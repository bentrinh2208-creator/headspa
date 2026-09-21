document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- MOBILE NAV ---------- */
const header = document.querySelector('.site-header');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => header.classList.toggle('menu-open'));
document.querySelectorAll('.nav a').forEach(a =>
  a.addEventListener('click', () => header.classList.remove('menu-open'))
);

/* ---------- SERVICE TABS ---------- */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.service-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.service-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
  });
});

/* ---------- VIDEO CARDS ---------- */
const videoModal = document.getElementById('videoModal');
const videoModalPlayer = document.getElementById('videoModalPlayer');
document.querySelectorAll('.video-card').forEach(card => {
  const clip = card.querySelector('.clip');
  clip.play().catch(() => {});
  card.querySelector('.play-btn').addEventListener('click', () => {
    videoModalPlayer.src = clip.querySelector('source').src;
    openModal(videoModal);
    videoModalPlayer.play().catch(() => {});
  });
});
document.getElementById('videoModalClose').addEventListener('click', () => {
  videoModalPlayer.pause();
  videoModalPlayer.removeAttribute('src');
  closeModal(videoModal);
});

/* ---------- MODAL HELPERS ---------- */
function openModal(el) { el.classList.add('open'); }
function closeModal(el) { el.classList.remove('open'); }
document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd); });
});

/* ---------- LUCKY WHEEL ---------- */
const SEGMENTS = [
  { label: '5%',       discount: 5,   weight: 14.2857 },
  { label: '10%',      discount: 10,  weight: 14.2857 },
  { label: '15%',      discount: 15,  weight: 14.2857 },
  { label: '8%',       discount: 8,   weight: 14.2857 },
  { label: '20%',      discount: 20,  weight: 14.2857 },
  { label: '12%',      discount: 12,  weight: 14.2857 },
  { label: '18%',      discount: 18,  weight: 14.2857 },
  { label: 'MIỄN PHÍ', discount: 100, weight: 1, jackpot: true },
];
// weights sum ~= 100, jackpot ~1% (~1/100 lượt quay)

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;
const SLICE_ANGLE = (Math.PI * 2) / SEGMENTS.length;
const COLORS = ['#6b7f66', '#f1ece1'];

function drawWheel() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  SEGMENTS.forEach((seg, i) => {
    const start = -Math.PI / 2 + i * SLICE_ANGLE;
    const end = start + SLICE_ANGLE;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.jackpot ? '#c9a24a' : COLORS[i % 2];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const midAngle = start + SLICE_ANGLE / 2;
    const normalized = ((midAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const flip = normalized > Math.PI / 2 && normalized < Math.PI * 1.5;

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(midAngle + (flip ? Math.PI : 0));
    ctx.textAlign = flip ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = seg.jackpot ? '#ffffff' : '#2b2b26';
    ctx.font = seg.jackpot ? '700 15px Inter, sans-serif' : '700 20px "Cormorant Garamond", serif';
    ctx.fillText(seg.label, flip ? -(RADIUS - 22) : RADIUS - 22, 0);
    ctx.restore();
  });
}
drawWheel();

function pickWeightedIndex() {
  const total = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTS.length; i++) {
    r -= SEGMENTS[i].weight;
    if (r <= 0) return i;
  }
  return SEGMENTS.length - 1;
}

function genPromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SPA-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const wheelForm = document.getElementById('wheelForm');
const spinBtn = document.getElementById('spinBtn');
const wheelNote = document.getElementById('wheelNote');
const STORAGE_KEY = 'headspa_wheel_result';

function renderExistingResult() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);
  spinBtn.disabled = true;
  spinBtn.textContent = 'Đã quay';
  wheelNote.textContent = `Anh/chị đã quay rồi. Mã ưu đãi: ${data.code} — ${data.jackpot ? 'Miễn phí 1 dịch vụ' : 'Giảm ' + data.discount + '%'}.`;
}
renderExistingResult();

let spinning = false;
wheelForm.addEventListener('submit', e => {
  e.preventDefault();
  if (spinning) return;
  if (localStorage.getItem(STORAGE_KEY)) {
    wheelNote.textContent = 'Anh/chị chỉ được quay 1 lần trên thiết bị này.';
    wheelNote.classList.add('error');
    return;
  }

  const name = document.getElementById('wheelName').value.trim();
  const phone = document.getElementById('wheelPhone').value.trim();
  if (!name || !phone) return;

  spinning = true;
  spinBtn.disabled = true;
  wheelNote.classList.remove('error');
  wheelNote.textContent = 'Đang quay...';

  const index = pickWeightedIndex();
  const seg = SEGMENTS[index];
  const sliceCenterDeg = (-90 + index * (360 / SEGMENTS.length) + (360 / SEGMENTS.length) / 2 + 360) % 360;
  let rotationNeeded = (-90 - sliceCenterDeg + 3600) % 360;
  const totalDeg = rotationNeeded + 360 * 6; // 6 full spins + land angle

  canvas.style.transition = 'transform 4.2s cubic-bezier(.17,.67,.16,1)';
  canvas.style.transform = `rotate(${totalDeg}deg)`;

  setTimeout(() => {
    const code = genPromoCode();
    const result = { name, phone, discount: seg.discount, jackpot: !!seg.jackpot, code, at: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

    document.getElementById('modalIcon').textContent = seg.jackpot ? '🏆' : '🎉';
    document.getElementById('modalTitle').textContent = seg.jackpot ? 'Trúng thưởng lớn!' : 'Chúc mừng!';
    document.getElementById('modalDesc').textContent = seg.jackpot
      ? 'Anh/chị may mắn trúng 1 dịch vụ MIỄN PHÍ! Xuất hiện với tỉ lệ khoảng 1/100 lượt quay.'
      : `Anh/chị nhận được ưu đãi giảm ${seg.discount}% cho dịch vụ tiếp theo.`;
    document.getElementById('modalCode').textContent = code;
    document.getElementById('bCode').value = code;

    openModal(document.getElementById('wheelModal'));
    renderExistingResult();
    spinning = false;
  }, 4300);
});

document.getElementById('wheelModalClose').addEventListener('click', () => closeModal(document.getElementById('wheelModal')));
document.getElementById('modalToBooking').addEventListener('click', () => {
  closeModal(document.getElementById('wheelModal'));
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
});

/* ---------- BOOKING FORM (demo only) ---------- */
const bookingForm = document.getElementById('bookingForm');
const bookingModal = document.getElementById('bookingModal');
bookingForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    name: document.getElementById('bName').value.trim(),
    phone: document.getElementById('bPhone').value.trim(),
    service: document.getElementById('bService').value,
    date: document.getElementById('bDate').value,
    time: document.getElementById('bTime').value,
    code: document.getElementById('bCode').value.trim(),
    note: document.getElementById('bNote').value.trim(),
  };

  const bookings = JSON.parse(localStorage.getItem('headspa_bookings') || '[]');
  bookings.push({ ...data, at: Date.now() });
  localStorage.setItem('headspa_bookings', JSON.stringify(bookings));

  document.getElementById('bookingModalDesc').textContent =
    `${data.name} — ${data.service} vào ${data.date} lúc ${data.time}. Spa sẽ gọi điện xác nhận qua số ${data.phone}.`;
  openModal(bookingModal);
  bookingForm.reset();
});
document.getElementById('bookingModalClose').addEventListener('click', () => closeModal(bookingModal));
document.getElementById('bookingModalOk').addEventListener('click', () => closeModal(bookingModal));
