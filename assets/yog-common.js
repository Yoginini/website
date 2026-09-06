/* Yoginini — shared behaviour. No framework, no build step.
 * Everything here is progressive: the pages are complete HTML without it. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var D = window.YOG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Nav (mobile disclosure) ───────────────────────────────── */
  $$('.nav').forEach(function (nav) {
    var btn = $('.nav-toggle', nav);
    if (!btn) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.textContent = open ? 'Menu' : 'Close';
    });
  });

  /* ── Reveal on scroll ──────────────────────────────────────── */
  var reveals = $$('[data-reveal]');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('shown');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('shown');
      else io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('shown'); });
  }

  /* ── Rotating spoken cue (hero) ────────────────────────────── */
  var cueBox = $('[data-cue]');
  if (cueBox && D.cues && D.cues.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ci = 0;
    setInterval(function () {
      ci = (ci + 1) % D.cues.length;
      var span = $('.cue-text', cueBox);
      if (!span) return;
      cueBox.style.animation = 'none';
      void cueBox.offsetWidth;              // restart the animation
      cueBox.style.animation = '';
      span.textContent = '“' + D.cues[ci] + '”';
    }, 5000);
  }

  /* ── Waitlist sheet ────────────────────────────────────────── */
  var sheet = $('#sheet');
  var lastFocus = null;

  function openSheet(e) {
    if (e) e.preventDefault();
    if (!sheet) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    var f = sheet.querySelector('input, button');
    if (f) f.focus();
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-sheet]').forEach(function (b) { b.addEventListener('click', openSheet); });
  if (sheet) {
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
    $$('[data-sheet-close]', sheet).forEach(function (b) { b.addEventListener('click', closeSheet); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  }

  /* ── Forms ─────────────────────────────────────────────────── *
   * Posts JSON to a Cloudflare Pages Function. Until the mail secrets are
   * set the function answers 503 not_configured, and we say so plainly and
   * hand over the real address rather than pretending the message was sent. */
  $$('form[data-post]').forEach(function (form) {
    var endpoint = form.getAttribute('data-post');
    var msg      = $('.form-msg', form);
    var submit   = form.querySelector('[type="submit"]');
    var label    = submit ? submit.textContent : '';

    function say(text, tone) {
      if (!msg) return;
      msg.textContent = text;
      msg.setAttribute('data-tone', tone || '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('.hp') && form.querySelector('.hp').value) return; // bot
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company') data[k] = v; });

      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      say('', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            form.setAttribute('data-done', 'true');
            var done = form.getAttribute('data-done-text') || 'You are on the list. We will write when your mat is ready.';
            form.innerHTML = '<div class="sheet-title" style="font-style:italic">Namaste.</div>' +
                             '<p class="body" style="margin:0">' + done + '</p>';
            return;
          }
          if (res.body && res.body.error === 'not_configured') {
            say('Our mail sending is not connected yet, so this form cannot deliver. ' +
                'Please write to ' + (D.brand ? D.brand.email : 'contact@yoginini.us') + ' and we will add you by hand.', 'err');
          } else {
            say('That did not send. Please try again, or write to ' +
                (D.brand ? D.brand.email : 'contact@yoginini.us') + '.', 'err');
          }
        })
        .catch(function () {
          say('That did not send. Please write to ' + (D.brand ? D.brand.email : 'contact@yoginini.us') + '.', 'err');
        })
        .then(function () {
          if (submit) { submit.disabled = false; submit.textContent = label; }
        });
    });
  });

  /* ── Coach cohort filter ───────────────────────────────────── */
  var filterBar = $('[data-coach-filters]');
  if (filterBar) {
    var seats = $$('[data-seat]');
    var empty = $('[data-coach-empty]');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var want = btn.getAttribute('data-filter');
      $$('button[data-filter]', filterBar).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      seats.forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split(',');
        var hit = want === 'All' || tags.indexOf(want) !== -1;
        card.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ── Share toggles (community preview) ─────────────────────── */
  $$('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
    });
  });

  /* ── Year stamp ────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
