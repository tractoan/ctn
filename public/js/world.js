// Sân trường: vẽ bản đồ, camera, tìm đường (A* trên lưới), nhân vật mình + người khác.
import { WORLD, GROUNDS, BUILDINGS, WALLS, GATE, TREES, BENCHES, FLAG, BOARD, STAGE, HOTSPOTS, CLASS_DOORS, solids } from './campus.js';
import { drawAvatar } from './avatar.js';

const CELL = 20;
const SPEED = 190; // px/giây

// ---------- Lưới va chạm & tìm đường ----------
const GW = Math.ceil(WORLD.w / CELL), GH = Math.ceil(WORLD.h / CELL);
const blocked = new Uint8Array(GW * GH);
const SOLIDS = solids();
(function buildGrid() {
  const pad = 8;
  for (const s of SOLIDS) {
    const x0 = Math.max(0, Math.floor((s.x - pad) / CELL)), x1 = Math.min(GW - 1, Math.floor((s.x + s.w + pad - 1) / CELL));
    const y0 = Math.max(0, Math.floor((s.y - pad) / CELL)), y1 = Math.min(GH - 1, Math.floor((s.y + s.h + pad - 1) / CELL));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked[y * GW + x] = 1;
  }
})();
const isBlockedPx = (x, y) => {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return true;
  return blocked[cy * GW + cx] === 1;
};

function nearestFree(cx, cy) {
  if (!blocked[cy * GW + cx]) return [cx, cy];
  for (let r = 1; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < GW && y < GH && !blocked[y * GW + x]) return [x, y];
    }
  }
  return [cx, cy];
}

function lineFree(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / (CELL / 3));
  for (let i = 1; i <= n; i++) { const t = i / n; if (isBlockedPx(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
  return true;
}

export function findPath(sx, sy, tx, ty) {
  let [scx, scy] = nearestFree(Math.floor(sx / CELL), Math.floor(sy / CELL));
  const [tcx, tcy] = nearestFree(Math.max(0, Math.min(GW - 1, Math.floor(tx / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(ty / CELL))));
  const goalExact = !isBlockedPx(tx, ty);
  const start = scy * GW + scx, goal = tcy * GW + tcx;
  const g = new Float32Array(GW * GH).fill(Infinity), from = new Int32Array(GW * GH).fill(-1);
  const closed = new Uint8Array(GW * GH);
  const open = [start]; g[start] = 0;
  const f = new Map([[start, 0]]);
  const hfn = (i) => { const x = i % GW, y = (i / GW) | 0; return Math.hypot(x - tcx, y - tcy); };
  let found = start === goal;
  while (open.length && !found) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(open[i]) < f.get(open[bi])) bi = i;
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (cur === goal) { found = true; break; }
    closed[cur] = 1;
    const cx = cur % GW, cy = (cur / GW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (blocked[ni] || closed[ni]) continue;
      if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
      const ng = g[cur] + (dx && dy ? 1.414 : 1);
      if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; if (!f.has(ni)) open.push(ni); f.set(ni, ng + hfn(ni)); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let i = goal; i !== -1 && i !== start; i = from[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map((i) => ({ x: (i % GW) * CELL + CELL / 2, y: ((i / GW) | 0) * CELL + CELL / 2 }));
  if (goalExact) pts.push({ x: tx, y: ty });
  // làm mượt: bỏ các điểm trung gian nếu nhìn thẳng được
  const out = [];
  let ax = sx, ay = sy, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !lineFree(ax, ay, pts[j].x, pts[j].y)) j--;
    out.push(pts[j]); ax = pts[j].x; ay = pts[j].y; i = j + 1;
  }
  return out;
}

// ---------- Vẽ ----------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function label(ctx, txt, x, y, { size = 12, color = '#1D2433', bg = null, weight = 700, pad = 5 } = {}) {
  ctx.font = `${weight} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
  const w = ctx.measureText(txt).width;
  if (bg) { ctx.fillStyle = bg; rr(ctx, x - w / 2 - pad, y - size / 2 - pad + 1, w + pad * 2, size + pad * 2 - 2, (size + pad * 2) / 2); ctx.fill(); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y + 0.5);
  return w + pad * 2;
}

function drawGround(ctx, g) {
  switch (g.kind) {
    case 'road': {
      ctx.fillStyle = '#4B5160'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = '#F4F1E6'; ctx.lineWidth = 4; ctx.setLineDash([40, 30]);
      ctx.beginPath(); ctx.moveTo(g.x, g.y + g.h / 2); ctx.lineTo(g.x + g.w, g.y + g.h / 2); ctx.stroke(); ctx.setLineDash([]);
      for (let x = 160; x < g.w; x += 640) label(ctx, g.label, x, g.y + g.h / 2 + 34, { size: 14, color: 'rgba(255,255,255,.75)', weight: 800 });
      // vạch qua đường trước cổng
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let x = 920; x < 1080; x += 22) ctx.fillRect(x, g.y + 8, 12, 46);
      break;
    }
    case 'sidewalk': ctx.fillStyle = '#C9C3B6'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
      for (let x = 0; x < g.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); }
      break;
    case 'grass': ctx.fillStyle = '#A9D18E'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = 'rgba(70,120,50,.10)';
      for (let i = 0; i < 900; i++) { const px = g.x + ((i * 7919) % g.w), py = g.y + ((i * 104729) % g.h); ctx.fillRect(px, py, 3, 2); }
      break;
    case 'paving': ctx.fillStyle = '#E9E2D3'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(120,100,70,.10)'; ctx.lineWidth = 1;
      for (let x = g.x; x <= g.x + g.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); }
      for (let y = g.y; y <= g.y + g.h; y += 40) { ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); }
      if (g.label) label(ctx, g.label, g.x + g.w / 2, g.y + g.h - 150, { size: 30, color: 'rgba(120,100,70,.16)', weight: 800 });
      break;
    case 'field': {
      ctx.fillStyle = '#5FAE55'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let y = g.y; y < g.y + g.h; y += 80) ctx.fillRect(g.x, y, g.w, 40);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
      ctx.strokeRect(g.x + 14, g.y + 14, g.w - 28, g.h - 28);
      ctx.beginPath(); ctx.moveTo(g.x + 14, g.y + g.h / 2); ctx.lineTo(g.x + g.w - 14, g.y + g.h / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(g.x + g.w / 2, g.y + g.h / 2, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(g.x + g.w / 2 - 60, g.y + 14, 120, 70); ctx.strokeRect(g.x + g.w / 2 - 60, g.y + g.h - 84, 120, 70);
      ctx.fillStyle = '#fff'; ctx.fillRect(g.x + g.w / 2 - 30, g.y + 6, 60, 8); ctx.fillRect(g.x + g.w / 2 - 30, g.y + g.h - 14, 60, 8);
      break;
    }
    case 'garden': ctx.fillStyle = '#93C47D'; rr(ctx, g.x, g.y, g.w, g.h, 24); ctx.fill();
      ctx.strokeStyle = '#D8CFB8'; ctx.lineWidth = 10; ctx.beginPath();
      ctx.moveTo(g.x + 30, g.y + 20); ctx.bezierCurveTo(g.x + 220, g.y + 120, g.x + 20, g.y + 300, g.x + 200, g.y + g.h - 20); ctx.stroke();
      ctx.fillStyle = '#E8A0BF';
      for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc(g.x + 20 + ((i * 37) % (g.w - 40)), g.y + 20 + ((i * 71) % (g.h - 40)), 2.5, 0, Math.PI * 2); ctx.fill(); }
      break;
  }
}

function drawBuilding(ctx, b) {
  const depth = b.shed ? 10 : 14 + b.floors * 6;
  // bóng đổ
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  if (b.shed) {
    ctx.fillStyle = b.roof; rr(ctx, b.x, b.y, b.w, b.h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    for (let x = b.x + 12; x < b.x + b.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, b.y + 4); ctx.lineTo(x, b.y + b.h - 4); ctx.stroke(); }
    label(ctx, b.short, b.x + b.w / 2, b.y + b.h / 2, { size: 12, color: '#fff', bg: 'rgba(27,42,78,.75)' });
    return;
  }
  // mặt tường phía nam (thấy được) + mái
  ctx.fillStyle = b.wall; ctx.fillRect(b.x, b.y + b.h - depth, b.w, depth);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  // cửa sổ trên mặt tường
  const rows = Math.max(1, b.floors), rowH = (depth - 6) / rows;
  ctx.fillStyle = '#7FA7CF';
  for (let r = 0; r < rows; r++) for (let x = b.x + 10; x < b.x + b.w - 14; x += 22) ctx.fillRect(x, b.y + b.h - depth + 4 + r * rowH, 12, Math.max(3, rowH - 4));
  // mái
  ctx.fillStyle = b.roof; rr(ctx, b.x - 4, b.y - 4, b.w + 8, b.h - depth + 8, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  if (b.vertical) ctx.fillRect(b.x + b.w / 2 - 2, b.y, 4, b.h - depth);
  else ctx.fillRect(b.x, b.y + (b.h - depth) / 2 - 2, b.w, 4);
  // hành lang (nhà lớp học): dải màu nhạt dọc mặt hướng ra sân
  const cx = b.x + b.w / 2, cy = b.y + (b.h - depth) / 2;
  if (b.w < 100) return;
  if (b.vertical) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2);
    label(ctx, b.short, 0, 0, { size: 18, color: '#fff', weight: 800 });
    ctx.restore();
  } else {
    label(ctx, b.short, cx, cy, { size: b.w < 300 ? 14 : 20, color: '#fff', weight: 800 });
  }
  if (b.floors > 1) label(ctx, `${b.floors} tầng`, cx, b.y + b.h + 10, { size: 9, color: '#5B6577', weight: 600 });
}

function drawDoor(ctx, d) {
  ctx.fillStyle = '#7A4B2A';
  if (d.side === 'e') ctx.fillRect(d.x - 27, d.y - 14, 6, 28);
  if (d.side === 'w') ctx.fillRect(d.x + 21, d.y - 14, 6, 28);
  if (d.side === 's') ctx.fillRect(d.x - 14, d.y - 27, 28, 6);
}

function drawTree(ctx, t, time) {
  const sway = Math.sin(time / 1400 + t.x) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(t.x + 6, t.y + 2, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7A5230'; ctx.fillRect(t.x - 3, t.y - 18, 6, 20);
  const leaf = t.kind === 'phuong' ? '#3F8A3A' : t.kind === 'xacu' ? '#2F6E3B' : '#4E9A48';
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.arc(t.x + sway, t.y - 32, 20, 0, Math.PI * 2);
  ctx.arc(t.x - 14 + sway, t.y - 24, 13, 0, Math.PI * 2);
  ctx.arc(t.x + 14 + sway, t.y - 24, 13, 0, Math.PI * 2);
  ctx.fill();
  if (t.kind === 'phuong') {
    ctx.fillStyle = '#E5382F';
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 6 + (i * 5) % 14; ctx.beginPath(); ctx.arc(t.x + sway + Math.cos(a) * r, t.y - 30 + Math.sin(a) * r * 0.7, 3, 0, Math.PI * 2); ctx.fill(); }
  }
}

function drawBench(ctx, b) {
  ctx.fillStyle = '#9AA0A6'; rr(ctx, b.x - 22, b.y - 6, 44, 12, 3); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(b.x - 22, b.y + 4, 44, 3);
}

function drawFlag(ctx, time) {
  const { x, y } = FLAG;
  ctx.fillStyle = '#D5D8DE'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B8BDC6'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6B7280'; ctx.fillRect(x - 2, y - 120, 4, 120);
  const wave = Math.sin(time / 300) * 3;
  ctx.fillStyle = '#DA251D';
  ctx.beginPath(); ctx.moveTo(x + 2, y - 120); ctx.quadraticCurveTo(x + 24, y - 120 + wave, x + 46, y - 118); ctx.lineTo(x + 46, y - 90); ctx.quadraticCurveTo(x + 24, y - 92 + wave, x + 2, y - 92); ctx.fill();
  ctx.fillStyle = '#FFDE00';
  const sx = x + 24, sy = y - 105 + wave / 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; ctx[i ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * 8, sy + Math.sin(a) * 8); }
  ctx.fill();
}

function drawBoard(ctx) {
  const { x, y } = BOARD;
  ctx.fillStyle = '#6B7280'; ctx.fillRect(x - 36, y - 40, 4, 40); ctx.fillRect(x + 32, y - 40, 4, 40);
  ctx.fillStyle = '#1B2A4E'; rr(ctx, x - 44, y - 70, 88, 40, 4); ctx.fill();
  label(ctx, 'THI ĐUA', x, y - 56, { size: 10, color: '#F2B233', weight: 800 });
  label(ctx, 'CÁC KHÓA', x, y - 42, { size: 8, color: '#fff', weight: 700 });
}

function drawStage(ctx) {
  const s = STAGE;
  ctx.fillStyle = '#C9A26B'; rr(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill();
  ctx.fillStyle = '#A9824F'; ctx.fillRect(s.x, s.y + s.h - 8, s.w, 8);
  label(ctx, s.label, s.x + s.w / 2, s.y + s.h / 2 - 4, { size: 11, color: '#fff', weight: 800 });
}

function drawGate(ctx) {
  const g = GATE;
  for (const px of [g.x - 18, g.x + g.w]) { ctx.fillStyle = '#B5452F'; ctx.fillRect(px, g.y - 46, 18, 58); ctx.fillStyle = '#F6E7C8'; ctx.fillRect(px + 3, g.y - 40, 12, 46); }
  ctx.fillStyle = '#1B2A4E'; rr(ctx, g.x - 20, g.y - 74, g.w + 40, 30, 6); ctx.fill();
  label(ctx, g.sign, g.x + g.w / 2, g.y - 59, { size: 10, color: '#F2B233', weight: 800 });
  // cánh cổng mở
  ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(g.x, g.y + 6); ctx.lineTo(g.x + 14, g.y - 30); ctx.moveTo(g.x + g.w, g.y + 6); ctx.lineTo(g.x + g.w - 14, g.y - 30); ctx.stroke();
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.me = null; // {x,y,look,name,...}
    this.others = new Map(); // id -> {data, x, y, tx, ty, moving, dir}
    this.npcs = [];
    this.path = [];
    this.target = null; // hotspot đang đi tới
    this.zoom = 1;
    this.cam = { x: 0, y: 0 };
    this.labelRects = [];
    this.onArrive = () => {};
    this.onTapPlayer = () => {};
    this.bubbles = new Map(); // id -> {text, until}
    this.bg = null;
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    this.keys = new Set();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._bindInput();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.vw = r.width; this.vh = r.height; this.dpr = dpr;
    this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr);
    this.baseZoom = r.width < 640 ? 0.72 : 1;
  }

  // Vẽ sẵn lớp nền tĩnh (mặt đất) vào canvas ngoài màn hình
  _buildBg() {
    const c = document.createElement('canvas');
    c.width = WORLD.w; c.height = WORLD.h;
    const ctx = c.getContext('2d');
    for (const g of GROUNDS) drawGround(ctx, g);
    ctx.fillStyle = '#B5452F';
    for (const w of WALLS) { ctx.fillRect(w.x, w.y, w.w, w.h); }
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (const w of WALLS) { if (w.w > w.h) for (let x = w.x; x < w.x + w.w; x += 30) ctx.fillRect(x, w.y + 2, 14, 3); }
    drawStage(ctx);
    for (const d of CLASS_DOORS) drawDoor(ctx, d);
    for (const b of BENCHES) drawBench(ctx, b);
    this.bg = c;
  }

  start() { this._buildBg(); requestAnimationFrame(this._loop); }

  setMe(me) {
    this.me = { ...me, dir: 1, moving: false };
    this._snapCam();
  }

  _snapCam() {
    const z = this.baseZoom * this.zoom;
    this.cam.x = this.me.x - this.vw / z / 2; this.cam.y = this.me.y - this.vh / z / 2 - 40;
  }

  zoomBy(f) { this.zoom = Math.max(0.5, Math.min(1.8, this.zoom * f)); }

  walkTo(x, y, hotspot = null) {
    if (!this.me) return;
    const p = findPath(this.me.x, this.me.y, x, y);
    this.target = hotspot;
    if (!p) { this.path = []; return; }
    this.path = p;
    if (!p.length && hotspot) { this.target = null; this.onArrive(hotspot); }
  }

  goToHotspot(h) { this.walkTo(h.x, h.y, h); }

  teleport(x, y) { if (this.me) { this.me.x = x; this.me.y = y; this.path = []; this._snapCam(); } }

  say(id, text) { this.bubbles.set(id, { text, until: performance.now() + 5000 }); }

  updateOthers(list) {
    const seen = new Set();
    for (const p of list) {
      seen.add(p.id);
      const o = this.others.get(p.id);
      if (!o) this.others.set(p.id, { data: p, x: p.x, y: p.y, tx: p.x, ty: p.y, dir: 1, moving: false });
      else { o.data = p; o.tx = p.x; o.ty = p.y; }
      if (p.say && p.sayAt && (!this._saidAt?.[p.id] || this._saidAt[p.id] < p.sayAt)) {
        (this._saidAt ||= {})[p.id] = p.sayAt;
        this.say(p.id, p.say);
      }
    }
    for (const id of [...this.others.keys()]) if (!seen.has(id)) this.others.delete(id);
  }

  zoneOf(x, y) {
    for (const b of BUILDINGS) if (x > b.x - 60 && x < b.x + b.w + 60 && y > b.y - 60 && y < b.y + b.h + 60) return b.id;
    if (y > 1500) return 'duong';
    return 'san';
  }

  _bindInput() {
    const c = this.canvas;
    let down = null;
    c.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    c.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 12) return;
      const r = c.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      for (const lr of this.labelRects) {
        if (sx >= lr.x && sx <= lr.x + lr.w && sy >= lr.y && sy <= lr.y + lr.h) {
          if (lr.player) this.onTapPlayer(lr.player); else this.goToHotspot(lr.h);
          return;
        }
      }
      const z = this.baseZoom * this.zoom;
      this.walkTo(this.cam.x + sx / z, this.cam.y + sy / z);
      this.tapFx = { x: this.cam.x + sx / z, y: this.cam.y + sy / z, t: performance.now() };
    });
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { this.keys.add(k); this.path = []; this.target = null; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  _step(dt, now) {
    const me = this.me;
    if (!me) return;
    let vx = 0, vy = 0;
    if (this.keys.size) {
      if (this.keys.has('arrowleft') || this.keys.has('a')) vx -= 1;
      if (this.keys.has('arrowright') || this.keys.has('d')) vx += 1;
      if (this.keys.has('arrowup') || this.keys.has('w')) vy -= 1;
      if (this.keys.has('arrowdown') || this.keys.has('s')) vy += 1;
      const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
      const nx = me.x + vx * SPEED * dt, ny = me.y + vy * SPEED * dt;
      if (!isBlockedPx(nx, me.y)) me.x = nx;
      if (!isBlockedPx(me.x, ny)) me.y = ny;
    } else if (this.path.length) {
      const p = this.path[0];
      const dx = p.x - me.x, dy = p.y - me.y, d = Math.hypot(dx, dy);
      const s = SPEED * dt;
      if (d <= s) { me.x = p.x; me.y = p.y; this.path.shift(); }
      else { vx = dx / d; vy = dy / d; me.x += vx * s; me.y += vy * s; }
      if (!this.path.length && this.target) { const h = this.target; this.target = null; this.onArrive(h); }
    }
    me.moving = !!(vx || vy);
    if (vx) me.dir = vx > 0 ? 1 : -1;
    me.back = vy < -0.6 && Math.abs(vx) < 0.5;

    for (const o of this.others.values()) {
      const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
      if (d > 400) { o.x = o.tx; o.y = o.ty; o.moving = false; continue; }
      const s = SPEED * dt;
      if (d > 1) { o.moving = true; const k = Math.min(1, s / d); o.x += dx * k; o.y += dy * k; if (Math.abs(dx) > 1) o.dir = dx > 0 ? 1 : -1; o.back = dy < -Math.abs(dx); }
      else o.moving = false;
    }
    for (const n of this.npcs) n.update?.(dt, now);

    // camera bám theo
    const z = this.baseZoom * this.zoom;
    const tx = me.x - this.vw / z / 2, ty = me.y - this.vh / z / 2 - 40;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 6);
    this.cam.x = Math.max(-100, Math.min(WORLD.w - this.vw / z + 100, this.cam.x));
    this.cam.y = Math.max(-100, Math.min(WORLD.h - this.vh / z + 60, this.cam.y));
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._step(dt, now);
    this._draw(now);
    requestAnimationFrame(this._loop);
  }

  _draw(now) {
    const ctx = this.ctx, z = this.baseZoom * this.zoom;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#8FBF73'; ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-this.cam.x, -this.cam.y);
    if (this.bg) ctx.drawImage(this.bg, 0, 0);

    // đường đi
    if (this.path.length && this.me) {
      ctx.strokeStyle = 'rgba(47,111,181,.45)'; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.me.x, this.me.y); for (const p of this.path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
      const last = this.path[this.path.length - 1];
      ctx.strokeStyle = 'rgba(47,111,181,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(last.x, last.y, 10 + Math.sin(now / 150) * 2, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // các vật thể sắp theo chiều y để che khuất đúng
    const items = [];
    for (const b of BUILDINGS) items.push({ y: b.y + b.h, draw: () => drawBuilding(ctx, b) });
    for (const t of TREES) items.push({ y: t.y, draw: () => drawTree(ctx, t, now) });
    items.push({ y: FLAG.y, draw: () => drawFlag(ctx, now) });
    items.push({ y: BOARD.y, draw: () => drawBoard(ctx) });
    items.push({ y: GATE.y + 10, draw: () => drawGate(ctx) });
    for (const n of this.npcs) items.push({ y: n.y, draw: () => { drawAvatar(ctx, n.x, n.y, n.look, { t: now, moving: n.moving, dir: n.dir }); this._nameTag(ctx, n.x, n.y, n.name, '#2E8B57'); } });
    for (const [id, o] of this.others) items.push({ y: o.y, draw: () => { drawAvatar(ctx, o.x, o.y, o.data.look, { t: now, moving: o.moving, dir: o.dir, back: o.back }); this._nameTag(ctx, o.x, o.y, o.data.name + (o.data.khoa ? ` · ${o.data.lop || ''} ${o.data.khoa}` : ''), '#2F6FB5', o.data); this._bubble(ctx, id, o.x, o.y, now); } });
    if (this.me) { const m = this.me; items.push({ y: m.y, draw: () => { drawAvatar(ctx, m.x, m.y, m.look, { t: now, moving: m.moving, dir: m.dir, back: m.back }); this._nameTag(ctx, m.x, m.y, m.name, '#D8343A'); this._bubble(ctx, 'me', m.x, m.y, now); } }); }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    if (this.tapFx && now - this.tapFx.t < 400) {
      const k = (now - this.tapFx.t) / 400;
      ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.tapFx.x, this.tapFx.y, 6 + k * 16, 3 + k * 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // nhãn điểm tương tác (vẽ theo toạ độ màn hình để luôn dễ đọc)
    this.labelRects = [];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (const h of HOTSPOTS) {
      const sx = (h.x - this.cam.x) * z, sy = (h.y - this.cam.y) * z - (h.small ? 18 : 34) * z;
      if (sx < -100 || sy < -40 || sx > this.vw + 100 || sy > this.vh + 40) continue;
      const txt = `${h.icon} ${h.label}`;
      const size = h.small ? 11 : 12;
      const near = this.me && Math.hypot(this.me.x - h.x, this.me.y - h.y) < 90;
      const w = label(ctx, txt, sx, sy, { size, color: h.small ? '#1B2A4E' : '#fff', bg: h.small ? 'rgba(255,255,255,.92)' : near ? '#D8343A' : 'rgba(27,42,78,.88)', weight: 700, pad: 6 });
      this.labelRects.push({ x: sx - w / 2, y: sy - size / 2 - 8, w, h: size + 16, h_: 0, h });
    }
    // chạm vào người khác
    for (const o of this.others.values()) {
      const sx = (o.x - this.cam.x) * z, sy = (o.y - this.cam.y) * z;
      this.labelRects.push({ x: sx - 16 * z, y: sy - 56 * z, w: 32 * z, h: 58 * z, player: o.data });
    }
  }

  _nameTag(ctx, x, y, name, color) {
    label(ctx, name, x, y + 12, { size: 9, color: '#fff', bg: color, weight: 700, pad: 3 });
  }

  _bubble(ctx, id, x, y, now) {
    const b = this.bubbles.get(id);
    if (!b) return;
    if (now > b.until) { this.bubbles.delete(id); return; }
    ctx.font = '600 11px "Be Vietnam Pro", system-ui, sans-serif';
    const w = Math.min(180, ctx.measureText(b.text).width + 16);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.15)';
    rr(ctx, x - w / 2, y - 82, w, 24, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 58); ctx.lineTo(x + 5, y - 58); ctx.lineTo(x, y - 52); ctx.fill();
    ctx.fillStyle = '#1D2433'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let t = b.text; while (ctx.measureText(t).width > w - 14 && t.length > 1) t = t.slice(0, -2) + '…';
    ctx.fillText(t, x, y - 70);
  }

  // Bản đồ thu nhỏ
  drawMinimap(canvas) {
    const ctx = canvas.getContext('2d');
    const s = canvas.width / WORLD.w;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.bg) ctx.drawImage(this.bg, 0, 0, canvas.width, canvas.height);
    for (const b of BUILDINGS) { ctx.fillStyle = b.roof; ctx.fillRect(b.x * s, b.y * s, b.w * s, b.h * s); }
    ctx.fillStyle = '#2F6FB5';
    for (const o of this.others.values()) { ctx.beginPath(); ctx.arc(o.x * s, o.y * s, 3, 0, Math.PI * 2); ctx.fill(); }
    if (this.me) { ctx.fillStyle = '#D8343A'; ctx.beginPath(); ctx.arc(this.me.x * s, this.me.y * s, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
}
