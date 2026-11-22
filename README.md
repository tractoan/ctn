# Trường THPT Chuyên Thái Nguyên – Họp lớp online

Sân trường ảo dựng theo **cơ sở 234A đường Lương Ngọc Quyến, phường Quang Trung, TP Thái Nguyên**
(nơi trường học từ năm 1995 đến 2019). Người dùng tạo nhân vật mặc đồng phục, dạo quanh sân trường,
ghé lớp cũ, viết lưu bút, đăng ký họp lớp và thi đua giữa các khóa.

![Sơ đồ sân trường](docs/so-do.png)

## Có gì trong sân trường

| Địa điểm | Chức năng |
|---|---|
| Cổng trường (xanh, biển trắng chữ đỏ), bác bảo vệ | Giới thiệu, gửi xe điểm danh mỗi ngày nhận 20k ăn vặt |
| **Nhà hiệu bộ** (4 tầng, sơn xanh trắng) | Lịch họp lớp (tạo, đăng ký), tri ân thầy cô, phòng giáo viên, phòng truyền thống |
| **Dãy nhà 5 tầng** (ngay sau cổng) | Lớp chuyên (phải → trái) Tin, Nga, Pháp – cửa ở mặt trong, quay vào sân trường |
| **Dãy nhà 4 tầng** (chữ L, hàng cây phượng – bằng lăng) | Lớp chuyên (trái → phải) Toán, Lý, Hóa, Sinh, Văn, Trung |
| **Dãy nhà 3 tầng** | Lớp chuyên (trái → phải) Anh, Sử, Địa |
| Trong mỗi lớp | Chạm cửa lớp (có biển tên) để vào phòng: bảng lớp (lưu bút, sổ đầu bài, đố vui, kiểm tra bài cũ, kiểm tra vở, nộp sổ), Nội quy, 5 điều Bác Hồ dạy, 36 chỗ ngồi (ngồi là ký sổ có mặt), hành lang, ban công; thấy bạn đang ở cùng lớp |
| Sân trường (cao, có bậc thang) | Sân khấu có cột cờ ở giữa, bảng tin thi đua theo khóa/lớp, ghế đá; trống trường giữa dãy 5 tầng (bấm để đánh trống) |
| Sân đá cầu | Trò đá cầu có bảng xếp hạng |
| Nhà đa năng | Gian các CLB |
| Căng tin | Thực đơn có giá, mua và đãi bạn; giờ ra chơi thật (9:25–9:45, 15:55–16:15) giảm 20% |
| Chỗ trốn học đá bóng, cổng phụ, tường "Ước mơ vào Chuyên" | Góc lưu bút kỷ niệm |

Giao diện theo kiểu trang mẫu [thpt.chuyenhalong.workers.dev](https://thpt.chuyenhalong.workers.dev/):
vào là thấy ngay sân trường với tư cách khách; muốn viết lưu bút, điểm danh, mua đồ, trò chuyện tự do thì bấm
**Ghi danh** (cựu học sinh, học sinh, thầy cô, bạn trường khác, em cấp 2). Thanh trên hiện nơi đang đứng,
giờ Việt Nam và tiết học hiện tại; thanh dưới có câu nói nhanh, biểu cảm, ô chat và nút 🗺️ mở bản đồ toàn trường
(chạm vào đâu trên bản đồ thì nhân vật tự đi tới đó).

**Nhạc nền** tự phát khi vào trường, 3 bài lần lượt rồi lặp lại: *Hanoi n U (beat)* → *Tháng 5 không trở lại* →
*Ngày ấy bạn và tôi* (file trong `public/music/`, danh sách ở hằng số `PLAYLIST` trong `public/js/main.js`).
Nút 🎵 mở bảng chọn bài, ⏮ ⏯ ⏭ và âm lượng. Lưu ý: đây là các bài hát có bản quyền, cần có quyền sử dụng
trước khi đưa trang lên mạng công khai.

**Các phòng bên trong** (giống trang mẫu): chạm cửa thư viện, phòng máy, phòng thí nghiệm, nhà hiệu bộ, căng tin,
nhà đa năng để vào hẳn trong phòng có bàn ghế, nhân vật và hoạt động riêng (`public/js/rooms.js`).

Nút 🎈 bên phải mở danh sách người đang online để **chọn người ném bóng nước** vào; người bị ném trúng ướt sũng
vài giây, mọi người cùng thấy. Nút 📸 **chụp ảnh kỷ yếu** có khung logo trường, lưu về máy hoặc đăng album chung.
Mỗi người có một **sổ lưu bút** dạng quyển sổ để bạn bè ký vào. Chạm vào **ghế đá** (hoặc ghế trong lớp) để ngồi.
Sân trường có bồn hoa, phượng, bằng lăng, hoa sữa.

**Giống trang mẫu**: nhiệm vụ hằng ngày và 37 thành tựu theo cấp (📜), ví ăn vặt có lịch sử, chọn phương tiện đến
trường và chuỗi đi học, đãi bạn và tỏ tình (có thông báo cho người nhận), 48 ghế chào cờ thứ Hai theo lớp, chuông
trống giờ ra chơi/vào lớp, tặng hoa và thiệp tri ân 20/11, giấy chứng nhận tốt nghiệp kỷ niệm, 4 trò chơi 5 vòng
(penalty, bóng rổ, pha chế hóa học, dò mìn), cô chủ nhiệm kiểm tra bài cũ, nhân vật phụ biết nói, khung chat,
danh sách người online, khiên chặn bóng nước, ngày/đêm theo giờ thật, chỉnh âm lượng, áo dài – vest kỷ yếu –
khăn quàng đỏ.

Điều khiển: chạm/nhấp vào sân để đi (tự tìm đường quanh các dãy nhà), chạm nhãn để mở,
trên máy tính dùng thêm phím mũi tên / WASD, cuộn chuột để phóng to/thu nhỏ.
Tạo nhân vật 4 bước như trang mẫu (vai → thông tin → chọn ngoại hình → tên). Không cần mật khẩu: mỗi nhân vật có **mã khôi phục** `CTN-XXXX-XXXX` để dùng lại trên máy khác.

Tài liệu: [yêu cầu](docs/YEU-CAU.md) (cần làm gì, tiêu chí chấp nhận, trạng thái) · [thiết kế](docs/THIET-KE.md) (làm như thế nào).

## Sửa sơ đồ cho đúng thực tế

Sơ đồ dựng theo bản vẽ tay của cựu học sinh ([`docs/so-do-goc.jpg`](docs/so-do-goc.jpg)), nhân hệ số 1,6.
Toàn bộ nằm trong [`public/js/campus.js`](public/js/campus.js): toạ độ, kích thước các dãy nhà
(`BUILDINGS`), sân trường cao và bậc thang (`YARD`, `STAIRS`, `EDGES`), cửa lớp và lớp chuyên của từng dãy
(`CLASS_DOORS`), điểm tương tác (`HOTSPOTS`), cây cối. Hướng Bắc ở trên, đường Lương Ngọc Quyến ở dưới.
Sửa các con số là va chạm, tìm đường, bản đồ toàn cảnh tự cập nhật theo.

## Cấu trúc

```
public/            giao diện tĩnh (không cần build)
  index.html, style.css, pages/gioi-thieu.html
  js/campus.js     dữ liệu sơ đồ trường
  js/world.js      vẽ canvas 2D, camera, tìm đường A*, người chơi khác
  js/avatar.js     vẽ nhân vật chibi (13 kiểu tóc, 8 màu tóc, trang phục theo vai)
  js/main.js       luồng tạo nhân vật và các bảng chức năng
  js/rooms.js      6 phòng bên trong: thư viện, phòng máy, phòng thí nghiệm, nhà hiệu bộ, căng tin, nhà đa năng
  music/           3 bài nhạc nền (MP3)
  js/games.js      đá cầu, câu hỏi đố vui
  js/logic.js      nghiệp vụ dùng chung cho server và chế độ ngoại tuyến
  js/api.js        gọi /api; nếu không có server thì chạy logic.js trên localStorage
src/worker.js      Cloudflare Worker: phục vụ file tĩnh + API /api/<chức năng> trên D1
schema.sql         bảng D1
tests/             kiểm thử nghiệp vụ (node --test)
```

## Chạy thử

```bash
npm install
npm test                 # kiểm thử nghiệp vụ

# Cách 1: đầy đủ (Worker + D1 cục bộ, nhiều người chơi thấy nhau)
npm run db:init
npm run dev              # http://localhost:8787

# Cách 2: chỉ giao diện, chế độ ngoại tuyến (dữ liệu lưu trong trình duyệt)
npm run static           # http://localhost:8080
```

## Triển khai lên Cloudflare

```bash
npx wrangler login
npx wrangler d1 create ctn          # dán database_id vào wrangler.toml
npm run db:init:remote
npm run deploy                      # https://thpt.<subdomain>.workers.dev
# Đặt subdomain workers.dev là "chuyenthainguyen" (Workers & Pages → Settings) để có thpt.chuyenthainguyen.workers.dev
npx wrangler secret put ADMIN_CODE  # nhập mã quản trị (dài, khó đoán) khi được hỏi
```

**Mã quản trị** dùng cho bảng *🔑 Quản trị: sửa tên thầy cô hàng loạt* (mở từ ảnh đại diện → Nhân vật của tôi, từ bảng sửa
tên thầy cô, hoặc vào thẳng `https://<địa chỉ trang>/?quantri`). Mã lưu trong biến bí mật `ADMIN_CODE` của Cloudflare,
không nằm trong mã nguồn. Đổi mã: chạy lại `npx wrangler secret put ADMIN_CODE`. Chạy thử trên máy với `npm run dev`:
tạo file `.dev.vars` có dòng `ADMIN_CODE=...` (file này đã được `.gitignore`). Ở chế độ chỉ giao diện (`npm run static`)
và trên link chạy thử, mã là `DEMO` (dữ liệu chỉ nằm trên trình duyệt đó). Nhập sai 10 lần trong 1 giờ thì bị khoá 1 giờ.

Ghi chú: vị trí người chơi được đồng bộ bằng cách hỏi máy chủ mỗi 2,5 giây (không dùng WebSocket),
bảng thi đua tính trên toàn bộ người dùng – phù hợp cộng đồng vài trăm đến vài nghìn người.

---

Trang cộng đồng do cựu học sinh xây dựng, **không phải website chính thức của nhà trường**
(xem [thptchuyenthainguyen.edu.vn](https://thptchuyenthainguyen.edu.vn)).
