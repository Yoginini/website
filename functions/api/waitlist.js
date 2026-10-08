/* POST /api/waitlist — Cloudflare Pages Function.
 *
 * Mail goes through Owlpost (POST /v1/emails, a Resend-compatible body) on
 * the transactional stream, from the verified send.yoginini.us subdomain.
 * Until OWLPOST_API_KEY and WAITLIST_TO are set as Pages secrets this answers
 * 503 not_configured and the page tells the visitor to write to us directly.
 * It never pretends a message was delivered: an undelivered signup that looks
 * successful is worse than an honest failure.
 *
 * Secrets:
 *   OWLPOST_API_KEY  required to send at all (Owlpost, api.owlpost.to)
 *   WAITLIST_TO      required, the inbox that receives signups
 *   WAITLIST_FROM    optional, defaults to Yoginini <no-reply@send.yoginini.us>
 *   OWLPOST_BASE_URL optional, defaults to https://api.owlpost.to
 *   TURNSTILE_SECRET optional, verifies a Cloudflare Turnstile token if present
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

const clean = (v, max = 200) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OWLPOST_DEFAULT = 'https://api.owlpost.to';
const FROM_DEFAULT = 'Yoginini <no-reply@send.yoginini.us>';

const sha256Hex = async (s) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// Owlpost answers a reused Idempotency-Key whose body differs (the timestamp
// line, say) with 409 idempotency-conflict: the form was already mailed, so
// that is success. Anything else non-2xx is a real failure.
const isIdempotencyReplay = (status, detail) =>
  status === 409 && /idempotency-conflict/.test(detail);

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  // Honeypot. Real people never fill this in.
  if (clean(body.company)) return json({ ok: true });

  const name     = clean(body.name, 120);
  const email    = clean(body.email, 200).toLowerCase();
  const platform = ['iphone', 'android', 'other'].includes(body.platform) ? body.platform : 'unspecified';

  if (!name)            return json({ error: 'name_required' }, 422);
  if (!EMAIL.test(email)) return json({ error: 'email_invalid' }, 422);

  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', clean(body.token, 2048));
    form.append('remoteip', request.headers.get('cf-connecting-ip') || '');
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
      .then(r => r.json())
      .catch(() => ({ success: false }));
    if (!verify.success) return json({ error: 'challenge_failed' }, 403);
  }

  if (!env.OWLPOST_API_KEY || !env.WAITLIST_TO) {
    return json({ error: 'not_configured' }, 503);
  }

  const country = request.headers.get('cf-ipcountry') || '—';
  const base = (env.OWLPOST_BASE_URL || OWLPOST_DEFAULT).replace(/\/+$/, '');
  const key = `yoginini-waitlist-${await sha256Hex(`waitlist\n${email}`)}`;

  let sent;
  try {
    sent = await fetch(`${base}/v1/emails`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OWLPOST_API_KEY}`,
        'content-type': 'application/json',
        'idempotency-key': key
      },
      body: JSON.stringify({
        from: env.WAITLIST_FROM || FROM_DEFAULT,
        to: [env.WAITLIST_TO],
        reply_to: email,
        subject: `Waitlist: ${name}`,
        stream: 'transactional',
        tags: [{ name: 'form', value: 'waitlist' }],
        text: [
          'New Yoginini waitlist signup.',
          '',
          `Name:     ${name}`,
          `Email:    ${email}`,
          `Platform: ${platform}`,
          `Country:  ${country}`,
          `At:       ${new Date().toISOString()}`
        ].join('\n')
      })
    });
  } catch (e) {
    console.log('owlpost unreachable', e.message);
    return json({ error: 'send_failed' }, 502);
  }

  if (!sent.ok) {
    const detail = await sent.text();
    if (!isIdempotencyReplay(sent.status, detail)) {
      console.log('owlpost failed', sent.status, detail);
      return json({ error: 'send_failed' }, 502);
    }
  }
  return json({ ok: true });
}

export const onRequestGet = () => json({ error: 'method_not_allowed' }, 405);
