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
    var label    = submit ? (submit.querySelector('[data-label]') || submit) : null;
    var idle     = label ? label.textContent : '';
    var contact  = D.brand ? D.brand.email : 'contact@yoginini.us';
    var EMAIL    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   /* the same test the functions apply */
    var BAD      = 'That email address does not look right. Check it and try again.';
    var DOWN     = 'We could not reach us just now. Please try again in a moment, or write to ' + contact + '.';
    var done     = null;

    function say(text, tone) {
      if (!msg) return;
      msg.textContent = text;
      msg.setAttribute('data-tone', tone || '');
    }
    function busy(on) {
      if (!submit) return;
      submit.disabled = on;
      if (on) submit.setAttribute('aria-busy', 'true'); else submit.removeAttribute('aria-busy');
      if (label) label.textContent = on ? 'Sending…' : idle;
    }
    /* An inline error; the form keeps what was typed. `field` is marked and focused. */
    function fail(text, field) {
      say(text, 'err');
      $$('input', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    }
    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }
    /* The success panel, built with textContent: the address never becomes markup. */
    function showDone(email) {
      if (done) done.remove();
      done = el('div', 'form-done');
      done.setAttribute('role', 'status');
      done.setAttribute('aria-live', 'polite');
      done.setAttribute('tabindex', '-1');
      done.appendChild(el('div', 'sheet-title', form.getAttribute('data-done-title') || 'Namaste.'));
      var p = el('p', 'body');
      var parts = (form.getAttribute('data-done-text') || 'We will write to {email} when your mat is ready.').split('{email}');
      parts.forEach(function (part, i) {
        if (i) p.appendChild(el('strong', '', email));
        p.appendChild(document.createTextNode(part));
      });
      done.appendChild(p);
      var note = form.getAttribute('data-done-note');
      if (note) done.appendChild(el('p', 'fine', note));
      var againText = form.getAttribute('data-again');
      if (againText) {
        var again = el('button', 'form-again', againText);
        again.type = 'button';
        again.addEventListener('click', function () {
          done.remove(); done = null;
          form.hidden = false;
          say('', '');
          var f = form.elements.email; if (f) { f.focus(); f.select(); }
        });
        done.appendChild(again);
      }
      form.hidden = true;
      form.parentNode.insertBefore(done, form.nextSibling);
      done.focus();
    }

    $$('input', form).forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.getAttribute('aria-invalid') === 'true') { i.removeAttribute('aria-invalid'); say('', ''); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit && submit.disabled) return;
      if (form.querySelector('.hp') && form.querySelector('.hp').value) return; // bot
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company') data[k] = typeof v === 'string' ? v.trim() : v; });
      var nameField = form.elements.name, emailField = form.elements.email;
      if (nameField && !data.name) { fail('Please add your name.', nameField); return; }
      if (emailField && !EMAIL.test(data.email || '')) { fail(BAD, emailField); return; }
      var missing = $$('[required]', form).filter(function (i) { return !String(i.value).trim(); })[0];
      if (missing) { fail('Please fill in ' + (form.querySelector('label[for="' + missing.id + '"]') || {}).textContent + '.', missing); return; }

      busy(true);
      say('', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
        .then(function (res) {
          busy(false);
          if (res.ok) { form.setAttribute('data-done', 'true'); showDone(data.email || ''); return; }
          var err = res.body && res.body.error;
          if (err === 'email_invalid') fail(BAD, emailField);
          else if (err === 'name_required') fail('Please add your name.', nameField);
          else if (err === 'link_invalid') fail('That link needs to start with https://.', form.elements.link);
          else if (err === 'styles_required') fail('Please add the styles you teach.', form.elements.styles);
          else if (err === 'challenge_failed') fail('The human check did not go through. Please reload the page and try again.');
          else if (res.status === 429) fail('Too many tries. Wait a minute, then try again.');
          else if (err === 'not_configured') {
            fail('Our mail sending is not connected yet, so this form cannot deliver. ' +
                 'Please write to ' + contact + ' and we will add you by hand.');
          } else fail(DOWN);
        })
        .catch(function () { busy(false); fail(DOWN); });
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
