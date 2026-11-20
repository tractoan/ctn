// Vẽ nhân vật kiểu chibi (đầu to, mắt tròn, má hồng): 13 kiểu tóc, 8 màu tóc, đồng phục và trang phục theo vai.
// Ngoại hình phiên bản 2 (`look.v = 2`); nhân vật tạo trước đó được tự chuyển bằng normLook().

export const SKINS = ['#FBDDC2', '#F1C39B', '#D9A066', '#B97C4E', '#8E5C3A'];
export const HAIR_NAMES = ['Ngắn', 'Rẽ ngôi', 'Tóc bob', 'Đuôi ngựa', 'Tóc dài', 'Búi cao', 'Rẽ ngôi 3/7', 'Đan Trường', 'Mullet', 'Undercut', 'Short quiff', 'Layer', 'Hai bím'];
// Kiểu tóc chỉ dành cho nữ (đổi sang nam thì về "Ngắn")
export const GIRL_HAIR = [2, 3, 4, 5, 11, 12];
export const HAIR_COLORS = ['#1F1A17', '#4A3426', '#6E6E6E', '#D0D0D0', '#B23A2E', '#6E4AA0', 'balayage', '#D9772B'];
export const HAIR_COLOR_NAMES = ['Đen', 'Nâu', 'Xám', 'Bạc', 'Đỏ', 'Tím', 'Balayage', 'Cam'];
export const HAIR_SWATCH = (i) => HAIR_COLORS[i] === 'balayage' ? 'linear-gradient(180deg,#3B2A20,#7A5232 45%,#E3B26A)' : HAIR_COLORS[i];
export const SHIRT_COLORS = ['#F2B233', '#2F6FB5', '#D8343A', '#2E8B57', '#7E57C2', '#5BA8E8'];

// Tên trang phục (mã → tên hiển thị)
export const OUTFIT_NAMES = {
  somi: 'Sơ mi cà vạt', somitrang: 'Sơ mi trắng', somixanh: 'Sơ mi xanh', somivang: 'Sơ mi vàng',
  khoac: 'Áo khoác trường', aolop: 'Áo lớp', vest: 'Vest kỷ yếu', phong: 'Áo phông', khanquang: 'Khăn quàng đỏ',
  aodai: 'Áo dài trắng', aodaitim: 'Áo dài tím', aodaihong: 'Áo dài hồng', aodaixanh: 'Áo dài xanh', aodaido: 'Áo dài đỏ',
  teew: 'Áo Tôi yêu CTN trắng 🤍', teeb: 'Áo Tôi yêu CTN đen 🖤',
};
// Tên trang phục theo vai (học sinh: áo dài / vest "kỷ yếu"; khách: "Vest")
export function outfitLabel(role, id) {
  if ((role === 'cuuhs' || role === 'hs') && id === 'aodai') return 'Áo dài kỷ yếu';
  if (role !== 'cuuhs' && role !== 'hs' && id === 'vest') return 'Vest';
  if (role === 'khach' && id === 'khoac') return 'Áo khoác';
  return OUTFIT_NAMES[id] || id;
}
// Trang phục được chọn theo vai và giới tính
export function outfitsFor(role, look) {
  const nu = look.gender === 'nu';
  const tees = ['teew', 'teeb'];
  if (role === 'cuuhs' || role === 'hs') return ['somi', 'khoac', 'aolop', nu ? 'aodai' : 'vest', ...tees];
  if (role === 'gv') return nu ? ['somitrang', 'somixanh', 'somivang', 'aodaitim', 'aodaihong', 'aodaixanh', 'aodaido', ...tees] : ['somitrang', 'somixanh', 'somivang', 'vest', ...tees];
  if (role === 'em') return ['khanquang', ...tees];
  return ['somitrang', 'khoac', 'phong', nu ? 'aodai' : 'vest', ...tees];
}

// Chuyển ngoại hình cũ (9 kiểu tóc, 5 màu tóc) sang phiên bản 2
const OLD_HAIR = [0, 0, 3, 4, 9, 12, 2, 5, 1];
const OLD_HAIR_COLOR = [0, 1, 1, 6, 2];
export function normLook(l) {
  l = l || {};
  if (l.v === 2) return l;
  return { ...l, v: 2, hair: OLD_HAIR[l.hair ?? 0] ?? 0, hairColor: OLD_HAIR_COLOR[l.hairColor ?? 0] ?? 0 };
}

// Ngoại hình ngẫu nhiên hợp với vai
export function randomLook(role, gender) {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const g = gender || pick(['nam', 'nu']);
  const look = {
    v: 2, gender: g, skin: Math.floor(Math.random() * 3),
    hair: pick(g === 'nu' ? [1, 2, 3, 4, 5, 6, 7, 11, 12] : [0, 1, 6, 7, 8, 9, 10]),
    hairColor: Math.random() < 0.8 ? Math.floor(Math.random() * 2) : pick([2, 4, 5, 6, 7]),
    bottom: g === 'nu' && Math.random() < 0.5 ? 'vay' : 'quan', color: Math.floor(Math.random() * SHIRT_COLORS.length),
  };
  look.outfit = outfitsFor(role, look)[0];
  return look;
}

const NAVY = '#1E2A55';
const AODAI = { aodai: '#FFFFFF', aodaitim: '#8E6BBF', aodaihong: '#F08DB4', aodaixanh: '#5BA8E8', aodaido: '#D8343A' };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}
const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

function clothes(look) {
  const o = look.outfit;
  if (AODAI[o]) return { top: AODAI[o], line: o === 'aodai' ? '#C9D3E1' : 'rgba(0,0,0,.18)', pants: '#F7F7F5', aodai: true };
  switch (o) {
    case 'khoac': return { top: '#2F6FB5', line: '#255C98', pants: NAVY };
    case 'aolop': return { top: SHIRT_COLORS[look.color ?? 0] || SHIRT_COLORS[0], line: 'rgba(0,0,0,.15)', pants: NAVY };
    case 'vest': return { top: '#2A2D36', line: '#1A1C22', pants: '#2A2D36' };
    case 'teew': return { top: '#FFFFFF', line: '#C9D3E1', pants: '#4A6FA5' };
    case 'teeb': return { top: '#23262F', line: '#14161C', pants: '#4A6FA5' };
    case 'somixanh': return { top: '#CFE3F6', line: '#A9C4DE', pants: NAVY };
    case 'somivang': return { top: '#F7E7A8', line: '#DCC778', pants: NAVY };
    case 'phong': return { top: '#FFFFFF', line: '#C9D3E1', pants: NAVY };
    default: return { top: '#FFFFFF', line: '#C9D3E1', pants: NAVY };
  }
}

// Tô tóc: màu đơn hoặc balayage (đậm ở chân tóc, vàng ở ngọn)
function hairFill(ctx, look) {
  const c = HAIR_COLORS[look.hairColor ?? 0] || HAIR_COLORS[0];
  if (c !== 'balayage') return c;
  const g = ctx.createLinearGradient(0, -54, 0, -14);
  g.addColorStop(0, '#3B2A20'); g.addColorStop(0.45, '#7A5232'); g.addColorStop(1, '#E3B26A');
  return g;
}

const HY = -39; // tâm đầu
const HR = 11.5; // bán kính đầu
const CAP = 12.4; // bán kính mũ tóc

// Mũ tóc (nửa trên đầu) với đường mái ở độ cao yF
function cap(ctx, yF, left = -CAP, right = CAP) {
  ctx.beginPath();
  ctx.arc(0, HY - 1, CAP, Math.PI, 0);
  ctx.lineTo(right, yF); ctx.lineTo(left, yF); ctx.closePath(); ctx.fill();
}

// Phần tóc nằm SAU đầu và thân (tóc dài, đuôi ngựa, mullet, bím…)
function hairBehind(ctx, hs, back, dir) {
  if (hs === 4) { rr(ctx, -13.5, HY - 9, 27, back ? 33 : 31, 7); ctx.fill(); }
  if (hs === 11) { rr(ctx, -13, HY - 8, 26, 22, 6); ctx.fill(); }
  if (hs === 2) { rr(ctx, -13.2, HY - 8, 26.4, 15, 5); ctx.fill(); }
  if (hs === 8) { rr(ctx, -12, HY - 4, 24, 15, 5); ctx.fill(); }
  if (hs === 3 && !back) {
    ctx.beginPath(); ctx.ellipse(dir > 0 ? -13 : 13, HY + 1, 3.6, 8, dir > 0 ? 0.35 : -0.35, 0, Math.PI * 2); ctx.fill();
  }
}

function hairFront(ctx, hs, dir) {
  const s = dir; // lệch theo hướng nhìn
  switch (hs) {
    case 0: // Ngắn
      cap(ctx, HY - 4);
      rr(ctx, -12.4, HY - 6, 3.2, 6, 1.5); ctx.fill(); rr(ctx, 9.2, HY - 6, 3.2, 6, 1.5); ctx.fill();
      break;
    case 1: // Rẽ ngôi: mái chéo một bên
      cap(ctx, HY - 5);
      ctx.beginPath(); ctx.moveTo(-12.4, HY - 5); ctx.quadraticCurveTo(-4 * s, HY - 1, 8 * s, HY - 3); ctx.lineTo(12.4 * s, HY - 6); ctx.lineTo(0, HY - 9); ctx.closePath(); ctx.fill();
      break;
    case 2: // Tóc bob: mái bằng + hai bên tới cằm
      cap(ctx, HY - 4);
      rr(ctx, -13.2, HY - 6, 4.6, 14, 2.5); ctx.fill(); rr(ctx, 8.6, HY - 6, 4.6, 14, 2.5); ctx.fill();
      break;
    case 3: // Đuôi ngựa
      cap(ctx, HY - 4.5);
      ctx.fillStyle = '#E25A6B'; circle(ctx, (dir > 0 ? -11 : 11), HY - 4, 1.6);
      break;
    case 4: // Tóc dài: hai dải ôm mặt
      cap(ctx, HY - 4);
      rr(ctx, -13.5, HY - 6, 4.2, 23, 2.2); ctx.fill(); rr(ctx, 9.3, HY - 6, 4.2, 23, 2.2); ctx.fill();
      break;
    case 5: // Búi cao
      cap(ctx, HY - 4.5);
      circle(ctx, 0, HY - 15, 4.6);
      break;
    case 6: { // Rẽ ngôi 3/7: hai mảng mái lệch + sợi tóc dựng
      cap(ctx, HY - 6);
      const px = -3.5 * s;
      ctx.beginPath(); ctx.moveTo(px, HY - 11); ctx.quadraticCurveTo(px + 6 * s, HY - 5, 12.4 * s, HY - 2); ctx.lineTo(12.4 * s, HY - 7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px, HY - 11); ctx.quadraticCurveTo(px - 3 * s, HY - 6, -12.4 * s, HY - 4); ctx.lineTo(-12.4 * s, HY - 7); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath(); ctx.moveTo(-2 * s, HY - 13); ctx.quadraticCurveTo(-4 * s, HY - 17, -1 * s, HY - 18); ctx.stroke(); ctx.lineCap = 'butt';
      break;
    }
    case 7: // Đan Trường: rẽ ngôi giữa, mái rèm hai bên
      cap(ctx, HY - 7);
      ctx.beginPath(); ctx.moveTo(0, HY - 10); ctx.quadraticCurveTo(-5, HY - 7, -9, HY - 1); ctx.lineTo(-12.4, HY - 2); ctx.lineTo(-12.4, HY - 8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, HY - 10); ctx.quadraticCurveTo(5, HY - 7, 9, HY - 1); ctx.lineTo(12.4, HY - 2); ctx.lineTo(12.4, HY - 8); ctx.closePath(); ctx.fill();
      break;
    case 8: // Mullet: mái lởm chởm, gáy dài
      cap(ctx, HY - 5);
      ctx.beginPath(); ctx.moveTo(-10, HY - 5);
      for (let i = 0; i < 5; i++) { ctx.lineTo(-8 + i * 4, HY - 2); ctx.lineTo(-6 + i * 4, HY - 5); }
      ctx.closePath(); ctx.fill();
      break;
    case 9: // Undercut: hai bên cạo, phần trên vuốt sang một bên
      ctx.globalAlpha = 0.45; rr(ctx, -12.2, HY - 8, 3.5, 7, 2); ctx.fill(); rr(ctx, 8.7, HY - 8, 3.5, 7, 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, HY - 2, 12, Math.PI * 1.12, Math.PI * 1.88); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2 * s, HY - 10.5, 10.5, 4.6, 0.12 * s, 0, Math.PI * 2); ctx.fill();
      break;
    case 10: // Short quiff: mái dựng cao phía trước
      cap(ctx, HY - 6);
      ctx.beginPath(); ctx.ellipse(-1.5 * s, HY - 13, 8.5, 4.6, -0.35 * s, 0, Math.PI * 2); ctx.fill();
      break;
    case 11: // Layer: tóc tỉa nhiều tầng, đuôi lởm chởm
      cap(ctx, HY - 4);
      ctx.beginPath(); ctx.moveTo(-13, HY - 6); ctx.lineTo(-13, HY + 10); ctx.lineTo(-11, HY + 6); ctx.lineTo(-10, HY + 11); ctx.lineTo(-8.8, HY - 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(13, HY - 6); ctx.lineTo(13, HY + 10); ctx.lineTo(11, HY + 6); ctx.lineTo(10, HY + 11); ctx.lineTo(8.8, HY - 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-9, HY - 5); for (let i = 0; i < 4; i++) { ctx.lineTo(-6.5 + i * 4.5, HY - 2.5); ctx.lineTo(-4.5 + i * 4.5, HY - 5); } ctx.closePath(); ctx.fill();
      break;
    case 12: { // Hai bím
      cap(ctx, HY - 4);
      for (const x of [-12, 12]) { for (let k = 0; k < 4; k++) circle(ctx, x + (x > 0 ? 0.5 : -0.5) * k, HY + 1 + k * 4.2, 2.6 - k * 0.15); }
      const f = ctx.fillStyle; ctx.fillStyle = '#E25A6B'; circle(ctx, -12.5, HY + 15, 1.5); circle(ctx, 13.5, HY + 15, 1.5); ctx.fillStyle = f;
      break;
    }
    default: cap(ctx, HY - 4);
  }
}

// Tóc nhìn từ phía sau
function hairBack(ctx, hs) {
  circle(ctx, 0, HY - 0.5, CAP);
  if (hs === 3) { ctx.beginPath(); ctx.ellipse(0, HY + 9, 3.6, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  if (hs === 5) circle(ctx, 0, HY - 15, 4.6);
  if (hs === 12) for (const x of [-6, 6]) for (let k = 0; k < 4; k++) circle(ctx, x, HY + 9 + k * 4, 2.4);
  if (hs === 10) { ctx.beginPath(); ctx.ellipse(0, HY - 11, 8.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); }
}

function drawTop(ctx, look, c, dir, back, t, moving) {
  const o = look.outfit;
  ctx.fillStyle = c.top; ctx.strokeStyle = c.line; ctx.lineWidth = 1.2;
  // thân áo
  rr(ctx, -9, -28.5, 18, 15.5, 5); ctx.fill(); ctx.stroke();
  if (c.aodai) {
    // hai tà áo dài phủ xuống ống quần
    const sway = moving ? Math.sin(t / 90) * 1.4 : 0;
    ctx.beginPath(); ctx.moveTo(-7.5, -15); ctx.lineTo(7.5, -15); ctx.lineTo(6.2 + sway, -4.5); ctx.lineTo(-6.2 + sway, -4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (back) return;
  switch (o) {
    case 'somi': case 'somitrang': case 'somixanh': case 'somivang': case 'khanquang':
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = c.line; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-5, -28.3); ctx.lineTo(0, -25); ctx.lineTo(-1.5, -23.5); ctx.lineTo(-5.5, -26.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -28.3); ctx.lineTo(0, -25); ctx.lineTo(1.5, -23.5); ctx.lineTo(5.5, -26.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (o === 'somi') {
        ctx.fillStyle = NAVY;
        ctx.beginPath(); ctx.moveTo(-1.6, -25.5); ctx.lineTo(1.6, -25.5); ctx.lineTo(1, -23.5); ctx.lineTo(-1, -23.5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1, -23.6); ctx.lineTo(1, -23.6); ctx.lineTo(1.9, -17); ctx.lineTo(0, -15); ctx.lineTo(-1.9, -17); ctx.closePath(); ctx.fill();
      } else if (o !== 'khanquang') {
        ctx.fillStyle = '#D8343A'; rr(ctx, dir > 0 ? 3 : -6, -23, 3, 3.4, 0.8); ctx.fill(); // phù hiệu
      }
      break;
    case 'khoac':
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-0.5, -27.5, 1, 14);
      ctx.fillStyle = '#FFFFFF'; circle(ctx, dir > 0 ? 4.5 : -4.5, -22.5, 2.2);
      ctx.fillStyle = '#2F6FB5'; circle(ctx, dir > 0 ? 4.5 : -4.5, -22.5, 0.9);
      break;
    case 'aolop':
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '800 4.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CTN', 0, -20.5);
      ctx.fillStyle = '#FFFFFF'; circle(ctx, dir > 0 ? 4.5 : -4.5, -24.5, 1.3);
      break;
    case 'vest':
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-4, -28.3); ctx.lineTo(0, -19); ctx.lineTo(4, -28.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#C62828'; ctx.beginPath(); ctx.moveTo(-1, -27); ctx.lineTo(1, -27); ctx.lineTo(1.5, -21.5); ctx.lineTo(0, -20); ctx.lineTo(-1.5, -21.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#F2B233'; circle(ctx, dir > 0 ? 5 : -5, -23, 0.9);
      break;
    case 'teew': case 'teeb': case 'phong':
      ctx.strokeStyle = o === 'teeb' ? '#4A4F5C' : c.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, -28.5, 3, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
      if (o !== 'phong') {
        ctx.fillStyle = '#E5383F';
        ctx.beginPath(); ctx.moveTo(0, -18.8); ctx.bezierCurveTo(-4.4, -21.6, -2.8, -25.6, 0, -23.4); ctx.bezierCurveTo(2.8, -25.6, 4.4, -21.6, 0, -18.8); ctx.fill();
        ctx.fillStyle = o === 'teeb' ? '#FFFFFF' : '#1B2A4E'; ctx.font = '800 3.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CTN', 0, -16);
      }
      break;
    default: // áo dài: đường xẻ cổ
      if (c.aodai) { ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-1.5, -28.3); ctx.lineTo(4, -23); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,.15)'; circle(ctx, 3, -24, 0.6); circle(ctx, 4.5, -21.5, 0.6); }
  }
  if (look.scarf || o === 'khanquang') {
    ctx.fillStyle = '#D8343A';
    ctx.beginPath(); ctx.moveTo(-6, -28.5); ctx.lineTo(6, -28.5); ctx.lineTo(1.8, -25); ctx.lineTo(3.4, -18.5); ctx.lineTo(0, -21); ctx.lineTo(-3.4, -18.5); ctx.lineTo(-1.8, -25); ctx.closePath(); ctx.fill();
  }
}

// (x, y) là điểm chân nhân vật. dir: 1 phải, -1 trái. t: thời gian (ms).
export function drawAvatar(ctx, x, y, look, { t = 0, moving = false, dir = 1, scale = 1, back = false, sit = false } = {}) {
  look = normLook(look);
  const skin = SKINS[look.skin ?? 1] || SKINS[1];
  const c = clothes(look);
  const vay = look.bottom === 'vay' && !c.aodai;
  const hs = look.hair ?? 0;
  const step = moving ? Math.sin(t / 90) : 0;
  const bob = moving ? Math.abs(Math.sin(t / 90)) * 1.6 : Math.sin(t / 700) * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // bóng
  ctx.fillStyle = 'rgba(20,30,50,.18)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -bob);

  if (sit) ctx.translate(0, 8);
  // tóc phía sau (vẽ trước thân)
  ctx.fillStyle = hairFill(ctx, look);
  if (!back) hairBehind(ctx, hs, false, dir);

  // chân / quần / váy
  if (sit) {
    if (!back) {
      ctx.fillStyle = vay ? skin : c.pants;
      rr(ctx, -6, -11, 5, 8, 2.2); ctx.fill(); rr(ctx, 1, -11, 5, 8, 2.2); ctx.fill();
      ctx.fillStyle = '#2A2A2A'; rr(ctx, -7, -4, 6.5, 3.4, 1.7); ctx.fill(); rr(ctx, 0.5, -4, 6.5, 3.4, 1.7); ctx.fill();
      ctx.fillStyle = vay ? NAVY : c.pants; rr(ctx, vay ? -10 : -8, -17, vay ? 20 : 16, 7.5, 3.5); ctx.fill();
    } else {
      ctx.fillStyle = vay ? NAVY : c.pants; rr(ctx, -8.5, -16, 17, 6, 3); ctx.fill();
    }
  } else {
    const l1 = step * 1.6, l2 = -step * 1.6;
    if (vay) {
      ctx.fillStyle = skin; rr(ctx, -5.5 + l1, -10, 4.5, 8, 2); ctx.fill(); rr(ctx, 1 + l2, -10, 4.5, 8, 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-5.5 + l1, -5, 4.5, 2.2); ctx.fillRect(1 + l2, -5, 4.5, 2.2);
    } else {
      ctx.fillStyle = c.pants; rr(ctx, -6 + l1, -15, 5.4, 12.5, 2.4); ctx.fill(); rr(ctx, 0.6 + l2, -15, 5.4, 12.5, 2.4); ctx.fill();
      if (c.pants === '#F7F7F5') { ctx.strokeStyle = '#D5D9E0'; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    ctx.fillStyle = '#2A2A2A';
    rr(ctx, -7 + l1, -3.5, 7, 3.6, 1.8); ctx.fill(); rr(ctx, 0 + l2, -3.5, 7, 3.6, 1.8); ctx.fill();
    if (vay) {
      ctx.fillStyle = NAVY;
      ctx.beginPath(); ctx.moveTo(-8, -15.5); ctx.lineTo(8, -15.5); ctx.lineTo(11, -8.5); ctx.lineTo(-11, -8.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-3, -15.5, 1, 7); ctx.fillRect(3, -15.5, 1, 7);
    }
  }

  // tay (sau thân khi đi để có nhịp lắc)
  const arm = moving ? Math.sin(t / 90) * 2.2 : 0;
  ctx.fillStyle = c.top; ctx.strokeStyle = c.line; ctx.lineWidth = 1.1;
  rr(ctx, -12, -27.5 + arm, 5, 7.5, 2.5); ctx.fill(); ctx.stroke();
  rr(ctx, 7, -27.5 - arm, 5, 7.5, 2.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin; circle(ctx, -10.5, -18.5 + arm, 2.7); circle(ctx, 10.5, -18.5 - arm, 2.7);

  drawTop(ctx, look, c, dir, back, t, moving);

  // đầu
  ctx.fillStyle = skin;
  if (!back) { circle(ctx, -HR + 0.3, HY + 1, 2.2); circle(ctx, HR - 0.3, HY + 1, 2.2); }
  circle(ctx, 0, HY, HR);

  ctx.fillStyle = hairFill(ctx, look);
  if (back) {
    hairBack(ctx, hs);
    if (hs === 4 || hs === 11 || hs === 2 || hs === 8) { rr(ctx, -12.4, HY - 2, 24.8, hs === 4 ? 26 : hs === 11 ? 18 : hs === 2 ? 11 : 13, 6); ctx.fill(); }
  } else {
    const ex = dir * 0.8;
    // mắt
    ctx.fillStyle = '#2A2730';
    ctx.beginPath(); ctx.ellipse(-4 + ex, HY + 0.5, 1.75, 2.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4 + ex, HY + 0.5, 1.75, 2.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(ctx, -3.4 + ex, HY - 0.4, 0.55); circle(ctx, 4.6 + ex, HY - 0.4, 0.55);
    if (look.gender === 'nu') {
      ctx.strokeStyle = '#2A2730'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-5.5 + ex, HY - 0.4); ctx.lineTo(-7 + ex, HY - 1.3); ctx.moveTo(5.5 + ex, HY - 0.4); ctx.lineTo(7 + ex, HY - 1.3); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    // má hồng, miệng
    ctx.fillStyle = 'rgba(240,120,120,.42)';
    ctx.beginPath(); ctx.ellipse(-6.9 + ex, HY + 4.2, 2.3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6.9 + ex, HY + 4.2, 2.3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7A3B2E'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ex, HY + 3.6, 2.2, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = hairFill(ctx, look);
    hairFront(ctx, hs, dir >= 0 ? 1 : -1);
  }
  ctx.restore();
}

// Ảnh đại diện nhỏ (canvas) cho danh sách, xem trước.
export function avatarCanvas(look, size = 96) {
  const c = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = size * dpr; c.height = size * dpr;
  c.style.width = size + 'px'; c.style.height = size + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  drawAvatar(ctx, size / 2, size * 0.94, look, { scale: size / 64 });
  return c;
}

// Xem trước có hoạt ảnh (đứng thở nhẹ) – trả về { el, set(look), stop() }
export function avatarStage(look, size = 150) {
  const c = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = size * dpr; c.height = size * dpr;
  c.style.width = size + 'px'; c.style.height = size + 'px';
  const ctx = c.getContext('2d');
  let cur = look, raf = 0, n = 0;
  const frame = (now) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    drawAvatar(ctx, size / 2, size * 0.94, cur, { t: now, scale: size / 64 });
    // dừng khi canvas đã bị gỡ khỏi trang (đóng bảng)
    raf = c.isConnected || ++n < 30 ? requestAnimationFrame(frame) : 0;
  };
  raf = requestAnimationFrame(frame);
  return { el: c, set(l) { cur = l; }, stop() { cancelAnimationFrame(raf); } };
}
