// Sân trường: vẽ bản đồ, camera, tìm đường (A* trên lưới), nhân vật mình + người khác.
import { WORLD, GROUNDS, BUILDINGS, WALLS, GATE, TREES, BENCHES, LAMPS, STAIRS, YARD, FLAG, BOARD, STAGE, HOTSPOTS, CLASS_DOORS, solids } from './campus.js';
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
      for (let x = 260; x < g.w; x += 740) label(ctx, g.label, x, g.y + g.h / 2 + 34, { size: 14, color: 'rgba(255,255,255,.75)', weight: 800 });
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let x = 820; x < 1000; x += 22) ctx.fillRect(x, g.y + 8, 12, 46);
      break;
    }
    case 'sidewalk': ctx.fillStyle = '#C9C3B6'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
      for (let x = 0; x < g.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); }
      break;
    case 'concrete': {
      ctx.fillStyle = '#D3CEC3'; ctx.fillRect(g.x, g.y, g.w, g.h);
      // vệt loang, vết nứt của sân bê tông cũ
      ctx.fillStyle = 'rgba(90,80,60,.06)';
      for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.ellipse(g.x + ((i * 7919) % g.w), g.y + ((i * 104729) % g.h), 30 + (i % 5) * 12, 14 + (i % 3) * 8, i, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(80,70,55,.12)'; ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const x = (i * 4931) % g.w, y = (i * 7757) % g.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y + 9); ctx.lineTo(x + 30, y + 4); ctx.stroke(); }
      break;
    }
    case 'grass': ctx.fillStyle = g.wild ? '#9CC77E' : '#A9D18E'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = g.wild ? 'rgba(140,100,60,.25)' : 'rgba(70,120,50,.10)';
      for (let i = 0; i < (g.wild ? 260 : 400); i++) { const px = g.x + ((i * 7919) % g.w), py = g.y + ((i * 104729) % g.h); ctx.fillRect(px, py, g.wild ? 6 : 3, g.wild ? 4 : 2); }
      if (g.wild) { // khung thành tự chế
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.strokeRect(g.x + g.w / 2 - 30, g.y + 14, 60, 20); ctx.strokeRect(g.x + g.w / 2 - 30, g.y + g.h - 34, 60, 20);
      }
      break;
    case 'court': {
      ctx.fillStyle = '#C3BEB3'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
      ctx.strokeRect(g.x + 20, g.y + 20, g.w - 40, g.h - 40);
      ctx.beginPath(); ctx.moveTo(g.x + 20, g.y + g.h / 2); ctx.lineTo(g.x + g.w - 20, g.y + g.h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x + g.w / 2, g.y + 20); ctx.lineTo(g.x + g.w / 2, g.y + g.h - 20); ctx.stroke();
      // lưới chắn thấp quanh sân
      ctx.strokeStyle = 'rgba(60,60,60,.55)'; ctx.lineWidth = 2; ctx.strokeRect(g.x + 2, g.y + 2, g.w - 4, g.h - 4);
      ctx.fillStyle = '#555'; for (const [px, py] of [[g.x, g.y], [g.x + g.w, g.y], [g.x, g.y + g.h], [g.x + g.w, g.y + g.h]]) ctx.fillRect(px - 3, py - 3, 6, 6);
      break;
    }
    case 'yard': {
      // sân cao: bóng đổ + tường chắn phía Tây và phía Nam
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(g.x - 4, g.y + 8, 8, g.h); ctx.fillRect(g.x, g.y + g.h, g.w, 10);
      ctx.fillStyle = '#E4DFD4'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3;
      for (let i = 1; i <= 4; i++) { const y = g.y + 90 + i * 95; ctx.beginPath(); ctx.moveTo(g.x + 130, y); ctx.lineTo(g.x + g.w - 90, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(g.x + 130, g.y + 185); ctx.lineTo(g.x + 130, g.y + 470); ctx.moveTo(g.x + g.w - 90, g.y + 185); ctx.lineTo(g.x + g.w - 90, g.y + 470); ctx.stroke();
      ctx.fillStyle = '#A9A295'; ctx.fillRect(g.x - 6, g.y, 8, g.h + 6); ctx.fillRect(g.x - 6, g.y + g.h - 2, g.w + 6, 8);
      label(ctx, g.label, g.x + g.w / 2 + 20, g.y + 330, { size: 30, color: 'rgba(120,100,70,.14)', weight: 800 });
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
  const depth = b.hall ? 46 : 14 + b.floors * 7;
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  // mặt tường phía Nam
  const fy = b.y + b.h - depth;
  ctx.fillStyle = b.wall; ctx.fillRect(b.x, fy, b.w, depth);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  if (b.hall) {
    // nhà đa năng: cửa lớn ở giữa, vòm trang trí
    ctx.fillStyle = '#5E6F63'; ctx.fillRect(b.x + b.w / 2 - 34, fy + 14, 68, depth - 14);
    ctx.strokeStyle = 'rgba(120,100,60,.5)'; ctx.lineWidth = 2;
    for (const cx of [b.x + b.w / 4, b.x + b.w * 3 / 4]) { ctx.beginPath(); ctx.arc(cx, fy + depth, 30, Math.PI, 0); ctx.stroke(); }
  } else {
    const rows = Math.max(1, b.floors), rowH = (depth - 6) / rows;
    for (let r = 0; r < rows; r++) {
      const ry = fy + 4 + r * rowH;
      if (b.trim) { ctx.fillStyle = b.trim; ctx.fillRect(b.x, ry - 2, b.w, 2); }
      ctx.fillStyle = b.bands ? '#8C5A3C' : '#7FA7CF';
      for (let x = b.x + 10; x < b.x + b.w - 14; x += 22) ctx.fillRect(x, ry, 12, Math.max(3, rowH - 4));
    }
    if (b.bands) { ctx.fillStyle = b.bands; for (const f of [0.18, 0.82]) ctx.fillRect(b.x + b.w * f - 12, fy, 24, depth); }
  }
  // mái
  const rh = b.h - depth;
  ctx.fillStyle = b.roof; rr(ctx, b.x - 4, b.y - 4, b.w + 8, rh + 8, 6); ctx.fill();
  if (b.hall) {
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(b.x + b.w / 2, b.y - 4, b.w / 2 + 4, rh + 8);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (let y = b.y + 10; y < b.y + rh; y += 14) { ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke(); }
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, rh - 12);
    if (b.bands) { ctx.fillStyle = b.bands; ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, 8); }
    if (b.trim) { ctx.fillStyle = b.trim; ctx.fillRect(b.x - 4, b.y + rh - 4, b.w + 8, 6); }
  }
  if (!b.short) return;
  const cx = b.x + b.w / 2, cy = b.y + rh / 2;
  const ink = '#6B5A35';
  if (b.vertical) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2);
    label(ctx, b.short, 0, 0, { size: 16, color: ink, weight: 800 });
    ctx.restore();
  } else {
    label(ctx, b.short, cx, cy, { size: b.w < 400 ? 18 : 24, color: ink, weight: 800 });
  }
}

function drawDoor(ctx, d) {
  ctx.fillStyle = '#7A4B2A';
  if (d.side === 'e') ctx.fillRect(d.x - 27, d.y - 14, 6, 28);
  if (d.side === 'w') ctx.fillRect(d.x + 21, d.y - 14, 6, 28);
  if (d.side === 's') ctx.fillRect(d.x - 14, d.y - 27, 28, 6);
  if (d.side === 'n') ctx.fillRect(d.x - 14, d.y + 27, 28, 6);
}

function drawTree(ctx, t, time) {
  const sway = Math.sin(time / 1400 + t.x) * 1.5;
  if (t.kind === 'palm') {
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(t.x + 10, t.y + 2, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#A99C86'; ctx.fillRect(t.x - 3, t.y - 70, 6, 72);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let y = t.y - 66; y < t.y; y += 7) ctx.fillRect(t.x - 3, y, 6, 1.5);
    ctx.strokeStyle = '#3F8A3A'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const top = { x: t.x + sway, y: t.y - 72 };
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.42, len = 28 + (i % 2) * 6;
      ctx.beginPath(); ctx.moveTo(top.x, top.y);
      ctx.quadraticCurveTo(top.x + Math.cos(a) * len * 0.6, top.y + Math.sin(a) * len * 0.6 - 6, top.x + Math.cos(a) * len, top.y + Math.sin(a) * len * 0.5 + 12);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    return;
  }
  if (t.kind === 'bonsai') {
    ctx.fillStyle = '#6E6A63'; rr(ctx, t.x - 9, t.y - 10, 18, 12, 3); ctx.fill();
    ctx.fillStyle = '#5D8F45'; ctx.beginPath(); ctx.arc(t.x - 5 + sway / 2, t.y - 18, 8, 0, Math.PI * 2); ctx.arc(t.x + 6 + sway / 2, t.y - 22, 9, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(t.x + 6, t.y + 2, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7A5230'; ctx.fillRect(t.x - 3, t.y - 18, 6, 20);
  ctx.fillStyle = '#4E9A48';
  ctx.beginPath();
  ctx.arc(t.x + sway, t.y - 36, 24, 0, Math.PI * 2);
  ctx.arc(t.x - 17 + sway, t.y - 26, 15, 0, Math.PI * 2);
  ctx.arc(t.x + 17 + sway, t.y - 26, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(t.x - 6 + sway, t.y - 44, 9, 0, Math.PI * 2); ctx.fill();
}

function drawBench(ctx, b) {
  ctx.fillStyle = '#9AA0A6'; rr(ctx, b.x - 22, b.y - 6, 44, 12, 3); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(b.x - 22, b.y + 4, 44, 3);
}

function drawLamp(ctx, l) {
  ctx.fillStyle = '#6B7280'; ctx.fillRect(l.x - 2, l.y - 70, 4, 70);
  ctx.fillRect(l.x - 2, l.y - 70, 18, 3);
  ctx.fillStyle = '#F4F1E6'; ctx.beginPath(); ctx.ellipse(l.x + 16, l.y - 66, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = '#FFDE00'; ctx.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; ctx[i ? 'lineTo' : 'moveTo'](s.x + s.w / 2 + Math.cos(a) * 16, s.y - 32 + Math.sin(a) * 16); }
  ctx.fill();
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
  // băng rôn xanh
  const wave = Math.sin(time / 600) * 1;
  ctx.fillStyle = '#1E5BB8'; rr(ctx, g.x + 10, top + 56 + wave, g.w - 20, 16, 2); ctx.fill();
  label(ctx, 'NHIỆT LIỆT CHÀO MỪNG CÁC THẾ HỆ THẦY TRÒ VỀ THĂM TRƯỜNG', g.x + g.w / 2, top + 64 + wave, { size: 7.5, color: '#fff', weight: 800 });
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
    this.baseZoom = r.width < 640 ? 0.95 : 1.2;
  }

  // Vẽ sẵn lớp nền tĩnh (mặt đất) vào canvas ngoài màn hình
  _buildBg() {
    const c = document.createElement('canvas');
    c.width = WORLD.w; c.height = WORLD.h;
    const ctx = c.getContext('2d');
    for (const g of GROUNDS) drawGround(ctx, g);
    for (const st of STAIRS) drawStairs(ctx, st);
    // tường rào thấp màu kem
    for (const w of WALLS) { ctx.fillStyle = '#E8E1CF'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2); }
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
    items.push({ y: BOARD.y + BOARD.h, draw: () => drawBoard(ctx) });
    items.push({ y: STAGE.y + STAGE.h, draw: () => drawStage(ctx) });
    for (const l of LAMPS) items.push({ y: l.y, draw: () => drawLamp(ctx, l) });
    items.push({ y: GATE.y + 10, draw: () => drawGate(ctx, now) });
    for (const n of this.npcs) items.push({ y: n.y, draw: () => { drawAvatar(ctx, n.x, n.y, n.look, { t: now, moving: n.moving, dir: n.dir }); if (n.tag !== false) this._nameTag(ctx, n.x, n.y, n.name, n.sub, '#2E8B57'); } });
    for (const [id, o] of this.others) items.push({ y: o.y, draw: () => { drawAvatar(ctx, o.x, o.y, o.data.look, { t: now, moving: o.moving, dir: o.dir, back: o.back }); this._nameTag(ctx, o.x, o.y, o.data.name, this.subOf(o.data), '#1D2433'); this._bubble(ctx, id, o.x, o.y, now); } });
    if (this.me) { const m = this.me; items.push({ y: m.y, draw: () => { drawAvatar(ctx, m.x, m.y, m.look, { t: now, moving: m.moving, dir: m.dir, back: m.back }); this._nameTag(ctx, m.x, m.y, m.name, m.sub, '#D8343A', true); this._bubble(ctx, 'me', m.x, m.y, now); } }); }
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
      const near = this.me && Math.hypot(this.me.x - h.x, this.me.y - h.y) < 60;
      // khi nhân vật đứng tại điểm, đẩy nhãn xuống dưới chân để không che người
      const sx = (h.x - this.cam.x) * z, sy = (h.y - this.cam.y) * z + (near ? 24 : h.small ? -18 : -34) * z;
      if (sx < -100 || sy < -40 || sx > this.vw + 100 || sy > this.vh + 40) continue;
      const txt = `${h.icon} ${h.label}`;
      const size = h.small ? 11 : 12;
      const w = label(ctx, txt, sx, sy, { size, color: h.small ? '#1B2A4E' : '#fff', bg: h.small ? 'rgba(255,255,255,.92)' : near ? '#D8343A' : 'rgba(27,42,78,.88)', weight: 700, pad: 6 });
      this.labelRects.push({ x: sx - w / 2, y: sy - size / 2 - 8, w, h: size + 16, h_: 0, h });
    }
    // chạm vào người khác
    for (const o of this.others.values()) {
      const sx = (o.x - this.cam.x) * z, sy = (o.y - this.cam.y) * z;
      this.labelRects.push({ x: sx - 16 * z, y: sy - 56 * z, w: 32 * z, h: 58 * z, player: o.data });
    }
  }

  subOf(p) {
    if (p.role === 'gv') return 'Thầy cô';
    if (p.role === 'em') return 'Em · THCS';
    if (p.role === 'khach') return p.school ? 'Bạn · ' + p.school : 'Bạn trường khác';
    return [p.khoa, p.lop].filter(Boolean).join(' · ');
  }

  _nameTag(ctx, x, y, name, sub, color, mine = false) {
    ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif';
    const w1 = ctx.measureText(name).width;
    ctx.font = '600 8px "Be Vietnam Pro", system-ui, sans-serif';
    const w2 = sub ? ctx.measureText(sub).width : 0;
    const w = Math.max(w1, w2) + 12, hgt = sub ? 25 : 15, top = y - 58 - hgt;
    ctx.fillStyle = mine ? '#D8343A' : 'rgba(255,255,255,.94)';
    rr(ctx, x - w / 2, top, w, hgt, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = mine ? '#fff' : color;
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
    rr(ctx, x - w / 2, y - 118, w, 24, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 94); ctx.lineTo(x + 5, y - 94); ctx.lineTo(x, y - 88); ctx.fill();
    ctx.fillStyle = '#1D2433'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let t = b.text; while (ctx.measureText(t).width > w - 14 && t.length > 1) t = t.slice(0, -2) + '…';
    ctx.fillText(t, x, y - 106);
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
    for (const t of TREES) items.push({ y: t.y, draw: () => drawTree(ctx, t, now) });
    items.push({ y: FLAG.y, draw: () => drawFlag(ctx, now) });
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
