// Cảnh LỚP HỌC (bố cục dọc, hợp màn hình điện thoại):
//  - tường đầu lớp: Nội quy lớp học · bảng lớp · 5 điều Bác Hồ dạy (chạm vào để xem)
//  - bục giảng + bàn giáo viên, cô chủ nhiệm đứng giảng
//  - 6 dãy × 3 bàn, mỗi bàn 2 ghế (36 chỗ ngồi), ngồi vào lớp mình là tự ký sổ đầu bài
//  - hành lang bên trái có lan can, chậu hoa và ban công; cửa ra sân ở góc phải đầu lớp
// Người đang ở cùng một lớp (mọi khóa) nhìn thấy nhau.
import { rr, label } from './world.js';

export const CLASS_W = 640, CLASS_H = 980;
const W = CLASS_W, H = CLASS_H;
const TOP = 112; // chân tường đầu lớp
const HALL = 70; // bề ngang hành lang
const WALL_L = { x: HALL, w: 14 }; // tường giữa hành lang và lớp
const WALL_R = 612; // tường phải (cửa sổ)
const BACK_DOOR = { y0: 858, y1: 944 }; // cửa sau, thông ra hành lang
const COLS = [116, 282, 448];
const DESK = { w: 112, h: 36 };
const ROWS = [0, 1, 2, 3, 4, 5].map((r) => 262 + r * 94);
const WINDOWS = [250, 470, 690];
const PLANTS = [214, 462, 700];
const BOARD = { x: 206, y: 12, w: 228, h: 90 };
const RULES = { x: 88, y: 18, w: 108, h: 82 };
const BACHO = { x: 444, y: 18, w: 108, h: 82 };
const TDESK = { x: 104, y: 168, w: 124, h: 38 };
const SHELF = { x: 270, y: 928, w: 100, h: 24 };

export const CLASS_RULES_SHORT = ['Đi học đúng giờ', 'Mặc đồng phục, đeo thẻ', 'Giơ tay khi phát biểu', 'Giữ vệ sinh lớp học', 'Không ném bóng nước', 'Lễ phép với thầy cô'];
const BACHO_SHORT = ['Yêu Tổ quốc, yêu đồng bào', 'Học tập tốt, lao động tốt', 'Đoàn kết tốt, kỷ luật tốt', 'Giữ gìn vệ sinh thật tốt', 'Khiêm tốn, thật thà, dũng cảm'];

export function classroomScene(lop) {
  const solids = [
    { x: 0, y: 0, w: W, h: TOP }, // tường đầu lớp
    { x: 0, y: TOP, w: 6, h: H - TOP }, // lan can hành lang
    { x: WALL_L.x, y: TOP, w: WALL_L.w, h: BACK_DOOR.y0 - TOP },
    { x: WALL_L.x, y: BACK_DOOR.y1, w: WALL_L.w, h: H - BACK_DOOR.y1 },
    { x: WALL_R, y: 190, w: W - WALL_R, h: H - 190 }, // tường phải, chừa cửa ra ở đầu lớp
    { x: 0, y: H - 18, w: W, h: 18 }, // tường cuối lớp
    { x: TDESK.x, y: TDESK.y, w: TDESK.w, h: TDESK.h },
    { x: SHELF.x, y: SHELF.y, w: SHELF.w, h: SHELF.h },
  ];
  for (const y of PLANTS) solids.push({ x: 16, y: y - 12, w: 32, h: 16 });
  const seats = [];
  for (const y of ROWS) for (const x of COLS) {
    solids.push({ x, y, w: DESK.w, h: DESK.h });
    seats.push({ x: x + 28, y: y + 54, dir: 1, back: true }, { x: x + 84, y: y + 54, dir: -1, back: true });
  }

  const hotspots = [
    { id: 'c-board', x: BOARD.x + BOARD.w / 2, y: 140, icon: '🖍️', label: 'Bảng lớp', panel: 'classBoard', lop, small: true, nolabel: true, rect: BOARD },
    { id: 'c-rules', x: RULES.x + RULES.w / 2, y: 140, icon: '📋', label: 'Nội quy', panel: 'classRules', lop, small: true, nolabel: true, rect: RULES },
    { id: 'c-bacho', x: BACHO.x + BACHO.w / 2, y: 140, icon: '⭐', label: '5 điều Bác Hồ dạy', panel: 'classBacHo', lop, small: true, nolabel: true, rect: BACHO },
    { id: 'c-desk', x: TDESK.x + TDESK.w / 2, y: 228, icon: '📒', label: 'Sổ đầu bài', panel: 'classLog', lop, small: true, rect: TDESK },
    { id: 'c-book', x: SHELF.x + SHELF.w / 2, y: 912, icon: '✍️', label: 'Lưu bút lớp', panel: 'class', lop, tab: 0, small: true, rect: SHELF },
    { id: 'c-balcony', x: 36, y: 820, icon: '🌤️', label: 'Ban công', panel: 'balcony', small: true },
    { id: 'c-exit', x: 566, y: 156, icon: '🚪', label: 'Ra sân', panel: 'exitClass', rect: { x: WALL_R, y: 116, w: W - WALL_R, h: 70 } },
  ];

  return {
    id: 'lop:' + lop, lop, w: W, h: H, bgColor: '#2B3348', solids, seats, hotspots,
    spawn: { x: 586, y: 206 },
    fit: true, fitMin: 0.6,
    name: 'Lớp chuyên ' + lop,
    drawBg(ctx) { drawRoom(ctx, lop); },
    statics(ctx) {
      const items = [];
      for (const y of ROWS) for (const x of COLS) {
        items.push({ y: y + DESK.h, draw: () => drawDesk(ctx, x, y) });
        // ghế vẽ trước người ngồi (y nhỏ hơn chỗ ngồi một chút)
        items.push({ y: y + 53, draw: () => { drawChair(ctx, x + 28, y + 54); drawChair(ctx, x + 84, y + 54); } });
      }
      items.push({ y: TDESK.y + TDESK.h, draw: () => drawTeacherDesk(ctx) });
      items.push({ y: SHELF.y + SHELF.h, draw: () => drawShelf(ctx) });
      for (const y of PLANTS) items.push({ y: y + 4, draw: () => drawPlant(ctx, 32, y) });
      return items;
    },
  };
}

// ---------- Nền phòng học (vẽ một lần) ----------
function drawRoom(ctx, lop) {
  // sàn gỗ
  ctx.fillStyle = '#EAD7B0'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(150,115,70,.16)'; ctx.lineWidth = 1;
  for (let y = TOP + 28; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(HALL + 14, y); ctx.lineTo(WALL_R, y); ctx.stroke();
    for (let x = HALL + 14 + ((y / 30) % 2) * 60; x < WALL_R; x += 120) { ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y); ctx.stroke(); }
  }
  // bục giảng
  ctx.fillStyle = '#DCC094'; ctx.fillRect(HALL + 14, TOP, WALL_R - HALL - 14, 112);
  ctx.fillStyle = 'rgba(120,80,40,.22)'; ctx.fillRect(HALL + 14, TOP + 108, WALL_R - HALL - 14, 4);
  // hành lang: gạch xám + lan can
  ctx.fillStyle = '#D6D3CB'; ctx.fillRect(0, TOP, HALL, H - TOP);
  ctx.strokeStyle = 'rgba(0,0,0,.07)';
  for (let y = TOP + 8; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(HALL, y); ctx.stroke(); }
  for (const x of [24, 48]) { ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.fillStyle = '#9AA3B2'; ctx.fillRect(0, TOP, 6, H - TOP);
  for (let y = TOP + 8; y < H; y += 14) ctx.fillRect(0, y, 10, 2);
  // bóng đổ dưới tường đầu lớp
  // tường đầu lớp
  ctx.fillStyle = '#FBF3DC'; ctx.fillRect(0, 0, W, TOP);
  ctx.fillStyle = '#E9D9B0'; ctx.fillRect(0, TOP - 10, W, 10);
  ctx.fillStyle = 'rgba(20,30,50,.10)'; ctx.fillRect(0, TOP, W, 6);
  // bảng lớp
  rr(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 6); ctx.fillStyle = '#8A6A48'; ctx.fill();
  rr(ctx, BOARD.x + 6, BOARD.y + 6, BOARD.w - 12, BOARD.h - 18, 3); ctx.fillStyle = '#2F5D50'; ctx.fill();
  ctx.fillStyle = '#A07C55'; ctx.fillRect(BOARD.x + 10, BOARD.y + BOARD.h - 10, BOARD.w - 20, 4); // máng phấn
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(BOARD.x + 30, BOARD.y + BOARD.h - 12, 10, 3); ctx.fillStyle = '#F7D774'; ctx.fillRect(BOARD.x + 46, BOARD.y + BOARD.h - 12, 8, 3);
  const d = new Date(Date.now() + 7 * 3600e3);
  const thu = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getUTCDay()];
  const cx = BOARD.x + BOARD.w / 2;
  label(ctx, `${thu}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`, cx, BOARD.y + 18, { size: 8.5, color: 'rgba(244,241,230,.75)', weight: 600 });
  label(ctx, 'LỚP CHUYÊN ' + lop.toUpperCase(), cx, BOARD.y + 36, { size: 17, color: '#F4F1E6', weight: 800 });
  label(ctx, '✍️ Lưu bút · 📒 Sổ đầu bài · ❓ Đố vui', cx, BOARD.y + 56, { size: 9, color: 'rgba(244,241,230,.88)', weight: 600 });
  label(ctx, 'Chạm vào bảng', cx, BOARD.y + 70, { size: 8, color: 'rgba(244,241,230,.6)', weight: 500 });
  // hai tờ áp phích
  poster(ctx, RULES, 'NỘI QUY LỚP HỌC', CLASS_RULES_SHORT, '#2F6FB5');
  poster(ctx, BACHO, '5 ĐIỀU BÁC HỒ DẠY', BACHO_SHORT, '#C8343A');
  // khẩu hiệu nhỏ trên tường hai góc
  label(ctx, 'TIÊN HỌC LỄ', 44, 30, { size: 9, color: '#C8343A', weight: 800 });
  label(ctx, 'HẬU HỌC VĂN', 44, 46, { size: 9, color: '#C8343A', weight: 800 });
  // đồng hồ treo tường
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(44, 78, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5B6577'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44, 78); ctx.lineTo(44, 69); ctx.moveTo(44, 78); ctx.lineTo(51, 80); ctx.stroke();
  // tường giữa hành lang và lớp (có cửa sau), cửa sổ hai bên
  ctx.fillStyle = '#F3EDE0';
  ctx.fillRect(WALL_L.x, TOP, WALL_L.w, BACK_DOOR.y0 - TOP); ctx.fillRect(WALL_L.x, BACK_DOOR.y1, WALL_L.w, H - BACK_DOOR.y1);
  ctx.fillRect(WALL_R, 190, W - WALL_R, H - 190);
  for (const y of WINDOWS) for (const x of [WALL_L.x, WALL_R]) {
    const ww = x === WALL_L.x ? 10 : 22;
    rr(ctx, x + 2, y, ww, 120, 2); ctx.fillStyle = '#8FB8D8'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 4, y + 6, 3, 50);
    ctx.fillStyle = '#E6E0D2'; ctx.fillRect(x, y + 58, ww + 4, 4);
  }
  // cửa sau (khung gỗ)
  ctx.fillStyle = '#8A5A35'; ctx.fillRect(WALL_L.x, BACK_DOOR.y0 - 4, WALL_L.w, 4); ctx.fillRect(WALL_L.x, BACK_DOOR.y1, WALL_L.w, 4);
  // cửa ra sân (góc phải đầu lớp)
  rr(ctx, WALL_R - 1, 116, W - WALL_R + 1, 70, 3); ctx.fillStyle = '#AEB4BE'; ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(WALL_R + 2, 120, W - WALL_R - 4, 62);
  ctx.fillStyle = '#EEF0F3'; ctx.fillRect(WALL_R + 5, 124, W - WALL_R - 10, 24);
  ctx.fillStyle = '#9AA3B2'; ctx.beginPath(); ctx.arc(WALL_R + 6, 154, 2.5, 0, Math.PI * 2); ctx.fill();
  rr(ctx, 560, 96, 76, 14, 4); ctx.fillStyle = '#2F6FB5'; ctx.fill();
  label(ctx, '🚪 Ra sân', 598, 103, { size: 8.5, color: '#fff', weight: 700 });
  // tường cuối lớp
  ctx.fillStyle = '#FBF3DC'; ctx.fillRect(0, H - 18, W, 18);
  ctx.fillStyle = '#E9D9B0'; ctx.fillRect(0, H - 18, W, 3);
}

function poster(ctx, r, title, lines, color) {
  rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#B9C1CC'; ctx.fill();
  rr(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 3); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  label(ctx, title, r.x + r.w / 2, r.y + 13, { size: 8.5, color, weight: 800 });
  ctx.font = '600 6.2px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillStyle = '#3A4152'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  lines.forEach((t, i) => ctx.fillText(`${i + 1}. ${t}`, r.x + 7, r.y + 26 + i * 9.6, r.w - 12));
  label(ctx, 'Chạm để đọc', r.x + r.w / 2, r.y + r.h - 7, { size: 5.5, color: '#9AA3B2', weight: 600 });
}

function drawDesk(ctx, x, y) {
  ctx.fillStyle = 'rgba(20,30,50,.10)'; rr(ctx, x + 3, y + 28, DESK.w, 12, 4); ctx.fill();
  rr(ctx, x, y, DESK.w, DESK.h - 2, 5); ctx.fillStyle = '#C9955C'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 4, y + 4, DESK.w - 8, 5);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(ctx, x, y + 28, DESK.w, 8, 3); ctx.fill();
  // sách vở trên bàn
  ctx.fillStyle = '#F7F3E8'; ctx.fillRect(x + 16, y + 9, 22, 14); ctx.fillRect(x + 74, y + 10, 20, 13);
  ctx.fillStyle = '#2F6FB5'; ctx.fillRect(x + 41, y + 11, 3, 11);
  ctx.fillStyle = '#C8343A'; ctx.fillRect(x + 97, y + 12, 3, 10);
}

function drawChair(ctx, x, y) {
  rr(ctx, x - 13, y - 14, 26, 10, 4); ctx.fillStyle = '#8FA3BF'; ctx.fill();
  ctx.fillStyle = '#6F84A3'; ctx.fillRect(x - 11, y - 5, 3, 6); ctx.fillRect(x + 8, y - 5, 3, 6);
}

function drawTeacherDesk(ctx) {
  const { x, y, w, h } = TDESK;
  ctx.fillStyle = 'rgba(20,30,50,.12)'; rr(ctx, x + 3, y + h - 8, w, 12, 4); ctx.fill();
  rr(ctx, x, y, w, h - 4, 5); ctx.fillStyle = '#A9744A'; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, x, y + h - 10, w, 8, 3); ctx.fill();
  ctx.fillStyle = '#C62828'; ctx.fillRect(x + 12, y + 6, 26, 18); // sổ đầu bài
  ctx.fillStyle = '#FFE08A'; ctx.fillRect(x + 15, y + 12, 20, 2);
  ctx.fillStyle = '#F7F3E8'; ctx.fillRect(x + 46, y + 7, 30, 18);
  ctx.fillStyle = '#5D8F45'; ctx.beginPath(); ctx.arc(x + 98, y + 13, 8, 0, Math.PI * 2); ctx.fill(); // lọ hoa
  ctx.fillStyle = '#E5382F'; ctx.beginPath(); ctx.arc(x + 95, y + 9, 3, 0, Math.PI * 2); ctx.arc(x + 101, y + 11, 3, 0, Math.PI * 2); ctx.fill();
  label(ctx, 'Bàn giáo viên', x + w / 2, y + h - 3, { size: 7, color: '#4A3018', weight: 700 });
}

function drawShelf(ctx) {
  const { x, y, w, h } = SHELF;
  rr(ctx, x, y - 26, w, h + 26, 3); ctx.fillStyle = '#7A5534'; ctx.fill();
  const colors = ['#C62828', '#2F6FB5', '#2E8B57', '#F2B233', '#7E57C2'];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 11; i++) { ctx.fillStyle = colors[(i + r) % 5]; ctx.fillRect(x + 6 + i * 8, y - 22 + r * 22, 6, 18); }
}

function drawPlant(ctx, x, y) {
  rr(ctx, x - 13, y - 8, 26, 14, 4); ctx.fillStyle = '#C8794A'; ctx.fill();
  ctx.fillStyle = '#6FB35A'; ctx.beginPath(); ctx.arc(x, y - 14, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5A9A48'; ctx.beginPath(); ctx.arc(x + 5, y - 10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FF8FB1'; ctx.beginPath(); ctx.arc(x - 5, y - 18, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFD45E'; ctx.beginPath(); ctx.arc(x + 4, y - 20, 2.5, 0, Math.PI * 2); ctx.fill();
}
