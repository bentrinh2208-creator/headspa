/* Gold Class Head Spa Chermside — site behaviour */
(function () {
  'use strict';

  /* ---------- Google rating (update here, or wire to the Places API later) ---------- */
  var GOOGLE = { rating: '5.0', reviewCount: 259 };
  document.querySelectorAll('[data-rating]').forEach(function (el) { el.textContent = GOOGLE.rating; });
  document.querySelectorAll('[data-review-count]').forEach(function (el) { el.textContent = GOOGLE.reviewCount; });

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

  /* ---------- Social videos: play muted when visible, tap for sound ---------- */
  var cards = document.querySelectorAll('.video-card');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target.querySelector('video');
        if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.5 });
    cards.forEach(function (c) { io.observe(c); });
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var v = card.querySelector('video');
      var turnOn = v.muted;
      cards.forEach(function (c) { c.querySelector('video').muted = true; c.classList.remove('has-sound'); });
      if (turnOn) {
        v.muted = false; v.currentTime = 0; v.play().catch(function () {});
        card.classList.add('has-sound');
      }
    });
  });
})();
