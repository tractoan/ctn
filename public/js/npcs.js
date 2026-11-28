// Nhân vật phụ (NPC): đứng/đi lại, thỉnh thoảng nói một câu; chạm vào để trò chuyện.
const L = (o) => ({ v: 2, gender: 'nam', skin: 1, hair: 0, hairColor: 0, bottom: 'quan', outfit: 'somi', ...o });

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
    { id: 'npc-guard', slot: 'baove', name: 'Bác bảo vệ', sub: 'Cổng trường', x: 1212, y: 1165, dir: -1, tag: false,
      look: L({ skin: 2, hair: 0, hairColor: 2, outfit: 'somixanh' }),
      lines: ['Đi học sớm thế cháu!', 'Xe đạp gửi ở bên trái cổng nhé.', 'Đeo thẻ vào cho bác nhé.', 'Cổng mở lúc 6 giờ sáng đấy.', 'Đi chậm thôi kẻo ngã!', 'Bác trông trường mấy chục năm rồi.', 'Hôm nay trời đẹp nhỉ!', 'Ngày xưa các cháu hay trèo tường ra quán nước, bác biết hết đấy!'] },
    { id: 'npc-codo', slot: 'codo', name: 'Đội cờ đỏ', sub: 'Trực cổng', x: 850, y: 1080, dir: 1,
      look: L({ gender: 'nu', hair: 3, bottom: 'vay', outfit: 'khoac' }),
      lines: ['Đi muộn là bị ghi tên đấy nhé!', 'Nhớ đeo thẻ học sinh!', 'Áo phải bỏ trong quần nhé.', 'Sau 7 giờ là muộn rồi!', 'Bạn lớp nào thế?', 'Thứ Hai nhớ ra chào cờ!', 'Hôm nay lớp mình được cộng điểm thi đua!', 'Chào bạn, chúc học tốt!'] },
    { id: 'npc-hung', slot: 'hung', name: 'Bác Hùng', sub: 'K1 · Toán', x: 780, y: 590, dir: 1,
      look: L({ skin: 2, hair: 0, hairColor: 2, outfit: 'khoac' }),
      update: walker([[780, 590], [1000, 600], [1290, 590], [1000, 600]], 26),
      lines: ['Sân trường giờ khác xưa nhiều quá!', 'Ngày xưa bọn bác đạp xe đi học đấy.', 'Thấy các cháu về đông, bác vui lắm.', 'Lớp chuyên Toán khóa bác học vất vả lắm.', 'Bác vẫn nhớ thầy dạy Toán năm ấy.', 'Họp lớp năm nay bác nhất định về.'] },
    { id: 'npc-mai', slot: 'mai', name: 'Chị Mai', sub: 'K10 · Văn', x: 1686, y: 1008, dir: 1, sit: true,
      look: L({ gender: 'nu', hair: 4, hairColor: 1, outfit: 'aodai' }),
      lines: ['Ngồi ghế đá buôn chuyện không?', 'Ai còn giữ cuốn lưu bút không?', 'Mùa phượng nở là mùa chia tay.', 'Chị vẫn nhớ tiết Văn cô chủ nhiệm.', 'Viết lưu bút cho trường đi em!', 'Thanh xuân ở đây đẹp nhất đời chị.'] },
    { id: 'npc-tuan', slot: 'tuan', name: 'Anh Tuấn', sub: 'K15 · Lý', x: 417, y: 470, dir: -1, panel: 'football',
      look: L({ hair: 10, outfit: 'aolop', color: 1 }),
      update: walker([[330, 470], [500, 470]], 34),
      lines: ['Đá cầu một hiệp đi!', 'Ngày xưa anh là thủ môn của lớp.', 'Ra chỗ trốn học sút penalty không?', 'Vật lý với bóng đá liên quan lắm đó.', 'Thua thì làm lại, đừng nản!'] },
    { id: 'npc-linh', slot: 'linh', name: 'Bạn Linh', sub: 'K30 · Anh', x: 700, y: 1040, dir: 1,
      look: L({ gender: 'nu', hair: 2, hairColor: 6, bottom: 'vay', outfit: 'teew' }),
      update: walker([[700, 1040], [1500, 1040]], 36),
      lines: ['Hôm nay có kiểm tra 15 phút đó!', 'Ra căng tin mua trà đá không?', 'Lớp Anh ở dãy 3 tầng nha.', 'Chụp ảnh kỷ yếu ở sân khấu đẹp lắm!', 'Nhớ ký sổ đầu bài nhé.'] },
  ].map((n) => ({ scene: 'campus', moving: false, ...n }));
}

const TEACHERS = ['Cô Thu', 'Cô Hằng', 'Cô Phương', 'Cô Yến', 'Cô Hạnh', 'Cô Mai', 'Cô Nga', 'Cô Thủy', 'Cô Vân', 'Cô Hiền', 'Cô Trang', 'Cô Oanh'];

export function classNpcs(lop) {
  let k = 0; for (const ch of lop) k = (k * 31 + ch.charCodeAt(0)) >>> 0;
  return [{
    id: 'npc-gvcn', slot: lop, subject: 'Chủ nhiệm', scene: 'lop:' + lop, name: TEACHERS[k % TEACHERS.length], sub: 'Cô · Chủ nhiệm', x: 300, y: 192, dir: 1, panel: 'oldLesson', lop,
    look: L({ gender: 'nu', hair: [5, 4, 2][k % 3], hairColor: k % 2, outfit: ['aodaitim', 'aodaihong', 'aodaixanh', 'aodaido', 'aodai'][k % 5], skin: k % 2 }),
    update: walker([[262, 192], [470, 192]], 16),
    lines: ['Cả lớp trật tự nào!', 'Em nào chưa làm bài tập về nhà?', 'Hôm nay lớp mình ôn bài cũ nhé.', 'Nhớ ký sổ đầu bài đầy đủ.', 'Ai lên bảng giải bài này nào?', 'Cô tự hào về lớp mình lắm.', 'Ra chơi đừng ném bóng nước trong lớp!', 'Cả lớp về đông đủ chưa nào?'],
  }];
}

// Nhân vật trong các phòng (thư viện, phòng máy, phòng thí nghiệm, nhà hiệu bộ, căng tin, nhà đa năng)
export function roomNpcs(sceneId) {
  const list = {
    'p:thuvien': [{ id: 'npc-thuthu', slot: 'thuvien', subject: 'Thủ thư', name: 'Cô Hạnh', sub: 'Cô · Thủ thư', x: 160, y: 476, dir: 1, panel: 'library',
      look: L({ gender: 'nu', hair: 5, hairColor: 1, outfit: 'somixanh', skin: 0 }),
      lines: ['Thư viện giữ trật tự nhé các em.', 'Mượn sách nhớ trả đúng hạn!', 'Cuốn nào hay thì giới thiệu cho các bạn nhé.', 'Báo Hoa học trò số mới về rồi đấy.', 'Ngày xưa các em hay trốn vào đây đọc truyện.'] }],
    'p:phongmay': [{ id: 'npc-thaytin', slot: 'phongmay', subject: 'Tin', name: 'Thầy Quang', sub: 'Thầy · Tin', x: 535, y: 114, dir: -1, panel: 'computer',
      look: L({ skin: 1, hair: 6, outfit: 'somitrang' }),
      lines: ['Không ăn uống trong phòng máy!', 'Ai chơi dò mìn trong giờ là thầy biết hết đấy.', 'Lưu bài vào ổ D nhé, ổ C bị xoá.', 'Pascal: nhớ dấu chấm phẩy cuối dòng!', 'Đội tuyển Tin năm nay tập ở đây đến tối.'] }],
    'p:phongtn': [{ id: 'npc-minh', slot: 'phongtn', subject: 'Hóa', name: 'Thầy Minh', sub: 'Thầy · Hóa', x: 320, y: 112, dir: 1, panel: 'lab',
      look: L({ skin: 2, hair: 6, outfit: 'vest' }),
      lines: ['Đeo kính bảo hộ vào các em!', 'Thí nghiệm hôm nay vui lắm đây.', 'Rót axit vào nước, không làm ngược lại!', 'Thử pha chế 5 vòng xem được mấy điểm.', 'Đội tuyển Hóa năm nay mạnh lắm!'] }],
    'p:hieubo': [{ id: 'npc-vanphong', slot: 'hieubo', subject: 'Văn phòng', name: 'Cô Lan', sub: 'Cô · Văn phòng', x: 320, y: 300, dir: -1, panel: 'office',
      look: L({ gender: 'nu', hair: 5, hairColor: 1, outfit: 'aodaitim', skin: 0 }),
      update: walker([[250, 300], [400, 300]], 26),
      lines: ['Các em về thăm trường, cô vui lắm!', 'Ai chưa nhận bằng thì vào phòng cấp bằng nhé.', 'Có ảnh kỷ yếu thì gửi lên phòng truyền thống nhé.', 'Họp lớp thì đăng thông báo ở bảng bên kia.', 'Nhớ ghé tri ân thầy cô cũ nhé.', 'Cô vẫn nhớ mặt nhiều em lắm.'] }],
    'p:cangtin': [
      { id: 'npc-cook', slot: 'cangtin', name: 'Cô căng tin', sub: 'Căng tin', x: 280, y: 106, dir: 1, panel: 'canteen',
        look: L({ gender: 'nu', skin: 1, hair: 3, hairColor: 1, bottom: 'vay', outfit: 'phong' }),
        update: walker([[180, 106], [380, 106]], 22),
        lines: ['Bánh mì pate nóng giòn đây!', 'Giờ ra chơi mua rẻ hơn đấy.', 'Bánh cuốn Thái Nguyên phải thử một lần.', 'Chè Tân Cương nóng không cháu?', 'Ăn xong nhớ dọn khay nhé.', 'Hết tiền thì mai bố mẹ cho tiếp!'] },
      { id: 'npc-dung', slot: 'dung', name: 'Anh Dũng', sub: 'K20 · Hóa', x: 186, y: 324, dir: -1, sit: true,
        look: L({ skin: 2, hair: 9, outfit: 'teeb' }),
        lines: ['Bánh mì căng tin là ngon nhất!', 'Đãi anh cốc trà đá đi!', 'Ngày xưa ra chơi là chạy xuống đây xếp hàng.', 'Nem chua rán ở đây ăn mãi không chán.'] },
    ],
    'p:dana': [{ id: 'npc-nam', slot: 'nam', name: 'Bạn Nam', sub: 'K35 · Tin', x: 320, y: 420, dir: 1,
      look: L({ hair: 10, outfit: 'aolop', color: 5 }),
      update: walker([[320, 420], [320, 690]], 30),
      lines: ['Vào CLB nào cũng vui hết!', 'CLB Văn nghệ đang tập tiết mục 20/11 đó.', 'Ném thử vài quả bóng rổ đi!', 'CLB Tình nguyện sắp đi Mùa hè xanh.', 'Ghé gian CLB Tiếng Anh nói chuyện chút nhé.'] }],
  }[sceneId] || [];
  return list.map((n) => ({ scene: sceneId, moving: false, ...n }));
}
