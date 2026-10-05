/* ==========================================================================
   Duluth Auto Service & Imports — site behaviour
   Vanilla JS, no dependencies, no external APIs.
   Everything here is progressive enhancement: the page works without it.
   ========================================================================== */
(function () {
  'use strict';

  var LEADR_ENDPOINT = 'https://vision.leadrai.com/api/forms/425c77749fe5fc020f03ada3ad5ccc97';
  var SUBMIT_FLAG_KEY = 'das-last-form';

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ----------------------------------------------------------------------
     1. Footer year
     ---------------------------------------------------------------------- */
  var yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------------------
     2. Mobile navigation
     ---------------------------------------------------------------------- */
  var navToggle = qs('#navToggle');
  var nav = qs('#primaryNav');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  }

  function openNav() {
    if (!nav || !navToggle) return;
    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-open');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) closeNav();
      else openNav();
    });

    // Close when a nav link is tapped (same-page anchors)
    qsa('a', nav).forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ----------------------------------------------------------------------
     3. Sticky header shadow + active section highlight
     ---------------------------------------------------------------------- */
  var header = qs('#siteHeader');

  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = qsa('.nav__link');
  var sectionTargets = navLinks
    .map(function (link) {
      var id = (link.getAttribute('href') || '').replace('#', '');
      if (!id || id === 'top') return null; // #top is a zero-height marker
      var el = document.getElementById(id);
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sectionTargets.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var match = sectionTargets.filter(function (t) { return t.el === entry.target; })[0];
        if (!match) return;
        navLinks.forEach(function (l) { l.classList.remove('is-active'); });
        match.link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sectionTargets.forEach(function (t) { sectionObserver.observe(t.el); });
  }

  /* ----------------------------------------------------------------------
     4. Reveal on scroll
     ---------------------------------------------------------------------- */
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealTargets = qsa(
    '.strip__item, .svc, .about__media, .about__copy, .euro__copy, .euro__media, ' +
    '.gallery__item, .review, .offers__copy, .card--form, .infocard, .maplink, .sechead'
  );

  if (!reducedMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ----------------------------------------------------------------------
     5. Services: search + category filter
     ---------------------------------------------------------------------- */
  var svcGrid = qs('#svcGrid');
  var svcSearch = qs('#svcSearch');
  var svcEmpty = qs('#svcEmpty');
  var chips = qsa('.chip');
  var cards = svcGrid ? qsa('.svc', svcGrid) : [];
  var activeFilter = 'all';

  function applyServiceFilter() {
    var term = svcSearch ? svcSearch.value.trim().toLowerCase() : '';
    var shown = 0;

    cards.forEach(function (card) {
      var cat = card.getAttribute('data-cat') || '';
      var haystack = (
        (card.getAttribute('data-name') || '') + ' ' +
        (qs('.svc__title', card) ? qs('.svc__title', card).textContent : '') + ' ' +
        (qs('.svc__text', card) ? qs('.svc__text', card).textContent : '')
      ).toLowerCase();

      var matchesCat = activeFilter === 'all' || cat === activeFilter;
      var matchesTerm = !term || haystack.indexOf(term) !== -1;
      var visible = matchesCat && matchesTerm;

      card.hidden = !visible;
      if (visible) shown++;
    });

    if (svcEmpty) svcEmpty.hidden = shown !== 0;
  }

  if (svcSearch) {
    svcSearch.addEventListener('input', applyServiceFilter);
    svcSearch.addEventListener('search', applyServiceFilter);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.getAttribute('data-filter') || 'all';
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      applyServiceFilter();
    });
  });

  /* Deep-link: #services?cat=brakes style not needed, but keep grid consistent */
  applyServiceFilter();

  /* ----------------------------------------------------------------------
     6. Opening hours: today highlight + open/closed status
        Mon & Sun closed; Tue–Sat 8:00am – 6:00pm
     ---------------------------------------------------------------------- */
  var SCHEDULE = {
    0: null,              // Sunday — closed
    1: null,              // Monday — closed
    2: [8 * 60, 18 * 60],
    3: [8 * 60, 18 * 60],
    4: [8 * 60, 18 * 60],
    5: [8 * 60, 18 * 60],
    6: [8 * 60, 18 * 60]
  };

  (function hoursStatus() {
    var now = new Date();
    var day = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var today = SCHEDULE[day];

    var row = qs('.hours li[data-day="' + day + '"]');
    if (row) row.classList.add('is-today');

    var statusEl = qs('#openStatus');
    if (!statusEl) return;

    if (today && minutes >= today[0] && minutes < today[1]) {
      statusEl.textContent = 'Open now · closes 6:00 pm';
      statusEl.className = 'openstatus is-open';
      return;
    }

    // Find the next open day (today counts if we're before opening)
    var label = 'Closed now · ';
    if (today && minutes < today[0]) {
      label += 'opens today at 8:00 am';
    } else {
      var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var nextDay = null;
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (SCHEDULE[d]) { nextDay = d; break; }
      }
      label += nextDay === null
        ? 'see hours below'
        : 'opens ' + (nextDay === (day + 1) % 7 ? 'tomorrow' : names[nextDay]) + ' at 8:00 am';
    }

    statusEl.textContent = label;
    statusEl.className = 'openstatus is-closed';
  })();

  /* ----------------------------------------------------------------------
     7. Forms → LeadrVision
        - every form keeps its own method/action so it works without JS
        - fetch() POSTs to the SAME endpoint and includes _page in the body
        - confirmation shown inline for fetch, and on ?submitted=1 for plain POST
     ---------------------------------------------------------------------- */
  var forms = qsa('form[data-leadr-form]');

  // Populate every hidden _page field with the current URL on page load.
  qsa('input[data-page-field]').forEach(function (input) {
    input.value = window.location.href;
  });

  function noteFor(form, which) {
    var card = form.closest('.card') || form.parentNode;
    return card ? qs('[data-' + which + ']', card) : null;
  }

  function showConfirmation(form, scroll) {
    var ok = noteFor(form, 'success');
    var err = noteFor(form, 'error');
    if (err) err.hidden = true;
    if (!ok) return;
    ok.hidden = false;
    if (scroll && typeof ok.scrollIntoView === 'function') {
      ok.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }

  function showError(form) {
    var ok = noteFor(form, 'success');
    var err = noteFor(form, 'error');
    if (ok) ok.hidden = true;
    if (err) {
      err.hidden = false;
      if (typeof err.scrollIntoView === 'function') {
        err.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  function validate(form) {
    var firstBad = null;
    qsa('input, select, textarea', form).forEach(function (field) {
      if (field.type === 'hidden' || field.name === '_gotcha') return;
      field.removeAttribute('aria-invalid');
      if (!field.hasAttribute('required')) return;

      var value = (field.value || '').trim();
      var bad = !value;

      if (!bad && field.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!bad && field.type === 'tel') bad = (value.replace(/[^0-9]/g, '').length < 7);

      if (bad) {
        field.setAttribute('aria-invalid', 'true');
        if (!firstBad) firstBad = field;
      }
    });

    if (firstBad) {
      firstBad.focus();
      return false;
    }
    return true;
  }

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      // Remember which form was used, so a no-JS round trip can be confirmed
      // against the right card when the page reloads with ?submitted=1.
      var formName = (qs('input[name="_form"]', form) || {}).value || '';
      try { window.sessionStorage.setItem(SUBMIT_FLAG_KEY, formName); } catch (ignore) {}

      // Keep the _page value fresh at submit time too.
      qsa('input[data-page-field]', form).forEach(function (input) {
        if (!input.value) input.value = window.location.href;
      });

      if (!validate(form)) {
        e.preventDefault();
        return;
      }

      // No fetch available → let the browser do the plain POST.
      if (typeof window.fetch !== 'function' || typeof FormData !== 'function') return;

      e.preventDefault();

      var button = qs('button[type="submit"]', form);
      var original = button ? button.textContent : '';
      if (button) {
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Sending…';
      }

      var data = new FormData(form);
      var payload = {};
      data.forEach(function (value, key) { payload[key] = value; });
      payload._page = window.location.href;

      fetch(LEADR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: res.ok }; });
        })
        .then(function (json) {
          if (json && json.ok) {
            form.reset();
            qsa('input[data-page-field]', form).forEach(function (input) {
              input.value = window.location.href;
            });
            showConfirmation(form, true);
          } else {
            showError(form);
          }
        })
        .catch(function () {
          showError(form);
        })
        .then(function () {
          if (button) {
            button.removeAttribute('aria-busy');
            button.textContent = original;
          }
        });
    });
  });

  /* ----------------------------------------------------------------------
     8. Plain-HTML submission return: ?submitted=1
     ---------------------------------------------------------------------- */
  (function handleSubmittedParam() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('submitted') !== '1' || !forms.length) return;

    var last = '';
    try { last = window.sessionStorage.getItem(SUBMIT_FLAG_KEY) || ''; } catch (ignore) {}

    var matched = forms.filter(function (form) {
      var field = qs('input[name="_form"]', form);
      return field && field.value === last;
    });

    // If we can't tell which form it was, confirm on the main contact form.
    var target = matched.length ? matched : [forms[forms.length - 1]];
    target.forEach(function (form, i) { showConfirmation(form, i === 0); });

    try { window.sessionStorage.removeItem(SUBMIT_FLAG_KEY); } catch (ignore) {}
  })();
})();
