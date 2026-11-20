// Nhân vật phụ (NPC): đứng/đi lại, thỉnh thoảng nói một câu; chạm vào để trò chuyện.
const L = (o) => ({ gender: 'nam', skin: 1, hair: 0, hairColor: 0, bottom: 'quan', bag: 0, outfit: 'somi', ...o });

function walker(points, speed = 40) {
  let i = 0;
  return (n, dt) => {
    const [tx, ty] = points[i];
    const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    if (d < 2) { n.wait = (n.wait || 0) + dt; n.moving = false; if (n.wait > 3) { n.wait = 0; i = (i + 1) % points.length; } return; }
    const s = Math.min(d, speed * dt);
    n.x += dx / d * s; n.y += dy / d * s; n.moving = true; if (Math.abs(dx) > 1) n.dir = dx > 0 ? 1 : -1;
  };
}

export function campusNpcs() {
  return [
    { id: 'npc-guard', name: 'Bác bảo vệ', sub: 'Cổng trường', x: 1165, y: 1165, dir: -1, tag: false,
      look: L({ skin: 2, hair: 4, hairColor: 4, outfit: 'phong' }),
      lines: ['Đi học sớm thế cháu!', 'Xe đạp gửi ở bên trái cổng nhé.', 'Đeo thẻ vào cho bác nhé.', 'Cổng mở lúc 6 giờ sáng đấy.', 'Đi chậm thôi kẻo ngã!', 'Bác trông trường mấy chục năm rồi.', 'Hôm nay trời đẹp nhỉ!', 'Ngày xưa các cháu hay trèo tường ra quán nước, bác biết hết đấy!'] },
    { id: 'npc-codo', name: 'Đội cờ đỏ', sub: 'Trực cổng', x: 830, y: 1150, dir: 1,
      look: L({ gender: 'nu', hair: 2, bottom: 'vay', scarf: true }),
      lines: ['Đi muộn là bị ghi tên đấy nhé!', 'Nhớ đeo thẻ học sinh!', 'Áo phải bỏ trong quần nhé.', 'Sau 7 giờ là muộn rồi!', 'Bạn lớp nào thế?', 'Thứ Hai nhớ ra chào cờ!', 'Hôm nay lớp mình được cộng điểm thi đua!', 'Chào bạn, chúc học tốt!'] },
    { id: 'npc-vanphong', name: 'Cô Lan', sub: 'Cô · Văn phòng', x: 412, y: 760, dir: -1, panel: 'office',
      look: L({ gender: 'nu', hair: 7, hairColor: 1, outfit: 'aodai', skin: 0 }),
      update: walker([[412, 700], [412, 950]], 30),
      lines: ['Các em về thăm trường, cô vui lắm!', 'Ai chưa nhận bằng thì vào phòng cấp bằng nhé.', 'Có ảnh kỷ yếu thì gửi lên phòng truyền thống nhé.', 'Họp lớp thì đăng thông báo ở nhà hiệu bộ.', 'Nhớ ghé tri ân thầy cô cũ nhé.', 'Cô vẫn nhớ mặt nhiều em lắm.'] },
    { id: 'npc-cook', name: 'Cô căng tin', sub: 'Căng tin', x: 1884, y: 745, dir: 1, panel: 'canteen',
      look: L({ gender: 'nu', skin: 1, hair: 2, hairColor: 1, bottom: 'vay', bag: 3, outfit: 'phong' }),
      update: walker([[1850, 745], [1925, 745]], 22),
      lines: ['Bánh mì pate nóng giòn đây!', 'Giờ ra chơi mua rẻ hơn đấy.', 'Bánh cuốn Thái Nguyên phải thử một lần.', 'Chè Tân Cương nóng không cháu?', 'Ăn xong nhớ dọn khay nhé.', 'Hết tiền thì mai bố mẹ cho tiếp!'] },
    { id: 'npc-hung', name: 'Bác Hùng', sub: 'K1 · Toán', x: 780, y: 590, dir: 1,
      look: L({ skin: 2, hair: 4, hairColor: 4, outfit: 'khoac' }),
      update: walker([[780, 590], [1000, 600], [1290, 590], [1000, 600]], 26),
      lines: ['Sân trường giờ khác xưa nhiều quá!', 'Ngày xưa bọn bác đạp xe đi học đấy.', 'Thấy các cháu về đông, bác vui lắm.', 'Lớp chuyên Toán khóa bác học vất vả lắm.', 'Bác vẫn nhớ thầy dạy Toán năm ấy.', 'Họp lớp năm nay bác nhất định về.'] },
    { id: 'npc-mai', name: 'Chị Mai', sub: 'K10 · Văn', x: 1686, y: 1008, dir: 1, sit: true,
      look: L({ gender: 'nu', hair: 3, hairColor: 1, outfit: 'aodai' }),
      lines: ['Ngồi ghế đá buôn chuyện không?', 'Ai còn giữ cuốn lưu bút không?', 'Mùa phượng nở là mùa chia tay.', 'Chị vẫn nhớ tiết Văn cô chủ nhiệm.', 'Viết lưu bút cho trường đi em!', 'Thanh xuân ở đây đẹp nhất đời chị.'] },
    { id: 'npc-tuan', name: 'Anh Tuấn', sub: 'K15 · Lý', x: 417, y: 470, dir: -1, panel: 'football',
      look: L({ hair: 0, outfit: 'aolop', color: 1 }),
      update: walker([[330, 470], [500, 470]], 34),
      lines: ['Đá cầu một hiệp đi!', 'Ngày xưa anh là thủ môn của lớp.', 'Ra chỗ trốn học sút penalty không?', 'Vật lý với bóng đá liên quan lắm đó.', 'Thua thì làm lại, đừng nản!'] },
    { id: 'npc-linh', name: 'Bạn Linh', sub: 'K30 · Anh', x: 700, y: 1040, dir: 1,
      look: L({ gender: 'nu', hair: 6, bottom: 'vay', bag: 1 }),
      update: walker([[700, 1040], [1500, 1040]], 36),
      lines: ['Hôm nay có kiểm tra 15 phút đó!', 'Ra căng tin mua trà đá không?', 'Lớp Anh ở dãy 3 tầng nha.', 'Chụp ảnh kỷ yếu ở sân khấu đẹp lắm!', 'Nhớ ký sổ đầu bài nhé.'] },
    { id: 'npc-minh', name: 'Thầy Minh', sub: 'Thầy · Hóa', x: 1480, y: 300, dir: -1, panel: 'lab',
      look: L({ skin: 2, hair: 8, outfit: 'vest' }),
      lines: ['Đeo kính bảo hộ vào các em!', 'Thí nghiệm hôm nay vui lắm đây.', 'Rót axit vào nước, không làm ngược lại!', 'Thử pha chế 5 vòng xem được mấy điểm.', 'Đội tuyển Hóa năm nay mạnh lắm!'] },
  ].map((n) => ({ scene: 'campus', moving: false, ...n }));
}

const TEACHERS = ['Cô Thu', 'Cô Hằng', 'Cô Phương', 'Cô Yến', 'Cô Hạnh', 'Cô Mai', 'Cô Nga', 'Cô Thủy', 'Cô Vân', 'Cô Hiền', 'Cô Trang', 'Cô Oanh'];

export function classNpcs(lop) {
  let k = 0; for (const ch of lop) k = (k * 31 + ch.charCodeAt(0)) >>> 0;
  return [{
    id: 'npc-gvcn', scene: 'lop:' + lop, name: TEACHERS[k % TEACHERS.length], sub: 'Cô · Chủ nhiệm', x: 560, y: 178, dir: 1, panel: 'oldLesson', lop,
    look: L({ gender: 'nu', hair: 7, hairColor: k % 3, outfit: 'aodai', skin: k % 2 }),
    update: walker([[400, 178], [660, 178]], 18),
    lines: ['Cả lớp trật tự nào!', 'Em nào chưa làm bài tập về nhà?', 'Hôm nay lớp mình ôn bài cũ nhé.', 'Nhớ ký sổ đầu bài đầy đủ.', 'Ai lên bảng giải bài này nào?', 'Cô tự hào về lớp mình lắm.', 'Ra chơi đừng ném bóng nước trong lớp!', 'Cả lớp về đông đủ chưa nào?'],
  }];
}
