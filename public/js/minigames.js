// Trò chơi nhỏ theo vòng: sút penalty, bóng rổ, pha chế hóa học, dò mìn, kiểm tra bài cũ.
// Mỗi trò 5 vòng, mỗi vòng 20 điểm (tối đa 100).
import { h } from './ui.js';
import { sfx } from './sound.js';
import { QUIZ } from './games.js';

const ROUNDS = 5;

// Khung chung: giới thiệu vòng → chơi → qua vòng / dừng → kết quả
function runRounds(root, { tip, play, continueOnFail = false, unit = 'điểm', resultNote }, onEnd) {
  let lv = 1, pts = 0, passed = 0, stopFn = null, dead = false;
  const head = h('p', { class: 'game-head' });
  const stage = h('div', { class: 'game-stage' });
  root.replaceChildren(head, stage);
  const setHead = () => { head.textContent = `Vòng ${Math.min(lv, ROUNDS)}/${ROUNDS} · ${pts} ${unit}`; };
  const intro = () => {
    setHead();
    stage.replaceChildren(h('div', { class: 'game-card' },
      h('div', { class: 'game-lv' }, `Vòng ${lv}`),
      h('p', {}, tip(lv)),
      h('button', { class: 'btn primary', onclick: go }, lv === 1 ? 'Bắt đầu' : 'Vào vòng ' + lv)));
  };
  const go = async () => {
    stage.replaceChildren();
    const res = await new Promise((resolve) => { stopFn = play(stage, lv, resolve); });
    stopFn = null;
    if (dead) return;
    if (res) { pts += 20; passed++; sfx.win(); } else sfx.lose();
    setHead();
    if ((res || continueOnFail) && lv < ROUNDS) {
      lv++;
      stage.replaceChildren(h('div', { class: 'game-card' }, h('div', { class: 'game-lv ' + (res ? 'ok' : 'bad') }, res ? 'Qua vòng! ✅' : 'Trượt rồi!'), h('button', { class: 'btn primary', onclick: intro }, 'Tiếp tục')));
      return;
    }
    finish();
  };
  const finish = () => {
    const note = resultNote ? resultNote(passed, pts) : (passed === ROUNDS ? 'Xuất sắc, qua cả 5 vòng!' : `Dừng ở vòng ${lv}. Giờ ra chơi sau gỡ lại nhé!`);
    stage.replaceChildren(h('div', { class: 'game-card' },
      h('div', { class: 'game-score' }, String(pts)), h('p', {}, note),
      h('button', { class: 'btn primary', onclick: () => { lv = 1; pts = 0; passed = 0; intro(); } }, 'Chơi lại')));
    onEnd(pts, passed);
  };
  intro();
  return () => { dead = true; stopFn?.(); };
}

function canvasIn(stage, w = 340, ht = 280) {
  const c = h('canvas', { class: 'game-canvas' });
  stage.append(c);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.min(w, stage.clientWidth || w);
  c.width = W * dpr; c.height = ht * dpr; c.style.width = W + 'px'; c.style.height = ht + 'px';
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  return { c, x, W, H: ht };
}

// ---------- Sút penalty: chạm vào chỗ muốn sút trong khung thành ----------
function penaltyRound(stage, lv, done) {
  const { c, x, W, H } = canvasIn(stage, 340, 280);
  const time = [5, 4, 3.5, 3, 2.5][lv - 1], guess = [0.2, 0.3, 0.4, 0.5, 0.6][lv - 1];
  const goal = { x: W / 2 - 120, y: 40, w: 240, h: 100 };
  const t0 = performance.now();
  let shot = null, keeper = { x: W / 2, y: goal.y + goal.h - 10, tx: W / 2, ty: goal.y + goal.h - 10 }, raf = 0, ended = false;
  const zoneOf = (px, py) => [px < goal.x + goal.w / 3 ? 0 : px < goal.x + goal.w * 2 / 3 ? 1 : 2, py < goal.y + goal.h / 2 ? 0 : 1];
  const end = (ok) => { if (ended) return; ended = true; setTimeout(() => done(ok), 700); };
  const draw = (now) => {
    const k = shot ? Math.min(1, (now - shot.t) / 550) : 0;
    x.fillStyle = '#5FAE55'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < H; i += 40) x.fillRect(0, i, W, 20);
    x.strokeStyle = '#fff'; x.lineWidth = 4; x.strokeRect(goal.x, goal.y, goal.w, goal.h);
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1;
    for (let i = goal.x; i < goal.x + goal.w; i += 12) { x.beginPath(); x.moveTo(i, goal.y); x.lineTo(i, goal.y + goal.h); x.stroke(); }
    for (let j = goal.y; j < goal.y + goal.h; j += 12) { x.beginPath(); x.moveTo(goal.x, j); x.lineTo(goal.x + goal.w, j); x.stroke(); }
    // thủ môn
    keeper.x += (keeper.tx - keeper.x) * 0.2; keeper.y += (keeper.ty - keeper.y) * 0.2;
    x.fillStyle = '#F2B233'; x.beginPath(); x.roundRect?.(keeper.x - 14, keeper.y - 34, 28, 30, 6); x.fill();
    x.fillStyle = '#F6CDA8'; x.beginPath(); x.arc(keeper.x, keeper.y - 42, 9, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1D2433'; x.fillRect(keeper.x - 20, keeper.y - 30, 6, 14); x.fillRect(keeper.x + 14, keeper.y - 30, 6, 14);
    // bóng
    const bx = shot ? W / 2 + (shot.x - W / 2) * k : W / 2, by = shot ? H - 40 + (shot.y - (H - 40)) * k : H - 40, br = 11 - k * 4;
    x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1D2433'; x.beginPath(); x.arc(bx, by, br * 0.35, 0, Math.PI * 2); x.fill();
    // thời gian
    if (!shot) {
      const left = Math.max(0, time - (now - t0) / 1000);
      x.fillStyle = '#fff'; x.font = '700 14px "Be Vietnam Pro", system-ui'; x.textAlign = 'center';
      x.fillText(`Chạm vào khung thành để sút · ${left.toFixed(1)}s`, W / 2, H - 10);
      if (left <= 0) { shot = { x: W / 2, y: H - 60, t: now, miss: true }; end(false); }
    } else if (k >= 1 && shot.result) {
      x.fillStyle = shot.result === 'goal' ? '#FFF59D' : '#FFCDD2'; x.font = '800 26px "Be Vietnam Pro", system-ui'; x.textAlign = 'center';
      x.fillText(shot.result === 'goal' ? 'VÀOOO! ⚽' : shot.result === 'save' ? 'Thủ môn bắt được!' : 'Ra ngoài rồi!', W / 2, H / 2 + 50);
    }
    raf = requestAnimationFrame(draw);
  };
  c.addEventListener('pointerdown', (e) => {
    if (shot) return;
    const r = c.getBoundingClientRect(); const px = e.clientX - r.left, py = e.clientY - r.top;
    shot = { x: px, y: py, t: performance.now() };
    sfx.whoosh();
    const inside = px > goal.x + 4 && px < goal.x + goal.w - 4 && py > goal.y + 4 && py < goal.y + goal.h;
    const [zx, zy] = zoneOf(px, py);
    let kz = [zx, zy];
    if (Math.random() > guess) kz = [[0, 1, 2].filter((v) => v !== zx)[Math.random() < 0.5 ? 0 : 1], Math.random() < 0.5 ? 0 : 1];
    keeper.tx = goal.x + goal.w * (kz[0] * 2 + 1) / 6; keeper.ty = goal.y + (kz[1] ? goal.h - 10 : goal.h * 0.55);
    shot.result = !inside ? 'out' : kz[0] === zx && kz[1] === zy ? 'save' : 'goal';
    end(shot.result === 'goal');
  });
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ---------- Bóng rổ: canh lực vào vùng sáng khi rổ ở gần giữa ----------
function basketRound(stage, lv, done) {
  const need = [2, 3, 3, 4, 4][lv - 1], secs = 20;
  const band = [0.22, 0.18, 0.15, 0.12, 0.1][lv - 1], hoopSpeed = [0, 40, 70, 95, 120][lv - 1], hoopRange = [0, 50, 70, 90, 110][lv - 1];
  const { c, x, W, H } = canvasIn(stage, 340, 300);
  const t0 = performance.now();
  let made = 0, power = 0, dirP = 1, ball = null, raf = 0, ended = false, last = t0, msg = '', msgAt = 0;
  const sweet = 0.62;
  const hoopX = (now) => W / 2 + Math.sin(now / 1000 * hoopSpeed / 50) * hoopRange;
  const end = (ok) => { if (ended) return; ended = true; setTimeout(() => done(ok), 600); };
  const draw = (now) => {
    const dt = (now - last) / 1000; last = now;
    if (!ball) { power += dirP * dt * 1.1; if (power > 1) { power = 1; dirP = -1; } if (power < 0) { power = 0; dirP = 1; } }
    x.fillStyle = '#E8C9A0'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(120,80,40,.25)'; for (let i = 0; i < W; i += 30) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    const hx = hoopX(now);
    x.fillStyle = '#fff'; x.fillRect(hx - 40, 30, 80, 50); x.strokeStyle = '#D8343A'; x.lineWidth = 2; x.strokeRect(hx - 15, 50, 30, 22);
    x.strokeStyle = '#F26A21'; x.lineWidth = 4; x.beginPath(); x.ellipse(hx, 86, 20, 5, 0, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1; for (let i = -16; i <= 16; i += 8) { x.beginPath(); x.moveTo(hx + i, 88); x.lineTo(hx + i * 0.6, 108); x.stroke(); }
    // thanh lực
    x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(W - 30, 110, 16, 150);
    x.fillStyle = 'rgba(255,245,157,.95)'; x.fillRect(W - 30, 110 + (1 - sweet - band / 2) * 150, 16, band * 150);
    x.fillStyle = '#D8343A'; x.fillRect(W - 34, 110 + (1 - power) * 150 - 2, 24, 4);
    // bóng
    if (ball) {
      const k = Math.min(1, (now - ball.t) / 700);
      const bx = W / 2 + (ball.tx - W / 2) * k, by = H - 40 - Math.sin(Math.PI * k) * 200 * ball.p - (H - 40 - ball.ty) * k;
      x.fillStyle = '#F26A21'; x.beginPath(); x.arc(bx, by, 12, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#7A2E0E'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx - 12, by); x.lineTo(bx + 12, by); x.moveTo(bx, by - 12); x.lineTo(bx, by + 12); x.stroke();
      if (k >= 1) {
        if (ball.ok) { made++; sfx.pop(); }
        msg = ball.ok ? 'Vào rổ!' : ball.why; msgAt = now; ball = null;
        if (made >= need) end(true);
      }
    } else {
      x.fillStyle = '#F26A21'; x.beginPath(); x.arc(W / 2, H - 40, 12, 0, Math.PI * 2); x.fill();
    }
    const left = Math.max(0, secs - (now - t0) / 1000);
    x.fillStyle = '#1D2433'; x.font = '700 14px "Be Vietnam Pro", system-ui'; x.textAlign = 'left';
    x.fillText(`Vào ${made}/${need} · ${left.toFixed(0)}s`, 12, H - 12);
    if (msg && now - msgAt < 900) { x.textAlign = 'center'; x.font = '800 20px "Be Vietnam Pro", system-ui'; x.fillStyle = msg === 'Vào rổ!' ? '#2E8B57' : '#D8343A'; x.fillText(msg, W / 2, 150); }
    if (left <= 0 && !ended) end(made >= need);
    raf = requestAnimationFrame(draw);
  };
  c.addEventListener('pointerdown', () => {
    if (ball || ended) return;
    const now = performance.now(), hx = hoopX(now);
    const okPower = Math.abs(power - sweet) <= band / 2;
    const okAim = Math.abs(hx - W / 2) < 26;
    ball = { t: now, p: power, tx: hx + (okAim ? 0 : (hx > W / 2 ? -1 : 1) * 30), ty: okPower ? 86 : power > sweet ? 40 : 140, ok: okPower && okAim, why: !okPower ? (power > sweet ? 'Mạnh quá' : 'Yếu quá') : 'Lệch rổ' };
    sfx.whoosh();
  });
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ---------- Pha chế hóa học: chọn đúng 2 lọ để tạo hiện tượng ----------
export const REACTIONS = [
  { goal: 'Tạo kết tủa xanh lam Cu(OH)₂', a: 'CuSO₄', b: 'NaOH', eq: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ (xanh lam) + Na₂SO₄', color: '#3B82F6' },
  { goal: 'Tạo kết tủa trắng AgCl từ muối ăn', a: 'AgNO₃', b: 'NaCl', eq: 'AgNO₃ + NaCl → AgCl↓ (trắng) + NaNO₃', color: '#F3F4F6' },
  { goal: 'Tạo kết tủa nâu đỏ Fe(OH)₃', a: 'FeCl₃', b: 'NaOH', eq: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ (nâu đỏ) + 3NaCl', color: '#A0522D' },
  { goal: 'Tạo kết tủa trắng BaSO₄', a: 'BaCl₂', b: 'Na₂SO₄', eq: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ (trắng) + 2NaCl', color: '#FAFAFA' },
  { goal: 'Thổi hơi thở làm nước vôi trong vẩn đục', a: 'Ca(OH)₂', b: 'CO₂', eq: 'Ca(OH)₂ + CO₂ → CaCO₃↓ (trắng đục) + H₂O', color: '#E5E7EB' },
  { goal: 'Làm phenolphtalein hóa hồng', a: 'Phenolphtalein', b: 'NaOH', eq: 'Phenolphtalein gặp bazơ (NaOH) → hồng', color: '#EC4899' },
  { goal: 'Làm quỳ tím hóa đỏ', a: 'Quỳ tím', b: 'HCl', eq: 'Quỳ tím gặp axit (HCl) → đỏ', color: '#DC2626' },
  { goal: 'Tạo kết tủa vàng AgI', a: 'AgNO₃', b: 'KI', eq: 'AgNO₃ + KI → AgI↓ (vàng) + KNO₃', color: '#FACC15' },
  { goal: 'Soda gặp axit sủi bọt khí CO₂', a: 'Na₂CO₃', b: 'HCl', eq: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑', color: '#BFDBFE', bubbles: true },
  { goal: 'Đinh sắt phủ lớp đồng đỏ', a: 'Fe', b: 'CuSO₄', eq: 'Fe + CuSO₄ → FeSO₄ + Cu (đỏ, bám trên đinh)', color: '#93C5FD' },
  { goal: 'Tạo dung dịch màu đỏ máu', a: 'FeCl₃', b: 'KSCN', eq: 'Fe³⁺ + SCN⁻ → phức màu đỏ máu', color: '#7F1D1D' },
  { goal: 'Làm hồ tinh bột hóa xanh tím', a: 'I₂', b: 'Hồ tinh bột', eq: 'I₂ + hồ tinh bột → hợp chất màu xanh tím', color: '#4C1D95' },
];
const REAGENTS = [...new Set(REACTIONS.flatMap((r) => [r.a, r.b]))];

function chemRound(stage, lv, done, order) {
  const rx = REACTIONS[order[lv - 1]];
  const pool = REAGENTS.filter((r) => r !== rx.a && r !== rx.b).sort(() => Math.random() - 0.5).slice(0, 4);
  const bottles = [rx.a, rx.b, ...pool].sort(() => Math.random() - 0.5);
  const picked = [];
  const beaker = h('div', { class: 'beaker' }, h('div', { class: 'liquid' }));
  const status = h('p', { class: 'muted' }, 'Chọn 2 lọ để đổ vào cốc.');
  const grid = h('div', { class: 'bottles' }, ...bottles.map((name) => {
    const btn = h('button', { class: 'bottle', onclick: () => {
      if (picked.length >= 2 || picked.includes(name)) return;
      picked.push(name); btn.classList.add('on'); sfx.click();
      if (picked.length === 2) {
        const ok = picked.includes(rx.a) && picked.includes(rx.b);
        const liq = beaker.firstChild;
        liq.style.background = ok ? rx.color : '#D6E4F0';
        beaker.classList.toggle('bubbles', ok && !!rx.bubbles);
        beaker.classList.add('filled');
        status.replaceChildren(ok ? h('b', { class: 'ok' }, '✅ ' + rx.eq) : h('span', { class: 'err' }, `Chưa đúng. Cần trộn ${rx.a} và ${rx.b}.`));
        setTimeout(() => done(ok), 1600);
      }
    } }, h('span', { class: 'flask' }, '🧪'), h('span', {}, name));
    return btn;
  }));
  stage.append(h('p', { class: 'chem-goal' }, '🎯 ' + rx.goal), beaker, grid, status);
  return () => {};
}

// ---------- Dò mìn ----------
function mineRound(stage, lv, done) {
  const [n, count] = [[5, 3], [6, 5], [7, 8], [8, 10], [8, 13]][lv - 1];
  let mines = null, flagMode = false, over = false, opened = 0;
  const cells = [];
  const board = h('div', { class: 'mines', style: { gridTemplateColumns: `repeat(${n}, 1fr)` } });
  const flagBtn = h('button', { class: 'btn ghost sm', onclick: () => { flagMode = !flagMode; flagBtn.textContent = flagMode ? '🚩 Đang cắm cờ' : '🚩 Cắm cờ'; flagBtn.classList.toggle('on', flagMode); } }, '🚩 Cắm cờ');
  const idx = (r, c) => r * n + c;
  const neighbors = (i) => { const r = Math.floor(i / n), c = i % n, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < n && cc < n) out.push(idx(rr, cc)); } return out; };
  const place = (safe) => {
    mines = new Set();
    const banned = new Set([safe, ...neighbors(safe)]);
    while (mines.size < count) { const i = Math.floor(Math.random() * n * n); if (!banned.has(i)) mines.add(i); }
  };
  const open = (i) => {
    const cell = cells[i];
    if (cell.dataset.open || cell.dataset.flag) return;
    cell.dataset.open = '1'; cell.classList.add('open'); opened++;
    if (mines.has(i)) { cell.textContent = '💥'; return 'boom'; }
    const k = neighbors(i).filter((j) => mines.has(j)).length;
    cell.textContent = k ? String(k) : ''; cell.dataset.k = String(k);
    if (!k) neighbors(i).forEach((j) => open(j));
  };
  for (let i = 0; i < n * n; i++) {
    const b = h('button', { class: 'mine', 'aria-label': 'Ô ' + (i + 1), onclick: () => {
      if (over) return;
      if (flagMode) { if (!b.dataset.open) { b.dataset.flag = b.dataset.flag ? '' : '1'; b.textContent = b.dataset.flag ? '🚩' : ''; } return; }
      if (!mines) place(i);
      sfx.click();
      if (open(i) === 'boom') {
        over = true; mines.forEach((m) => { cells[m].textContent = cells[m] === b ? '💥' : '💣'; cells[m].classList.add('open'); });
        setTimeout(() => done(false), 900); return;
      }
      if (opened >= n * n - count) { over = true; setTimeout(() => done(true), 500); }
    } });
    cells.push(b); board.append(b);
  }
  stage.append(h('div', { class: 'row-inline' }, h('span', { class: 'muted' }, `Bàn ${n}×${n} · ${count} quả mìn`), flagBtn), board);
  return () => {};
}

export const MINIGAMES = {
  penalty: {
    title: '⚽ Sút penalty', intro: 'Chạm vào chỗ muốn sút trong khung thành. Thủ môn ngày càng đoán giỏi hơn.',
    start: (root, onEnd) => runRounds(root, {
      continueOnFail: true, tip: (lv) => `Quả thứ ${lv}. Có ${[5, 4, 3.5, 3, 2.5][lv - 1]} giây để sút. Thủ môn đoán đúng khoảng ${[20, 30, 40, 50, 60][lv - 1]}%.`,
      play: penaltyRound, resultNote: (g) => `Ghi ${g}/5 bàn. ${g >= 4 ? 'Chân sút đội tuyển!' : 'Tập thêm vài quả nữa nhé!'}`,
    }, onEnd),
  },
  bongro: {
    title: '🏀 Bóng rổ', intro: 'Chạm để ném khi vạch lực nằm trong vùng sáng và rổ ở gần giữa.',
    start: (root, onEnd) => runRounds(root, {
      tip: (lv) => `Vào ${[2, 3, 3, 4, 4][lv - 1]} quả trong 20 giây. ${lv === 1 ? 'Rổ đứng yên.' : 'Vùng lực hẹp hơn, rổ chạy nhanh và xa hơn.'}`,
      play: basketRound,
    }, onEnd),
  },
  hoahoc: {
    title: '🧪 Pha chế hóa học', intro: 'Mỗi vòng một hiện tượng: chọn đúng 2 lọ hóa chất để tạo ra nó.',
    start: (root, onEnd) => {
      const order = REACTIONS.map((_, i) => i).sort(() => Math.random() - 0.5);
      return runRounds(root, {
        continueOnFail: true, tip: () => 'Đọc yêu cầu rồi chọn 2 lọ. Chỉ được chọn một lần!',
        play: (s, lv, d) => chemRound(s, lv, d, order), resultNote: (g) => `Pha đúng ${g}/5 phản ứng. ${g === 5 ? 'Đội tuyển Hóa đây rồi!' : 'Ôn lại dãy hoạt động hóa học nhé!'}`,
      }, onEnd);
    },
  },
  domin: {
    title: '💣 Dò mìn', intro: 'Mở hết các ô không có mìn. Con số cho biết có bao nhiêu mìn quanh ô đó.',
    start: (root, onEnd) => runRounds(root, { tip: (lv) => lv === 1 ? 'Bàn 5×5 có 3 quả mìn. Ô đầu tiên luôn an toàn.' : 'Bàn to hơn, nhiều mìn hơn.', play: mineRound }, onEnd),
  },
};

// ---------- Kiểm tra bài cũ: cô chủ nhiệm gọi lên bảng, 2 câu, mỗi câu 5 điểm ----------
export function oldLesson(root, lop, onEnd) {
  const qs = (QUIZ[lop] || QUIZ['Toán']).slice().sort(() => Math.random() - 0.5).slice(0, 2);
  let i = 0, right = 0;
  const show = () => {
    if (i >= qs.length) {
      const score = right * 5;
      root.replaceChildren(h('div', { class: 'game-card' },
        h('div', { class: 'game-score' }, `${score}/10`),
        h('p', {}, score === 10 ? '👩‍🏫 Giỏi lắm, em về chỗ!' : score === 5 ? '👩‍🏫 Tạm được, về ôn thêm nhé.' : '👩‍🏫 Chưa thuộc bài rồi em ơi!')));
      onEnd(score * 10, right);
      return;
    }
    const [q, ans, ok] = qs[i];
    root.replaceChildren(h('p', { class: 'muted' }, `👩‍🏫 Câu ${i + 1}/2 – em trả lời cô nào:`), h('p', { class: 'q' }, q),
      h('div', { class: 'answers' }, ...ans.map((a, k) => h('button', { class: 'answer', onclick: (e) => {
        root.querySelectorAll('.answer').forEach((x) => (x.disabled = true));
        e.currentTarget.classList.add(k === ok ? 'right' : 'wrong');
        root.querySelectorAll('.answer')[ok].classList.add('right');
        if (k === ok) { right++; sfx.coin(); } else sfx.lose();
        setTimeout(() => { i++; show(); }, 900);
      } }, a))));
  };
  show();
}
