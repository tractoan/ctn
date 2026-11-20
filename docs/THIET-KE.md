# Tài liệu thiết kế – Trường THPT Chuyên Thái Nguyên · Họp lớp online

| | |
|---|---|
| Phiên bản | 1.5 – vẽ lại cảnh vật theo phong cách trang mẫu (gạch sân, cỏ, cây tán tròn, hoa 5 cánh, mái nhà, màu trời theo giờ) |
| Tài liệu yêu cầu | [YEU-CAU.md](YEU-CAU.md) – mã yêu cầu `YC-…` được dẫn lại trong tài liệu này |
| Nhánh | `claude/thpt-chuyen-thai-nguyen-srs08f` |
| Sản phẩm tham khảo | [thpt.chuyenhalong.workers.dev](https://thpt.chuyenhalong.workers.dev/) |
| Nền tảng | Trình duyệt (điện thoại là chính) · Cloudflare Workers + D1 |

---

## 1. Mục tiêu và phạm vi

Một **sân trường ảo** dựng lại cơ sở cũ của THPT Chuyên Thái Nguyên tại **234A đường Lương Ngọc Quyến,
TP Thái Nguyên** (1995–2019). Mục tiêu, phạm vi, người dùng và toàn bộ yêu cầu xem [tài liệu yêu cầu](YEU-CAU.md).
Tài liệu này mô tả **cách hiện thực**.

**Nguyên tắc thiết kế**

| # | Nguyên tắc | Lý do |
|---|---|---|
| NT-1 | Không bước build, không thư viện ngoài: HTML + ES modules + Canvas 2D | Nhẹ, ai cũng sửa được, triển khai là chép file (YC-PN-03) |
| NT-2 | Nghiệp vụ viết **một lần** trong `logic.js`, chạy cả trên Worker lẫn trình duyệt | Chế độ ngoại tuyến và kiểm thử miễn phí (YC-PN-06, YC-PN-13) |
| NT-3 | Sơ đồ là **dữ liệu** (`campus.js`), không lẫn vào mã vẽ | Sửa sơ đồ theo trí nhớ cựu học sinh mà không đụng logic (YC-SD-13) |
| NT-4 | Đồng bộ bằng hỏi định kỳ (polling) thay vì WebSocket | Chạy được trên gói miễn phí, đơn giản (YC-PN-07) |
| NT-5 | Nội dung người dùng chỉ gắn bằng `textContent` | Chống chèn mã (YC-PN-09) |
| NT-6 | Mỗi không gian là một **cảnh** (`scene`) cùng một giao diện: kích thước, vật cản, điểm tương tác, chỗ ngồi, vẽ nền, vẽ vật thể | Thêm phòng mới (lớp học, thư viện…) mà không sửa lõi `World` (YC-LH-01) |

## 2. Người dùng

| Vai (`role`) | Mô tả | Cần khai báo | Ghi chú |
|---|---|---|---|
| `cuuhs` – Cựu học sinh | Đã ra trường | Tên, khóa, lớp chuyên | Nhóm chính |
| `hs` – Học sinh | Đang học | Tên, khóa, lớp chuyên | |
| `gv` – Thầy cô | Đang/đã công tác | Tên | Có phòng giáo viên |
| `khach` – Bạn trường khác | THPT khác | Tên, trường (tuỳ chọn) | |
| `em` – Em cấp 2 | THCS tham quan | Tên, trường (tuỳ chọn) | Viết tường "Ước mơ vào Chuyên" |
| Khách chưa ghi danh | Chỉ xem | – | Đi dạo, xem lưu bút, thấy người online; không được ghi |

Lớp chuyên: Toán, Tin, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh, Nga, Pháp, Trung. Khóa ghi dạng `K1`…`K99`.

## 3. Sơ đồ khuôn viên

Sơ đồ dựng theo **bản vẽ tay của cựu học sinh** (`docs/so-do-goc.jpg`) và ảnh chụp cổng trường, nhà hiệu bộ,
dãy 4 tầng. Mỗi pixel của bản vẽ gốc = **1,6 px thế giới**. Thế giới rộng **2000 × 1400 px**, hướng Bắc ở trên,
đường Lương Ngọc Quyến ở dưới. Toàn bộ dữ liệu nằm trong `public/js/campus.js`.

| Bản vẽ gốc | Bản trong game |
|---|---|
| ![Bản vẽ gốc](so-do-goc.jpg) | ![Sơ đồ trong game](so-do.png) |

```
┌──────────────────────────────┬──────────────────────────────────┬──────────┐
│ DÃY NHÀ 4 TẦNG (chữ L)       │ DÃY NHÀ 3 TẦNG    [sân khấu]     │ CHỖ TRỐN │
│ ┌────┐ (hàng cau vua)        │                          ┌───────┤ HỌC ĐÁ   │
│ │    │  ┌──────────┐ ║┌──────┴───────────────────┐      │       │ BÓNG     │
│ └────┘  │ SÂN ĐÁ   │ ║│                          │      └───────┘          │
│CỔNG PHỤ │   CẦU    │ ▤│       SÂN TRƯỜNG         │ ┌──────────┐ ┌──┐      │
│         └──────────┘ ║│      (cao hơn mặt đất)   │ │ NHÀ ĐA   │ │CĂ│      │
│┌──────────┐          ║└──────────────────────────┘ │ NĂNG     │ │NG│      │
││ NHÀ      │  Lối  ┌──────────────────────────────┐ └──────────┘ │TIN      │
││ HIỆU BỘ  │  vào  │       DÃY NHÀ 5 TẦNG         │                         │
│└──────────┘       └──────────────────────────────┘       (cây xanh)        │
│                       [ CỔNG TRƯỜNG ]                                       │
└─────────────────────────┘         └───────────────────────────────────────┘
══════════════════════════ ĐƯỜNG LƯƠNG NGỌC QUYẾN ═══════════════════════════
 ║ bậc thang   ▤ bảng tin
```

| Hằng số | Nội dung |
|---|---|
| `FLOWERBEDS` | Bồn hoa tròn (`round`, `r`) hoặc chữ nhật, tuỳ chọn bảng màu `colors`; là vật cản |
| `BENCHES`, `SEATS` | Ghế đá và chỗ ngồi sinh từ ghế (2 chỗ/ghế) |
| `GROUNDS` | Mặt đất: đường, vỉa hè, sân bê tông, bãi cỏ, sân đá cầu (`court`), sân trường (`yard`) |
| `BUILDINGS` | Toà nhà: `id, name, short, x, y, w, h, floors, wall, roof` + tuỳ chọn `trim` (lan can đỏ dãy 4 tầng), `bands` (dải xanh nhà hiệu bộ), `hall` (mái nhà đa năng). Nhà chữ L tách thành nhiều khối cùng `id`; chỉ khối có `short` mới vẽ tên |
| `YARD`, `STAIRS`, `EDGES` | Sân trường cao; hai bậc thang ở cạnh trái (xuống sân đá cầu, bậc thang chính); tường chắn là vật cản, chừa chỗ bậc thang |
| `WALLS`, `GATE`, `SIDE_GATE` | Tường rào thấp màu kem, cổng chính (x 693–1130), cổng phụ bên trái |
| `CLASS_DOORS` | Cửa lớp: lớp chuyên nào ở dãy nào, vị trí đứng trước cửa |
| `HOTSPOTS` | Điểm tương tác: toạ độ, biểu tượng, nhãn, nhãn ngắn trên bản đồ (`map`), bảng cần mở (`panel`) |
| `TREES` (`palm`, `bonsai`, `tree` + `bloom`: `phuong`/`banglang`/`hoasua`), `LAMPS`, `FLAG`, `BOARD`, `STAGE`, `DRUM` | Trang trí; gốc cây, bảng tin, bục sân khấu là vật cản |

Lối đi chính: cổng → khoảng sân trước dãy 5 tầng → **lối vào** giữa nhà hiệu bộ và dãy 5 tầng → **bậc thang
chính** lên sân trường (sân chỉ lên được bằng hai bậc thang bên trái). Căng tin và chỗ trốn học đi vòng phía
Đông nhà đa năng.

Phân bổ lớp (theo cựu học sinh, `CLASS_DOORS`): **dãy 4 tầng** trái → phải – Toán (chân chữ L), rồi Lý, Hóa, Sinh,
Văn, Trung cách đều nhau, cau vua đứng xen giữa; **dãy 3 tầng** trái → phải – Anh, Sử, Địa; **dãy 5 tầng** phải → trái – Tin, Nga, Pháp, cửa ở **mặt trong**
(quay vào sân trường), đi theo hành lang dưới chân tường sân, vào từ lối vào hoặc từ phía nhà đa năng.

### 3.1 Cảnh và lớp học

`World` luôn hiển thị **một cảnh**. Cảnh là object:

```js
{ id, name, w, h, bgColor, fit?,          // fit: thu nhỏ cho vừa chiều ngang màn hình
  solids: [{x,y,w,h}],                    // vật cản → lưới va chạm 20 px riêng của cảnh (class Grid, có cache)
  hotspots: [...], seats: [{x,y,dir,back}],
  spawn: {x,y},
  drawBg(ctx),                            // nền tĩnh, vẽ một lần vào canvas ngoài màn hình
  statics(ctx, now) → [{ y, draw() }] }   // vật thể sắp theo y cùng nhân vật
```

| Cảnh | Nguồn | Ghi chú |
|---|---|---|
| `campus` | `CAMPUS_SCENE` trong `world.js`, dữ liệu `campus.js` | 2000 × 1400, 30 điểm tương tác, 20 chỗ ngồi ghế đá |
| `lop:<Lớp>` | `classroomScene(lop)` trong `classroom.js` | 960 × 740: bảng đen (thứ/ngày/tên lớp), bục giảng, bàn giáo viên, 4 × 3 bàn đôi, 24 chỗ ngồi (ngồi quay lưng về phía người xem, hướng lên bảng), tủ sách, cửa sổ; `fit: true` |

Vào lớp: chạm cửa lớp (`panel: 'enterClass'`) → `world.setScene(classroomScene(lop), spawn)`, nhớ vị trí cửa trong
`classReturn`. Ra lớp (`exitClass`, mở bản đồ, "Về cổng trường") → `setScene(CAMPUS_SCENE, classReturn)`.
`setScene` dựng lại nền, lưới va chạm, xoá người khác và hiệu ứng, đặt lại mức phóng to, gọi `onSceneChange`.
Vị trí chỉ được lưu vào `localStorage` khi đang ở sân trường.

Mỗi lượt `presence` gửi kèm `scene`; máy khách chỉ hiện những người có cùng `scene`, nên ai đang trong lớp Toán
chỉ thấy người cũng trong lớp Toán (mọi khóa). Số người online trên thanh trên vẫn đếm toàn trường.

### 3.2 Ngồi ghế

Chỗ ngồi là điểm `{x, y, dir, back}` của cảnh (ghế đá: 2 chỗ/ghế, nhìn ra phía người xem; ghế lớp: quay lưng).
Chạm gần chỗ ngồi (≤ 24 px) → `walkTo(seat, { sit })` → tới nơi thì `sitOn(seat)`: đặt `me.sit`, xoay theo `dir`.
Bất kỳ chuyển động nào (chạm sân, phím, ném bóng) xoá `me.sit`. `avatar.js` vẽ tư thế ngồi: hạ thân, đùi gập,
cẳng chân thõng trước ghế (nhìn thẳng) hoặc chỉ thấy lưng (quay lưng). Trạng thái ngồi đi theo `presence`
(`sit`, `sitBack`, `dir`) để người khác cùng thấy.

## 4. Chức năng

| Địa điểm | Bảng (`panel`) | Chức năng | Cần ghi danh |
|---|---|---|---|
| Cổng trường | `gate` | Giới thiệu cơ sở cũ, hướng dẫn | Không |
| Bác bảo vệ | `guard` | Câu thoại ngẫu nhiên | Không |
| Gửi xe (trái cổng) | `parking` | Điểm danh mỗi ngày: +20.000đ vào ví, +2 điểm | Có |
| Bảng tin | `board` | Bảng thi đua theo khóa, theo lớp chuyên, đá cầu | Không |
| Sân khấu (cột cờ ở giữa) | `stage` | "Hiền tài là nguyên khí của quốc gia", lưu bút chào cờ/văn nghệ | Ghi: có |
| Trống trường (giữa dãy 5 tầng, sát sân) | `drum` | Xem giờ/tiết, đánh trống (âm thanh Web Audio) | Không |
| Nút 🎈 (mọi nơi) | – | Danh sách người cùng cảnh để chọn ném bóng nước | Thấy được bởi người khác: có |
| Thẻ người chơi | – | Vẫy tay, ném bóng nước, viết sổ lưu bút, đi tới | Một số: có |
| Nhân vật của tôi | – | Đổi kiểu, sổ lưu bút của tôi, album kỷ yếu, mã khôi phục | Có |
| Nút 🎵 (thanh trên) | – | Bài ca truyền thống qua YouTube nhúng | Không |
| Sân trường · ghế đá | `garden` | Lưu bút tâm sự | Ghi: có |
| Nhà hiệu bộ | `office` | Lịch họp lớp (tạo, đăng ký/huỷ), thiệp tri ân thầy cô | Ghi: có |
| Phòng giáo viên | `teachers` | Lưu bút `gv` | Ghi: có |
| Phòng truyền thống | `history` | Mốc lịch sử cơ sở, góc kỷ niệm | Ghi: có |
| Cửa lớp | `enterClass` | Vào cảnh lớp học | Không |
| Trong lớp: bảng đen / bàn giáo viên / tủ sách | `class` (tab 2 / 1 / 0) | Đố vui · Sổ đầu bài · Lưu bút lớp, chọn khóa | Ghi: có |
| Trong lớp: cửa ra | `exitClass` | Về sân, đứng trước cửa lớp | Không |
| Chụp ảnh kỷ yếu (trước sân khấu, nút 📸) | `photo` | Đếm ngược, khung kỷ yếu, lưu về máy, đăng album | Đăng: có |
| Sân đá cầu | `football` | Trò đá cầu + bảng xếp hạng | Lưu điểm: có |
| Nhà đa năng | `clubs` | Gian từng CLB, mỗi gian một lưu bút | Ghi: có |
| Căng tin | `canteen` | Thực đơn, mua/đãi bạn, giảm 20% giờ ra chơi | Có |
| Chỗ trốn học đá bóng | `tronhoc` | Lưu bút "tự thú" | Ghi: có |
| Cổng phụ | `sidegate` | Lưu bút chuyện cổng phụ | Ghi: có |
| Tường ước mơ | `wish` | Lưu bút "Ước mơ vào Chuyên" | Ghi: có |
| Lối vào | `entry` | Gợi ý đường lên sân trường | Không |
| Nhân vật của tôi (nút ảnh đại diện) | `mirror` | Đổi tên, kiểu tóc, đồng phục | Có |

**Điểm thi đua** (`POINTS` trong `logic.js`): điểm danh +2, lưu bút +5, tạo họp lớp +3, đăng ký họp lớp +3,
mỗi câu đố đúng +1 (tối đa 10 điểm/ngày), đá cầu từ 5 quả +1. Điểm của khóa/lớp = tổng điểm thành viên.

**Thời khoá biểu** (giờ Việt Nam, `SCHEDULE`): sáng 5 tiết từ 7:00, ra chơi 9:25–9:45; chiều 5 tiết từ 13:30,
ra chơi 15:55–16:15. Dùng cho đồng hồ trên thanh trên và giảm giá căng tin.

## 5. Giao diện

### 5.1 Bố cục màn hình chính (điện thoại)

```
┌──────────────────────────────────────┐
│ [CTN] Sân trường    ●3 🎵 💰20k 🙂    │  ← khu vực · giờ · tiết; online; nhạc; ví / Ghi danh
│       14:07 · Tiết 1 chiều            │
├──────────────────────────────────────┤
│                                      │
│        canvas sân trường             │  ← chạm để đi, chạm nhãn để mở
│ ┌─────────┐                     (🎈) │  ← ném bóng nước
│ │▶ nhạc   │                      (+) │
│ └─────────┘                      (−) │  ← trình phát nhạc nhỏ (khi bật 🎵)
├──────────────────────────────────────┤
│ [Xin chào!👋] [Lâu quá không gặp!] … │  ← câu nói nhanh + 😂 ❤️ 👍 (cuộn ngang)
│ (🗺️)  Nhắn gì đó…                (➤) │  ← bản đồ toàn trường, ô chat
└──────────────────────────────────────┘
```

Các bảng chức năng mở dạng **sheet trượt từ dưới lên** (trên máy tính hiện ở giữa), đóng bằng ✕, chạm nền
hoặc phím Esc.

### 5.2 Luồng ghi danh

```
Mở trang ──► Sân trường (khách) + bảng "Chào mừng"
               ├─ Chọn vai ─► Tên / khóa / lớp ─► Mặc đồng phục ─► Lưu mã khôi phục ─► Vào sân
               ├─ "Tôi đã có nhân vật" ─► nhập CTN-XXXX-XXXX ─► Vào sân
               └─ "Vào xem với tư cách khách" ─► Vào sân (chỉ xem)
Khách bấm chức năng cần ghi danh / ô chat ─► mở lại bảng "Chào mừng"
```

### 5.3 Nhân vật

Vẽ bằng canvas (`avatar.js`): áo sơ mi trắng có phù hiệu, quần âu hoặc chân váy xanh than, cặp sách.
Tuỳ chọn: dáng (nam/nữ), đồng phục, 6 kiểu tóc, 5 màu tóc, 5 màu da, 4 màu cặp. Có hoạt ảnh bước đi,
quay trái/phải, quay lưng khi đi lên. Thẻ tên hai dòng: tên + `K20 · Toán` (thẻ của mình màu đỏ).

### 5.4 Âm thanh và hiệu ứng

| Thành phần | Thiết kế | Yêu cầu |
|---|---|---|
| Nhạc nền 🎵 | `music` trong `main.js`: lần bấm đầu tạo `<iframe>` YouTube (`youtube-nocookie.com/embed/<id>?enablejsapi=1&autoplay=1&loop=1`) trong hộp nổi góc dưới trái; các lần sau gửi lệnh `playVideo`/`pauseVideo` qua `postMessage`; ✕ gỡ iframe. Đổi bài ở hằng số `MUSIC` | YC-AT-02, YC-AT-03 |
| Trống trường 🥁 | `beatDrum()`: 3 nhịp, mỗi nhịp một `OscillatorNode` sóng sine trượt 110 → 45 Hz trong 0,4 s, âm lượng tắt dần theo hàm mũ. `AudioContext` chỉ tạo khi người dùng bấm | YC-HD-09 |
| Bóng nước 🎈 | `World.throwBalloon`: quỹ đạo nội suy tuyến tính + cung `sin(πk)`, thời gian bay `450 + khoảng cách × 1,3` ms, bám theo vị trí hiện tại của mục tiêu; khi chạm: vòng nước + 10 giọt bắn trong 0,7 s; đặt `wet[id]` 4 s → `_wetFx` vẽ giọt nước rơi quanh người | YC-OL-07 |
| Bong bóng lời nói | `World.say(id, text)`: hiện 5 s trên đầu, cắt bớt chữ quá dài | YC-OL-05 |

Đồng bộ cú ném: người ném đặt `pendingThrow = {x, y, target}` và gửi kèm lượt `presence` kế tiếp. Máy chủ lưu
`throw` (kèm `at`) trong bản ghi presence 6 giây. Máy khác thấy `throw.at` mới thì diễn lại cú ném từ vị trí người
ném tới mục tiêu; nếu `target` là id của mình thì hiện thông báo "… vừa ném bóng nước trúng bạn!". Lần đầu thấy một
người, cú ném cũ hơn 4 giây bị bỏ qua để không diễn lại chuyện đã qua.

```
Người ném (A)            Máy chủ (presence)              Người bị ném (B)
   │ bấm 🎈                    │                               │
   │ diễn hoạt ảnh ngay        │                               │
   │── presence {throw} ──────►│ lưu throw.at (giữ 6 s)        │
   │                           │◄────────── presence ──────────│ (≤ 2,5 s sau)
   │                           │── others[A].throw ───────────►│ throw.at mới → diễn lại,
   │                           │                               │ target = B → ướt + thông báo
```

### 5.5 Sổ lưu bút

`bookSheet(owner)` dùng phòng lưu bút `so:<id chủ sổ>` (API `guestbook`/`sign` sẵn có). Trang 0 là bìa (logo, tên
chủ sổ, số trang), trang 1…n là từng lời lưu bút theo thứ tự cũ → mới, trang n+1 là trang viết. Giấy kẻ dòng
28 px bằng `repeating-linear-gradient`, lề đỏ, chữ viết tay **Pangolin** (Google Fonts, có tiếng Việt), rơi về
Be Vietnam Pro nếu không tải được font.

### 5.6 Ảnh kỷ yếu

```
📸 Chụp → đếm ngược 3·2·1 (presence: "📸 Cười lên nào!")
       → world.capture(640, 404, zoom 1.6): vẽ lại cảnh quanh nhân vật vào canvas riêng, bỏ nhãn/đường đi
       → composeYearbook(): khung 720 × 660 – viền xanh than, chỉ vàng, logo tròn, "KỶ YẾU",
         tên trường, ngày, khóa · lớp, ảnh, lời ghi (Pangolin), tên người trong ảnh (≤ 260 px quanh mình)
       → JPEG: ảnh lớn ≤ 720 px (≤ 290 KB base64), ảnh nhỏ 240 px (≤ 38 KB)
       → ⬇️ lưu về máy (<a download>) | 🖼️ albumPost {full, thumb, caption, people}
```

`world.capture` tạm thay `ctx`, kích thước, camera của `World` rồi gọi `_draw` với cờ `_capturing`, sau đó khôi phục.
Logo là file cùng nguồn nên canvas không bị "nhiễm bẩn" và xuất được JPEG.

### 5.7 Phong cách

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--navy` | `#1B2A4E` | Thanh trên, nhãn, tiêu đề |
| `--red` | `#D8343A` | Nút chính, phù hiệu, nhãn của mình |
| `--blue` | `#2F6FB5` | Liên kết, đường đi |
| `--gold` | `#F2B233` | Chữ trên biển, cảnh báo ngoại tuyến |
| `--bg` | `#F4F6FA` | Nền sheet |
| Font | Be Vietnam Pro 400/600/700/800 | Toàn bộ (hỗ trợ tiếng Việt tốt) |

#### Bảng màu cảnh vật (`world.js`)

Vẽ phẳng, màu ấm, bóng đổ mềm `rgba(20,30,50,.16)` lệch xuống dưới – phải, giống trang mẫu.

| Thành phần | Cách vẽ | Màu |
|---|---|---|
| Sân lát gạch | Ô 40 px, ô xen kẽ phủ màu đất nung nhạt, đường ron trắng | nền `#E7D9C4`, phủ `rgba(196,110,80,.18)` |
| Cỏ | Mẫu lặp 96 px (`grassPattern`) gồm vệt đậm nhạt + 46 nhúm cỏ | `#98CC7C` (bãi trống học: `#8CC36F`), nhúm `rgba(55,105,50,.32)` |
| Sân đá cầu | Nền đất nung, vạch trắng, lưới giữa | `#D98A5B`, viền `#C46A45` |
| Cây tán tròn | Thân + 5 vòng tròn: lớp tối lệch +3 px, lớp sáng phía trên; cây có hoa rắc hoa 5 cánh | thân `#8B6243`/`#A7795A`, tán `#4E9E55`/`#5DAA5E` → `#6CC06A`/`#7CC870`/`#76C27A` |
| Hoa (`flower5`) | 5 cánh tròn + nhụy | phượng `#F2544A`, bằng lăng `#C29BEA`, hoa sữa `#FFFFFF`, nhụy `#FFD45E` |
| Bồn hoa / bụi cây | Viền xanh đậm, nền `#7FB069`, hoa nhiều màu | `#6A9A55`, `#7FB069` |
| Ghế đá | Mặt + chân đá hoa cương hồng | `#E2B4A6`, `#C9978A`, `#B98579` |
| Ghế chào cờ | Ghế nhựa trắng, dải đỏ, biển lớp đỏ | `#FFFFFF`, `#D8343A`, `#C8343A` |
| Đèn sân | Cột xanh, chụp kem; tối thì có quầng sáng | `#2F6FB5`, `#FFF3C4` |
| Tường rào | Gạch đỏ, mũ tường trắng | `#C8553D`, `#F6F5F1` |
| Toà nhà | Mặt tường có vân dọc; cửa sổ khung trắng, kính xanh có vệt sáng, bệ cửa; tầng trệt cứ 4 ô có 1 cửa gỗ; mái có tường chắn mái (màu mái tối 18 %) và gạch lá nem ô bàn cờ; bồn nước + cục điều hoà trên mái dãy lớn | tường `#F4E2A6`, mái `#D9C9A0`, lan can dãy 4 tầng `#B5452F`, kính `#9CC3E6`, cửa `#8A5A35` |
| Nhà đa năng | Mái tôn xanh hai dốc có sóng, cửa lớn ở giữa, vòm trang trí | mái `#8FA3BF` |
| Căng tin | Mái cam | tường `#FFF1D6`, mái `#E08A4B` |

Màu trời theo giờ Việt Nam (`skyTint`): trước 5 h và sau 19 h 30 phủ `rgba(16,24,58,.50)` và bật đèn; 5–6 h
`rgba(60,50,110,.32)`; 6–7 h bình minh `rgba(255,170,120,.14)`; 7–16 h 30 không phủ; 16 h 30–18 h hoàng hôn
`rgba(255,140,60,.16)`; 18–19 h 30 chạng vạng `rgba(80,50,110,.32)` và bật đèn. Ban đêm cửa sổ sáng vàng `#FFD97A`.

### 5.8 Tiến trình người chơi (nhiệm vụ, thành tựu, ví)

Tất cả tính trên máy chủ (`logic.js`), máy khách chỉ hiển thị. Mỗi lần xác thực, `ensure(u, now)` bổ sung các
trường còn thiếu và đặt lại phần "hôm nay" khi sang ngày mới (5 giờ sáng giờ Việt Nam, `questDay`).

| Trường trong `user` | Ý nghĩa |
|---|---|
| `stats` | Bộ đếm trọn đời: `checkins, streak, bestStreak, classDays, buys, treats, gb, games, gameKinds[], sports80, perfect, hits, photos, flagWeeks, loveYes, events, diploma, flowers, zones[]` |
| `today` | Việc đã làm hôm nay: `checkin, classSit, buy, game, zones[], gb, treat, hit, hitCount, flower, loves` |
| `claimed` | Nhiệm vụ ngày đã nhận thưởng `{day, list[]}` |
| `achClaimed` | Thành tựu đã nhận |
| `ledger` | 30 giao dịch ví gần nhất `{at, amount, text}` – mọi thay đổi tiền đi qua `credit()` |

Nhiệm vụ ngày (`DAILY_QUESTS`) mỗi mục có hàm `done(today)`; thành tựu (`ACHIEVEMENTS`) có `stat` + ngưỡng `n`;
`tierState()` mở cấp sau khi đã nhận ≥ (số thành tựu của cấp − 1). `privateUser()` trả thêm `badge` = số phần
thưởng đang chờ, để thanh trên hiện chấm đỏ.

Sự kiện chỉ máy khách biết được gửi qua `act`: `zone` (vào khu mới, một lần mỗi khu mỗi phiên), `classSit`
(ngồi ghế trong lớp; chỉ tính đúng lớp của mình, thầy cô/khách lớp nào cũng được), `hit` (ném trúng bóng nước,
tối đa 40 lần/ngày), `diploma`. Các sự kiện khác (điểm danh, mua, đãi, viết lưu bút, chơi, đố vui, đăng ảnh,
đăng ký họp lớp) tự cộng trong handler tương ứng.

### 5.9 Hộp thư: đãi bạn và tỏ tình

```
B mua ở căng tin (buy {forUid: A})  ──►  inbox A: {kind: 'gift', fromName, icon, item}
B tỏ tình (love {to: A, line})      ──►  inbox A: {kind: 'love', id, fromName, line}
A trả lời (loveReply {id, ans})     ──►  inbox B: {kind: 'loveReply', fromName, ans}   (ans = 0 → B.stats.loveYes++)
Mỗi lượt presence trả kèm inbox của người gọi rồi xoá (nhận một lần).
```

### 5.10 Trò chơi theo vòng (`minigames.js`)

`runRounds(root, {tip, play, continueOnFail})` dựng khung chung: thẻ giới thiệu vòng → `play(stage, lv, done)` →
"Qua vòng! ✅ / Trượt rồi!" → kết quả (0–100 điểm, 20 điểm/vòng) → `score` lên máy chủ.

| Trò | Cơ chế | Độ khó theo vòng |
|---|---|---|
| ⚽ Sút penalty | Chạm vào khung thành; thủ môn chọn 1 trong 6 ô, đoán trúng ô của mình với xác suất | Thời gian 5 → 2,5 giây; thủ môn đoán đúng 20% → 60%; đá đủ 5 quả |
| 🏀 Bóng rổ | Thanh lực dao động; chạm khi vạch nằm trong vùng sáng và rổ gần giữa | Cần 2 → 4 quả trong 20 giây; vùng sáng hẹp dần; rổ chạy nhanh, xa hơn |
| 🧪 Pha chế | Chọn đúng 2 trong 6 lọ cho hiện tượng yêu cầu (12 phản ứng: kết tủa, đổi màu chỉ thị, sủi bọt…) | Mỗi vòng 1 phản ứng; chọn sai vẫn đi tiếp, đếm số đúng |
| 💣 Dò mìn | Ô đầu tiên luôn an toàn (mìn đặt sau lượt mở đầu), mở lan ô trống, chế độ cắm cờ | 5×5/3 mìn → 8×8/13 mìn |
| 👩‍🏫 Kiểm tra bài cũ | 2 câu đố môn chuyên của lớp, mỗi câu 5 điểm | – |

### 5.11 Nhân vật phụ, chuông trống, ngày/đêm, âm thanh

- `npcs.js`: NPC `{id, scene, name, sub, look, lines[], update(n, dt), panel}`; `walker(points)` cho đi qua lại giữa
  các điểm. `World` cập nhật NPC của cảnh hiện tại, cứ 9–21 giây NPC ở gần (≤ 500 px) nói một câu; chạm NPC →
  `npcSheet` (nói tiếp + hành động theo `panel`: vào nhà hiệu bộ, căng tin, đá cầu, pha chế, kiểm tra bài cũ).
- Chuông trống: `checkBell()` chạy mỗi 20 giây, so `periodOf()` với lần trước; đổi sang "Ra chơi" hoặc "Tiết …" thì
  hiện banner + âm thanh. Sáng thứ Hai mở trang thấy banner chào cờ với nút đưa tới đúng hàng ghế lớp mình.
- Ngày/đêm: `skyTint()` trả về màu phủ theo giờ Việt Nam (xem 5.7); `_draw` phủ màu đó lên
  cảnh có `lamps`, rồi vẽ quầng sáng đèn bằng `globalCompositeOperation = 'lighter'`; `drawBuilding` thắp cửa sổ.
  Lớp học không có `lamps` nên luôn sáng. Kiểm thử có thể ép `world.forceNight`.
- Âm thanh (`sound.js`): bộ dao động + nhiễu Web Audio cho `click, coin, pop, whoosh, splash, drum, bell, win,
  lose, shutter, heart`; âm lượng nhạc nền gửi `setVolume` cho trình phát YouTube qua `postMessage`; lưu ở
  `localStorage` (`ctn.sound`).
- Thẻ ảnh (`cards.js`): giấy chứng nhận 900 × 640 và thiệp tri ân 720 × 900 vẽ bằng canvas; `shareCanvas` dùng
  Web Share (gửi file) nếu máy hỗ trợ, nếu không thì tải về.

## 6. Kiến trúc

```
Trình duyệt                                   Cloudflare
┌────────────────────────────┐   POST /api/*  ┌──────────────────────────┐
│ main.js  (UI, luồng)       │ ─────────────► │ src/worker.js            │
│ world.js (canvas, A*)      │                │   ├─ logic.js (dùng chung)│
│ api.js ──┬─ online ────────┼────────────────┤   └─ D1: bảng kv          │
│          └─ offline: logic.js + localStorage│ Static assets: public/    │
└────────────────────────────┘                └──────────────────────────┘
```

Điểm chính: **`logic.js` là nguồn sự thật duy nhất** cho nghiệp vụ, chạy được cả trên Worker lẫn trong trình
duyệt. Nó chỉ làm việc qua giao diện kho dữ liệu `store`:

```js
store.get(t, k) · store.put(t, k, v) · store.del(t, k) · store.list(t, prefix, limit)  // đều async
```

- Worker cài `store` trên D1 (`d1Store` trong `src/worker.js`).
- `api.js` cài `store` trên `localStorage` cho **chế độ ngoại tuyến**: tự bật khi `POST /api/ping` thất bại
  (mở bằng máy chủ tĩnh, link artifact…). Giao diện hiện nhãn "Ngoại tuyến".
- Kiểm thử (`tests/logic.test.js`) cài `store` trong bộ nhớ.

### 6.1 Mô-đun phía trình duyệt

| File | Trách nhiệm |
|---|---|
| `main.js` | Khởi động, ghi danh, thanh trên/dưới, vòng đồng bộ, hộp thư, chuông trống, chuyển cảnh, toàn bộ bảng chức năng (nhiệm vụ, ví, online, âm thanh, căng tin, gửi xe, nhà hiệu bộ…), ảnh kỷ yếu + album, sổ lưu bút |
| `minigames.js` | Khung trò chơi 5 vòng + penalty, bóng rổ, pha chế hóa học, dò mìn, kiểm tra bài cũ |
| `cards.js` | Giấy chứng nhận, thiệp tri ân dạng ảnh, chia sẻ/tải về |
| `npcs.js` | Nhân vật phụ sân trường và cô chủ nhiệm từng lớp |
| `sound.js` | Hiệu ứng âm thanh Web Audio, cài đặt âm lượng |
| `classroom.js` | Cảnh lớp học: bố cục, vật cản, chỗ ngồi, điểm tương tác, vẽ bàn ghế/bảng đen |
| `world.js` | `Grid` (lưới va chạm 20 px, A* 8 hướng + làm mượt) theo từng cảnh, `CAMPUS_SCENE`, camera (căn giữa cảnh nhỏ), vẽ theo thứ tự y, nhãn, bong bóng lời nói, bóng nước, ngồi ghế, chụp ảnh (`capture`), bản đồ toàn cảnh |
| `campus.js` | Dữ liệu sơ đồ (mục 3) |
| `avatar.js` | Vẽ nhân vật (đứng, đi, quay lưng, ngồi), ảnh đại diện nhỏ |
| `games.js` | Đá cầu (canvas, trọng lực), câu hỏi đố vui theo môn |
| `ui.js` | Tạo phần tử an toàn (`textContent`), sheet, toast, tab |
| `api.js` | Phát hiện online/offline, gọi API, kho `localStorage` |
| `logic.js` | Nghiệp vụ, kiểm tra dữ liệu vào, điểm thi đua, thời khoá biểu |

### 6.2 Vòng lặp

| Việc | Chu kỳ |
|---|---|
| Vẽ canvas, di chuyển | `requestAnimationFrame`, tốc độ 190 px/giây |
| Đồng bộ vị trí (`presence` / `online` với khách) | 2,5 giây; người khác được nội suy mượt giữa hai lần |
| Đồng hồ, tiết học | 15 giây |
| Bản đồ toàn cảnh (khi mở) | 1,5 giây |

Không dùng WebSocket: đơn giản, chạy được trên gói miễn phí, đủ cho cộng đồng vài trăm người online.

## 7. Dữ liệu

Một bảng D1 duy nhất (`schema.sql`):

```sql
CREATE TABLE kv (t TEXT NOT NULL, k TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY (t, k));
```

`list(t, prefix)` truy vấn khoảng `k >= prefix AND k < prefix || U+FFFF`, dùng được chỉ mục khoá chính.

| `t` | `k` | `v` (JSON) |
|---|---|---|
| `user` | id | `{id, token, code, name, role, khoa, lop, school, look, wallet, points, lastCheckin, quizDay, quizCount, createdAt}` |
| `tok` | token | id người dùng |
| `code` | mã khôi phục `CTN-XXXX-XXXX` | id người dùng |
| `presence` | id | `{id, name, role, khoa, lop, school, look, x, y, zone, scene, sit, sitBack, dir, noBalloon, say, sayAt, throw: {x, y, target, at}, at}` |
| `inbox` | `uid nhận\|thời gian-id` | `{id, kind: gift\|love\|loveReply, from, fromName, …}` – xoá khi đã trả về |
| `love` | id | `{id, from, fromName, to, toName, line, ans?, at}` |
| `counter` | `flower\|ngày` | `{n}` – số bó hoa tặng thầy cô trong ngày |
| `flowerlog` | `thời gian-id` | `{name, khoa, lop, to, at}` |
| `photo` | `thời gian-id` | `{id, uid, by, khoa, lop, caption, people[], thumb, at}` – ảnh nhỏ cho album |
| `photofull` | id | `{id, full}` – ảnh lớn, chỉ tải khi xem |
| `gb` | `phòng\|thời gian-id` | `{id, room, uid, name, role, khoa, lop, body, at}` |
| `roster` | `phòng\|uid` | `{id, name, khoa, at}` – sổ đầu bài |
| `event` | id | `{id, title, date, time, place, note, khoa, lop, by, byId, joins[], at}` |
| `score` | `trò chơi\|uid` | `{id, name, khoa, lop, score, at}` |
| `buy` | `thời gian-id` | `{id, uid, name, item, emoji, price, forName, at}` |

Tên phòng lưu bút: `lop:<Lớp>:<Khóa>`, `so:<id người dùng>` (sổ lưu bút cá nhân), `gv`, `trian`, `kyniem`, `clb:<id>`, `ghe-da`, `san-khau`, `tronhoc`, `cong-phu`, `uocmo`. Bản ghi `user` có thêm `photoDay`, `photoCount` (giới hạn 5 ảnh/ngày).

## 8. API

Mọi chức năng là `POST /api/<action>`, thân là JSON, trả JSON. Chức năng cần ghi danh gửi
`Authorization: Bearer <token>`. Lỗi trả `{error}` với mã 400/401/404/413/500.

| Action | Ghi danh | Vào | Ra |
|---|---|---|---|
| `ping` | – | – | `{ok, school}` |
| `register` | – | `role, name, khoa, lop, school, look` | `{token, user}` |
| `recover` | – | `code` | `{token, user}` |
| `me` | ✔ | – | `{user}` |
| `look` | ✔ | `look, name` | `{user}` |
| `presence` | ✔ | `x, y, zone, scene, sit, sitBack, dir, noBalloon, say?, throw? {x, y, target}` | `{others[], inbox[], now}` – mỗi người kèm `say` và `throw` gần nhất (giữ 6 giây) |
| `online` | – | – | `{others[], now}` |
| `guestbook` | – | `room` | `{items[]}` (100 mới nhất) |
| `sign` | ✔ | `room, body` (≤ 600 ký tự) | `{item, user}` |
| `roster` | – | `room` | `{items[]}` |
| `attend` | ✔ | `room` (`lop:*`) | `{ok}` |
| `checkin` | ✔ | `transport` (xedap/xemay/oto/bus/dibo) | `{already, gained, bonus, streak, transport, user}` |
| `menu` | – | – | `{sale, items[]}` |
| `buy` | ✔ | `item, forUid?` (đãi bạn) | `{item, user}` |
| `purchases` | – | – | `{items[]}` (20 mới nhất) |
| `events` | – | – | `{items[]}` |
| `createEvent` | ✔ | `title, date (YYYY-MM-DD), time, place, note` | `{item, user}` |
| `joinEvent` | ✔ | `id` | `{item, joined, user}` |
| `quiz` | ✔ | `correct, total` | `{award, user}` |
| `score` | ✔ | `game, score` | `{best, user}` |
| `leaderboard` | – | `game` | `{items[]}` (top 20) |
| `khoaBoard` | – | – | `{khoa[], lop[]}` |
| `albumPost` | ✔ | `full, thumb` (JPEG data URL), `caption?`, `people[]?` | `{item, user}`; ≤ 5 ảnh/ngày, thân ≤ 400 KB |
| `album` | – | – | `{items[]}` (60 mới nhất, chỉ ảnh nhỏ) |
| `photo` | – | `id` | `{id, full}` |
| `act` | ✔ | `kind` (zone/classSit/hit/diploma), `value` | `{ok, msg, user}` |
| `quests` | ✔ | – | `{daily[], bonus, tiers[], achievements[], user}` |
| `claim` | ✔ | `kind` (daily/ach), `id` | `{user}` |
| `wallet` | ✔ | – | `{wallet, streak, ledger[], user}` |
| `flag` | ✔ | – | `{fresh, user}`; chỉ sáng thứ Hai |
| `flower` | ✔ | `to?` | `{fresh, today, user}` |
| `flowers` | – | – | `{today, recent[]}` |
| `love` | ✔ | `to, line` | `{ok}`; ≤ 10/ngày |
| `loveReply` | ✔ | `id, ans` | `{ok}` |

## 9. Bảo mật và riêng tư

- **Danh tính**: token ngẫu nhiên 24 ký tự (lưu `localStorage`) + mã khôi phục 8 ký tự. Không mật khẩu, không email.
  Ai có mã khôi phục là dùng được nhân vật – người dùng được nhắc cất kỹ.
- **Chống chèn mã**: giao diện chỉ gắn nội dung người dùng bằng `textContent` (hàm `h()` trong `ui.js`), không dùng `innerHTML`.
- **Kiểm tra dữ liệu vào** trong `logic.js`: cắt độ dài (tên 40, lưu bút 600, lời nói 80…), chuẩn hoá khóa, chỉ nhận
  lớp/vai/món ăn trong danh sách, giới hạn toạ độ. Worker từ chối thân request > 8 KB và phương thức khác POST.
- Bảng handler tra bằng `hasOwnProperty`, nên `/api/toString` và tên lạ trả 404.
- `robots.txt` chặn `/api/`. Trang giới thiệu nhắc không đăng số điện thoại, địa chỉ.
- **Chưa có** (rủi ro đã biết): giới hạn tần suất gọi API, kiểm duyệt/xoá lưu bút, chặn người dùng. Ví và điểm
  có thể bị "cày" bằng script. Xem mục 11.

## 10. Kiểm thử và triển khai

| Lệnh | Việc |
|---|---|
| `npm test` | 13 nhóm kiểm thử nghiệp vụ (`node --test`): ghi danh, presence (cảnh, ngồi, ném bóng), album, chuỗi điểm danh và ví, nhiệm vụ & thành tựu, hộp thư đãi bạn/tỏ tình, chào cờ, tặng hoa… |
| `npm run db:init` + `npm run dev` | Worker + D1 cục bộ, `http://localhost:8787` |
| `npx wrangler dev --ip 0.0.0.0` | Cho điện thoại cùng Wi-Fi truy cập |
| `npm run static` | Chỉ giao diện, chế độ ngoại tuyến, `http://localhost:8080` |
| `npx wrangler d1 create ctn` → `npm run db:init:remote` → `npm run deploy` | Đưa lên Cloudflare |

Kiểm thử thủ công đã chạy bằng Playwright (Chromium giả lập iPhone 13 và máy tính): hai người chơi và một
khách cùng lúc; ghi danh, thấy nhau online, lời nói và cú ném bóng nước hiện cho người khác, lưu bút lớp,
điểm danh, mua đồ, tạo họp lớp, đá cầu, bảng thi đua, đi tới từng địa điểm qua bản đồ toàn cảnh, nút nhạc;
không có lỗi JavaScript. Khi đổi sơ đồ, chạy script tìm đường tới mọi điểm tương tác và chỗ ngồi của sân trường và lớp học (YC-SD-09). Lần này còn chạy: 2 người vào lớp Toán thấy nhau, ngồi ghế, chọn người ném bóng, mở đố vui ở bảng đen, ra lớp về đúng cửa, ngồi ghế đá, chụp và đăng ảnh kỷ yếu, xem album, ký sổ lưu bút.
Bảng truy vết yêu cầu → mã → kiểm thử: [YEU-CAU.md mục 7](YEU-CAU.md#7-truy-vết-yêu-cầu--mã-nguồn--kiểm-thử).

**Chưa kiểm thử:** thiết bị Android/iOS thật, tiếng nhạc YouTube và tiếng trống thật, triển khai thật lên Cloudflare.

## 11. Hướng phát triển

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| Cao | Thêm cửa phòng thí nghiệm, thư viện, phòng học bộ môn | Chỉ sửa `campus.js` |
| Cao | Giới hạn tần suất API, nút báo cáo/xoá lưu bút, trang quản trị (YC-PN-12) | Cần trước khi công bố rộng |
| Cao | Thay `confirm()` của nút "Thoát nhân vật" bằng bước xác nhận trong trang (YC-DT-07) | `confirm()` bị chặn trong khung nhúng |
| Trung bình | Thay CLB, câu đố, thực đơn bằng nội dung thật của trường | Hiện là nội dung mẫu |
| Trung bình | Album ảnh kỷ yếu, giấy chứng nhận kỷ niệm | Cần R2 để lưu ảnh |
| Thấp | Durable Objects + WebSocket cho chuyển động thời gian thực | Khi > vài trăm người online |
| Thấp | Đóng gói APK bằng Capacitor / TWA | |

---

*Trang cộng đồng do cựu học sinh xây dựng, không phải website chính thức của nhà trường.*
