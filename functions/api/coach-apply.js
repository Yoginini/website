/* POST /api/coach-apply — Cloudflare Pages Function.
 *
 * Same contract as /api/waitlist: without RESEND_API_KEY and COACH_TO this
 * answers 503 not_configured and the page shows the real address rather than
 * claiming an application was received.
 *
 * Secrets:
 *   RESEND_API_KEY   required to send at all
 *   COACH_TO         required, the inbox that receives applications
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

  if (clean(body.company)) return json({ ok: true });   // honeypot

  const name   = clean(body.name, 120);
  const email  = clean(body.email, 200).toLowerCase();
  const styles = clean(body.styles, 300);
  const link   = clean(body.link, 400);

  if (!name)              return json({ error: 'name_required' }, 422);
  if (!EMAIL.test(email)) return json({ error: 'email_invalid' }, 422);
  if (!styles)            return json({ error: 'styles_required' }, 422);
  if (link && !/^https?:\/\//i.test(link)) return json({ error: 'link_invalid' }, 422);

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

  if (!env.RESEND_API_KEY || !env.COACH_TO) {
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
      to: [env.COACH_TO],
      reply_to: email,
      subject: `Founding coach application: ${name}`,
      text: [
        'New Yoginini founding-coach application.',
        '',
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Teaches: ${styles}`,
        `Link:    ${link || '—'}`,
        `Country: ${country}`,
        `At:      ${new Date().toISOString()}`
      ].join('\n')
    })
  });

  if (!sent.ok) return json({ error: 'send_failed' }, 502);
  return json({ ok: true });
}

export const onRequestGet = () => json({ error: 'method_not_allowed' }, 405);
