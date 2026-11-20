# Tài liệu thiết kế – Trường THPT Chuyên Thái Nguyên · Họp lớp online

| | |
|---|---|
| Phiên bản | 1.1 – sơ đồ theo bản vẽ của cựu học sinh |
| Nhánh | `claude/thpt-chuyen-thai-nguyen-srs08f` |
| Sản phẩm tham khảo | [thpt.chuyenhalong.workers.dev](https://thpt.chuyenhalong.workers.dev/) |
| Nền tảng | Trình duyệt (điện thoại là chính) · Cloudflare Workers + D1 |

---

## 1. Mục tiêu

Một **sân trường ảo** dựng lại cơ sở cũ của THPT Chuyên Thái Nguyên tại **234A đường Lương Ngọc Quyến,
phường Quang Trung, TP Thái Nguyên** (trường học tại đây giai đoạn 1995–2019). Người dùng tạo nhân vật
mặc đồng phục, đi dạo trong trường, gặp người khác đang online, ghé lớp cũ viết lưu bút, hẹn họp lớp và
thi đua giữa các khóa.

**Mục tiêu chính**

1. Vào chơi trong vòng 1 phút, không mật khẩu, chạy tốt trên điện thoại.
2. Gợi nhớ không gian trường cũ: cổng xanh, nhà hiệu bộ, dãy 3–4–5 tầng, sân trường cao có bậc thang, sân đá cầu, nhà đa năng, căng tin.
3. Kết nối các thế hệ: lưu bút theo lớp và khóa, lịch họp lớp, bảng thi đua.
4. Chi phí vận hành gần bằng 0 (gói miễn phí của Cloudflare).

**Ngoài phạm vi (phiên bản này)**

- Tài khoản có mật khẩu, đăng nhập mạng xã hội.
- Chat riêng tư, tin nhắn 1–1, gửi ảnh.
- Trang quản trị, kiểm duyệt nội dung.
- Ứng dụng cài đặt (APK/iOS).

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
| `GROUNDS` | Mặt đất: đường, vỉa hè, sân bê tông, bãi cỏ, sân đá cầu (`court`), sân trường (`yard`) |
| `BUILDINGS` | Toà nhà: `id, name, short, x, y, w, h, floors, wall, roof` + tuỳ chọn `trim` (lan can đỏ dãy 4 tầng), `bands` (dải xanh nhà hiệu bộ), `hall` (mái nhà đa năng). Nhà chữ L tách thành nhiều khối cùng `id`; chỉ khối có `short` mới vẽ tên |
| `YARD`, `STAIRS`, `EDGES` | Sân trường cao; hai bậc thang ở cạnh trái (xuống sân đá cầu, bậc thang chính); tường chắn là vật cản, chừa chỗ bậc thang |
| `WALLS`, `GATE`, `SIDE_GATE` | Tường rào thấp màu kem, cổng chính (x 693–1130), cổng phụ bên trái |
| `CLASS_DOORS` | Cửa lớp: lớp chuyên nào ở dãy nào, vị trí đứng trước cửa |
| `HOTSPOTS` | Điểm tương tác: toạ độ, biểu tượng, nhãn, nhãn ngắn trên bản đồ (`map`), bảng cần mở (`panel`) |
| `TREES` (`palm`, `bonsai`, `tree`), `LAMPS`, `BENCHES`, `FLAG`, `BOARD`, `STAGE` | Trang trí; gốc cây, cột cờ, bảng tin, bục sân khấu là vật cản |

Lối đi chính: cổng → khoảng sân trước dãy 5 tầng → **lối vào** giữa nhà hiệu bộ và dãy 5 tầng → **bậc thang
chính** lên sân trường (sân chỉ lên được bằng hai bậc thang bên trái). Căng tin và chỗ trốn học đi vòng phía
Đông nhà đa năng.

Phân bổ lớp (theo cựu học sinh, `CLASS_DOORS`): **dãy 4 tầng** trái → phải – Toán, Lý (chân chữ L), Hóa, Sinh,
Văn, Trung; **dãy 3 tầng** trái → phải – Anh, Sử, Địa; **dãy 5 tầng** phải → trái – Tin, Nga, Pháp (cửa quay ra cổng).

## 4. Chức năng

| Địa điểm | Bảng (`panel`) | Chức năng | Cần ghi danh |
|---|---|---|---|
| Cổng trường | `gate` | Giới thiệu cơ sở cũ, hướng dẫn | Không |
| Bác bảo vệ | `guard` | Câu thoại ngẫu nhiên | Không |
| Gửi xe (trái cổng) | `parking` | Điểm danh mỗi ngày: +20.000đ vào ví, +2 điểm | Có |
| Bảng tin | `board` | Bảng thi đua theo khóa, theo lớp chuyên, đá cầu | Không |
| Sân khấu | `stage` | "Hiền tài là nguyên khí của quốc gia", lưu bút chào cờ/văn nghệ | Ghi: có |
| Sân trường · ghế đá | `garden` | Lưu bút tâm sự | Ghi: có |
| Nhà hiệu bộ | `office` | Lịch họp lớp (tạo, đăng ký/huỷ), thiệp tri ân thầy cô | Ghi: có |
| Phòng giáo viên | `teachers` | Lưu bút `gv` | Ghi: có |
| Phòng truyền thống | `history` | Mốc lịch sử cơ sở, góc kỷ niệm | Ghi: có |
| Cửa lớp | `class` | Chọn khóa → Lưu bút · Sổ đầu bài · Đố vui | Ghi: có |
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
│ [CTN] Sân trường        ●3  💰 20k 🙂 │  ← nơi đang đứng · giờ · tiết; online; ví / Ghi danh
│       14:07 · Tiết 1 chiều            │
├──────────────────────────────────────┤
│                                      │
│        canvas sân trường             │  ← chạm để đi, chạm nhãn để mở
│                                  (+) │
│                                  (−) │
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

### 5.4 Phong cách

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--navy` | `#1B2A4E` | Thanh trên, nhãn, tiêu đề |
| `--red` | `#D8343A` | Nút chính, phù hiệu, nhãn của mình |
| `--blue` | `#2F6FB5` | Liên kết, đường đi |
| `--gold` | `#F2B233` | Chữ trên biển, cảnh báo ngoại tuyến |
| `--bg` | `#F4F6FA` | Nền sheet |
| Font | Be Vietnam Pro 400/600/700/800 | Toàn bộ (hỗ trợ tiếng Việt tốt) |

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
| `main.js` | Khởi động, ghi danh, thanh trên/dưới, vòng đồng bộ, toàn bộ bảng chức năng |
| `world.js` | Lưới va chạm 20 px, tìm đường A* 8 hướng + làm mượt, camera, vẽ theo thứ tự y, nhãn, bong bóng lời nói, bản đồ toàn cảnh |
| `campus.js` | Dữ liệu sơ đồ (mục 3) |
| `avatar.js` | Vẽ nhân vật, ảnh đại diện nhỏ |
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
| `presence` | id | `{id, name, role, khoa, lop, school, look, x, y, zone, say, sayAt, at}` |
| `gb` | `phòng\|thời gian-id` | `{id, room, uid, name, role, khoa, lop, body, at}` |
| `roster` | `phòng\|uid` | `{id, name, khoa, at}` – sổ đầu bài |
| `event` | id | `{id, title, date, time, place, note, khoa, lop, by, byId, joins[], at}` |
| `score` | `trò chơi\|uid` | `{id, name, khoa, lop, score, at}` |
| `buy` | `thời gian-id` | `{id, uid, name, item, emoji, price, forName, at}` |

Tên phòng lưu bút: `lop:<Lớp>:<Khóa>`, `gv`, `trian`, `kyniem`, `clb:<id>`, `ghe-da`, `san-khau`, `tronhoc`, `cong-phu`, `uocmo`.

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
| `presence` | ✔ | `x, y, zone, say?` | `{others[], now}` |
| `online` | – | – | `{others[], now}` |
| `guestbook` | – | `room` | `{items[]}` (100 mới nhất) |
| `sign` | ✔ | `room, body` (≤ 600 ký tự) | `{item, user}` |
| `roster` | – | `room` | `{items[]}` |
| `attend` | ✔ | `room` (`lop:*`) | `{ok}` |
| `checkin` | ✔ | – | `{already, gained, user}` |
| `menu` | – | – | `{sale, items[]}` |
| `buy` | ✔ | `item, forName?` | `{item, user}` |
| `purchases` | – | – | `{items[]}` (20 mới nhất) |
| `events` | – | – | `{items[]}` |
| `createEvent` | ✔ | `title, date (YYYY-MM-DD), time, place, note` | `{item, user}` |
| `joinEvent` | ✔ | `id` | `{item, joined, user}` |
| `quiz` | ✔ | `correct` | `{award, user}` |
| `score` | ✔ | `game, score` | `{best, user}` |
| `leaderboard` | – | `game` | `{items[]}` (top 20) |
| `khoaBoard` | – | – | `{khoa[], lop[]}` |

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
| `npm test` | 7 bài kiểm thử nghiệp vụ (`node --test`) |
| `npm run db:init` + `npm run dev` | Worker + D1 cục bộ, `http://localhost:8787` |
| `npx wrangler dev --ip 0.0.0.0` | Cho điện thoại cùng Wi-Fi truy cập |
| `npm run static` | Chỉ giao diện, chế độ ngoại tuyến, `http://localhost:8080` |
| `npx wrangler d1 create ctn` → `npm run db:init:remote` → `npm run deploy` | Đưa lên Cloudflare |

Kiểm thử thủ công đã chạy bằng Playwright: hai người chơi (điện thoại + máy tính) và một khách cùng lúc;
ghi danh, thấy nhau online, lời nói hiện cho người khác, lưu bút lớp, điểm danh, mua đồ, tạo họp lớp,
đá cầu, bảng thi đua, bản đồ toàn cảnh; không có lỗi JavaScript.

## 11. Hướng phát triển

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| Cao | Thêm cửa phòng thí nghiệm, thư viện, phòng học bộ môn | Chỉ sửa `campus.js` |
| Cao | Giới hạn tần suất API, nút báo cáo/xoá lưu bút, trang quản trị | Cần trước khi công bố rộng |
| Trung bình | Thay CLB, câu đố, thực đơn bằng nội dung thật của trường | Hiện là nội dung mẫu |
| Trung bình | Nhạc nền, ném bóng nước 🎈 như trang mẫu | |
| Trung bình | Album ảnh kỷ yếu, giấy chứng nhận kỷ niệm | Cần R2 để lưu ảnh |
| Thấp | Durable Objects + WebSocket cho chuyển động thời gian thực | Khi > vài trăm người online |
| Thấp | Đóng gói APK bằng Capacitor / TWA | |

---

*Trang cộng đồng do cựu học sinh xây dựng, không phải website chính thức của nhà trường.*
