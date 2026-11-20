// Vẽ nhân vật: đồng phục (sơ mi trắng, quần/váy xanh than, phù hiệu), áo dài, áo khoác trường, áo lớp, vest kỷ yếu…
export const SKINS = ['#FFE0C7', '#F6CDA8', '#E7B48A', '#C98E62', '#9C6A44'];
export const HAIR_COLORS = ['#1E1A18', '#4A2F21', '#7A4B2A', '#B7835A', '#5B5F6B'];
export const HAIR_NAMES = ['Ngắn', 'Mái bằng', 'Đuôi ngựa', 'Tóc dài', 'Đầu đinh', 'Hai bím', 'Tóc bob', 'Búi cao', 'Rẽ ngôi'];
export const BAG_COLORS = ['#2F6FB5', '#D8343A', '#2E8B57', '#F2B233'];
export const OUTFITS = [
  ['somi', 'Sơ mi trắng'], ['aodai', 'Áo dài trắng'], ['khoac', 'Áo khoác trường'],
  ['aolop', 'Áo lớp'], ['vest', 'Vest kỷ yếu'], ['phong', 'Áo phông'],
];
export const SHIRT_COLORS = ['#F2B233', '#2F6FB5', '#D8343A', '#2E8B57', '#7E57C2'];
const NAVY = '#26345C';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

function topColors(look) {
  switch (look.outfit) {
    case 'aodai': return { body: '#FFFFFF', arm: '#FFFFFF', line: 'rgba(30,40,60,.25)' };
    case 'khoac': return { body: NAVY, arm: NAVY, line: 'rgba(0,0,0,.25)' };
    case 'aolop': return { body: SHIRT_COLORS[look.color ?? 0], arm: SHIRT_COLORS[look.color ?? 0], line: 'rgba(0,0,0,.2)' };
    case 'vest': return { body: '#22252E', arm: '#22252E', line: 'rgba(0,0,0,.3)' };
    case 'phong': return { body: '#F4F4F2', arm: '#F4F4F2', line: 'rgba(30,40,60,.3)' };
    default: return { body: '#FFFFFF', arm: '#FFFFFF', line: 'rgba(30,40,60,.35)' };
  }
}

// (x, y) là điểm chân nhân vật. dir: 1 phải, -1 trái. t: thời gian (ms).
export function drawAvatar(ctx, x, y, look, { t = 0, moving = false, dir = 1, scale = 1, back = false, sit = false } = {}) {
  look = look || {};
  const skin = SKINS[look.skin ?? 1];
  const hairC = HAIR_COLORS[look.hairColor ?? 0];
  const top = topColors(look);
  const aodai = look.outfit === 'aodai';
  const pants = aodai ? '#FFFFFF' : NAVY;
  const step = moving ? Math.sin(t / 90) : 0;
  const bob = moving ? Math.abs(Math.sin(t / 90)) * 1.6 : Math.sin(t / 700) * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // bóng
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -bob);

  if (sit) {
    ctx.translate(0, 9);
    if (!back) {
      // cẳng chân thõng trước mặt ghế, đầu gối nhô ra
      ctx.fillStyle = aodai ? pants : skin; ctx.fillRect(-5.5, -9, 4, 6); ctx.fillRect(1.5, -9, 4, 6);
      ctx.fillStyle = '#2A2A2A'; rr(ctx, -7, -4, 6, 3, 1.5); ctx.fill(); rr(ctx, 1, -4, 6, 3, 1.5); ctx.fill();
      ctx.fillStyle = pants;
      if (look.bottom === 'vay' && !aodai) { rr(ctx, -9, -20, 18, 10, 4); ctx.fill(); } else { rr(ctx, -7, -19, 14, 10, 3); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-7, -11, 14, 2);
    } else {
      ctx.fillStyle = pants; rr(ctx, -8, -20, 16, 8, 3); ctx.fill();
    }
  } else {
    // chân
    const vay = look.bottom === 'vay' && !aodai;
    ctx.fillStyle = aodai ? pants : skin;
    const legY = vay ? -11 : -8;
    ctx.fillRect(-5 + step * 1.5, legY, 3.5, -legY);
    ctx.fillRect(1.5 - step * 1.5, legY, 3.5, -legY);
    // giày
    ctx.fillStyle = '#2A2A2A';
    rr(ctx, -6.5 + step * 1.5, -2.5, 6, 3, 1.5); ctx.fill();
    rr(ctx, 0.5 - step * 1.5, -2.5, 6, 3, 1.5); ctx.fill();
    // quần / váy
    ctx.fillStyle = pants;
    if (vay) {
      ctx.beginPath(); ctx.moveTo(-7, -20); ctx.lineTo(7, -20); ctx.lineTo(9.5, -10); ctx.lineTo(-9.5, -10); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(-6.5 + step * 1.5, -19, 6, 12);
      ctx.fillRect(0.5 - step * 1.5, -19, 6, 12);
    }
  }

  // cặp sách (sau lưng)
  if (!back && look.outfit !== 'vest' && !aodai) {
    ctx.fillStyle = BAG_COLORS[look.bag ?? 0];
    rr(ctx, dir > 0 ? -11 : 6, -31, 5, 12, 2); ctx.fill();
  }

  // thân áo
  ctx.fillStyle = top.body; ctx.strokeStyle = top.line; ctx.lineWidth = 1;
  if (aodai) {
    // áo dài: thân trên ôm, hai tà dài bay theo bước chân
    rr(ctx, -7.5, -33, 15, 15, 4); ctx.fill(); ctx.stroke();
    const sway = moving ? Math.sin(t / 90) * 1.5 : 0;
    ctx.beginPath(); ctx.moveTo(-6.5, -20); ctx.lineTo(6.5, -20); ctx.lineTo(5 + sway, sit ? -12 : -5); ctx.lineTo(-5 + sway, sit ? -12 : -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    rr(ctx, -8, -33, 16, 15, 4); ctx.fill(); ctx.stroke();
  }
  // tay
  const arm = moving ? Math.sin(t / 90) * 2 : 0;
  ctx.fillStyle = top.arm;
  rr(ctx, -11, -32 + arm, 4, 9, 2); ctx.fill(); ctx.stroke();
  rr(ctx, 7, -32 - arm, 4, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.fillRect(-10.5, -23.5 + arm, 3, 2.5);
  ctx.fillRect(7.5, -23.5 - arm, 3, 2.5);

  if (!back) {
    switch (look.outfit) {
      case 'vest':
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-3.5, -33); ctx.lineTo(0, -24); ctx.lineTo(3.5, -33); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#C62828'; ctx.beginPath(); ctx.moveTo(-1, -31); ctx.lineTo(1, -31); ctx.lineTo(1.5, -25); ctx.lineTo(0, -23.5); ctx.lineTo(-1.5, -25); ctx.closePath(); ctx.fill();
        break;
      case 'khoac':
        ctx.fillStyle = '#E8ECF3'; ctx.fillRect(-0.6, -32, 1.2, 13);
        ctx.fillStyle = '#F2B233'; ctx.beginPath(); ctx.arc(dir > 0 ? 4 : -4, -28, 1.8, 0, Math.PI * 2); ctx.fill();
        break;
      case 'aolop':
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '700 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CTN', 0, -24);
        break;
      case 'phong':
        ctx.fillStyle = '#D8343A'; ctx.beginPath(); ctx.arc(0, -26, 2.3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'aodai':
        ctx.strokeStyle = 'rgba(30,40,60,.25)'; ctx.beginPath(); ctx.moveTo(-2, -33); ctx.lineTo(3, -28); ctx.stroke();
        break;
      default:
        // sơ mi: cổ áo + phù hiệu
        ctx.fillStyle = '#E8ECF3';
        ctx.beginPath(); ctx.moveTo(-4, -33); ctx.lineTo(0, -29); ctx.lineTo(4, -33); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#D8343A';
        ctx.fillRect(dir > 0 ? 2 : -5, -29, 3, 3);
        if (look.gender === 'nu') { ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(-2, -31); ctx.lineTo(2, -31); ctx.lineTo(0, -28); ctx.fill(); }
    }
    if (look.scarf) {
      // khăn quàng đỏ
      ctx.fillStyle = '#D8343A';
      ctx.beginPath(); ctx.moveTo(-5, -33); ctx.lineTo(5, -33); ctx.lineTo(1.5, -30); ctx.lineTo(3, -24); ctx.lineTo(0, -26); ctx.lineTo(-3, -24); ctx.lineTo(-1.5, -30); ctx.closePath(); ctx.fill();
    }
  }

  // đầu
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -42, 9, 0, Math.PI * 2); ctx.fill();

  // tóc
  ctx.fillStyle = hairC;
  const hs = look.hair ?? 0;
  ctx.beginPath();
  if (back) {
    ctx.arc(0, -43, 9.6, 0, Math.PI * 2); ctx.fill();
    if (hs === 6) { rr(ctx, -10, -45, 20, 10, 4); ctx.fill(); }
  } else {
    if (hs === 4) { ctx.arc(0, -44, 9.4, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    else { ctx.arc(0, -44, 9.8, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    if (hs === 1) { ctx.fillRect(-9, -47, 18, 4); }
    if (hs === 0) { ctx.beginPath(); ctx.moveTo(-9, -45); ctx.quadraticCurveTo(-2, -40, 6, -46); ctx.lineTo(9, -46); ctx.lineTo(9, -50); ctx.closePath(); ctx.fill(); }
    if (hs === 8) { ctx.beginPath(); ctx.moveTo(-9.5, -44); ctx.quadraticCurveTo(-6, -38, -3, -47); ctx.lineTo(9.5, -46); ctx.lineTo(9, -51); ctx.closePath(); ctx.fill(); }
  }
  if (hs === 2) { ctx.beginPath(); ctx.ellipse(dir > 0 ? -10 : 10, -40, 3, 7, dir * 0.4, 0, Math.PI * 2); ctx.fill(); }
  if (hs === 3) { ctx.fillRect(-10, -45, 4, 17); ctx.fillRect(6, -45, 4, 17); }
  if (hs === 5) {
    ctx.fillRect(-10, -45, 3, 10); ctx.fillRect(7, -45, 3, 10);
    ctx.beginPath(); ctx.arc(-8.5, -34, 2.5, 0, Math.PI * 2); ctx.arc(8.5, -34, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  if (hs === 6) { ctx.fillRect(-10, -45, 4, 10); ctx.fillRect(6, -45, 4, 10); ctx.fillRect(-9, -47, 18, 3); }
  if (hs === 7) { ctx.beginPath(); ctx.arc(0, -53.5, 4.5, 0, Math.PI * 2); ctx.fill(); }

  if (!back) {
    // mắt, má, miệng
    ctx.fillStyle = '#1D2433';
    const ex = dir * 1.2;
    ctx.beginPath(); ctx.arc(-3.2 + ex, -41, 1.2, 0, Math.PI * 2); ctx.arc(3.2 + ex, -41, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(232,110,110,.45)';
    ctx.beginPath(); ctx.arc(-5.5 + ex, -38, 1.6, 0, Math.PI * 2); ctx.arc(5.5 + ex, -38, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8A3B2E'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ex, -38, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
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
  drawAvatar(ctx, size / 2, size * 0.92, look, { scale: size / 60 });
  return c;
}
