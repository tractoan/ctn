// Cảnh LỚP HỌC: mỗi lớp chuyên là một phòng có bảng đen, bục giảng, bàn giáo viên, bàn ghế học sinh.
// Người đang ở cùng một lớp (mọi khóa) nhìn thấy nhau. Ngồi được vào ghế.
import { rr, label } from './world.js';

const W = 960, H = 740;
const DESK = { w: 160, h: 30 };
const COLS = [110, 400, 690];
const ROWS = [250, 350, 450, 550];

export function classroomScene(lop) {
  const solids = [
    { x: 0, y: 0, w: W, h: 96 }, // tường trên (bảng đen)
    { x: 0, y: 0, w: 24, h: H },
    { x: W - 24, y: 0, w: 24, h: H },
    { x: 0, y: H - 30, w: 420, h: 30 },
    { x: 540, y: H - 30, w: W - 540, h: 30 },
    { x: 700, y: 118, w: 140, h: 46 }, // bàn giáo viên
    { x: 30, y: 600, w: 70, h: 90 }, // tủ sách
  ];
  const seats = [];
  for (const y of ROWS) for (const x of COLS) {
    solids.push({ x, y, w: DESK.w, h: DESK.h });
    seats.push({ x: x + 42, y: y + 58, dir: 1, back: true }, { x: x + 118, y: y + 58, dir: -1, back: true });
  }

  const hotspots = [
    { id: 'c-board', x: 300, y: 150, icon: '❓', label: 'Bảng đen · Đố vui', panel: 'class', lop, tab: 2 },
    { id: 'c-desk', x: 770, y: 190, icon: '📋', label: 'Sổ đầu bài', panel: 'class', lop, tab: 1 },
    { id: 'c-book', x: 130, y: 650, icon: '📒', label: 'Lưu bút lớp', panel: 'class', lop, tab: 0 },
    { id: 'c-exit', x: 480, y: 690, icon: '🚪', label: 'Ra khỏi lớp', panel: 'exitClass' },
  ];

  return {
    id: 'lop:' + lop, lop, w: W, h: H, bgColor: '#3A3027', solids, seats, hotspots,
    spawn: { x: 480, y: 660 },
    fit: true,
    name: 'Lớp chuyên ' + lop,
    drawBg(ctx) {
      // sàn gạch hoa
      for (let y = 96; y < H; y += 40) for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = (x / 40 + y / 40) % 2 ? '#E9DFC8' : '#DCCFB2'; ctx.fillRect(x, y, 40, 40);
      }
      // tường + bảng đen
      ctx.fillStyle = '#F2E6B8'; ctx.fillRect(0, 0, W, 96);
      ctx.fillStyle = '#C9B98A'; ctx.fillRect(0, 90, W, 6);
      ctx.fillStyle = '#6B4A2E'; ctx.fillRect(266, 10, 428, 74);
      ctx.fillStyle = '#244A35'; ctx.fillRect(272, 15, 416, 64);
      const d = new Date();
      const thu = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
      label(ctx, `${thu}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`, 480, 30, { size: 10, color: 'rgba(255,255,255,.85)', weight: 600 });
      label(ctx, 'LỚP CHUYÊN ' + lop.toUpperCase(), 480, 52, { size: 18, color: '#fff', weight: 800 });
      label(ctx, 'Tiết học: Ôn lại kỷ niệm', 480, 70, { size: 9, color: 'rgba(255,255,255,.75)', weight: 600 });
      // khẩu hiệu hai bên bảng
      ctx.fillStyle = '#C62828'; ctx.fillRect(40, 22, 190, 34); ctx.fillRect(730, 22, 190, 34);
      label(ctx, 'TIÊN HỌC LỄ', 135, 39, { size: 12, color: '#FFE08A', weight: 800 });
      label(ctx, 'HẬU HỌC VĂN', 825, 39, { size: 12, color: '#FFE08A', weight: 800 });
      // cửa sổ hai bên tường
      for (const y of [180, 330, 480]) {
        ctx.fillStyle = '#9CC9E8'; ctx.fillRect(4, y, 16, 90); ctx.fillRect(W - 20, y, 16, 90);
        ctx.fillStyle = '#6B4A2E'; ctx.fillRect(4, y + 44, 16, 3); ctx.fillRect(W - 20, y + 44, 16, 3);
      }
      ctx.fillStyle = '#E8DAB0'; ctx.fillRect(0, 96, 24, H); ctx.fillRect(W - 24, 96, 24, H);
      // bục giảng
      ctx.fillStyle = '#B88A5A'; ctx.fillRect(250, 96, 460, 40);
      ctx.fillStyle = '#9A7046'; ctx.fillRect(250, 132, 460, 6);
      // tường dưới + cửa ra
      ctx.fillStyle = '#E8DAB0'; ctx.fillRect(0, H - 30, 420, 30); ctx.fillRect(540, H - 30, W - 540, 30);
      ctx.fillStyle = '#7A4B2A'; ctx.fillRect(420, H - 8, 120, 8);
    },
    statics(ctx) {
      const items = [];
      for (const y of ROWS) for (const x of COLS) {
        items.push({ y: y + DESK.h, draw: () => drawDesk(ctx, x, y) });
        items.push({ y: y + 50, draw: () => drawBench(ctx, x, y + 50) });
      }
      items.push({ y: 164, draw: () => drawTeacherDesk(ctx) });
      items.push({ y: 690, draw: () => drawShelf(ctx) });
      return items;
    },
  };
}

function drawDesk(ctx, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 4, y + 6, DESK.w, DESK.h);
  ctx.fillStyle = '#B07A45'; rr(ctx, x, y, DESK.w, DESK.h, 3); ctx.fill();
  ctx.fillStyle = '#C8925A'; ctx.fillRect(x + 3, y + 3, DESK.w - 6, 8);
  ctx.fillStyle = '#8A5A30'; ctx.fillRect(x, y + DESK.h - 4, DESK.w, 4);
  // sách vở trên bàn
  ctx.fillStyle = '#F7F3E8'; ctx.fillRect(x + 22, y + 6, 26, 16); ctx.fillRect(x + 104, y + 8, 24, 15);
  ctx.fillStyle = '#2F6FB5'; ctx.fillRect(x + 50, y + 9, 4, 12);
}

function drawBench(ctx, x, y) {
  ctx.fillStyle = '#9A6A3C'; rr(ctx, x + 6, y - 6, DESK.w - 12, 12, 3); ctx.fill();
  ctx.fillStyle = '#7A4F2A'; ctx.fillRect(x + 6, y + 3, DESK.w - 12, 3);
}

function drawTeacherDesk(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(704, 124, 140, 46);
  ctx.fillStyle = '#8E5B32'; rr(ctx, 700, 118, 140, 46, 4); ctx.fill();
  ctx.fillStyle = '#A86F40'; ctx.fillRect(704, 122, 132, 10);
  ctx.fillStyle = '#C62828'; ctx.fillRect(712, 128, 30, 20); // sổ đầu bài
  ctx.fillStyle = '#F7F3E8'; ctx.fillRect(760, 126, 34, 22);
  ctx.fillStyle = '#5D8F45'; ctx.beginPath(); ctx.arc(815, 130, 8, 0, Math.PI * 2); ctx.fill(); // lọ hoa
  ctx.fillStyle = '#E5382F'; ctx.beginPath(); ctx.arc(812, 126, 3, 0, Math.PI * 2); ctx.arc(818, 128, 3, 0, Math.PI * 2); ctx.fill();
}

function drawShelf(ctx) {
  ctx.fillStyle = '#6B4A2E'; ctx.fillRect(30, 600, 70, 90);
  const colors = ['#C62828', '#2F6FB5', '#2E8B57', '#F2B233', '#7E57C2'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { ctx.fillStyle = colors[(i + r) % 5]; ctx.fillRect(36 + i * 10, 606 + r * 28, 7, 22); }
}
