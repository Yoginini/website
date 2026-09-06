/* POST /api/waitlist — Cloudflare Pages Function.
 *
 * Until RESEND_API_KEY and WAITLIST_TO are set as Pages secrets this answers
 * 503 not_configured and the page tells the visitor to write to us directly.
 * It never pretends a message was delivered: an undelivered signup that looks
 * successful is worse than an honest failure.
 *
 * Secrets:
 *   RESEND_API_KEY   required to send at all
 *   WAITLIST_TO      required, the inbox that receives signups
 *   WAITLIST_FROM    optional, defaults to onboarding@resend.dev
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

  if (!env.RESEND_API_KEY || !env.WAITLIST_TO) {
    return json({ error: 'not_configured' }, 503);
  }

  const country = request.headers.get('cf-ipcountry') || '—';
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.WAITLIST_FROM || 'Yoginini <onboarding@resend.dev>',
      to: [env.WAITLIST_TO],
      reply_to: email,
      subject: `Waitlist: ${name}`,
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

  if (!sent.ok) return json({ error: 'send_failed' }, 502);
  return json({ ok: true });
}

export const onRequestGet = () => json({ error: 'method_not_allowed' }, 405);
