#!/usr/bin/env node
/* Yoginini — generates every page from assets/yog-data.js.
 *
 * Content lives in the data file, chrome lives here, and the output is plain
 * static HTML so that search engines, answer engines and people with no
 * JavaScript all read the same words.
 *
 *   node tools/pages.js
 *
 * Writes: index.html, <page>/index.html, 404.html, sitemap.xml, llms.txt,
 * yoginini.json.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* Load the browser data file without a bundler. */
const win = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'assets', 'yog-data.js'), 'utf8'))(win);
const D = win.YOG;
const B = D.brand;

/* ── helpers ─────────────────────────────────────────────────── */
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Typographic quotes and apostrophes for body copy. */
const tx = s => esc(s).replace(/'/g, '’');

const PAGES = [
  { slug: '',            file: 'index.html',            nav: null,          title: `${B.name} — a yoga teacher who can see you`,
    desc: 'Yoginini watches your yoga form through your phone camera and speaks corrections out loud. Pose tracking runs on the device; video never leaves it. Book real teachers by the hour.' },
  { slug: 'philosophy',  file: 'philosophy/index.html', nav: 'Philosophy',  title: `Philosophy — ${B.name}`,
    desc: 'Why Yoginini is purple, what the crown chakra has to do with it, and the seven rules that decide how the app behaves.' },
  { slug: 'community',   file: 'community/index.html',  nav: 'Community',   title: `Community — ${B.name}`,
    desc: 'Practise live with people in other cities, share a streak with a friend, join a circle. No leaderboards, friends-only by default.' },
  { slug: 'coaches',     file: 'coaches/index.html',    nav: 'Coaches',     title: `Coaches — ${B.name}`,
    desc: 'Real yoga teachers, booked by the hour. Coaches set their own rate and keep 80%. Apply to join the founding cohort.' },
  { slug: 'pricing',     file: 'pricing/index.html',    nav: 'Pricing',     title: `Pricing — ${B.name}`,
    desc: '$3 for 14 days, then $15 a month. Coaches are paid separately at their own hourly rate and keep 80% of it.' },
  { slug: 'privacy',     file: 'privacy/index.html',    nav: null,          title: `Privacy — ${B.name}`,
    desc: 'What Yoginini stores and what it does not. Video is analysed on your phone and discarded; only joint angles and scores leave the device.' }
];

const NAV = [
  { href: '/#how',         label: 'How it works' },
  { href: '/philosophy/',  label: 'Philosophy' },
  { href: '/community/',   label: 'Community' },
  { href: '/coaches/',     label: 'Coaches' },
  { href: '/pricing/',     label: 'Pricing' }
];

/* ── chrome ──────────────────────────────────────────────────── */
const lotus = (cls = '') =>
  `<span class="lotus${cls}"><i></i><i></i><i></i><i></i><i></i><u></u></span>`;

const wordmark = () =>
  `<a class="wordmark on-dark" href="/">${lotus(' on-dark')}<span>yogin<em>ini</em></span></a>`;

const nav = current => `
  <nav class="nav" data-open="false">
    ${wordmark()}
    <button class="nav-toggle" type="button" aria-controls="nav-links">Menu</button>
    <div class="nav-links" id="nav-links">
      ${NAV.map(n => `<a href="${n.href}"${n.label === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n      ')}
      <button class="btn btn-ghost-d" type="button" data-sheet>Join the waitlist</button>
    </div>
  </nav>`;

const fzCredit = () => `
      <span class="fz-credit"><a href="https://factory0.ventures" rel="noopener">
        <svg class="fz-ring" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.1" fill="none" stroke="#FF5A36" stroke-width="1.9" stroke-dasharray="28.7 9.6"/></svg>
        <span>&copy; 2026 Factory Zero</span>
      </a></span>`;

const footer = (headline, sub) => `
<footer class="foot">
  <div class="foot-cta">
    <h2 class="big">${headline}</h2>
    ${sub ? `<p class="lede" style="margin:22px auto 0;color:var(--on-dark-2)">${sub}</p>` : ''}
    <p style="margin:28px 0 0"><button class="btn btn-primary" type="button" data-sheet>Join the waitlist</button></p>
  </div>
  <div class="foot-bar">
    <a class="foot-mark" href="/"><span class="dot-mark"></span><span>yogin<em>ini</em></span></a>
    <nav class="foot-nav" aria-label="Footer">
      <a href="/">Home</a>
      <a href="/philosophy/">Philosophy</a>
      <a href="/community/">Community</a>
      <a href="/coaches/">Coaches</a>
      <a href="/pricing/">Pricing</a>
      <a href="/privacy/">Privacy</a>
      <a href="mailto:${B.email}">Contact</a>
      <a href="https://github.com/Yoginini/website" rel="noopener">GitHub</a>
    </nav>
    <div class="foot-legal">
      <span>&copy; <span data-year>2026</span> YOGININI &middot; ${B.domain}</span>${fzCredit()}
    </div>
  </div>
</footer>`;

/* The waitlist sheet. The design mocked Apple/Google/Meta sign-in buttons that
   only set a flag; a real address is collected instead, or nothing is. */
const sheet = () => `
<div class="sheet" id="sheet" hidden role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <div class="sheet-card">
    <button class="sheet-close" type="button" data-sheet-close aria-label="Close">&times;</button>
    <p class="kicker" style="margin:0;color:var(--lav)">Early access</p>
    <h2 class="sheet-title" id="sheet-title">Save your place <em>on the mat.</em></h2>
    <form class="form" data-post="/api/waitlist" data-done-text="You are on the list. We will write once, when your mat is ready.">
      <label class="fine" style="color:var(--on-dark-2)" for="w-name">Your name</label>
      <input id="w-name" name="name" autocomplete="name" required placeholder="Name">
      <label class="fine" style="color:var(--on-dark-2)" for="w-email">Email</label>
      <input id="w-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
      <label class="fine" style="color:var(--on-dark-2)" for="w-platform">Which phone do you practise with?</label>
      <select id="w-platform" name="platform">
        <option value="iphone">iPhone</option>
        <option value="android">Android</option>
        <option value="other">Something else</option>
      </select>
      <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">Join the waitlist</button>
      <p class="form-msg" role="status" aria-live="polite"></p>
      <p class="fine" style="margin:2px 0 0">We ask for a name and an email, nothing else. One message when we open, one when you are in. No card, ever, on this site.</p>
    </form>
  </div>
</div>`;

/* Every sheet input inherits the dark treatment. */
const SHEET_STYLE = `
  .sheet-card .form input, .sheet-card .form select {
    border-color: rgba(236,231,244,.2); background: rgba(236,231,244,.05); color: var(--on-dark);
  }
  .sheet-card .form input::placeholder { color: var(--on-dark-5); }
  .sheet-card .form input:focus, .sheet-card .form select:focus { border-color: var(--lav); }
  .sheet-card .form select option { background: #100d17; }`;

/* ── structured data ─────────────────────────────────────────── */
function jsonLd(page) {
  const org = {
    '@type': 'Organization',
    '@id': B.url + '/#org',
    name: B.name,
    url: B.url,
    email: B.email,
    description: B.summary,
    logo: B.url + '/assets/icon-512.png',
    parentOrganization: { '@type': 'Organization', name: B.parent.name, url: B.parent.url }
  };
  const site = {
    '@type': 'WebSite',
    '@id': B.url + '/#site',
    url: B.url,
    name: B.name,
    publisher: { '@id': B.url + '/#org' },
    inLanguage: 'en'
  };
  const graph = [org, site];

  if (page.slug === '' && !page.noindex) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': B.url + '/#app',
      name: B.name,
      applicationCategory: 'HealthApplication',
      applicationSubCategory: 'Yoga',
      operatingSystem: 'iOS',
      description: B.summary,
      publisher: { '@id': B.url + '/#org' },
      /* No aggregateRating and no reviews: nothing has shipped, so there is
         nothing to rate. Inventing either would be a fabricated record. */
      offers: [
        { '@type': 'Offer', name: D.pricing.trial.name, price: String(D.pricing.trial.price),
          priceCurrency: D.pricing.currency, description: `${D.pricing.trial.period} trial, then the monthly membership`,
          availability: 'https://schema.org/PreOrder' },
        { '@type': 'Offer', name: D.pricing.membership.name, price: String(D.pricing.membership.price),
          priceCurrency: D.pricing.currency, availability: 'https://schema.org/PreOrder',
          priceSpecification: {
            '@type': 'UnitPriceSpecification', price: String(D.pricing.membership.price),
            priceCurrency: D.pricing.currency, billingDuration: 1, billingIncrement: 1,
            unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' }
          }
        }
      ]
    });
    graph.push({
      '@type': 'FAQPage',
      '@id': B.url + '/#faq',
      mainEntity: D.faqs.map(f => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }

  if (page.slug === 'pricing') {
    graph.push({
      '@type': 'FAQPage',
      '@id': B.url + '/pricing/#faq',
      mainEntity: D.billingFaqs.map(f => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }

  if (page.slug) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: B.url + '/' },
        { '@type': 'ListItem', position: 2, name: page.nav || page.title.split(' — ')[0], item: `${B.url}/${page.slug}/` }
      ]
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/* ── document ────────────────────────────────────────────────── */
function doc(page, body, extraStyle) {
  const canonical = page.slug ? `${B.url}/${page.slug}/` : `${B.url}/`;
  const og = page.slug ? `og-${page.slug}.png` : 'og.png';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#100d17">
<meta name="color-scheme" content="light">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${B.name}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${B.url}/assets/${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${B.url}/assets/${og}">

<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<link rel="alternate" type="application/json" href="/yoginini.json" title="Yoginini, machine-readable">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Yoginini for language models">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Figtree:wght@300;400;500;600&family=Space+Mono&display=swap">
<link rel="stylesheet" href="/assets/yog.css">
${extraStyle ? `<style>${extraStyle}</style>` : ''}
<script type="application/ld+json">${jsonLd(page)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${body}
${sheet()}
<script src="/assets/yog-data.js"></script>
<script src="/assets/yog-common.js" defer></script>
</body>
</html>
`;
}

/* ── shared blocks ───────────────────────────────────────────── */
const previewNote = (what = 'Everything in this section describes an app that has not shipped') => `
      <p class="note"><strong>Preview.</strong> ${what}. The screens are mockups, not live activity, and no numbers here count anything real.</p>`;

const statusLine = () => `
      <p class="fine" style="margin:26px 0 0;display:inline-flex;align-items:center;gap:9px">
        <span style="width:7px;height:7px;border-radius:50%;background:var(--amber);display:inline-block;flex:none"></span>
        In development. Nothing has shipped yet, no coaches are signed, and there is no app to download &mdash; the waitlist is the only thing that is real today.
      </p>`;

/* The tracked figure from the design source, drawn as static SVG. */
function figure() {
  const P = { head: [150, 58], neck: [150, 88], ls: [116, 102], rs: [184, 102], le: [104, 58], re: [196, 58],
              lh: [142, 14], rh: [158, 14], lhip: [130, 206], rhip: [170, 206], lk: [86, 252], la: [152, 242],
              rk: [174, 296], ra: [177, 386] };
  const L = [['neck','ls'],['neck','rs'],['ls','le'],['le','lh'],['rs','re'],['re','rh'],['ls','lhip'],
             ['rs','rhip'],['lhip','rhip'],['lhip','lk'],['lk','la'],['rhip','rk'],['rk','ra']];
  const sage = '#b39ddb';
  const lines = L.map(([a, b], i) =>
    `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${sage}" stroke-width="1.4" stroke-opacity=".7" stroke-dasharray="600" stroke-dashoffset="600" style="animation:drawline 1.6s ${(0.4 + i * 0.08).toFixed(2)}s cubic-bezier(.2,.7,.2,1) forwards"/>`
  ).join('');
  const dots = Object.keys(P).filter(k => k !== 'head').map((k, i) => {
    const [x, y] = P[k], err = k === 'lhip';
    const ring = err ? `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#e0a86b" stroke-width="1" style="transform-origin:${x}px ${y}px;transform-box:view-box;animation:ring 2.4s ease-out infinite"/>` : '';
    return `${ring}<circle cx="${x}" cy="${y}" r="${err ? 4.5 : 3.2}" fill="${err ? '#e0a86b' : sage}" style="transform-origin:${x}px ${y}px;transform-box:view-box;animation:pulse ${(2.8 + (i % 3) * 0.6).toFixed(1)}s ${(i * 0.15).toFixed(2)}s ease-in-out infinite"/>`;
  }).join('');
  return `<svg viewBox="0 0 300 420" style="position:absolute;inset:12% 10% 16%;width:80%;height:72%;overflow:visible" role="img" aria-label="A tracked figure in tree pose, with the left hip flagged four degrees low">
      <circle cx="150" cy="58" r="20" fill="none" stroke="${sage}" stroke-width="1.4" stroke-opacity=".7" stroke-dasharray="600" stroke-dashoffset="600" style="animation:drawline 1.6s .3s forwards"/>
      ${lines}${dots}
      <text x="118" y="212" text-anchor="end" fill="#e0a86b" font-family="'Space Mono',monospace" font-size="9" letter-spacing="1">L HIP  -4&#176;</text>
    </svg>`;
}

/* ── page: home ──────────────────────────────────────────────── */
function home() {
  const ticker = D.poses.map(p => `<span>${esc(p[0])}</span>`).join('');
  return `
<header class="dark">
  <div class="glow" style="background:radial-gradient(55% 60% at 78% 18%, rgba(179,157,219,.22), transparent 70%), radial-gradient(45% 45% at 8% 100%, rgba(224,168,107,.08), transparent 70%)"></div>
  ${nav(null)}
  <div class="shell" style="position:relative;z-index:1;padding-block:clamp(32px,6vh,72px) clamp(56px,9vh,104px)">
    <div class="grid-2 middle">
      <div>
        <p class="kicker on-dark" style="margin-bottom:0;animation:rise .9s both">Early access &middot; ${B.domain}</p>
        <h1 style="margin-top:24px;animation:rise 1s .1s both">A yoga teacher <em class="soft">who can see you.</em></h1>
        <p class="lede" style="animation:rise 1s .22s both">Prop up your phone. Yoginini watches your form through the camera and speaks gentle corrections out loud, the way a good teacher would across the room. When you want a human, book one by the hour.</p>
        <p style="margin:30px 0 0;display:flex;flex-wrap:wrap;gap:12px;animation:rise 1s .32s both">
          <button class="btn btn-primary" type="button" data-sheet>Join the waitlist</button>
          <a class="btn btn-ghost-d" href="#how" style="padding:15px 26px;font-size:15px">See how it works</a>
        </p>
        ${statusLine()}
      </div>

      <figure style="margin:0;animation:fadein 1.4s .3s both">
        <div style="position:relative;aspect-ratio:4/4.6;border-radius:28px;border:1px solid rgba(236,231,244,.14);background:linear-gradient(165deg,#241c38,#150f22);overflow:hidden">
          <div class="pill" style="position:absolute;top:16px;left:18px;color:var(--lav);z-index:2"><span class="led"></span>LIVE &middot; 24 FPS &middot; ON-DEVICE</div>
          <div class="mono" style="position:absolute;top:16px;right:18px;font-size:10px;color:var(--on-dark-5);z-index:2">VRKSASANA</div>
          ${figure()}
          <div data-cue style="position:absolute;left:18px;right:18px;bottom:56px;z-index:2;animation:cuein 5s ease both">
            <span style="display:inline-flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(236,231,244,.08);border:1px solid rgba(236,231,244,.16);border-radius:14px;backdrop-filter:blur(8px);max-width:100%">
              <span style="display:inline-flex;gap:2px;align-items:flex-end;height:14px" aria-hidden="true">
                <span style="width:2px;height:4px;background:var(--lav);border-radius:1px;animation:breathe .9s ease-in-out infinite"></span>
                <span style="width:2px;height:10px;background:var(--lav);border-radius:1px;animation:breathe 1.1s ease-in-out infinite"></span>
                <span style="width:2px;height:4px;background:var(--lav);border-radius:1px;animation:breathe 1.3s ease-in-out infinite"></span>
                <span style="width:2px;height:10px;background:var(--lav);border-radius:1px;animation:breathe 1.5s ease-in-out infinite"></span>
              </span>
              <span class="cue-text" style="font-family:var(--serif);font-size:21px;font-style:italic;color:var(--on-dark);line-height:1.1">&ldquo;${tx(D.cues[0])}&rdquo;</span>
            </span>
          </div>
          <div class="mono" style="position:absolute;left:18px;right:18px;bottom:20px;font-size:11px;color:var(--on-dark-5);z-index:2">knee 174&#176; &middot; hip 88&#176; &middot; spine 179&#176;</div>
        </div>
        <figcaption class="fine" style="margin-top:12px">A mockup of the in-app view. The app is not released.</figcaption>
      </figure>
    </div>
  </div>

  <div class="ticker" aria-hidden="true">
    <div class="ticker-track">${ticker}${ticker}</div>
  </div>
</header>

<main id="main">

<section class="sect shell" id="how">
  <div class="grid-2 bottom" style="margin-bottom:clamp(40px,6vh,64px)">
    <div>
      <p class="kicker">How it works</p>
      <h2 data-reveal>Three minutes to <em class="soft">your first correction.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>No wearables, no special mat. The phone you already own, propped against a water bottle, is enough.</p>
  </div>
  <ol class="cards-3" style="list-style:none;margin:0;padding:0">
    ${D.steps.map(s => `<li class="card" data-reveal>
      <span class="mono" style="font-size:11px;color:var(--muted-2)">${esc(s.meta)}</span>
      <span class="step-n">${esc(s.n)}</span>
      <h3>${tx(s.title)}</h3>
      <p class="body" style="margin:0">${tx(s.body)}</p>
    </li>`).join('\n    ')}
  </ol>
</section>

<section class="dark sect">
  <div class="glow" style="background:radial-gradient(50% 60% at 20% 30%, rgba(179,157,219,.16), transparent 70%)"></div>
  <div class="shell" style="position:relative">
    <div class="grid-2">
      <div>
        <p class="kicker on-dark">Privacy, by construction</p>
        <h2 data-reveal>Your bedroom stays <em class="soft">your bedroom.</em></h2>
        <p class="lede" data-reveal>Every frame is analysed on your phone and thrown away. What leaves the device is a handful of numbers: 33 body points, the angles between them, and your score. There is no video to leak because there is no video to store.</p>
        <p class="lede" data-reveal>We compare angles rather than positions, so it does not matter how tall you are or how far away you stand. It matters how you hold the shape.</p>
        <p style="margin:28px 0 0"><a class="arrow" href="/privacy/">Read the privacy page <span aria-hidden="true">&rarr;</span></a></p>
      </div>
      <div data-reveal>
        <div class="card card-dark" style="gap:20px">
          <p class="mono" style="font-size:11px;color:var(--lav);margin:0">ON YOUR PHONE</p>
          <p class="mono" style="font-size:13px;color:var(--on-dark-3);margin:0;line-height:1.9">Camera &rarr; 33 landmarks &rarr; joint angles &rarr; cue</p>
          <hr style="border:0;border-top:1px dashed rgba(236,231,244,.2);margin:4px 0">
          <p class="mono" style="font-size:11px;color:var(--lav);margin:0">ON OUR SERVER</p>
          <p class="mono" style="font-size:13px;color:var(--on-dark-3);margin:0;line-height:1.9">Angles, scores, streaks. Never a pixel.</p>
        </div>
        <dl style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0 0">
          ${[['33', 'body landmarks tracked'], ['0', 'frames uploaded, ever'], ['1s', 'before a cue is spoken']].map(([n, l]) => `<div>
            <dt style="font-family:var(--serif);font-size:44px;line-height:1;color:var(--on-dark)">${n}</dt>
            <dd class="fine" style="margin:6px 0 0">${l}</dd>
          </div>`).join('\n          ')}
        </dl>
      </div>
    </div>
  </div>
</section>

<section class="sect shell">
  <div class="grid-2 middle">
    <div data-reveal>
      <div class="card" style="gap:0;padding:0;overflow:hidden">
        ${D.sampleCues.map((c, i) => `<div style="display:flex;gap:16px;align-items:baseline;padding:18px 24px${i ? ';border-top:1px solid var(--band)' : ''}">
          <span class="mono" style="font-size:11px;color:var(--purple);flex:none">${esc(c.t)}</span>
          <span style="font-family:var(--serif);font-size:21px;font-style:italic;line-height:1.25">&ldquo;${tx(c.text)}&rdquo;</span>
        </div>`).join('\n        ')}
        <div style="padding:14px 24px;border-top:1px solid var(--band);background:var(--band)">
          <span class="mono" style="font-size:10px;color:var(--muted-2)">COOLDOWN 5s</span>
          <div style="height:3px;background:var(--line);border-radius:2px;margin-top:8px;overflow:hidden"><span style="display:block;height:100%;background:var(--lav);animation:cooldown 5s linear infinite"></span></div>
        </div>
      </div>
    </div>
    <div>
      <p class="kicker">The voice</p>
      <h2 data-reveal>It knows when <em class="soft">to say nothing.</em></h2>
      <p class="lede" data-reveal>One cue at a time. Never off a single frame. Never twice in five seconds. If three things are off, you hear the one that keeps you safe, and the rest can wait.</p>
      <p class="lede" data-reveal>Every phrase was written with a teacher, then rotated so it never sounds like a machine reading a list. After you finish, a short summary tells you what went well and what to watch next time.</p>
    </div>
  </div>
</section>

<section class="band sect">
  <div class="shell">
    <div class="grid-2 bottom" style="margin-bottom:clamp(36px,5vh,56px)">
      <div>
        <p class="kicker">Human coaches</p>
        <h2 data-reveal>When you want a person, <em class="soft">book one.</em></h2>
      </div>
      <p class="lede" style="margin:0" data-reveal>The AI fills the days between classes. A teacher does what no model can: notice you. Coaches set their own rate, keep 80% of it, and arrive at the call already knowing where you are stuck.</p>
    </div>
    <div class="rows" style="max-width:760px">
      ${D.pricing.rows.map(r => `<div class="row-kv">
        <span class="k">${tx(r.k)}<small>${tx(r.sub)}</small></span>
        <span class="v${r.accent ? ' accent' : ''}"${r.italic ? ' style="font-style:italic"' : ''}>${esc(r.v)}</span>
      </div>`).join('\n      ')}
    </div>
    <p style="margin:28px 0 0"><a class="arrow" href="/coaches/">Meet the founding cohort <span aria-hidden="true">&rarr;</span></a></p>
  </div>
</section>

<section class="dark sect">
  <div class="glow" style="background:radial-gradient(50% 55% at 82% 25%, rgba(179,157,219,.18), transparent 70%)"></div>
  <div class="shell" style="position:relative">
    <div class="grid-2 bottom" style="margin-bottom:clamp(36px,5vh,56px)">
      <div>
        <p class="kicker on-dark">yogin<span style="color:var(--on-dark)">ini</span> &middot; the &ldquo;us&rdquo; is the point</p>
        <h2 data-reveal>Alone on your mat. <em class="soft">Never on your own.</em></h2>
      </div>
      <p class="lede" style="margin:0" data-reveal>Practise live with people in other cities, each on your own mat, each with your own coach in your ear. Make friends, share a streak, cheer a first headstand. No rankings, no comparison, just company.</p>
    </div>
    <div class="cards">
      ${D.rooms.map(r => `<div class="card card-dark card-lift" style="min-height:230px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="pill" style="color:var(--lav)"><span class="led"></span>${esc(r.state)}</span>
          <span class="mono" style="font-size:11px;color:var(--on-dark-5)">${esc(r.len)}</span>
        </div>
        <h3 style="color:var(--on-dark)">${tx(r.title)}</h3>
        <p class="body" style="margin:0;font-size:14px">${tx(r.desc)}</p>
      </div>`).join('\n      ')}
    </div>
    ${previewNote('Together rooms are a planned feature')}
    <p style="margin:22px 0 0"><a class="arrow" href="/community/">Explore the community <span aria-hidden="true">&rarr;</span></a></p>
  </div>
</section>

<section class="sect shell">
  <div class="grid-2 bottom" style="margin-bottom:clamp(36px,5vh,56px)">
    <div>
      <p class="kicker">Streaks and badges</p>
      <h2 data-reveal>Consistency, <em class="soft">kindly kept.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>Daily streaks with two grace days a month, because flu should not reset a year of practice. No leaderboards, no red charts. Just quiet proof that you keep showing up.</p>
  </div>
  <ul class="cards" style="list-style:none;margin:0;padding:0">
    ${D.badges.map(b => `<li class="card" data-reveal style="gap:10px;padding:24px 22px">
      <span style="width:26px;height:26px;border-radius:50%;background:${b.rare ? 'var(--ink)' : b.warm ? 'var(--amber)' : 'var(--lav)'};display:block"></span>
      <span style="font-family:var(--serif);font-size:24px;font-weight:500;line-height:1.1">${tx(b.name)}</span>
      <span class="fine" style="margin:0">${tx(b.how)}</span>
    </li>`).join('\n    ')}
  </ul>
</section>

<section class="band sect">
  <div class="shell">
    <div class="grid-2 middle">
      <div>
        <p class="kicker">Pricing</p>
        <h2 data-reveal>Less than one class. <em class="soft">Every day of the month.</em></h2>
        <p class="lede" data-reveal>Membership covers the AI coach and every published pose. Live sessions with a human are paid per hour, at whatever that human charges.</p>
        <p style="margin:28px 0 0"><a class="arrow" href="/pricing/">Full pricing and how coach bookings work <span aria-hidden="true">&rarr;</span></a></p>
      </div>
      <div class="cards-3" style="grid-template-columns:1fr 1fr">
        <div class="card" data-reveal>
          <span class="mono" style="font-size:11px;color:var(--muted-2)">TRY IT</span>
          <span style="font-family:var(--serif);font-size:64px;line-height:1">$${D.pricing.trial.price}</span>
          <span class="fine" style="margin:0">for ${esc(D.pricing.trial.period)}</span>
          <p class="body" style="margin:0;font-size:14px">Full access, every pose, every cue. On day 14 it becomes the monthly plan unless you cancel, and we remind you two days before.</p>
        </div>
        <div class="card card-dark" data-reveal>
          <span class="mono" style="font-size:11px;color:var(--lav)">MEMBERSHIP</span>
          <span style="font-family:var(--serif);font-size:64px;line-height:1;color:var(--on-dark)">$${D.pricing.membership.price}</span>
          <span class="fine" style="margin:0">per ${esc(D.pricing.membership.period)}</span>
          <p class="body" style="margin:0;font-size:14px">The AI coach, the core library, every coach&rsquo;s published sequences, streaks and summaries.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="dark sect">
  <div class="glow" style="background:radial-gradient(50% 60% at 12% 80%, rgba(179,157,219,.18), transparent 70%)"></div>
  <div class="shell" style="position:relative">
    <div class="grid-2">
      <div>
        <p class="kicker on-dark">For teachers</p>
        <h2 data-reveal>Teach the app <em class="soft">your poses.</em></h2>
        <p class="lede" data-reveal>Hold a pose for the camera a few times. Set how strict each joint should be. Write the cues in your own words. Once reviewed, your students practise with your voice in their ear between sessions, and you walk into every live call already knowing where they struggle.</p>
        <p class="lede" data-reveal>You set your rate and keep 80% of it. Repeat students with you cost you less, not more.</p>
        <p style="margin:28px 0 0"><a class="arrow" href="/coaches/#apply">Apply to teach on Yoginini <span aria-hidden="true">&rarr;</span></a></p>
      </div>
      <ol class="steps" style="list-style:none;margin:0;padding:0">
        ${D.coachSteps.map(s => `<li class="step-row" data-reveal>
          <span class="step-n">${esc(s.n)}</span>
          <div><h4>${tx(s.title)}</h4><p class="body" style="margin:0;font-size:15px">${tx(s.body)}</p></div>
        </li>`).join('\n        ')}
      </ol>
    </div>
  </div>
</section>

<section class="sect" style="max-width:900px;margin:0 auto;padding-inline:var(--pad)">
  <h2 style="margin-bottom:clamp(28px,4vh,48px)">Things people ask.</h2>
  <div class="faq">
    ${D.faqs.map(f => `<details>
      <summary><span>${tx(f.q)}</span><span class="plus" aria-hidden="true">+</span></summary>
      <p class="answer">${tx(f.a)}</p>
    </details>`).join('\n    ')}
  </div>
</section>

</main>

${footer('Roll out the mat. <em class="soft">We&rsquo;ll meet you there.</em>', 'Opening first on iPhone, Android after. There is no app to download yet.')}`;
}

/* ── page: philosophy ────────────────────────────────────────── */
function philosophy() {
  const petals = Array.from({ length: 12 }, (_, i) =>
    `<span style="position:absolute;left:50%;top:50%;width:14%;height:50%;margin-left:-7%;margin-top:-50%;transform-origin:50% 100%;transform:rotate(${i * 30}deg)"><span style="display:block;width:100%;height:100%;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;background:${i % 2 ? '#b39ddb' : '#5e4b9a'};opacity:.85;transform-origin:50% 100%;animation:bloom 8s ${(i * 0.18).toFixed(2)}s ease-in-out infinite"></span></span>`
  ).join('');

  return `
<header class="dark" style="min-height:92vh;display:flex;flex-direction:column">
  <div class="glow" style="background:radial-gradient(50% 60% at 50% 100%, rgba(179,157,219,.28), transparent 70%)"></div>
  ${nav('Philosophy')}
  <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:900px;margin:0 auto;padding:clamp(24px,5vh,64px) var(--pad) clamp(64px,10vh,120px)">
    <div style="position:relative;width:min(240px,50vw);aspect-ratio:1;margin-bottom:clamp(28px,5vh,48px);animation:fadein 1.6s both" aria-hidden="true">
      ${petals}
      <span style="position:absolute;inset:32%;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ece7f3,#b39ddb 55%,#5e4b9a);animation:breathe 8s ease-in-out infinite;box-shadow:0 0 60px rgba(179,157,219,.5)"></span>
      <span style="position:absolute;inset:-8%;border-radius:50%;border:1px dashed rgba(179,157,219,.35);animation:spin 60s linear infinite;display:block"></span>
    </div>
    <p class="kicker on-dark" style="margin-bottom:0;animation:rise .9s both">Why we built it this way</p>
    <h1 style="margin-top:24px;animation:rise 1s .1s both">Technology in service <em class="soft">of stillness.</em></h1>
    <p class="lede" style="margin-left:auto;margin-right:auto;animation:rise 1s .22s both">Yoga has been taught one way for a few thousand years: a teacher watches, and says a little. We built a machine that can do the watching so more people can be taught, and then set rules so it behaves like a good teacher would.</p>
  </div>
</header>

<main id="main">

<section class="sect shell">
  <div class="grid-2 middle">
    <div>
      <p class="kicker">Why purple</p>
      <h2 data-reveal>Sahasrara, <em class="soft">the crown.</em></h2>
      <p class="lede" data-reveal>In the yogic map of the body there are seven chakras, running from the base of the spine to the top of the head. The seventh and highest is Sahasrara, the crown chakra, pictured as a thousand-petalled lotus and coloured violet. It stands for awareness, connection, and the quiet that arrives when the rest of the practice has done its work.</p>
      <p class="lede" data-reveal>That is why everything here is purple, and why the mark is a lotus that opens on the breath. The colour is a reminder of where the practice is pointing, even on the days it is mostly about a stiff left hip.</p>
    </div>
    <ol style="display:grid;gap:8px;list-style:none;margin:0;padding:0" data-reveal>
      ${D.chakras.map(c => `<li style="display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;padding:14px 18px;border-radius:16px;border:1px solid ${c.top ? 'var(--purple)' : 'var(--line)'};background:${c.top ? 'var(--panel)' : 'var(--paper)'};color:${c.top ? 'var(--on-dark)' : 'var(--ink)'}">
        <span style="width:18px;height:18px;border-radius:50%;background:${c.color};${c.top ? 'box-shadow:0 0 18px rgba(179,157,219,.8);' : ''}flex:none"></span>
        <span style="font-size:15px"><span style="font-family:var(--serif);font-size:20px;font-weight:500">${esc(c.name)}</span> <span style="color:${c.top ? 'var(--on-dark-2)' : 'var(--muted-2)'}">&middot; ${esc(c.meaning)}</span></span>
        <span class="mono" style="font-size:11px;color:${c.top ? 'var(--on-dark-2)' : 'var(--muted-2)'}">${esc(c.n)}</span>
      </li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="band sect">
  <div class="shell">
    <h2 style="max-width:800px;margin-bottom:clamp(40px,6vh,64px)">Seven things we hold to.</h2>
    <ol class="cards-3" style="list-style:none;margin:0;padding:0;gap:2px">
      ${D.principles.map(p => `<li style="background:var(--bg);border:1px solid var(--line);padding:34px 30px 38px;display:flex;flex-direction:column;gap:18px;min-height:280px" data-reveal>
        <span class="step-n">${esc(p.n)}</span>
        <h3>${tx(p.title)}</h3>
        <p class="body" style="margin:0;font-size:15px">${tx(p.body)}</p>
      </li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="sect center" style="max-width:900px;margin:0 auto;padding-inline:var(--pad)">
  <p class="kicker">The name</p>
  <h2 data-reveal>Yogini, <em class="soft">and us.</em></h2>
  <p class="lede" style="margin:24px auto 0" data-reveal>A yogini is a woman who practises. The name honours the teachers most of us first learned from, and the small repeated syllable is the practice itself: the same thing, again, a little better. The .us is not a place. It is who is on the mat with you.</p>
</section>

</main>

${footer('Practise with <em class="soft">a clear head.</em>')}`;
}

/* ── page: community ─────────────────────────────────────────── */
function community() {
  return `
<header class="dark">
  <div class="glow" style="background:radial-gradient(60% 60% at 80% 30%, rgba(179,157,219,.22), transparent 70%), radial-gradient(40% 40% at 10% 100%, rgba(224,168,107,.1), transparent 70%)"></div>
  ${nav('Community')}
  <div class="shell" style="position:relative;z-index:1;padding-block:clamp(32px,6vh,80px) clamp(56px,9vh,104px)">
    <p class="kicker on-dark" style="margin-bottom:0;animation:rise .9s both">yogin<span style="color:var(--on-dark)">ini</span>.us</p>
    <h1 style="margin-top:24px;max-width:16ch;animation:rise 1s .1s both">Your mat, your room. <em class="soft">Everyone else, a breath away.</em></h1>
    <p class="lede" style="animation:rise 1s .22s both">Practise live with people in other cities. Make friends who roll out the mat when you do. Share a streak, share your progress, and keep each other going. Nothing ranked, nothing public unless you say so.</p>
    ${statusLine()}
  </div>
</header>

<main id="main">

<section class="sect shell" id="rooms">
  <div class="grid-2 bottom" style="margin-bottom:clamp(40px,6vh,64px)">
    <div>
      <p class="kicker">Together rooms</p>
      <h2 data-reveal>Same sequence, same minute, <em class="soft">different living rooms.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>Join a scheduled room or open one for your friends. Everyone follows the same flow in sync while the AI coach corrects each person privately in their own ear. Nobody is called out in front of the group.</p>
  </div>
  <div class="cards">
    ${D.rooms.map(r => `<div class="card card-lift" style="min-height:230px" data-reveal>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="pill" style="color:var(--purple)"><span class="led"></span>${esc(r.state)}</span>
        <span class="mono" style="font-size:11px;color:var(--muted-2)">${esc(r.len)}</span>
      </div>
      <h3>${tx(r.title)}</h3>
      <p class="body" style="margin:0;font-size:14px">${tx(r.desc)}</p>
    </div>`).join('\n    ')}
  </div>
  ${previewNote('Together rooms are a planned feature')}
  <div class="cards-3" style="margin-top:40px">
    ${D.roomNotes.map(n => `<div class="step-row" data-reveal>
      <span class="step-n">${esc(n.n)}</span>
      <div><h4>${tx(n.title)}</h4><p class="body" style="margin:0;font-size:14px">${tx(n.body)}</p></div>
    </div>`).join('\n    ')}
  </div>
</section>

<section class="band sect">
  <div class="shell grid-2 middle">
    <div>
      <p class="kicker">Friends</p>
      <h2 data-reveal>Find the people who practise <em class="soft">when you do.</em></h2>
      <p class="lede" data-reveal>We suggest people by rhythm rather than by follower count: the same time of day, a similar level, poses you are both working on. Say hello, practise together once, and decide from there.</p>
      <p class="lede" data-reveal>Invite friends from outside with a link. When they join, you are connected from the first session.</p>
    </div>
    <div class="card" data-reveal>
      <p class="mono" style="font-size:11px;color:var(--purple);margin:0">WHAT YOU SHARE</p>
      ${D.shareScopes.map(s => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--band)">
        <span><span style="font-size:15px">${tx(s.label)}</span><br><span class="fine">${tx(s.who)}</span></span>
        <button type="button" data-toggle aria-pressed="${s.on}" aria-label="${tx(s.label)}" style="width:42px;height:24px;border-radius:999px;border:0;background:${s.on ? 'var(--purple)' : 'var(--line)'};position:relative;flex:none;transition:background .3s">
          <span style="position:absolute;top:3px;left:${s.on ? '21px' : '3px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:left .3s"></span>
        </button>
      </div>`).join('\n      ')}
      <p class="fine" style="margin:8px 0 0">Everything is off until you turn it on. Video is never an option, because none exists.</p>
    </div>
  </div>
</section>

<section class="sect shell">
  <div class="grid-2 bottom" style="margin-bottom:clamp(40px,6vh,64px)">
    <div>
      <p class="kicker">Shared progress</p>
      <h2 data-reveal>Show your friends how far you have come. <em class="soft">Only your friends.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>Shared streaks, mastered poses and badges appear in a small circle of people you chose. Cheers are counted in breaths. There is no leaderboard to climb, so nobody forces a pose to win one.</p>
  </div>
  <div class="cards-3">
    <div class="card card-dark" style="min-height:320px" data-reveal>
      <p class="mono" style="font-size:11px;color:var(--lav);margin:0">SHARED STREAK</p>
      <p class="body" style="margin:0">A shared streak only breaks if you both miss a day. One of you always has a reason to roll out the mat.</p>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:auto" aria-hidden="true">
        ${Array.from({ length: 28 }, (_, i) => `<span style="aspect-ratio:1;border-radius:6px;background:${i < 23 ? (i % 5 === 3 ? 'var(--amber)' : 'var(--lav)') : 'transparent'};border:1px solid ${i < 23 ? 'transparent' : 'rgba(236,231,244,.18)'};display:block"></span>`).join('')}
      </div>
    </div>
    <div class="card" style="min-height:320px" data-reveal>
      <p class="mono" style="font-size:11px;color:var(--purple);margin:0">GRACE DAYS</p>
      <h3>Two a month, no questions.</h3>
      <p class="body" style="margin:0;font-size:15px">Flu, a late flight, a bad week. Two days a month are forgiven automatically, and the streak survives. You do not have to ask, and nobody is told.</p>
      <p class="body" style="margin:auto 0 0;font-size:15px">Pause for up to three months and the streak is frozen rather than lost.</p>
    </div>
    <div class="card" style="min-height:320px" data-reveal>
      <p class="mono" style="font-size:11px;color:var(--purple);margin:0">CHEERS, NOT LIKES</p>
      <h3>Counted in breaths.</h3>
      <p class="body" style="margin:0;font-size:15px">When a friend does something worth marking, you send a breath. There is no running total on anyone&rsquo;s profile, so there is nothing to farm and nothing to lose.</p>
      <p class="body" style="margin:auto 0 0;font-size:15px">No follower counts exist anywhere in the app.</p>
    </div>
  </div>
</section>

<section class="dark sect">
  <div class="glow" style="background:radial-gradient(50% 60% at 15% 80%, rgba(179,157,219,.18), transparent 70%)"></div>
  <div class="shell" style="position:relative">
    <div class="grid-2 bottom" style="margin-bottom:clamp(40px,6vh,64px)">
      <div>
        <p class="kicker on-dark">Circles</p>
        <h2 data-reveal>Small groups with <em class="soft">a shared reason.</em></h2>
      </div>
      <p class="lede" style="margin:0" data-reveal>Circles are groups of up to fifty around a time of day, a goal or a coach. Each has its own rooms, chat and a monthly challenge nobody is ranked on.</p>
    </div>
    <div class="cards">
      ${D.circles.map(c => `<div class="card card-dark card-lift" style="min-height:180px" data-reveal>
        <span class="mono" style="font-size:10px;color:var(--on-dark-4)">${esc(c.kind)}</span>
        <h3 style="color:var(--on-dark)">${tx(c.name)}</h3>
        <p class="body" style="margin:0;font-size:14px">${tx(c.desc)}</p>
      </div>`).join('\n      ')}
    </div>
    ${previewNote('Circles are a planned feature and none exist yet')}
  </div>
</section>

<section class="sect" style="max-width:900px;margin:0 auto;padding-inline:var(--pad)">
  <h2 style="margin-bottom:clamp(28px,4vh,48px)">How we keep it kind.</h2>
  <ol class="rows" style="list-style:none;margin:0;padding:0">
    ${D.rules.map(r => `<li style="padding:22px 26px;display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:baseline">
      <span class="mono" style="font-size:11px;color:var(--purple)">${esc(r.n)}</span>
      <div><span style="font-size:17px;font-weight:500">${tx(r.title)}</span><p class="body" style="margin:4px 0 0;font-size:14px">${tx(r.body)}</p></div>
    </li>`).join('\n    ')}
  </ol>
</section>

</main>

${footer('Save a place on the mat <em class="soft">next to us.</em>')}`;
}

/* ── page: coaches ───────────────────────────────────────────── */
function coaches() {
  return `
<header class="dark">
  <div class="glow" style="background:radial-gradient(60% 60% at 85% 20%, rgba(179,157,219,.2), transparent 70%)"></div>
  ${nav('Coaches')}
  <div class="shell grid-2 bottom" style="position:relative;z-index:1;padding-block:clamp(32px,6vh,80px) clamp(48px,8vh,96px)">
    <div>
      <p class="kicker on-dark" style="margin-bottom:0;animation:rise .9s both">Founding cohort</p>
      <h1 style="margin-top:24px;animation:rise 1s .1s both">Real teachers, <em class="soft">by the hour.</em></h1>
    </div>
    <div>
      <p class="lede" style="margin:0;animation:rise 1s .22s both">Every coach sets their own rate and keeps 80% of it. Book a live one-to-one call, and they will arrive already knowing your practice from the app.</p>
      ${statusLine()}
    </div>
  </div>
</header>

<main id="main">

<section class="sect-s shell">
  <div class="grid-2 bottom" style="margin-bottom:clamp(28px,4vh,44px)">
    <div>
      <p class="kicker">Seats open</p>
      <h2 data-reveal>We are recruiting the <em class="soft">first teachers.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>These are the seats in the founding cohort, not people. <strong>No coaches are signed yet</strong>, so there is nobody here to book &mdash; if you teach, the application at the bottom of this page is the real thing.</p>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:36px" data-coach-filters role="group" aria-label="Filter seats by style">
    ${D.coachFilters.map((f, i) => `<button type="button" class="btn btn-sm" data-filter="${esc(f)}" aria-pressed="${i === 0}" style="border:1px solid var(--line);background:${i === 0 ? 'var(--ink)' : 'transparent'};color:${i === 0 ? 'var(--bg)' : 'var(--ink)'}">${esc(f)}</button>`).join('\n    ')}
  </div>

  <div class="cards">
    ${D.coachSeats.map(s => `<article class="card card-lift" data-seat data-tags="${esc(s.tags.join(','))}" style="min-height:300px" data-reveal>
      <div style="aspect-ratio:16/7;border-radius:16px;background:repeating-linear-gradient(135deg,#e2dbea 0 10px,#ebe6f1 10px 20px);display:flex;align-items:flex-end;padding:14px">
        <span class="mono" style="font-size:11px;color:var(--muted-2);background:rgba(245,242,248,.85);padding:6px 10px;border-radius:6px">seat open &middot; ${esc(s.style)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
        <h3>${esc(s.style)}</h3>
        <span class="mono" style="font-size:13px;color:var(--purple);white-space:nowrap">${esc(s.band)}</span>
      </div>
      <p class="body" style="margin:0;font-size:15px">${tx(s.wants)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:14px;border-top:1px solid var(--band)">
        <span class="fine">Rate is set by the teacher</span>
        <a class="btn btn-ink btn-sm" href="#apply">Apply</a>
      </div>
    </article>`).join('\n    ')}
  </div>
  <p class="lede" data-coach-empty hidden style="text-align:center;padding:60px 0;font-family:var(--serif);font-size:26px;font-style:italic;max-width:none">No seat in this style yet. Tell us you teach it.</p>
</section>

<section class="band sect">
  <div class="shell grid-2 tight">
    <h2 data-reveal>The coach already knows <em class="soft">where you are stuck.</em></h2>
    <ol class="steps" style="list-style:none;margin:0;padding:0">
      ${D.bookingSteps.map(s => `<li data-reveal><h4 style="font-size:18px;font-weight:500;margin:0 0 6px;font-family:var(--sans)">${tx(s.title)}</h4><p class="body" style="margin:0">${tx(s.body)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="sect shell">
  <div class="grid-2 bottom" style="margin-bottom:clamp(28px,4vh,44px)">
    <div>
      <p class="kicker">Economics</p>
      <h2 data-reveal>Pay the teacher, <em class="soft">not the app.</em></h2>
    </div>
    <p class="lede" style="margin:0" data-reveal>Of every session, 80% goes to the coach and 20% keeps the calls, calendar, payments and payouts running. Book a coach you have worked with before and our share drops, so the people who stick with you cost less to keep.</p>
  </div>
  <div class="rows" style="max-width:760px">
    ${D.pricing.rows.map(r => `<div class="row-kv">
      <span class="k">${tx(r.k)}<small>${tx(r.sub)}</small></span>
      <span class="v${r.accent ? ' accent' : ''}"${r.italic ? ' style="font-style:italic"' : ''}>${esc(r.v)}</span>
    </div>`).join('\n    ')}
  </div>
</section>

<section class="dark sect" id="apply">
  <div class="glow" style="background:radial-gradient(50% 60% at 15% 80%, rgba(179,157,219,.18), transparent 70%)"></div>
  <div class="shell grid-2 middle" style="position:relative">
    <div>
      <p class="kicker on-dark">Teach on Yoginini</p>
      <h2 data-reveal>Your poses. Your words. <em class="soft">Your students, everywhere.</em></h2>
      <p class="lede" data-reveal>Record a pose a few times and the app learns it. Set how strict each joint should be. Write the cues the way you would say them in class. After review, your students practise with you between sessions.</p>
      <ul class="dashed" style="margin-top:22px">
        <li>Set your own hourly rate, keep 80%</li>
        <li>Calendar, bookings, video and payouts handled</li>
        <li>See each student&rsquo;s AI-session data before every call</li>
        <li>Publish your own library of poses and sequences</li>
      </ul>
    </div>
    <form class="form form-dark" data-post="/api/coach-apply" data-done-text="We will be in touch to set up a short call and your first pose capture.">
      <h3 style="font-size:30px;margin-bottom:6px;color:var(--on-dark)">Apply as a founding coach</h3>
      <label for="c-name">Your name</label>
      <input id="c-name" name="name" autocomplete="name" required placeholder="Name">
      <label for="c-email">Email</label>
      <input id="c-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
      <label for="c-styles">Styles you teach, and years teaching</label>
      <input id="c-styles" name="styles" required placeholder="Vinyasa and yin, 8 years">
      <label for="c-link">A link to your teaching</label>
      <input id="c-link" name="link" type="url" placeholder="https://">
      <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">Send application</button>
      <p class="form-msg" role="status" aria-live="polite"></p>
      <p class="fine" style="margin:2px 0 0">We read every application by hand. Founding coaches help shape the core library and pay a reduced fee for their first year.</p>
    </form>
  </div>
</section>

</main>

${footer('Teach the days <em class="soft">between your classes.</em>')}`;
}

/* ── page: pricing ───────────────────────────────────────────── */
function pricing() {
  const P = D.pricing;
  return `
<header class="dark">
  <div class="glow" style="background:radial-gradient(60% 60% at 50% 110%, rgba(179,157,219,.22), transparent 70%)"></div>
  ${nav('Pricing')}
  <div class="shell center" style="position:relative;z-index:1;padding-block:clamp(32px,6vh,80px) clamp(72px,10vh,120px)">
    <p class="kicker on-dark" style="margin-bottom:0;animation:rise .9s both">Pricing</p>
    <h1 style="margin:24px auto 0;max-width:900px;animation:rise 1s .1s both">One plan. <em class="soft">Coaches priced by coaches.</em></h1>
    <p class="lede" style="margin-left:auto;margin-right:auto;animation:rise 1s .22s both">Membership covers the AI coach and every published pose. Live sessions with a human are paid per hour, at whatever that human charges.</p>
  </div>
</header>

<main id="main">

<section class="shell" style="transform:translateY(-40px)">
  <div class="cards-3" style="max-width:960px;margin:0 auto;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">
    <div class="card" style="padding:40px 36px;border-radius:28px;box-shadow:0 40px 60px -40px rgba(26,22,32,.3);gap:18px">
      <span class="mono" style="font-size:11px;color:var(--muted-2)">TRIAL</span>
      <span style="display:flex;align-items:baseline;gap:8px"><span style="font-family:var(--serif);font-size:80px;line-height:1">$${P.trial.price}</span><span class="body">for ${esc(P.trial.period)}</span></span>
      <p class="body" style="margin:0">Everything in membership, for two weeks. On day 14 it rolls into the monthly plan unless you cancel. We email you on day 12, and cancelling is one tap.</p>
      <button class="btn btn-ghost btn-block" type="button" data-sheet style="margin-top:auto">Join the waitlist</button>
    </div>
    <div class="card card-dark" style="padding:40px 36px;border-radius:28px;border-color:var(--purple);box-shadow:0 40px 60px -40px rgba(26,22,32,.5);gap:18px">
      <span class="mono" style="font-size:11px;color:var(--lav)">MEMBERSHIP</span>
      <span style="display:flex;align-items:baseline;gap:8px"><span style="font-family:var(--serif);font-size:80px;line-height:1;color:var(--on-dark)">$${P.membership.price}</span><span class="body">per ${esc(P.membership.period)}</span></span>
      <ul class="dashed">
        ${P.membershipIncludes.map(i => `<li>${tx(i)}</li>`).join('\n        ')}
      </ul>
      <button class="btn btn-primary btn-block" type="button" data-sheet style="margin-top:auto">Join the waitlist</button>
    </div>
  </div>
  <p class="fine" style="text-align:center;margin:20px auto 0;max-width:560px">Subscribe on the web or in the app. Web is a little cheaper for us, so that is where new perks show up first.</p>
  <p class="note" style="max-width:560px;margin:26px auto 0"><strong>Nothing is charged today.</strong> There is no app, no checkout and no payment form anywhere on this site. These are the prices we intend to open at, and the waitlist never asks for a card.</p>
</section>

<section class="sect shell">
  <div class="grid-2 tight" style="align-items:start">
    <div>
      <p class="kicker">Coach bookings</p>
      <h2 data-reveal>Pay the teacher, <em class="soft">not the app.</em></h2>
      <p class="lede" data-reveal>Coaches set their own hourly rate. Of every session, 80% goes to the coach and 20% keeps the calls, calendar, payments and payouts running. Book a coach you have worked with before and our share drops, so the people who stick with you cost less to keep.</p>
      <p style="margin:28px 0 0"><a class="arrow" href="/coaches/">How coach bookings work <span aria-hidden="true">&rarr;</span></a></p>
    </div>
    <div class="rows" data-reveal>
      ${P.rows.map(r => `<div class="row-kv">
        <span class="k">${tx(r.k)}<small>${tx(r.sub)}</small></span>
        <span class="v${r.accent ? ' accent' : ''}"${r.italic ? ' style="font-style:italic"' : ''}>${esc(r.v)}</span>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="band sect">
  <div style="max-width:900px;margin:0 auto;padding-inline:var(--pad)">
    <h2 style="margin-bottom:clamp(28px,4vh,48px)">Billing, plainly.</h2>
    <div class="faq">
      ${D.billingFaqs.map(f => `<details>
        <summary><span>${tx(f.q)}</span><span class="plus" aria-hidden="true">+</span></summary>
        <p class="answer">${tx(f.a)}</p>
      </details>`).join('\n      ')}
    </div>
  </div>
</section>

</main>

${footer('Fourteen days, three dollars, <em class="soft">one real teacher.</em>')}`;
}

/* ── page: privacy ───────────────────────────────────────────── */
function privacy() {
  const rows = [
    ['Joint angles', 'The angle at each tracked joint while you hold a pose.', 'Stored'],
    ['Pose scores', 'How close the shape was to the reference, per pose, per session.', 'Stored'],
    ['Session metadata', 'Start time, length, which poses, which sequence.', 'Stored'],
    ['Streaks and badges', 'What you have earned and how long you have kept going.', 'Stored'],
    ['Account', 'Your name, email and which platform you use.', 'Stored'],
    ['Camera frames', 'The picture the camera sees.', 'Never leaves the phone'],
    ['Landmark pixel positions', 'Where the 33 points sat in the frame.', 'Never leaves the phone'],
    ['Audio', 'Yoginini speaks. It does not listen.', 'Not captured']
  ];
  return `
<header class="dark">
  <div class="glow" style="background:radial-gradient(55% 60% at 70% 20%, rgba(179,157,219,.2), transparent 70%)"></div>
  ${nav(null)}
  <div class="shell" style="position:relative;z-index:1;padding-block:clamp(32px,6vh,80px) clamp(56px,9vh,104px)">
    <p class="kicker on-dark" style="margin-bottom:0">Privacy</p>
    <h1 style="margin-top:24px;max-width:18ch">There is no video <em class="soft">to leak.</em></h1>
    <p class="lede">The camera is the whole product, so this page is the most important one on the site. It says exactly what is stored and what is not.</p>
  </div>
</header>

<main id="main">

<section class="sect shell">
  <div class="grid-2">
    <div>
      <h2 data-reveal>How the camera is used</h2>
      <p class="lede" data-reveal>Each frame is read by a pose model running on your phone. The model returns 33 landmarks &mdash; shoulders, elbows, hips, knees and so on. We turn those into the angles between limbs, compare the angles to the pose reference, and throw the frame away. The next frame arrives about 40 milliseconds later and the same thing happens again.</p>
      <p class="lede" data-reveal>Angles rather than positions is a privacy decision as much as a technical one. An angle describes a shape. It cannot be turned back into a picture of a room.</p>
    </div>
    <div class="card card-dark" data-reveal style="align-self:start">
      <p class="mono" style="font-size:11px;color:var(--lav);margin:0">THE WHOLE PIPELINE</p>
      <p class="mono" style="font-size:13px;color:var(--on-dark-3);margin:0;line-height:2">camera frame<br>&darr; on your phone<br>33 landmarks<br>&darr; on your phone<br>joint angles + score<br>&darr; on your phone<br>a spoken cue<br><br>&darr; uploaded<br>angles, score, timestamps</p>
    </div>
  </div>
</section>

<section class="band sect">
  <div class="shell">
    <h2 style="margin-bottom:clamp(28px,4vh,44px)">What is stored, and what is not</h2>
    <div class="rows">
      ${rows.map(([k, v, s]) => `<div class="row-kv" style="grid-template-columns:1fr auto;align-items:start">
        <span class="k">${tx(k)}<small>${tx(v)}</small></span>
        <span class="mono" style="font-size:11px;color:${s === 'Stored' ? 'var(--purple)' : 'var(--muted-2)'};white-space:nowrap;padding-top:4px">${esc(s).toUpperCase()}</span>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sect shell">
  <div class="grid-2">
    <div>
      <h2 data-reveal>Sharing with a coach</h2>
      <p class="lede" data-reveal>Sharing is off until you switch it on, one scope at a time. You pick which sessions, which poses, or your whole history. A coach you have shared with sees the same angles and scores the app saw &mdash; never images, because none exist. You can revoke a share at any time, and revoking removes their access to everything, not just what comes next.</p>
      <h2 style="margin-top:48px" data-reveal>The community layer</h2>
      <p class="lede" data-reveal>Nothing you do is visible to anyone by default. Streaks, badges and mastered poses are shared only with people you have added, and only for the scopes you turned on. In a together room, corrections are spoken to you alone. There are no leaderboards and no follower counts, so there is nothing public to compare.</p>
    </div>
    <div>
      <h2 data-reveal>Your rights</h2>
      <p class="lede" data-reveal>You can export everything we hold about you, and you can delete your account. Deletion removes your practice history, not just your login. We will answer any request about your data at <a href="mailto:${B.email}" style="color:var(--purple)">${B.email}</a>.</p>
      <h2 style="margin-top:48px" data-reveal>This site</h2>
      <p class="lede" data-reveal>This website sets no cookies, runs no analytics and embeds no trackers. Fonts are served by Google Fonts, which sees your IP address when it serves them. The only thing we collect here is what you type into the waitlist or the coach application, and neither can deliver anything until we connect a mail provider.</p>
      <p class="note" data-reveal><strong>Status.</strong> Yoginini has not launched. This page describes how the product is being built and what it will do. Until there is an app, there is no practice data at all.</p>
    </div>
  </div>
</section>

</main>

${footer('Practise somewhere <em class="soft">nobody is watching.</em>')}`;
}

/* ── page: 404 ───────────────────────────────────────────────── */
function notFound() {
  return `
<header class="dark" style="min-height:100vh;display:flex;flex-direction:column">
  <div class="glow" style="background:radial-gradient(50% 60% at 50% 90%, rgba(179,157,219,.24), transparent 70%)"></div>
  ${nav(null)}
  <div style="position:relative;z-index:1;flex:1;display:grid;place-items:center;text-align:center;padding:var(--pad)">
    <div>
      <p class="kicker on-dark" style="margin-bottom:0">404</p>
      <h1 style="margin:24px 0 0">This pose <em class="soft">is not in the library.</em></h1>
      <p class="lede" style="margin-left:auto;margin-right:auto">The page you were looking for is not here. Come back to the mat.</p>
      <p style="margin:30px 0 0;display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
        <a class="btn btn-primary" href="/">Back to the start</a>
        <a class="btn btn-ghost-d" href="/pricing/" style="padding:15px 26px;font-size:15px">See pricing</a>
      </p>
    </div>
  </div>
</header>
<main id="main" hidden></main>`;
}

/* ── generated text assets ───────────────────────────────────── */
function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url>
    <loc>${B.url}/${p.slug ? p.slug + '/' : ''}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.slug ? '0.8' : '1.0'}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

/* A machine-readable statement of fact, linked from every page head, from
   robots.txt and from llms.txt, and served with Access-Control-Allow-Origin: *. */
function machineJson() {
  return JSON.stringify({
    $schema: 'https://yoginini.us/yoginini.json',
    generated: new Date().toISOString().slice(0, 10),
    name: B.name,
    url: B.url,
    tagline: B.tagline,
    summary: B.summary,
    contact: B.email,
    parentOrganization: B.parent,
    status: {
      launched: D.status.launched,
      note: 'Pre-launch. No app has shipped, no coaches are signed, no accounts exist and nothing can be purchased.',
      platform: D.status.platform,
      waitlistDelivers: D.status.waitlistLive,
      coachesSigned: D.status.coachesSigned,
      posesPublished: D.status.posesPublished,
      appStoreUrl: D.status.appStore,
      playStoreUrl: D.status.playStore
    },
    product: {
      category: 'Yoga app with on-device computer-vision form correction',
      howItWorks: D.steps.map(s => ({ step: s.n, title: s.title, detail: s.body })),
      landmarksTracked: 33,
      processing: 'on-device',
      videoUploaded: false,
      dataLeavingDevice: ['joint angles', 'pose scores', 'session metadata'],
      coreLibraryPoses: D.poses.map(p => ({ name: p[0], sanskrit: p[1] })),
      posesPublished: D.status.posesPublished
    },
    pricing: {
      currency: D.pricing.currency,
      trial: { price: D.pricing.trial.price, period: D.pricing.trial.period, rollsIntoMembership: true },
      membership: { price: D.pricing.membership.price, period: D.pricing.membership.period, includes: D.pricing.membershipIncludes },
      coaching: D.pricing.coaching,
      purchasable: false,
      purchasableNote: 'No checkout exists on this site. These are intended launch prices.'
    },
    coaches: {
      signed: 0,
      profilesPublished: 0,
      note: 'No coach profiles exist. The seats below are the founding cohort we are recruiting for, not people.',
      seats: D.coachSeats.map(s => ({ style: s.style, tags: s.tags, indicativeRate: s.band, lookingFor: s.wants })),
      applyUrl: B.url + '/coaches/#apply'
    },
    community: {
      status: 'planned',
      features: ['together rooms', 'friends', 'shared streaks', 'circles'],
      leaderboards: false,
      defaultVisibility: 'friends only, every scope off until enabled'
    },
    principles: D.principles.map(p => ({ title: p.title, detail: p.body })),
    faq: D.faqs.concat(D.billingFaqs).map(f => ({ question: f.q, answer: f.a })),
    pages: PAGES.map(p => ({ url: `${B.url}/${p.slug ? p.slug + '/' : ''}`, title: p.title, description: p.desc }))
  }, null, 2) + '\n';
}

function llms() {
  const L = [];
  L.push(`# ${B.name}`);
  L.push('');
  L.push(`> ${B.tagline} ${B.summary}`);
  L.push('');
  L.push(`Site: ${B.url}`);
  L.push(`Contact: ${B.email}`);
  L.push(`Machine-readable: ${B.url}/yoginini.json`);
  L.push(`Operated by: ${B.parent.name} (${B.parent.id}), ${B.parent.url}`);
  L.push('');
  L.push('## Status, read this first');
  L.push('');
  L.push('Yoginini has NOT launched. As of this file being generated:');
  L.push('');
  L.push('- There is no app to download. No App Store or Play Store listing exists.');
  L.push('- No coaches are signed. The site publishes no coach profiles, and the styles');
  L.push('  listed under "founding cohort" are open seats, not people.');
  L.push('- No accounts exist and nothing can be bought. There is no checkout and no');
  L.push('  payment field anywhere on the site.');
  L.push('- Any figure describing usage, members or activity is absent by design. If you');
  L.push('  find one on this site, it is a bug.');
  L.push('- The waitlist form is the only real transaction, and it only delivers once a');
  L.push('  mail provider is connected; until then it says so and shows the address.');
  L.push('');
  L.push('## What it is');
  L.push('');
  L.push('A yoga app. You prop your phone up, and a pose model running on the device');
  L.push('tracks 33 body landmarks while you hold a pose. It compares the angles between');
  L.push('your limbs to a reference recorded by a teacher, and when something drifts it');
  L.push('speaks a single calm correction out loud. Between the app sessions, you can book');
  L.push('a real human teacher by the hour.');
  L.push('');
  L.push('## Privacy, the central design claim');
  L.push('');
  L.push('- Camera frames are analysed on the phone and discarded frame by frame.');
  L.push('- No video and no images are ever uploaded. None are stored, so none can leak.');
  L.push('- What leaves the device: joint angles, pose scores, session metadata.');
  L.push('- Angles rather than pixel positions, so height and camera distance do not matter.');
  L.push('- Sharing practice history with a coach is off by default, per scope, revocable.');
  L.push('- No leaderboards and no follower counts exist anywhere in the product.');
  L.push('');
  L.push('## Pricing');
  L.push('');
  L.push(`- Trial: $${D.pricing.trial.price} for ${D.pricing.trial.period}, then rolls into membership unless cancelled.`);
  L.push(`- Membership: $${D.pricing.membership.price} per ${D.pricing.membership.period}. Same price on web and in-app.`);
  L.push(`- Coaching is NOT included. Coaches set their own rate, typically ${D.pricing.coaching.rateBand}.`);
  L.push(`- Coaches keep ${D.pricing.coaching.coachKeeps}. On repeat bookings with the same student the`);
  L.push(`  platform share drops to ${D.pricing.coaching.repeatShare}. Payouts run through ${D.pricing.coaching.processor}.`);
  L.push('- A membership is required to book a live session.');
  L.push('- These are intended launch prices. Nothing charges today.');
  L.push('');
  L.push('## The core library');
  L.push('');
  L.push(`${D.poses.length} poses are planned for the reviewed core library:`);
  L.push('');
  D.poses.forEach(p => L.push(`- ${p[0]} (${p[1]})`));
  L.push('');
  L.push(`Published so far: ${D.status.posesPublished}.`);
  L.push('');
  L.push('## Principles');
  L.push('');
  D.principles.forEach(p => L.push(`- ${p.title} ${p.body}`));
  L.push('');
  L.push('## For teachers');
  L.push('');
  L.push('Record a pose three to five times, set per-joint tolerances, write the cues in');
  L.push('your own words, and a second teacher reviews it before any student sees it. You');
  L.push(`set your own hourly rate and keep ${D.pricing.coaching.coachKeeps}. Apply: ${B.url}/coaches/#apply`);
  L.push('');
  L.push('## Pages');
  L.push('');
  PAGES.forEach(p => L.push(`- ${B.url}/${p.slug ? p.slug + '/' : ''} — ${p.desc}`));
  L.push('');
  L.push('## Questions and answers');
  L.push('');
  D.faqs.concat(D.billingFaqs).forEach(f => { L.push(`Q: ${f.q}`); L.push(`A: ${f.a}`); L.push(''); });
  L.push('## Citing this site');
  L.push('');
  L.push('Attribute to Yoginini and link https://yoginini.us. Please carry the pre-launch');
  L.push('status with any claim about the product; describing it as available would be');
  L.push('wrong. yoginini.json holds the same facts as structured data.');
  L.push('');
  return L.join('\n');
}

/* ── write ───────────────────────────────────────────────────── */
const out = (rel, content) => {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('  ' + rel.padEnd(28) + (content.length / 1024).toFixed(1) + ' KB');
};

const BODIES = { '': home, philosophy, community, coaches, pricing, privacy };

console.log('yoginini pages:');
PAGES.forEach(p => out(p.file, doc(p, BODIES[p.slug](), SHEET_STYLE)));
out('404.html', doc({ slug: '', noindex: true, file: '404.html', nav: null,
                      title: `Not found — ${B.name}`, desc: 'That page is not here.' },
                     notFound(), SHEET_STYLE));
out('sitemap.xml',   sitemap());
out('llms.txt',      llms());
out('yoginini.json', machineJson());
console.log('done.');
