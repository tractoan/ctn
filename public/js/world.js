// Sân trường: vẽ bản đồ, camera, tìm đường (A* trên lưới), nhân vật mình + người khác.
import { WORLD, GROUNDS, BUILDINGS, WALLS, GATE, TREES, BENCHES, SEATS, CHAIR_ROWS, ROOM_DOORS, FLOWERBEDS, LAMPS, STAIRS, YARD, DRUM, FLAG, BOARD, STAGE, HOTSPOTS, CLASS_DOORS, solids } from './campus.js';
import { drawAvatar } from './avatar.js';

const CELL = 20;
const AV = 1.2; // tỉ lệ nhân vật
// Mức tối của trời theo giờ Việt Nam: 0 = ban ngày, 1 = đêm
// Màu trời theo giờ Việt Nam (bảng màu như trang mẫu): đêm xanh thẫm, bình minh tím, sáng sớm cam nhạt,
// ban ngày trong, chiều tà cam, chạng vạng tím. lamps: bật đèn sân.
export function skyTint(now = Date.now()) {
  const d = new Date(now + 7 * 3600e3), m = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (m < 5 * 60 || m >= 19.5 * 60) return { color: 'rgba(16,24,58,.50)', lamps: true, night: 1 };
  if (m < 6 * 60) return { color: 'rgba(60,50,110,.32)', lamps: true, night: 0.6 };
  if (m < 7 * 60) return { color: 'rgba(255,170,120,.14)', lamps: false, night: 0 };
  if (m < 16.5 * 60) return { color: null, lamps: false, night: 0 };
  if (m < 18 * 60) return { color: 'rgba(255,140,60,.16)', lamps: false, night: 0 };
  return { color: 'rgba(80,50,110,.32)', lamps: true, night: 0.6 };
}
export function nightLevel(now = Date.now()) { return skyTint(now).night; }
let NIGHT = 0;
let SKY = { color: null, lamps: false, night: 0 };
// Logo trường (vẽ trên biển cổng)
const LOGO = typeof Image !== 'undefined' ? Object.assign(new Image(), { src: 'logo.jpg' }) : null;
const SPEED = 190; // px/giây

// ---------- Lưới va chạm & tìm đường (mỗi cảnh một lưới) ----------
export class Grid {
  constructor(w, h, solidList) {
    this.GW = Math.ceil(w / CELL); this.GH = Math.ceil(h / CELL);
    this.blocked = new Uint8Array(this.GW * this.GH);
    const pad = 8;
    for (const s of solidList) {
      const x0 = Math.max(0, Math.floor((s.x - pad) / CELL)), x1 = Math.min(this.GW - 1, Math.floor((s.x + s.w + pad - 1) / CELL));
      const y0 = Math.max(0, Math.floor((s.y - pad) / CELL)), y1 = Math.min(this.GH - 1, Math.floor((s.y + s.h + pad - 1) / CELL));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.blocked[y * this.GW + x] = 1;
    }
  }
  isBlockedPx(x, y) {
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= this.GW || cy >= this.GH) return true;
    return this.blocked[cy * this.GW + cx] === 1;
  }
  nearestFree(cx, cy) {
    const { GW, GH, blocked } = this;
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
  lineFree(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / (CELL / 3));
    for (let i = 1; i <= n; i++) { const t = i / n; if (this.isBlockedPx(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
    return true;
  }
  findPath(sx, sy, tx, ty) {
    const { GW, GH, blocked } = this;
    const [scx, scy] = this.nearestFree(Math.max(0, Math.min(GW - 1, Math.floor(sx / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(sy / CELL))));
    const [tcx, tcy] = this.nearestFree(Math.max(0, Math.min(GW - 1, Math.floor(tx / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(ty / CELL))));
    const goalExact = !this.isBlockedPx(tx, ty);
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
      while (j > i && !this.lineFree(ax, ay, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]); ax = pts[j].x; ay = pts[j].y; i = j + 1;
    }
    return out;
  }
}

let campusGrid = null;
// Giữ để tương thích: tìm đường trên sân trường
export function findPath(sx, sy, tx, ty) {
  campusGrid ||= new Grid(WORLD.w, WORLD.h, solids());
  return campusGrid.findPath(sx, sy, tx, ty);
}

// ---------- Vẽ ----------
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
export function label(ctx, txt, x, y, { size = 12, color = '#1D2433', bg = null, weight = 700, pad = 5 } = {}) {
  ctx.font = `${weight} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
  const w = ctx.measureText(txt).width;
  if (bg) { ctx.fillStyle = bg; rr(ctx, x - w / 2 - pad, y - size / 2 - pad + 1, w + pad * 2, size + pad * 2 - 2, (size + pad * 2) / 2); ctx.fill(); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y + 0.5);
  return w + pad * 2;
}

// ---------- Bảng màu & hoạ tiết (theo phong cách trang mẫu: phẳng, màu ấm) ----------
const circ = (ctx, color, x, y, r) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
// Hoa 5 cánh
function flower5(ctx, x, y, r, petal, center = '#FFD45E') {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.75, 0, Math.PI * 2); ctx.fill(); }
  circ(ctx, center, x, y, r * 0.55);
}
// Hoạ tiết cỏ lặp lại: vệt sáng tối + khóm cỏ ba nét
const grassCache = new Map();
function grassPattern(ctx, color) {
  if (grassCache.has(color)) return grassCache.get(color);
  if (typeof document === 'undefined') return color;
  const n = 96, c = document.createElement('canvas'); c.width = n; c.height = n;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, n, n);
  let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647, seed / 2147483647);
  for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(40,90,40,.07)'; x.beginPath(); x.ellipse(rnd() * n, rnd() * n, 8 + rnd() * 10, 5 + rnd() * 6, 0, 0, Math.PI * 2); x.fill(); }
  x.lineCap = 'round'; x.lineWidth = 1.2;
  for (let i = 0; i < 46; i++) {
    const px = rnd() * n, py = rnd() * n, light = rnd() < 0.35;
    x.strokeStyle = light ? 'rgba(255,255,255,.28)' : 'rgba(55,105,50,.32)';
    for (const w of [-2, 0, 2]) { x.beginPath(); x.moveTo(px + w * 0.6, py); x.lineTo(px + w, py - 3 - rnd() * 2.5); x.stroke(); }
  }
  const pat = ctx.createPattern(c, 'repeat') || color;
  grassCache.set(color, pat);
  return pat;
}
// Sân lát gạch màu đất nung
function tiles(ctx, x, y, w, h, base, tint = 'rgba(196,110,80,.18)', size = 40) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tint;
  for (let yy = y; yy < y + h; yy += size) for (let xx = x; xx < x + w; xx += size) ctx.fillRect(xx, yy, Math.min(size - 2, x + w - xx), Math.min(size - 2, y + h - yy));
}

function drawGround(ctx, g) {
  switch (g.kind) {
    case 'road': {
      ctx.fillStyle = '#A2A7AF'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(g.x, g.y, g.w, 6);
      ctx.fillStyle = '#FFFFFF';
      for (let x = g.x + 10; x < g.x + g.w; x += 80) ctx.fillRect(x, g.y + g.h / 2 - 2, 40, 4);
      for (let x = 260; x < g.w; x += 740) label(ctx, g.label, x, g.y + g.h / 2 + 36, { size: 14, color: 'rgba(255,255,255,.85)', weight: 800 });
      ctx.fillStyle = '#FFFFFF';
      for (let x = 820; x < 1000; x += 22) ctx.fillRect(x, g.y + 10, 12, 44);
      break;
    }
    case 'sidewalk':
      tiles(ctx, g.x, g.y, g.w, g.h, '#E3DED3', 'rgba(150,140,120,.14)', 36);
      ctx.fillStyle = '#C9C3B6'; ctx.fillRect(g.x, g.y + g.h - 4, g.w, 4);
      break;
    case 'concrete':
      tiles(ctx, g.x, g.y, g.w, g.h, '#E7D9C4');
      break;
    case 'grass': {
      ctx.fillStyle = grassPattern(ctx, g.wild ? '#8CC36F' : '#98CC7C'); ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(70,120,50,.25)'; ctx.lineWidth = 2; ctx.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
      if (g.wild) {
        // đất mòn chỗ đá bóng + khung thành tự chế
        ctx.fillStyle = 'rgba(176,130,80,.35)'; ctx.beginPath(); ctx.ellipse(g.x + g.w / 2, g.y + g.h / 2, g.w * 0.3, g.h * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
        ctx.strokeRect(g.x + g.w / 2 - 30, g.y + 14, 60, 20); ctx.strokeRect(g.x + g.w / 2 - 30, g.y + g.h - 34, 60, 20);
      }
      break;
    }
    case 'court': {
      ctx.fillStyle = '#C46A45'; rr(ctx, g.x - 6, g.y - 6, g.w + 12, g.h + 12, 8); ctx.fill();
      ctx.fillStyle = '#D98A5B'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
      ctx.strokeRect(g.x + 20, g.y + 20, g.w - 40, g.h - 40);
      ctx.beginPath(); ctx.moveTo(g.x + 20, g.y + g.h / 2); ctx.lineTo(g.x + g.w - 20, g.y + g.h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x + g.w / 2, g.y + 20); ctx.lineTo(g.x + g.w / 2, g.y + g.h - 20); ctx.stroke();
      // lưới đá cầu
      ctx.fillStyle = '#F6F5F1'; ctx.fillRect(g.x + 14, g.y + g.h / 2 - 2, g.w - 28, 4);
      ctx.fillStyle = '#5A6475'; ctx.fillRect(g.x + 10, g.y + g.h / 2 - 6, 6, 12); ctx.fillRect(g.x + g.w - 16, g.y + g.h / 2 - 6, 6, 12);
      break;
    }
    case 'yard': {
      // sân cao: bóng đổ + tường chắn phía Tây và phía Nam
      ctx.fillStyle = 'rgba(20,30,50,.16)'; ctx.fillRect(g.x - 4, g.y + 8, 8, g.h); ctx.fillRect(g.x, g.y + g.h, g.w, 10);
      tiles(ctx, g.x, g.y, g.w, g.h, '#EFE6D6', 'rgba(196,110,80,.12)', 44);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3;
      ctx.strokeRect(g.x + 130, g.y + 120, g.w - 220, g.h - 230);
      ctx.fillStyle = '#C9B79A'; ctx.fillRect(g.x - 6, g.y, 8, g.h + 6); ctx.fillRect(g.x - 6, g.y + g.h - 2, g.w + 6, 8);
      label(ctx, g.label, g.x + g.w / 2 + 20, g.y + 520, { size: 26, color: 'rgba(160,110,70,.16)', weight: 800 });
      break;
    }
  }
}

function drawStairs(ctx, st) {
  ctx.fillStyle = '#C8C1B2'; ctx.fillRect(st.x - 8, st.y, st.w + 8, st.h);
  ctx.fillStyle = '#E9E4D8';
  for (let x = st.x - 6; x < st.x + st.w; x += 8) ctx.fillRect(x, st.y + 2, 5, st.h - 4);
  ctx.fillStyle = '#9C9586'; ctx.fillRect(st.x - 8, st.y, st.w + 8, 4); ctx.fillRect(st.x - 8, st.y + st.h - 4, st.w + 8, 4);
}

function drawBuilding(ctx, b) {
  const depth = b.hall ? 50 : 16 + b.floors * 9;
  const fy = b.y + b.h - depth, rh = b.h - depth;
  // bóng đổ mềm
  ctx.fillStyle = 'rgba(20,30,50,.16)'; rr(ctx, b.x + 6, b.y + 10, b.w + 4, b.h + 2, 6); ctx.fill();
  // mặt tường phía Nam (nhìn thấy)
  ctx.fillStyle = b.wall; ctx.fillRect(b.x, fy, b.w, depth);
  ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = b.x; x < b.x + b.w; x += 6) ctx.fillRect(x, fy, 1, depth);
  ctx.fillStyle = 'rgba(120,80,40,.25)'; ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4); // chân tường
  if (b.hall) {
    // nhà đa năng: cửa lớn ở giữa, ô kính, vòm trang trí
    rr(ctx, b.x + b.w / 2 - 36, fy + 12, 72, depth - 12, 4); ctx.fillStyle = '#5E6F63'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(b.x + b.w / 2 - 1, fy + 12, 2, depth - 12);
    for (let x = b.x + 14; x < b.x + b.w - 20; x += 28) if (Math.abs(x + 8 - (b.x + b.w / 2)) > 48) {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, fy + 9, 18, 14);
      ctx.fillStyle = NIGHT > 0.4 ? '#FFD97A' : '#A9CBE8'; ctx.fillRect(x + 1, fy + 11, 14, 10);
    }
    ctx.strokeStyle = 'rgba(120,100,60,.45)'; ctx.lineWidth = 2;
    for (const cx of [b.x + b.w / 4, b.x + b.w * 3 / 4]) { ctx.beginPath(); ctx.arc(cx, fy + depth, 30, Math.PI, 0); ctx.stroke(); }
  } else {
    const rows = Math.max(1, b.floors), rowH = (depth - 6) / rows;
    for (let r = 0; r < rows; r++) {
      const ry = fy + 4 + r * rowH, wh = Math.max(4, rowH - 5);
      if (b.trim) { ctx.fillStyle = b.trim; ctx.fillRect(b.x, ry - 2, b.w, 2.5); }
      else { ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.fillRect(b.x, ry - 1.5, b.w, 1.5); }
      const ground = r === rows - 1;
      for (let x = b.x + 9, i = 0; x < b.x + b.w - 14; x += 22, i++) {
        // tầng trệt: cứ 4 ô có một cửa ra vào
        if (ground && rows > 1 && i % 4 === 2) {
          ctx.fillStyle = '#8A5A35'; ctx.fillRect(x, ry, 13, wh + 3);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + 6, ry, 1, wh + 3);
          continue;
        }
        const lit = NIGHT > 0.4 && ((x * 7 + r * 13) % 5) < 3;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, ry - 1, 15, wh + 2);
        ctx.fillStyle = lit ? '#FFD97A' : b.bands ? '#9C6B48' : '#9CC3E6';
        ctx.fillRect(x + 1, ry + 1, 11, wh - 2);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 1, ry + 1, 4, wh - 2);
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - 1, ry + wh + 1, 15, 1.5);
      }
    }
    if (b.bands) { ctx.fillStyle = b.bands; for (const f of [0.18, 0.82]) ctx.fillRect(b.x + b.w * f - 12, fy, 24, depth); }
  }
  // mái bằng: tường chắn mái + tấm lợp
  ctx.fillStyle = shade(b.roof, -0.18); rr(ctx, b.x - 5, b.y - 5, b.w + 10, rh + 10, 6); ctx.fill();
  ctx.fillStyle = b.roof; rr(ctx, b.x + 2, b.y + 2, b.w - 4, rh - 4, 4); ctx.fill();
  if (b.hall) {
    // mái tôn hai dốc
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(b.x + b.w / 2, b.y + 2, b.w / 2 - 2, rh - 4);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (let y = b.y + 10; y < b.y + rh; y += 12) { ctx.beginPath(); ctx.moveTo(b.x + 2, y); ctx.lineTo(b.x + b.w - 2, y); ctx.stroke(); }
    ctx.fillStyle = shade(b.roof, -0.25); ctx.fillRect(b.x + b.w / 2 - 2, b.y + 2, 4, rh - 4);
  } else {
    // gạch lá nem trên sân thượng (ô bàn cờ nhạt)
    ctx.save(); rr(ctx, b.x + 2, b.y + 2, b.w - 4, rh - 4, 4); ctx.clip();
    ctx.fillStyle = 'rgba(160,90,50,.07)';
    for (let y = b.y + 2, j = 0; y < b.y + rh; y += 24, j++) for (let x = b.x + 2 + (j % 2) * 24; x < b.x + b.w; x += 48) ctx.fillRect(x, y, 24, 24);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    for (let x = b.x + 26; x < b.x + b.w - 4; x += 24) { ctx.beginPath(); ctx.moveTo(x, b.y + 2); ctx.lineTo(x, b.y + rh); ctx.stroke(); }
    for (let y = b.y + 26; y < b.y + rh - 2; y += 24) { ctx.beginPath(); ctx.moveTo(b.x + 2, y); ctx.lineTo(b.x + b.w, y); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 6);
    if (b.bands) { ctx.fillStyle = b.bands; ctx.fillRect(b.x - 5, b.y - 5, b.w + 10, 8); }
    if (b.trim) { ctx.fillStyle = b.trim; ctx.fillRect(b.x - 5, b.y + rh - 2, b.w + 10, 6); }
    // bồn nước, cục điều hoà trên mái
    if (b.short && b.w > 200) {
      const tx = b.x + b.w - 70, ty = b.y + 14;
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(tx + 4, ty + 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#C9CED8'; rr(ctx, tx - 14, ty - 6, 28, 20, 8); ctx.fill();
      ctx.fillStyle = '#E3E6EC'; ctx.fillRect(tx - 12, ty - 4, 24, 4);
      ctx.fillStyle = '#9AA3B2'; rr(ctx, tx + 30, ty, 20, 14, 2); ctx.fill();
    }
  }
  if (!b.short) return;
  const cx = b.x + b.w / 2, cy = b.y + rh / 2;
  const ink = shade(b.roof, -0.5);
  if (b.vertical) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2);
    label(ctx, b.short, 0, 0, { size: 16, color: ink, weight: 800 });
    ctx.restore();
  } else {
    label(ctx, b.short, cx, cy, { size: b.w < 400 ? 18 : 22, color: ink, weight: 800 });
  }
}

// Làm tối/sáng một màu hex (#RRGGBB) theo tỉ lệ k (-1 → 1)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  const r = f(n >> 16), g = f((n >> 8) & 255), bl = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

function drawDoor(ctx, d) {
  ctx.fillStyle = '#7A4B2A';
  if (d.side === 'e') ctx.fillRect(d.x - 27, d.y - 14, 6, 28);
  if (d.side === 'w') ctx.fillRect(d.x + 21, d.y - 14, 6, 28);
  if (d.side === 's') {
    // cửa lớp ở chân mặt tiền: khung trắng, cánh gỗ, biển tên lớp màu xanh phía trên
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(d.x - 12, d.y - 52, 24, 27);
    ctx.fillStyle = '#8A5A35'; ctx.fillRect(d.x - 10, d.y - 50, 20, 25);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(d.x - 0.5, d.y - 50, 1, 25);
    ctx.fillStyle = '#F2D27A'; ctx.fillRect(d.x + 5, d.y - 39, 2, 2);
  }
  if (d.side === 'n') ctx.fillRect(d.x - 14, d.y + 27, 28, 6);
  if (d.lop) {
    const y = d.side === 's' ? d.y - 62 : d.y + 16;
    rr(ctx, d.x - 22, y - 6, 44, 12, 3); ctx.fillStyle = '#2F6FB5'; ctx.fill();
    label(ctx, d.lop.toUpperCase(), d.x, y, { size: 7.5, color: '#fff', weight: 800 });
  }
}

function drawTree(ctx, t, time) {
  const sway = Math.sin(time * 0.0008 + t.x) * 1.2;
  if (t.kind === 'palm') {
    ctx.fillStyle = 'rgba(20,30,50,.14)'; ctx.beginPath(); ctx.ellipse(t.x + 10, t.y + 2, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    rr(ctx, t.x - 4, t.y - 72, 8, 74, 3); ctx.fillStyle = '#B49A78'; ctx.fill();
    ctx.fillStyle = 'rgba(120,90,60,.35)'; for (let y = t.y - 66; y < t.y; y += 7) ctx.fillRect(t.x - 4, y, 8, 2);
    const top = { x: t.x + sway, y: t.y - 74 };
    ctx.lineCap = 'round';
    for (const [col, w] of [['#4E9E55', 7], ['#6CC06A', 4.5]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.42, len = 30 + (i % 2) * 6;
        ctx.beginPath(); ctx.moveTo(top.x, top.y);
        ctx.quadraticCurveTo(top.x + Math.cos(a) * len * 0.6, top.y + Math.sin(a) * len * 0.6 - 6, top.x + Math.cos(a) * len, top.y + Math.sin(a) * len * 0.5 + 12);
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
    circ(ctx, '#8B6243', top.x, top.y + 2, 4);
    return;
  }
  if (t.kind === 'bonsai') {
    // bụi cây tròn có hoa
    ctx.fillStyle = 'rgba(20,30,50,.14)'; ctx.beginPath(); ctx.ellipse(t.x, t.y + 2, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    const g = [[-10, -7, 10], [10, -7, 10], [0, -13, 12]];
    for (const [dx, dy, r] of g) circ(ctx, '#4E9E55', t.x + dx, t.y + dy + 2, r + 1.5);
    for (const [dx, dy, r] of g) circ(ctx, '#6CC06A', t.x + dx, t.y + dy, r);
    for (const [dx, dy] of [[-16, -6], [-12, -13], [16, -6], [12, -13], [0, -1]]) circ(ctx, 'rgba(40,95,45,.3)', t.x + dx, t.y + dy, 2.4);
    circ(ctx, 'rgba(255,255,255,.3)', t.x - 4, t.y - 18, 3.5);
    const col = ['#FF9EC4', '#FFD45E', '#FFFFFF', '#F2544A'][Math.abs(Math.round(t.x / 37)) % 4];
    for (const [dx, dy] of [[-9, -12], [6, -16], [12, -6], [-3, -4]]) flower5(ctx, t.x + dx, t.y + dy, 2.6, col);
    return;
  }
  // cây tán tròn (bàng, xà cừ) – phượng, bằng lăng, hoa sữa thì có hoa
  if (t.planter) { rr(ctx, t.x - 20, t.y - 6, 40, 14, 3); ctx.fillStyle = '#3E7E45'; ctx.fill(); rr(ctx, t.x - 16, t.y - 4, 32, 9, 2); ctx.fillStyle = '#5B9A4C'; ctx.fill(); }
  ctx.fillStyle = 'rgba(20,30,50,.16)'; ctx.beginPath(); ctx.ellipse(t.x, t.y + 1, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, t.x - 5, t.y - 36, 10, 38, 4); ctx.fillStyle = '#8B6243'; ctx.fill();
  rr(ctx, t.x - 3, t.y - 30, 3, 26, 2); ctx.fillStyle = '#A7795A'; ctx.fill();
  const light = t.bloom === 'phuong' ? '#7CC870' : t.bloom ? '#76C27A' : '#6CC06A';
  const dark = t.bloom ? '#5DAA5E' : '#4E9E55';
  const g = [[-20, -50, 21], [20, -52, 22], [0, -72, 27], [-12, -66, 18], [13, -68, 18]];
  for (const [dx, dy, r] of g) circ(ctx, dark, t.x + dx + sway, t.y + dy + 3, r + 2);
  for (const [dx, dy, r] of g) circ(ctx, light, t.x + dx + sway, t.y + dy, r);
  for (const [dx, dy, r] of g) {
    for (let p = 0; p < 5; p++) { const a = 0.35 + p * 0.6; circ(ctx, 'rgba(40,95,45,.32)', t.x + dx + sway + Math.cos(a) * r * 0.9, t.y + dy + Math.sin(a) * r * 0.9, 3.4); }
    for (let p = 0; p < 4; p++) { const a = -2.6 + p * 0.55; circ(ctx, 'rgba(255,255,255,.16)', t.x + dx + sway + Math.cos(a) * r * 0.55, t.y + dy + Math.sin(a) * r * 0.55, 3.2); }
  }
  circ(ctx, 'rgba(255,255,255,.35)', t.x - 8 + sway, t.y - 82, 8);
  circ(ctx, 'rgba(255,255,255,.25)', t.x + 14 + sway, t.y - 60, 5);
  const bloom = { phuong: ['#F2544A', '#FFD45E'], banglang: ['#C29BEA', '#FFF2A8'], hoasua: ['#FFFFFF', '#F4E7A1'] }[t.bloom];
  if (bloom) for (let f = 0; f < 12; f++) { const a = f * 2.4 + t.x, r = 10 + (f * 37) % 24; flower5(ctx, t.x + Math.cos(a) * r + sway, t.y - 62 + Math.sin(a) * r * 0.75, 3.4, bloom[0], bloom[1]); }
}

// Ghế đá hoa cương hồng
function drawBench(ctx, b) {
  ctx.fillStyle = 'rgba(20,30,50,.15)'; ctx.beginPath(); ctx.ellipse(b.x + 2, b.y + 8, 36, 6, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, b.x - 26, b.y - 3, 9, 11, 2); ctx.fillStyle = '#B98579'; ctx.fill();
  rr(ctx, b.x + 17, b.y - 3, 9, 11, 2); ctx.fill();
  rr(ctx, b.x - 32, b.y - 12, 64, 12, 4); ctx.fillStyle = '#E2B4A6'; ctx.fill();
  rr(ctx, b.x - 30, b.y - 11, 60, 4, 2); ctx.fillStyle = '#EFCDC2'; ctx.fill();
  ctx.fillStyle = '#C9978A'; ctx.fillRect(b.x - 32, b.y - 3, 64, 3);
}

// Bồn hoa: nền xanh bo góc, hoa 5 cánh xếp đều
const BED_COLORS = ['#FF8FB1', '#FFD45E', '#FFFFFF'];
function drawFlowerbed(ctx, f) {
  const cols = f.colors || BED_COLORS;
  if (f.round) {
    ctx.fillStyle = 'rgba(20,30,50,.12)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 5, f.r + 4, f.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    circ(ctx, '#6A9A55', f.x, f.y, f.r + 4);
    circ(ctx, '#7FB069', f.x, f.y, f.r);
    const n = Math.round(f.r * 0.7);
    for (let k = 0; k < n; k++) { const a = k * 0.24 * 26 / n * 2.3, rad = (k % 3 + 0.6) / 3.2 * f.r * 0.85; flower5(ctx, f.x + Math.cos(a) * rad, f.y + Math.sin(a) * rad, 4, cols.concat('#C29BEA')[k % (cols.length + 1)]); }
    return;
  }
  const r = Math.min(18, f.h / 2);
  ctx.fillStyle = 'rgba(20,30,50,.12)'; rr(ctx, f.x + 2, f.y + 4, f.w, f.h, r); ctx.fill();
  ctx.fillStyle = '#6A9A55'; rr(ctx, f.x - 2, f.y - 2, f.w + 4, f.h + 4, r + 2); ctx.fill();
  ctx.fillStyle = '#7FB069'; rr(ctx, f.x, f.y, f.w, f.h, r); ctx.fill();
  const rows = Math.max(1, Math.floor((f.h - 6) / 20)), sz = f.h < 24 ? 3.4 : 4;
  let i = 0;
  for (let ry = 0; ry < rows; ry++) for (let x = f.x + 14 + (ry % 2) * 13; x < f.x + f.w - 8; x += 26) {
    const y = f.y + (rows === 1 ? f.h / 2 : 12 + ry * 20);
    flower5(ctx, x, y, sz, cols[i++ % cols.length]);
  }
}

// Ghế nhựa chào cờ (nhìn từ phía sau) + biển tên lớp
function drawChairGroup(ctx, g) {
  ctx.fillStyle = '#6B7280'; ctx.fillRect(g.x + 4, g.y - 26, 3, 26);
  ctx.fillStyle = '#C8343A'; rr(ctx, g.x - 12, g.y - 42, 34, 17, 3); ctx.fill();
  ctx.strokeStyle = '#F2B233'; ctx.lineWidth = 1; ctx.strokeRect(g.x - 10, g.y - 40, 30, 13);
  label(ctx, g.lop, g.x + 5, g.y - 33.5, { size: 8, color: '#FFE08A', weight: 800 });
  for (let k = 0; k < 4; k++) {
    const cx = g.x + 30 + k * 24, cy = g.y;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx - 9, cy + 1, 18, 3);
    ctx.fillStyle = '#9AA3B2'; ctx.fillRect(cx - 8, cy - 4, 2, 6); ctx.fillRect(cx + 6, cy - 4, 2, 6);
    ctx.fillStyle = '#FFFFFF'; rr(ctx, cx - 9, cy - 9, 18, 6, 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; rr(ctx, cx - 8, cy - 21, 16, 12, 3); ctx.fill();
    ctx.fillStyle = '#D8343A'; ctx.fillRect(cx - 8, cy - 17, 16, 3);
    ctx.strokeStyle = 'rgba(30,40,60,.18)'; ctx.lineWidth = 1; rr(ctx, cx - 8, cy - 21, 16, 12, 3); ctx.stroke();
  }
}

// Giá sổ lưu bút của trường
function drawLectern(ctx, x, y) {
  ctx.fillStyle = '#6B4A2E'; ctx.fillRect(x - 3, y - 24, 6, 24);
  ctx.fillStyle = '#8A5A35'; rr(ctx, x - 20, y - 40, 40, 18, 3); ctx.fill();
  ctx.fillStyle = '#FFFDF6'; ctx.fillRect(x - 17, y - 38, 16, 13); ctx.fillRect(x + 1, y - 38, 16, 13);
  ctx.fillStyle = '#9DB4D6'; for (let i = 0; i < 3; i++) { ctx.fillRect(x - 15, y - 35 + i * 4, 12, 1); ctx.fillRect(x + 3, y - 35 + i * 4, 12, 1); }
}

function drawLamp(ctx, l) {
  ctx.fillStyle = 'rgba(20,30,50,.14)'; ctx.beginPath(); ctx.ellipse(l.x, l.y + 1, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, l.x - 5, l.y - 6, 10, 7, 2); ctx.fillStyle = '#1F4E85'; ctx.fill();
  ctx.fillStyle = '#2F6FB5'; ctx.fillRect(l.x - 2, l.y - 74, 4, 70);
  ctx.beginPath(); ctx.ellipse(l.x, l.y - 78, 13, 6, 0, Math.PI, 0); ctx.fillStyle = '#2F6FB5'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(l.x, l.y - 77, 10, 4, 0, 0, Math.PI * 2); ctx.fillStyle = '#FFF3C4'; ctx.fill();
  circ(ctx, '#FFE08A', l.x, l.y - 76, 3);
}

function drawFlag(ctx, time) {
  const { x, y } = FLAG;
  ctx.fillStyle = '#B8BDC6'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
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

function drawDrum(ctx) {
  const { x, y } = DRUM;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 2, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
  // giá gỗ
  ctx.fillStyle = '#6B3E22';
  ctx.fillRect(x - 26, y - 34, 5, 36); ctx.fillRect(x + 21, y - 34, 5, 36); ctx.fillRect(x - 28, y - 36, 56, 5);
  // tang trống
  ctx.fillStyle = '#B23A2A'; rr(ctx, x - 20, y - 46, 40, 34, 10); ctx.fill();
  ctx.fillStyle = '#8E2B1F'; ctx.fillRect(x - 20, y - 31, 40, 3);
  ctx.fillStyle = '#E8D3A6'; ctx.beginPath(); ctx.ellipse(x - 20, y - 29, 5, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#F2B233'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x - 20, y - 29, 5, 16, 0, 0, Math.PI * 2); ctx.stroke();
  // dùi trống
  ctx.strokeStyle = '#8A5A35'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 34, y - 14); ctx.lineTo(x - 22, y - 30); ctx.stroke();
}

function drawBoard(ctx) {
  const b = BOARD;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(b.x + 6, b.y + 6, b.w, b.h);
  ctx.fillStyle = '#8A4B2E'; ctx.fillRect(b.x, b.y - 40, b.w, b.h + 40);
  ctx.fillStyle = '#F7F3E8'; ctx.fillRect(b.x + 4, b.y - 36, b.w - 8, b.h + 28);
  ctx.fillStyle = '#1B2A4E'; ctx.fillRect(b.x + 4, b.y - 36, b.w - 8, 14);
  label(ctx, 'BẢNG TIN', b.x + b.w / 2, b.y - 29, { size: 7, color: '#fff', weight: 800 });
  ctx.fillStyle = '#C9D6E8'; for (let y = b.y - 16; y < b.y + b.h - 14; y += 18) ctx.fillRect(b.x + 8, y, b.w - 16, 12);
}

function drawStage(ctx) {
  const s = STAGE;
  // phông sân khấu: nền đỏ, sao vàng, băng chữ
  ctx.fillStyle = '#1F5E3B'; ctx.fillRect(s.x + 20, s.y - 70, s.w - 40, 70);
  ctx.fillStyle = '#C62828'; ctx.fillRect(s.x + s.w / 2 - 50, s.y - 70, 100, 70);
  ctx.fillStyle = '#C62828'; ctx.fillRect(s.x + 10, s.y - 86, s.w - 20, 18);
  label(ctx, s.label, s.x + s.w / 2, s.y - 77, { size: 9, color: '#FFE08A', weight: 800 });
  // bục sân khấu
  ctx.fillStyle = '#E7A9A0'; rr(ctx, s.x, s.y, s.w, s.h, 3); ctx.fill();
  ctx.fillStyle = '#C98C83'; ctx.fillRect(s.x, s.y + s.h - 10, s.w, 10);
}

function drawGate(ctx, time) {
  const g = GATE, top = g.y - 104;
  // cánh cổng xếp (inox) bên trái, đang mở
  ctx.strokeStyle = '#9AA0A6'; ctx.lineWidth = 2;
  for (let x = g.x + 4; x < g.x + 70; x += 6) { ctx.beginPath(); ctx.moveTo(x, g.y - 40); ctx.lineTo(x, g.y + 4); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(g.x + 4, g.y - 40); ctx.lineTo(g.x + 70, g.y - 40); ctx.moveTo(g.x + 4, g.y - 4); ctx.lineTo(g.x + 70, g.y - 4); ctx.stroke();
  // trụ cổng xanh nhạt
  for (const px of [g.x - 30, g.x + g.w * 0.62, g.x + g.w + 4]) {
    ctx.fillStyle = '#7FB6DA'; ctx.fillRect(px, top + 40, 26, g.y - top - 36);
    ctx.fillStyle = '#A8D0EA'; ctx.fillRect(px + 4, top + 44, 18, g.y - top - 44);
  }
  // xà ngang + biển trường trắng chữ đỏ
  ctx.fillStyle = '#7FB6DA'; rr(ctx, g.x - 46, top + 2, g.w + 92, 50, 4); ctx.fill();
  ctx.fillStyle = '#FBFBF7'; rr(ctx, g.x - 38, top + 6, g.w + 76, 40, 3); ctx.fill();
  label(ctx, 'SỞ GIÁO DỤC & ĐÀO TẠO TỈNH THÁI NGUYÊN', g.x + g.w / 2, top + 14, { size: 7.5, color: '#C62828', weight: 800 });
  label(ctx, g.sign, g.x + g.w / 2, top + 31, { size: 16, color: '#C62828', weight: 800 });
  // logo trường hai đầu biển
  if (LOGO && LOGO.complete && LOGO.naturalWidth) {
    for (const lx of [g.x - 18, g.x + g.w + 18]) {
      ctx.save(); ctx.beginPath(); ctx.arc(lx, top + 26, 17, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(LOGO, lx - 17, top + 9, 34, 34); ctx.restore();
    }
  }
  // băng rôn xanh
  const wave = Math.sin(time / 600) * 1;
  ctx.fillStyle = '#1E5BB8'; rr(ctx, g.x + 10, top + 56 + wave, g.w - 20, 16, 2); ctx.fill();
  label(ctx, 'NHIỆT LIỆT CHÀO MỪNG CÁC THẾ HỆ THẦY TRÒ VỀ THĂM TRƯỜNG', g.x + g.w / 2, top + 64 + wave, { size: 7.5, color: '#fff', weight: 800 });
}

// Cảnh SÂN TRƯỜNG
export const CAMPUS_SCENE = {
  id: 'campus', w: WORLD.w, h: WORLD.h, bgColor: '#8FBF73', name: 'Sân trường',
  solids: solids(), hotspots: HOTSPOTS, seats: SEATS, spawn: null,
  drawBg(ctx) {
    for (const g of GROUNDS) drawGround(ctx, g);
    for (const st of STAIRS) drawStairs(ctx, st);
    for (const fb of FLOWERBEDS) drawFlowerbed(ctx, fb);
    // tường rào thấp màu kem
    // tường rào gạch đỏ, mũ tường trắng
    for (const w of WALLS) {
      ctx.fillStyle = '#C8553D'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      if (w.w > w.h) for (let x = w.x; x < w.x + w.w; x += 14) ctx.fillRect(x, w.y + w.h / 2, 1, w.h / 2);
      else for (let y = w.y; y < w.y + w.h; y += 14) ctx.fillRect(w.x + w.w / 2, y, w.w / 2, 1);
      ctx.fillStyle = '#F6F5F1';
      if (w.w > w.h) ctx.fillRect(w.x, w.y, w.w, 3); else ctx.fillRect(w.x, w.y, 3, w.h);
    }
    // cửa mặt nam vẽ sau toà nhà (trong statics) để nằm trên mặt tiền
    for (const d of CLASS_DOORS) if (d.side !== 's') drawDoor(ctx, d);
    for (const d of ROOM_DOORS) drawDoor(ctx, d);
  },
  lamps: LAMPS,
  statics(ctx, now) {
    const items = [];
    for (const b of BUILDINGS) items.push({ y: b.y + b.h, draw: () => drawBuilding(ctx, b) });
    for (const d of CLASS_DOORS) if (d.side === 's') items.push({ y: d.y - 25, draw: () => drawDoor(ctx, d) });
    for (const t of TREES) items.push({ y: t.y, draw: () => drawTree(ctx, t, now) });
    for (const b of BENCHES) items.push({ y: b.y - 1, draw: () => drawBench(ctx, b) });
    items.push({ y: STAGE.y + STAGE.h + 1, draw: () => drawFlag(ctx, now) });
    items.push({ y: DRUM.y, draw: () => drawDrum(ctx) });
    items.push({ y: BOARD.y + BOARD.h, draw: () => drawBoard(ctx) });
    items.push({ y: STAGE.y + STAGE.h, draw: () => drawStage(ctx) });
    for (const l of LAMPS) items.push({ y: l.y, draw: () => drawLamp(ctx, l) });
    for (const g of CHAIR_ROWS) items.push({ y: g.y - 1, draw: () => drawChairGroup(ctx, g) });
    items.push({ y: 650, draw: () => drawLectern(ctx, 735, 650) });
    items.push({ y: GATE.y + 10, draw: () => drawGate(ctx, now) });
    return items;
  },
};

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
    // phần màn hình bị thanh trên / thanh chat che (px), để lớp học căn vào vùng nhìn thấy
    this.insets = { top: 56, bottom: 0 };
    this.cam = { x: 0, y: 0 };
    this.labelRects = [];
    this.onArrive = () => {};
    this.onTapPlayer = () => {};
    this.bubbles = new Map(); // id -> {text, until}
    this.fx = []; // bóng nước đang bay / vừa vỡ
    this.wet = new Map(); // id ('me' hoặc id người khác) -> ướt đến lúc nào
    this.myId = '';
    this.onWet = () => {};
    this.onHitOther = () => {};
    this.onTapNpc = () => {};
    this.shield = false;
    this.bg = null;
    this.scene = null;
    this.grid = null;
    this._grids = new Map();
    this.onSceneChange = () => {};
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
    this.baseZoom = r.width < 640 ? 0.95 : 1.2;
  }

  // Đổi cảnh (sân trường ↔ lớp học). Vẽ sẵn nền tĩnh vào canvas ngoài màn hình.
  setScene(scene, pos) {
    this.scene = scene;
    if (!this._grids.has(scene.id)) this._grids.set(scene.id, new Grid(scene.w, scene.h, scene.solids));
    this.grid = this._grids.get(scene.id);
    const c = document.createElement('canvas');
    c.width = scene.w; c.height = scene.h;
    scene.drawBg(c.getContext('2d'));
    this.bg = c;
    this.others.clear(); this.fx = []; this.path = []; this.target = null;
    // lớp học: thu nhỏ cho vừa chiều ngang màn hình; ra sân thì về mức bình thường
    this.zoom = scene.fit ? Math.max(scene.fitMin || 0.68, Math.min(1, this.vw / (scene.w * this.baseZoom))) : 1;
    if (this.me && pos) { this.me.x = pos.x; this.me.y = pos.y; this.me.sit = null; this._snapCam(); }
    this.onSceneChange(scene);
  }

  start(scene = CAMPUS_SCENE) { if (!this.scene) this.setScene(scene); requestAnimationFrame(this._loop); }

  setMe(me) {
    this.me = { ...me, dir: 1, moving: false };
    this._snapCam();
  }

  _snapCam() {
    const z = this.baseZoom * this.zoom;
    this.cam.x = this.me.x - this.vw / z / 2; this.cam.y = this.me.y - this.vh / z / 2 - 40;
  }

  zoomBy(f) { this.zoom = Math.max(0.4, Math.min(1.8, this.zoom * f)); }

  walkTo(x, y, hotspot = null) {
    if (!this.me) return;
    const p = this.grid.findPath(this.me.x, this.me.y, x, y);
    this.target = hotspot;
    if (!p) { this.path = []; return; }
    this.path = p;
    if (!p.length && hotspot) { this.target = null; this._arrive(hotspot); }
  }

  _arrive(h) {
    if (h.sit) { this.sitOn(h.sit); return; }
    this.onArrive(h);
  }

  // Ngồi xuống ghế đá / ghế trong lớp
  sitOn(seat) {
    const m = this.me;
    m.x = seat.x; m.y = seat.y; m.dir = seat.dir || 1; m.sit = seat; m.moving = false;
    this.onSit?.(seat);
  }

  seatAt(wx, wy) {
    for (const st of this.scene.seats || []) if (Math.hypot(st.x - wx, st.y - 8 - wy) < 24) return st;
    return null;
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
        this.onSay?.(p, p.say);
      }
      if (p.throw && p.throw.at && (!this._threwAt?.[p.id] || this._threwAt[p.id] < p.throw.at)) {
        const first = !this._threwAt?.[p.id];
        (this._threwAt ||= {})[p.id] = p.throw.at;
        const from = this.others.get(p.id);
        // lần đầu thấy người này thì bỏ qua cú ném cũ, chỉ diễn những cú ném mới
        if (!first || Date.now() - p.throw.at < 4000) {
          const target = p.throw.target && p.throw.target === this.myId ? 'me' : p.throw.target || null;
          this.throwBalloon({ from: p.id, fromName: p.name, fx: from.x, fy: from.y, tx: p.throw.x, ty: p.throw.y, target });
        }
      }
    }
    for (const id of [...this.others.keys()]) if (!seen.has(id)) this.others.delete(id);
  }

  zoneOf(x, y) {
    if (this.scene && this.scene.id !== 'campus') return this.scene.id;
    const inR = (r, m = 0) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
    if (y > GATE.y) return 'duong';
    if (inR(YARD)) return 'san';
    for (const g of GROUNDS) if (g.kind === 'court' && inR(g)) return 'dacau';
    for (const g of GROUNDS) if (g.wild && inR(g)) return 'tronhoc';
    for (const b of BUILDINGS) if (inR(b, 40)) return b.id;
    if (y > 984 && x > 380) return 'cong';
    return 'khuon';
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
          if (lr.player) this.onTapPlayer(lr.player); else if (lr.npc) this.onTapNpc(lr.npc); else this.goToHotspot(lr.hs);
          return;
        }
      }
      const z = this.baseZoom * this.zoom;
      const wx = this.cam.x + sx / z, wy = this.cam.y + sy / z;
      // chạm vào chính đồ vật (cửa lớp, bảng, áp phích, bàn giáo viên…) cũng như chạm nhãn
      const hit = this.scene.hotspots.find((h) => h.rect && wx >= h.rect.x && wx <= h.rect.x + h.rect.w && wy >= h.rect.y && wy <= h.rect.y + h.rect.h);
      if (hit) { this.goToHotspot(hit); return; }
      const seat = this.seatAt(wx, wy);
      if (seat) { this.walkTo(seat.x, seat.y, { sit: seat }); return; }
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
      if (!this.grid.isBlockedPx(nx, me.y)) me.x = nx;
      if (!this.grid.isBlockedPx(me.x, ny)) me.y = ny;
    } else if (this.path.length) {
      const p = this.path[0];
      const dx = p.x - me.x, dy = p.y - me.y, d = Math.hypot(dx, dy);
      const s = SPEED * dt;
      if (d <= s) { me.x = p.x; me.y = p.y; this.path.shift(); }
      else { vx = dx / d; vy = dy / d; me.x += vx * s; me.y += vy * s; }
      if (!this.path.length && this.target) { const h = this.target; this.target = null; this._arrive(h); }
    }
    me.moving = !!(vx || vy);
    if (me.moving) me.sit = null;
    if (vx) me.dir = vx > 0 ? 1 : -1;
    me.back = vy < -0.6 && Math.abs(vx) < 0.5;

    for (const o of this.others.values()) {
      const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
      if (d > 400) { o.x = o.tx; o.y = o.ty; o.moving = false; continue; }
      const s = SPEED * dt;
      if (d > 1) { o.moving = true; const k = Math.min(1, s / d); o.x += dx * k; o.y += dy * k; if (Math.abs(dx) > 1) o.dir = dx > 0 ? 1 : -1; o.back = dy < -Math.abs(dx); }
      else o.moving = false;
    }
    for (const n of this.npcs) {
      if ((n.scene || 'campus') !== this.scene.id) continue;
      n.update?.(n, dt, now);
      // thỉnh thoảng NPC nói một câu
      if (n.lines && now > (n.nextSay ||= now + 3000 + Math.random() * 9000)) {
        n.nextSay = now + 9000 + Math.random() * 12000;
        if (this.me && Math.hypot(n.x - this.me.x, n.y - this.me.y) < 500) this.say(n.id, n.lines[Math.floor(Math.random() * n.lines.length)]);
      }
    }

    // camera bám theo
    const z = this.baseZoom * this.zoom;
    const tx = me.x - this.vw / z / 2, ty = me.y - this.vh / z / 2 - 40;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 6);
    const W = this.scene.w, H = this.scene.h;
    // cảnh nhỏ hơn màn hình thì căn giữa
    // lớp học (fit) không cho thấy khoảng tối ngoài phòng; sân trường cho lố ra một chút
    const m = this.scene.fit ? 0 : 100;
    if (W * z <= this.vw + 2) this.cam.x = (W - this.vw / z) / 2;
    else this.cam.x = Math.max(-m, Math.min(W - this.vw / z + m, this.cam.x));
    // lớp học: tính cả phần bị thanh trên (HUD) và thanh chat che để thấy trọn tường đầu và cuối lớp
    const top = this.scene.fit ? this.insets.top : 0, bot = this.scene.fit ? this.insets.bottom : 0;
    if (H * z <= this.vh - top - bot + 2) this.cam.y = -(top + (this.vh - top - bot - H * z) / 2) / z;
    else this.cam.y = Math.max(this.scene.fit ? -top / z : -m, Math.min(H - (this.vh - bot) / z + (this.scene.fit ? 0 : 60), this.cam.y));
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
    SKY = this.forceNight === 1 ? skyTint(Date.UTC(2026, 0, 1, 16)) : this.forceNight === 0 ? skyTint(Date.UTC(2026, 0, 1, 3)) : skyTint();
    NIGHT = SKY.night;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.scene.bgColor; ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-this.cam.x, -this.cam.y);
    if (this.bg) ctx.drawImage(this.bg, 0, 0);

    // đường đi
    if (this.path.length && this.me && !this._capturing) {
      ctx.strokeStyle = 'rgba(47,111,181,.45)'; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.me.x, this.me.y); for (const p of this.path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
      const last = this.path[this.path.length - 1];
      ctx.strokeStyle = 'rgba(47,111,181,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(last.x, last.y, 10 + Math.sin(now / 150) * 2, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // các vật thể sắp theo chiều y để che khuất đúng
    const items = this.scene.statics(ctx, now);
    for (const n of this.npcs) if ((n.scene || 'campus') === this.scene.id) items.push({ y: n.y, draw: () => { drawAvatar(ctx, n.x, n.y, n.look, { t: now, moving: n.moving, dir: n.dir, sit: !!n.sit && !n.moving, scale: AV }); this._nameTag(ctx, n.x, n.y, n.name, n.sub, '#2E8B57', false, true); this._bubble(ctx, n.id, n.x, n.y, now); } });
    for (const [id, o] of this.others) items.push({ y: o.y, draw: () => { const osit = o.data.sit && !o.moving; drawAvatar(ctx, o.x, o.y, o.data.look, { t: now, moving: o.moving, dir: osit ? o.data.dir || 1 : o.dir, back: osit ? o.data.sitBack : o.back, sit: osit, scale: AV }); if (o.data.noBalloon) this._shieldFx(ctx, o.x, o.y); this._nameTag(ctx, o.x, o.y, o.data.name, this.subOf(o.data), '#1D2433'); this._wetFx(ctx, id, o.x, o.y, now); this._bubble(ctx, id, o.x, o.y, now); } });
    if (this.me) { const m = this.me; items.push({ y: m.y, draw: () => { drawAvatar(ctx, m.x, m.y, m.look, { t: now, moving: m.moving, dir: m.dir, back: m.sit ? m.sit.back : m.back, sit: !!m.sit, scale: AV }); if (this.shield) this._shieldFx(ctx, m.x, m.y); this._nameTag(ctx, m.x, m.y, m.name, m.sub, '#D8343A', true); this._wetFx(ctx, 'me', m.x, m.y, now); this._bubble(ctx, 'me', m.x, m.y, now); } }); }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    this._drawFx(ctx, now);
    if (this.tapFx && now - this.tapFx.t < 400 && !this._capturing) {
      const k = (now - this.tapFx.t) / 400;
      ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.tapFx.x, this.tapFx.y, 6 + k * 16, 3 + k * 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // màu trời theo giờ; tối thì đèn sân toả sáng
    if (this.scene.lamps && SKY.color) {
      ctx.fillStyle = SKY.color;
      ctx.fillRect(this.cam.x - 50, this.cam.y - 50, this.vw / z + 100, this.vh / z + 100);
      if (SKY.lamps) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const l of this.scene.lamps) {
          const g = ctx.createRadialGradient(l.x, l.y - 76, 4, l.x, l.y - 40, 120);
          g.addColorStop(0, 'rgba(255,214,140,.5)'); g.addColorStop(1, 'rgba(255,214,140,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y - 40, 120, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }
    ctx.restore();

    // nhãn điểm tương tác (vẽ theo toạ độ màn hình để luôn dễ đọc)
    if (this._capturing) return;
    this.labelRects = [];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (const h of this.scene.hotspots) {
      if (h.nolabel) continue; // đồ vật đã có chữ (bảng, áp phích): chạm thẳng vào đồ vật
      const near = this.me && Math.hypot(this.me.x - h.x, this.me.y - h.y) < 60;
      // khi nhân vật đứng tại điểm, đẩy nhãn xuống dưới chân để không che người
      const sx = (h.x - this.cam.x) * z, sy = (h.y - this.cam.y) * z + (near ? 24 : h.small ? -18 : -34) * z;
      if (sx < -100 || sy < -40 || sx > this.vw + 100 || sy > this.vh + 40) continue;
      const txt = `${h.icon} ${h.label}`;
      const size = h.small ? 11 : 12;
      const w = label(ctx, txt, sx, sy, { size, color: h.small ? '#1B2A4E' : '#fff', bg: h.small ? 'rgba(255,255,255,.92)' : near ? '#D8343A' : 'rgba(27,42,78,.88)', weight: 700, pad: 6 });
      this.labelRects.push({ x: sx - w / 2, y: sy - size / 2 - 8, w, h: size + 16, hs: h });
    }
    // chạm vào người khác
    for (const o of this.others.values()) {
      const sx = (o.x - this.cam.x) * z, sy = (o.y - this.cam.y) * z;
      this.labelRects.push({ x: sx - 16 * AV * z, y: sy - 58 * AV * z, w: 32 * AV * z, h: 60 * AV * z, player: o.data });
    }
    for (const n of this.npcs) {
      if ((n.scene || 'campus') !== this.scene.id) continue;
      const sx = (n.x - this.cam.x) * z, sy = (n.y - this.cam.y) * z;
      this.labelRects.push({ x: sx - 16 * AV * z, y: sy - 58 * AV * z, w: 32 * AV * z, h: 60 * AV * z, npc: n });
    }
  }

  // Chụp ảnh khung cảnh quanh nhân vật (không có nhãn, đường đi). Trả về canvas w × h.
  capture(w = 640, h = 480, zoom = 1.5) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const saved = { ctx: this.ctx, vw: this.vw, vh: this.vh, dpr: this.dpr, cam: { ...this.cam }, baseZoom: this.baseZoom, zoom: this.zoom, labelRects: this.labelRects };
    try {
      Object.assign(this, { ctx: c.getContext('2d'), vw: w, vh: h, dpr: 1, baseZoom: zoom, zoom: 1, _capturing: true });
      this.cam = { x: this.me.x - w / zoom / 2, y: this.me.y - h / zoom / 2 - 30 };
      this._draw(performance.now());
    } finally {
      Object.assign(this, saved, { _capturing: false });
    }
    return c;
  }

  // Những người đang đứng trong khung hình chụp
  peopleNear(range = 260) {
    const out = [this.me.name];
    for (const o of this.others.values()) if (Math.hypot(o.x - this.me.x, o.y - this.me.y) < range) out.push(o.data.name);
    return out;
  }

  subOf(p) {
    if (p.role === 'gv') return p.school || 'Thầy cô';
    if (p.role === 'em') return 'Em · THCS';
    if (p.role === 'khach') return p.school ? 'Bạn · ' + p.school : 'Bạn trường khác';
    return [p.khoa, p.lop].filter(Boolean).join(' · ');
  }

  // ---------- Bóng nước ----------
  posOf(id) {
    if (id === 'me') return this.me;
    return this.others.get(id) || null;
  }

  // Người gần nhất trong tầm ném (px thế giới), hoặc null
  nearestOther(range = 360) {
    let best = null, bd = range;
    for (const [id, o] of this.others) { const d = Math.hypot(o.x - this.me.x, o.y - this.me.y); if (d < bd) { bd = d; best = { id, o }; } }
    return best;
  }

  throwBalloon({ from = 'me', fromName = '', fx, fy, tx, ty, target = null }) {
    const colors = ['#F06292', '#4FC3F7', '#FFD54F', '#81C784', '#BA68C8'];
    const dist = Math.hypot(tx - fx, ty - fy);
    this.fx.push({ from, fromName, fx, fy: fy - 30, tx, ty, target, t0: performance.now(), dur: 450 + dist * 1.3, color: colors[Math.floor(Math.random() * colors.length)], landed: false });
  }

  _drawFx(ctx, now) {
    this.fx = this.fx.filter((f) => now - f.t0 < f.dur + 700);
    for (const f of this.fx) {
      // bám theo mục tiêu đang di chuyển
      const tp = f.target ? this.posOf(f.target) : null;
      const tx = tp ? tp.x : f.tx, ty = tp ? tp.y - 26 : f.ty;
      const k = (now - f.t0) / f.dur;
      if (k < 1) {
        const x = f.fx + (tx - f.fx) * k, y = f.fy + (ty - f.fy) * k - Math.sin(Math.PI * k) * (60 + f.dur / 12);
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(f.fx + (tx - f.fx) * k, f.fy + 30 + (ty + 26 - f.fy - 30) * k, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(k * 8);
        ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-3, -4, 2.5, 3.5, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = f.color; ctx.beginPath(); ctx.moveTo(-2, 11); ctx.lineTo(2, 11); ctx.lineTo(0, 15); ctx.fill();
        ctx.restore();
      } else {
        if (!f.landed) {
          f.landed = true; f.lx = tx; f.ly = ty;
          if (f.target) {
            const shielded = f.target === 'me' ? this.shield : this.others.get(f.target)?.data.noBalloon;
            if (shielded) { if (f.target === 'me' && f.from !== 'me') this.say('me', '🛡️ Chặn được!'); }
            else {
              this.wet.set(f.target, now + 4000);
              if (f.target === 'me' && f.from !== 'me') this.onWet(f.fromName);
              if (f.from === 'me' && f.target !== 'me') this.onHitOther(f.target);
            }
          }
        }
        const s = Math.min(1, (now - f.t0 - f.dur) / 700);
        ctx.strokeStyle = `rgba(79,195,247,${1 - s})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(f.lx, f.ly + 24, 10 + s * 30, 4 + s * 12, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(79,195,247,${0.9 * (1 - s)})`;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(f.lx + Math.cos(a) * (6 + s * 34), f.ly + Math.sin(a) * (4 + s * 18) - Math.sin(Math.PI * s) * 16, 3 - s * 2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // Giọt nước nhỏ quanh người vừa bị ném trúng
  _wetFx(ctx, id, x, y, now) {
    const until = this.wet.get(id);
    if (!until) return;
    if (now > until) { this.wet.delete(id); return; }
    ctx.fillStyle = 'rgba(79,195,247,.85)';
    for (let i = 0; i < 6; i++) {
      const ph = ((now / 600) + i / 6) % 1;
      const dx = Math.sin(i * 2.1) * 12, dy = -48 + ph * 46;
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy - 4); ctx.quadraticCurveTo(x + dx + 3, y + dy + 1, x + dx, y + dy + 2); ctx.quadraticCurveTo(x + dx - 3, y + dy + 1, x + dx, y + dy - 4); ctx.fill();
    }
    ctx.fillStyle = 'rgba(79,195,247,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  _nameTag(ctx, x, y, name, sub, color, mine = false, npc = false) {
    ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif';
    const w1 = ctx.measureText(name).width;
    ctx.font = '600 8px "Be Vietnam Pro", system-ui, sans-serif';
    const w2 = sub ? ctx.measureText(sub).width : 0;
    const w = Math.max(w1, w2) + 12, hgt = sub ? 25 : 15, top = y - 58 * AV - 2 - hgt;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(ctx, x - w / 2, top + 1.5, w, hgt, 6); ctx.fill();
    ctx.fillStyle = mine ? '#2F6FB5' : npc ? '#FFF8E1' : 'rgba(255,255,255,.96)';
    rr(ctx, x - w / 2, top, w, hgt, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = mine ? '#fff' : npc ? '#8A5A00' : color;
    ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(name, x, top + 8);
    if (sub) { ctx.fillStyle = mine ? 'rgba(255,255,255,.85)' : '#5B6577'; ctx.font = '600 8px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillText(sub, x, top + 19); }
  }

  _bubble(ctx, id, x, y, now) {
    const b = this.bubbles.get(id);
    if (!b) return;
    if (now > b.until) { this.bubbles.delete(id); return; }
    ctx.font = '600 11px "Be Vietnam Pro", system-ui, sans-serif';
    const w = Math.min(180, ctx.measureText(b.text).width + 16);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.15)';
    const by = y - 58 * AV - 60;
    rr(ctx, x - w / 2, by, w, 24, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, by + 24); ctx.lineTo(x + 5, by + 24); ctx.lineTo(x, by + 30); ctx.fill();
    ctx.fillStyle = '#1D2433'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let t = b.text; while (ctx.measureText(t).width > w - 14 && t.length > 1) t = t.slice(0, -2) + '…';
    ctx.fillText(t, x, by + 12);
  }

  _shieldFx(ctx, x, y) {
    ctx.strokeStyle = 'rgba(96,165,250,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 30 * AV, 20 * AV, 36 * AV, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(96,165,250,.08)'; ctx.fill();
  }

  // Bản đồ toàn cảnh (trong bảng "Bản đồ trường"); trả về hàm đổi toạ độ màn hình → thế giới
  drawOverview(canvas, places, now = performance.now()) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth, s = cw / WORLD.w, ch = WORLD.h * s;
    canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.height = ch + 'px';
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    if (this.bg) ctx.drawImage(this.bg, 0, 0);
    const items = [];
    for (const b of BUILDINGS) items.push({ y: b.y + b.h, draw: () => drawBuilding(ctx, b) });
    for (const d of CLASS_DOORS) if (d.side === 's') items.push({ y: d.y - 25, draw: () => drawDoor(ctx, d) });
    for (const t of TREES) items.push({ y: t.y, draw: () => drawTree(ctx, t, now) });
    items.push({ y: STAGE.y + STAGE.h + 1, draw: () => drawFlag(ctx, now) });
    items.push({ y: DRUM.y, draw: () => drawDrum(ctx) });
    items.push({ y: BOARD.y + BOARD.h, draw: () => drawBoard(ctx) });
    items.push({ y: STAGE.y + STAGE.h, draw: () => drawStage(ctx) });
    items.push({ y: GATE.y + 10, draw: () => drawGate(ctx, now) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#F26A21';
    for (const o of this.others.values()) { ctx.beginPath(); ctx.arc(o.x * s, o.y * s, 3.5, 0, Math.PI * 2); ctx.fill(); }
    const rects = [];
    for (const p of places) {
      const fs = cw < 500 ? 9 : 11;
      const w = label(ctx, p.map || p.label, p.x * s, p.y * s - 8, { size: fs, color: '#fff', bg: 'rgba(27,42,78,.88)', pad: 4 });
      rects.push({ x: p.x * s - w / 2, y: p.y * s - 20, w, h: 24, p });
    }
    if (this.me) { ctx.fillStyle = '#D8343A'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.me.x * s, this.me.y * s, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    return (sx, sy) => {
      for (const r of rects) if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) return { hotspot: r.p };
      return { x: sx / s, y: sy / s };
    };
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
