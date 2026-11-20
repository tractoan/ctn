// Vẽ nhân vật mặc đồng phục (áo sơ mi trắng, quần/váy xanh than, phù hiệu trường).
export const SKINS = ['#FFE0C7', '#F6CDA8', '#E7B48A', '#C98E62', '#9C6A44'];
export const HAIR_COLORS = ['#1E1A18', '#4A2F21', '#7A4B2A', '#B7835A', '#5B5F6B'];
export const HAIR_NAMES = ['Ngắn', 'Mái bằng', 'Buộc đuôi ngựa', 'Tóc dài', 'Đầu đinh', 'Hai bím'];
export const BAG_COLORS = ['#2F6FB5', '#D8343A', '#2E8B57', '#F2B233'];
const NAVY = '#26345C';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

// (x, y) là điểm chân nhân vật. dir: 1 phải, -1 trái. t: thời gian (ms).
export function drawAvatar(ctx, x, y, look, { t = 0, moving = false, dir = 1, scale = 1, back = false, sit = false } = {}) {
  look = look || {};
  const skin = SKINS[look.skin ?? 1];
  const hairC = HAIR_COLORS[look.hairColor ?? 0];
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
    // ngồi: đùi gập ra trước, chân thõng xuống, thân hạ thấp
    ctx.translate(0, 9);
    if (!back) {
      // cẳng chân thõng trước mặt ghế, đầu gối nhô ra
      ctx.fillStyle = skin; ctx.fillRect(-5.5, -9, 4, 6); ctx.fillRect(1.5, -9, 4, 6);
      ctx.fillStyle = '#2A2A2A'; rr(ctx, -7, -4, 6, 3, 1.5); ctx.fill(); rr(ctx, 1, -4, 6, 3, 1.5); ctx.fill();
      ctx.fillStyle = NAVY;
      if (look.bottom === 'vay') { rr(ctx, -9, -20, 18, 10, 4); ctx.fill(); } else { rr(ctx, -7, -19, 14, 10, 3); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-7, -11, 14, 2);
    } else {
      ctx.fillStyle = NAVY; rr(ctx, -8, -20, 16, 8, 3); ctx.fill();
    }
  }
  if (!sit) {
  // chân
  ctx.fillStyle = skin;
  const legY = look.bottom === 'vay' ? -11 : -8;
  ctx.fillRect(-5 + step * 1.5, legY, 3.5, 8 - (legY + 8) + 0);
  ctx.fillRect(1.5 - step * 1.5, legY, 3.5, 8 - (legY + 8) + 0);
  // giày
  ctx.fillStyle = '#2A2A2A';
  rr(ctx, -6.5 + step * 1.5, -2.5, 6, 3, 1.5); ctx.fill();
  rr(ctx, 0.5 - step * 1.5, -2.5, 6, 3, 1.5); ctx.fill();

  // quần / váy
  ctx.fillStyle = NAVY;
  if (look.bottom === 'vay') {
    ctx.beginPath(); ctx.moveTo(-7, -20); ctx.lineTo(7, -20); ctx.lineTo(9.5, -10); ctx.lineTo(-9.5, -10); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillRect(-6.5 + step * 1.5, -19, 6, 12);
    ctx.fillRect(0.5 - step * 1.5, -19, 6, 12);
  }
  }

  // cặp sách (sau lưng)
  if (!back) {
    ctx.fillStyle = BAG_COLORS[look.bag ?? 0];
    rr(ctx, dir > 0 ? -11 : 6, -31, 5, 12, 2); ctx.fill();
  }

  // áo sơ mi trắng
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = 'rgba(30,40,60,.35)';
  ctx.lineWidth = 1;
  rr(ctx, -8, -33, 16, 15, 4); ctx.fill(); ctx.stroke();
  // tay
  const arm = moving ? Math.sin(t / 90) * 2 : 0;
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, -11, -32 + arm, 4, 9, 2); ctx.fill(); ctx.stroke();
  rr(ctx, 7, -32 - arm, 4, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.fillRect(-10.5, -23.5 + arm, 3, 2.5);
  ctx.fillRect(7.5, -23.5 - arm, 3, 2.5);
  if (!back) {
    // cổ áo + phù hiệu
    ctx.fillStyle = '#E8ECF3';
    ctx.beginPath(); ctx.moveTo(-4, -33); ctx.lineTo(0, -29); ctx.lineTo(4, -33); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#D8343A';
    ctx.fillRect(dir > 0 ? 2 : -5, -29, 3, 3);
    if (look.gender === 'nu') { ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(-2, -31); ctx.lineTo(2, -31); ctx.lineTo(0, -28); ctx.fill(); }
  }

  // đầu
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -42, 9, 0, Math.PI * 2); ctx.fill();

  // tóc
  ctx.fillStyle = hairC;
  const h = look.hair ?? 0;
  ctx.beginPath();
  if (back) {
    ctx.arc(0, -43, 9.6, 0, Math.PI * 2); ctx.fill();
  } else {
    if (h === 4) { ctx.arc(0, -44, 9.4, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    else { ctx.arc(0, -44, 9.8, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    if (h === 1) { ctx.fillRect(-9, -47, 18, 4); }
    if (h === 0) { ctx.beginPath(); ctx.moveTo(-9, -45); ctx.quadraticCurveTo(-2, -40, 6, -46); ctx.lineTo(9, -46); ctx.lineTo(9, -50); ctx.closePath(); ctx.fill(); }
  }
  if (h === 2) { ctx.beginPath(); ctx.ellipse(dir > 0 ? -10 : 10, -40, 3, 7, dir * 0.4, 0, Math.PI * 2); ctx.fill(); }
  if (h === 3) { ctx.fillRect(-10, -45, 4, 17); ctx.fillRect(6, -45, 4, 17); }
  if (h === 5) {
    ctx.fillRect(-10, -45, 3, 10); ctx.fillRect(7, -45, 3, 10);
    ctx.beginPath(); ctx.arc(-8.5, -34, 2.5, 0, Math.PI * 2); ctx.arc(8.5, -34, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  if (!back) {
    // mắt, miệng
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
