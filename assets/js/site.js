/* Gold Class Head Spa Chermside — site behaviour */
(function () {
  'use strict';

  var SQUARE_URL = 'https://book.squareup.com/appointments/vua2hb0rjhnlym/location/L93RV1W2DN5CJ';

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

  /* ---------- Booking helper ---------- */
  var TREATMENTS = {
    experience: { name: 'Head Spa Experience', mins: '60 min', cost: 199, dur: 1 },
    premium: { name: 'Head Spa Premium', mins: '90 min', cost: 299, dur: 1.5 }
  };
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var state = { treatment: 'premium', day: 0, time: null, longHair: false };

  // Trading hours [open, close] in hours, by day of week (0 = Sunday)
  function hoursFor(dow) {
    if (dow === 0) return [10, 16];
    if (dow === 4) return [9, 21];
    if (dow === 6) return [9, 17];
    return [9, 17.5];
  }
  function fmt(h) {
    var hh = Math.floor(h), mm = h % 1 ? '30' : '00';
    var ap = hh >= 12 ? 'pm' : 'am';
    var h12 = hh > 12 ? hh - 12 : hh;
    return h12 + ':' + mm + ap;
  }
  function dateFor(i) {
    var t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
  }

  var daysEl = document.getElementById('days');
  var slotsEl = document.getElementById('slots');
  if (!daysEl || !slotsEl) return;

  function renderDays() {
    daysEl.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var d = dateFor(i);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt day';
      b.setAttribute('aria-pressed', i === state.day ? 'true' : 'false');
      b.setAttribute('aria-label', (i === 0 ? 'Today, ' : '') + DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]);
      b.innerHTML = '<span class="day-dow">' + (i === 0 ? 'Today' : DOW[d.getDay()]) + '</span>' +
        '<span class="day-num">' + d.getDate() + '</span><span class="day-mon">' + MON[d.getMonth()] + '</span>';
      b.dataset.i = i;
      b.addEventListener('click', function () { state.day = +this.dataset.i; state.time = null; render(); });
      daysEl.appendChild(b);
    }
  }

  function isPast(i, h) {
    if (i !== 0) return false;
    var now = new Date();
    return h <= now.getHours() + now.getMinutes() / 60 + 0.5;
  }

  function renderSlots() {
    var t = TREATMENTS[state.treatment];
    var d = dateFor(state.day);
    var oc = hoursFor(d.getDay());
    slotsEl.innerHTML = '';
    var count = 0;
    for (var h = oc[0]; h + t.dur <= oc[1]; h += 0.5) {
      if (isPast(state.day, h)) continue;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt slot';
      b.textContent = fmt(h);
      b.setAttribute('aria-pressed', state.time === h ? 'true' : 'false');
      b.dataset.h = h;
      b.addEventListener('click', function () { state.time = +this.dataset.h; render(); });
      slotsEl.appendChild(b);
      count++;
    }
    if (!count) {
      var p = document.createElement('p');
      p.className = 'muted small';
      p.textContent = 'No more times today — please pick another day.';
      slotsEl.appendChild(p);
    }
    document.getElementById('hoursNote').textContent =
      'Open ' + fmt(oc[0]) + ' – ' + fmt(oc[1]) + ' · last start ' + fmt(oc[1] - t.dur);
  }

  function render() {
    document.querySelectorAll('.opt-t').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === state.treatment ? 'true' : 'false');
    });
    renderDays();
    renderSlots();
    var t = TREATMENTS[state.treatment];
    var d = dateFor(state.day);
    var when = (state.day === 0 ? 'Today' : DOW[d.getDay()]) + ' ' + d.getDate() + ' ' + MON[d.getMonth()] +
      (state.time !== null ? ', ' + fmt(state.time) : ' · choose a time');
    document.getElementById('summary').textContent = t.name + ' (' + t.mins + ') · ' + when;
    document.getElementById('total').textContent = 'Total $' + (t.cost + (state.longHair ? 20 : 0));
  }

  document.querySelectorAll('.opt-t').forEach(function (b) {
    b.addEventListener('click', function () { state.treatment = this.dataset.id; state.time = null; render(); });
  });
  document.getElementById('longHair').addEventListener('change', function () { state.longHair = this.checked; render(); });
  document.querySelectorAll('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () { state.treatment = this.dataset.pick; state.time = null; render(); });
  });
  document.getElementById('continueBtn').href = SQUARE_URL;
  render();

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
