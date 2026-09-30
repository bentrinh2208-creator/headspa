/* Gold Class Head Spa Chermside — site behaviour */
(function () {
  'use strict';

  /* ---------- Google rating (update here, or wire to the Places API later) ---------- */
  // Google rating: refreshed daily by .github/workflows/update-google-rating.yml.
  // The numbers in index.html are the fallback if this file can't be loaded.
  function applyRating(g) {
    if (!g || !g.reviewCount) return;
    var r = Number(g.rating);
    var rating = isNaN(r) ? String(g.rating) : r.toFixed(1);
    document.querySelectorAll('[data-rating]').forEach(function (el) { el.textContent = rating; });
    document.querySelectorAll('[data-review-count]').forEach(function (el) { el.textContent = g.reviewCount; });
  }
  if (window.fetch) {
    fetch('data/google-rating.json', { cache: 'no-cache' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(applyRating)
      .catch(function () {});
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('#nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Reviews carousel ---------- */
  (function () {
    var track = document.getElementById('reviewTrack');
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    var prev = document.getElementById('revPrev');
    var next = document.getElementById('revNext');
    var dotsEl = document.getElementById('revDots');
    var dots = [];
    function perView() {
      var w = cards[0].getBoundingClientRect().width;
      return Math.max(1, Math.round(track.clientWidth / (w + 1)));
    }
    function pages() { return Math.max(1, cards.length - perView() + 1); }
    function current() {
      var step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
      return Math.min(pages() - 1, Math.round(track.scrollLeft / step));
    }
    function go(i) {
      i = Math.max(0, Math.min(pages() - 1, i));
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
    }
    function buildDots() {
      var n = pages();
      if (dots.length === n) return;
      dotsEl.innerHTML = '';
      dots = [];
      for (var i = 0; i < n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show review ' + (i + 1));
        b.addEventListener('click', go.bind(null, i));
        dotsEl.appendChild(b);
        dots.push(b);
      }
    }
    function sync() {
      buildDots();
      var i = current();
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      prev.disabled = i <= 0;
      next.disabled = i >= pages() - 1;
    }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 80); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  })();

  /* ---------- FAQ tabs ---------- */
  var faqTabs = Array.prototype.slice.call(document.querySelectorAll('.faq-tabs [role="tab"]'));
  function showFaq(tab, focus) {
    faqTabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  faqTabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showFaq(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      e.preventDefault();
      showFaq(faqTabs[(n + faqTabs.length) % faqTabs.length], true);
    });
  });

  /* ---------- Social videos: only one plays at a time ---------- */
  var section = document.getElementById('social');
  var track = document.getElementById('videos');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.video-card'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('#vidDots button'));
  var prevBtn = document.getElementById('vidPrev');
  var nextBtn = document.getElementById('vidNext');
  var mobileMq = window.matchMedia('(max-width: 900px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = 0;
  var inView = false;
  var userStarted = false; // with reduced motion, wait for a tap before playing

  function videoOf(i) { return cards[i].querySelector('video'); }

  function syncUi() {
    cards.forEach(function (c, i) {
      var v = videoOf(i);
      var playing = i === active && !v.paused;
      c.classList.toggle('is-playing', playing);
      c.classList.toggle('has-sound', playing && !v.muted);
      c.querySelector('.video-hit').setAttribute('aria-label',
        playing ? (v.muted ? 'Turn sound on' : 'Mute video') : 'Play video ' + (i + 1) + ' of ' + cards.length);
    });
    dots.forEach(function (d, i) { d.setAttribute('aria-current', i === active ? 'true' : 'false'); });
    if (prevBtn) prevBtn.disabled = active === 0;
    if (nextBtn) nextBtn.disabled = active === cards.length - 1;
  }

  function playActive() {
    cards.forEach(function (c, i) {
      var v = videoOf(i);
      if (i !== active) { v.pause(); v.muted = true; }
    });
    if (inView && (!reduceMotion || userStarted)) {
      var v = videoOf(active);
      v.preload = 'auto';
      v.play().then(syncUi).catch(syncUi);
    }
    syncUi();
  }

  function scrollToCard(i) {
    if (!mobileMq.matches || !track) return;
    var c = cards[i];
    track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.clientWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function setActive(i, fromScroll) {
    if (i < 0 || i >= cards.length) return;
    if (i !== active) { videoOf(active).currentTime = 0; }
    active = i;
    if (!fromScroll) scrollToCard(i);
    playActive();
  }

  cards.forEach(function (card, i) {
    var v = videoOf(i);
    v.addEventListener('play', syncUi);
    v.addEventListener('pause', syncUi);
    v.addEventListener('volumechange', syncUi);
    card.querySelector('.video-hit').addEventListener('click', function () {
      userStarted = true;
      if (i !== active) { setActive(i); return; }
      if (v.paused) { inView = true; playActive(); return; }
      v.muted = !v.muted;
      if (!v.muted) { v.currentTime = 0; v.play().catch(function () {}); }
      syncUi();
    });
  });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { userStarted = true; setActive(i); }); });
  if (prevBtn) prevBtn.addEventListener('click', function () { userStarted = true; setActive(active - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { userStarted = true; setActive(active + 1); });

  // Phone: the card snapped to the centre becomes the playing one
  var scrollTimer;
  if (track) {
    track.addEventListener('scroll', function () {
      if (!mobileMq.matches) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bestD = Infinity;
        cards.forEach(function (c, i) {
          var d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best !== active) setActive(best, true);
      }, 120);
    }, { passive: true });
  }

  // Play only while the section is on screen
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) { playActive(); }
      else { cards.forEach(function (c, i) { var v = videoOf(i); v.pause(); v.muted = true; }); syncUi(); }
    }, { threshold: 0.35 }).observe(section);
  }
  syncUi();
})();
