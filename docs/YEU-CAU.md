# Tài liệu yêu cầu – Trường THPT Chuyên Thái Nguyên · Họp lớp online

| | |
|---|---|
| Phiên bản | 2.3 – sửa nhạc tự phát trên điện thoại, bỏ danh sách bài, điện thoại nhìn rộng hơn |
| Nhánh | `claude/thpt-chuyen-thai-nguyen-srs08f` |
| Tài liệu liên quan | [Tài liệu thiết kế](THIET-KE.md) · [README](../README.md) |
| Sản phẩm tham khảo | [thpt.chuyenhalong.workers.dev](https://thpt.chuyenhalong.workers.dev/) |

Tài liệu này mô tả **cần làm gì**: mục tiêu, người dùng, yêu cầu chức năng, yêu cầu phi chức năng và tiêu chí
chấp nhận. **Làm như thế nào** nằm trong [tài liệu thiết kế](THIET-KE.md).

Mỗi yêu cầu có mã (`YC-…`), mức ưu tiên và trạng thái:

| Ưu tiên | Nghĩa | | Trạng thái | Nghĩa |
|---|---|---|---|---|
| **P1** | Bắt buộc, thiếu thì sản phẩm không dùng được | | ✅ | Đã làm và đã kiểm thử |
| **P2** | Nên có, tạo nên trải nghiệm | | 🟡 | Đã làm một phần / chưa kiểm thử đủ |
| **P3** | Có thì tốt | | ⬜ | Chưa làm |

---

## 1. Bối cảnh và mục tiêu

Trường THPT Chuyên Thái Nguyên học tại cơ sở **234A đường Lương Ngọc Quyến, TP Thái Nguyên** từ năm 1995 đến 2019,
sau đó chuyển về cơ sở mới. Nhiều thế hệ học sinh muốn có một nơi để "về lại trường cũ", gặp bạn, viết lưu bút,
hẹn họp lớp. Sản phẩm là một **sân trường ảo trên trình duyệt**, lấy cảm hứng từ trang họp lớp online của THPT
Chuyên Hạ Long.

| Mã | Mục tiêu | Đo bằng |
|---|---|---|
| MT-1 | Vào chơi nhanh, không rào cản | Từ lúc mở trang tới lúc đi lại trong sân ≤ 1 phút; không mật khẩu |
| MT-2 | Gợi nhớ đúng không gian trường cũ | Sơ đồ khớp bản vẽ của cựu học sinh (`docs/so-do-goc.jpg`) |
| MT-3 | Kết nối các thế hệ | Lưu bút theo lớp và khóa, lịch họp lớp, thi đua giữa các khóa |
| MT-4 | Chi phí vận hành gần bằng 0 | Chạy trong gói miễn phí của Cloudflare với vài trăm người dùng |

**Ngoài phạm vi phiên bản này:** tài khoản có mật khẩu hoặc đăng nhập mạng xã hội; tin nhắn riêng 1–1; gửi ảnh;
trang quản trị và kiểm duyệt; ứng dụng cài đặt (APK/iOS); website chính thức của nhà trường.

## 2. Các bên liên quan và người dùng

| Vai | Mô tả | Cần gì |
|---|---|---|
| Cựu học sinh | Đã ra trường, nhóm người dùng chính | Tìm bạn cùng lớp/khóa, viết lưu bút, hẹn họp lớp |
| Học sinh đang học | Đang học tại trường | Giao lưu, thi đua cho khóa mình |
| Thầy cô | Đang hoặc đã công tác tại trường | Nhắn gửi học trò, nhận lời tri ân |
| Bạn trường khác | Học sinh THPT khác | Tham quan, giao lưu |
| Em cấp 2 | Học sinh THCS | Tham quan, viết "Ước mơ vào Chuyên" |
| Khách chưa ghi danh | Mới mở trang | Xem trước khi quyết định tạo nhân vật |
| Người vận hành | Cựu học sinh dựng và duy trì trang | Triển khai dễ, chi phí thấp, sửa sơ đồ dễ |

Lớp chuyên: Toán, Tin, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh, Nga, Pháp, Trung. Khóa ghi dạng `K1` … `K99`.

## 3. Ca sử dụng chính

| Mã | Ca sử dụng | Tác nhân | Luồng chính |
|---|---|---|---|
| CSD-1 | Vào xem trường | Khách | Mở trang → chọn "Vào xem với tư cách khách" → đi dạo, mở bản đồ, đọc lưu bút |
| CSD-2 | Tạo nhân vật | Mọi vai | Chọn vai → nhập tên (khóa, lớp) → chọn đồng phục → lưu mã khôi phục → vào sân |
| CSD-3 | Dùng lại nhân vật trên máy khác | Người đã ghi danh | "Tôi đã có nhân vật" → nhập mã `CTN-XXXX-XXXX` |
| CSD-4 | Về lớp cũ | Cựu học sinh | Mở bản đồ → chọn lớp → nhân vật tự đi tới cửa → đọc/viết lưu bút khóa mình, xem sổ đầu bài |
| CSD-5 | Hẹn họp lớp | Cựu học sinh | Vào nhà hiệu bộ → tạo buổi họp lớp → bạn bè đăng ký tham gia |
| CSD-6 | Gặp bạn đang online | Người đã ghi danh | Thấy nhân vật khác → chạm để xem → vẫy tay / nói / ném bóng nước |
| CSD-7 | Thi đua cho khóa | Mọi người đã ghi danh | Điểm danh, viết lưu bút, đố vui, đá cầu → điểm cộng cho khóa và lớp |

## 4. Yêu cầu chức năng

### 4.1 Danh tính và ghi danh

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-DT-01 | Người mới mở trang thấy ngay sân trường và bảng chào mừng; có thể vào xem với tư cách khách mà không cần ghi danh | P1 | ✅ |
| YC-DT-02 | Ghi danh không cần mật khẩu hay email, 4 bước như trang mẫu: chọn 1 trong 5 vai → thông tin (cựu học sinh/học sinh **chọn khóa** trong danh sách và **chọn lớp chuyên** bằng nút; thầy cô chọn **Thầy/Cô** và nhập bộ môn; bạn trường khác/em cấp 2 nhập trường, không bắt buộc, ≤ 60 ký tự) → chọn ngoại hình → tên hiển thị (2–40 ký tự, có xem trước nhân vật và dòng tóm tắt) | P1 | ✅ |
| YC-DT-03 | Khóa nhập "20" hoặc "k20" đều được chuẩn hoá thành `K20`; khóa sai định dạng bị từ chối với thông báo rõ | P1 | ✅ |
| YC-DT-04 | Sau khi ghi danh, hiển thị **mã khôi phục** dạng `CTN-XXXX-XXXX` kèm nút sao chép; nhập mã này trên máy khác sẽ lấy lại đúng nhân vật (không phân biệt hoa thường) | P1 | ✅ |
| YC-DT-05 | Nhân vật được nhớ trên trình duyệt; mở lại trang là vào thẳng, không phải ghi danh lại | P1 | ✅ |
| YC-DT-06 | Khách bấm vào chức năng cần ghi danh (viết, mua, điểm danh, chat tự do…) thì được mời ghi danh, không báo lỗi khó hiểu | P1 | ✅ |
| YC-DT-07 | Người dùng có thể "Thoát nhân vật" trên máy, có xác nhận trước | P3 | 🟡 |

**Tiêu chí chấp nhận YC-DT-04:** đăng ký trên trình duyệt A, lấy mã; mở trình duyệt B, nhập mã bằng chữ thường →
vào đúng nhân vật, cùng tên, cùng ví, cùng điểm.

> YC-DT-07: hộp xác nhận dùng `confirm()` của trình duyệt; trên link chạy thử trong Claude hộp này không hiện nên
> nút không có tác dụng. Cần thay bằng bước xác nhận trong trang.

### 4.2 Nhân vật

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-NV-01 | Nhân vật kiểu chibi đầu to giống trang mẫu; mặc định đồng phục sơ mi trắng cà vạt, quần âu hoặc chân váy xanh than | P1 | ✅ |
| YC-NV-02 | Bộ chọn ngoại hình giống trang mẫu: khung xem trước có hoạt ảnh + nút 🎲 Ngẫu nhiên; Giới tính, Màu da (5), **Kiểu tóc (13)**: Ngắn, Rẽ ngôi, Tóc bob, Đuôi ngựa, Tóc dài, Búi cao, Rẽ ngôi 3/7, Đan Trường, Mullet, Undercut, Short quiff, Layer, Hai bím; **Màu tóc (8)** gồm Balayage; Kiểu dáng Quần/Váy (nữ); **Trang phục theo vai**; màu áo lớp | P1 | ✅ |
| YC-NV-07 | Nhân vật tạo trước bản 1.4 tự đổi sang kiểu tóc/màu tóc gần nhất, không mất nhân vật | P1 | ✅ |
| YC-NV-08 | Thầy cô hiện danh xưng và bộ môn dưới tên (vd "Thầy · Vật lý") | P3 | ✅ |
| YC-NV-03 | Đổi tên và ngoại hình bất cứ lúc nào (nút ảnh đại diện → "Đổi kiểu tóc, đồng phục") | P2 | ✅ |
| YC-NV-04 | Thẻ tên hai dòng trên đầu: tên và `Khóa · Lớp` (thầy cô: "Thầy cô"; em cấp 2: "Em · THCS"); thẻ của mình nổi bật màu khác | P1 | ✅ |
| YC-NV-05 | Có hoạt ảnh bước đi, quay trái/phải, quay lưng khi đi lên | P3 | ✅ |
| YC-NV-06 | **Ngồi**: chạm vào ghế đá (sân trường, vườn) hoặc ghế trong lớp thì nhân vật đi tới và ngồi xuống; đi tiếp thì tự đứng dậy; người khác thấy mình đang ngồi | P2 | ✅ |

### 4.3 Sơ đồ và di chuyển

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-SD-01 | Sơ đồ dựng theo bản vẽ của cựu học sinh: dãy nhà 4 tầng (chữ L), dãy 3 tầng, dãy 5 tầng, nhà hiệu bộ, sân trường cao có bậc thang, sân đá cầu, nhà đa năng, căng tin (sau nhà đa năng), chỗ trốn học đá bóng, cổng phụ, cổng chính ra đường Lương Ngọc Quyến (không có vạch kẻ đường) | P1 | ✅ |
| YC-SD-18 | **Lối xuống căng tin**: nhà đa năng và căng tin lùi xuống, chừa lối đi rộng giữa dãy 3 tầng và nhà đa năng; cửa căng tin ở đầu trên (mái hiên sọc cam trắng) quay ra lối đi đó | P1 | ✅ |
| YC-SD-02 | Sân trường lên/xuống qua **bậc thang chính** và **bậc thang xuống sân đá cầu** ở cạnh trái, và **bậc thang giữa** xuống lối đi dãy 5 tầng | P2 | ✅ |
| YC-SD-03 | Cổng chính giống ảnh thật: trụ xanh nhạt, biển trắng chữ đỏ "SỞ GIÁO DỤC & ĐÀO TẠO TỈNH THÁI NGUYÊN – TRƯỜNG THPT CHUYÊN THÁI NGUYÊN", băng rôn xanh | P2 | ✅ |
| YC-SD-04 | Vị trí lớp chuyên: **dãy 4 tầng** trái → phải Toán, Lý, Hóa, Sinh, Văn, Trung (Lý sát Hóa, các lớp giãn đều); **dãy 3 tầng** trái → phải Anh, Sử, Địa; **dãy 5 tầng** phải → trái Tin, Nga, Pháp, cửa ở mặt trong quay vào sân trường | P1 | ✅ |
| YC-SD-05 | Sân khấu có phông "Hiền tài là nguyên khí của quốc gia", **cột cờ ở giữa sân khấu** | P2 | ✅ |
| YC-SD-06 | **Trống trường** ở giữa dãy 5 tầng, phía sát sân trường (ngay cạnh lối đi giữa) | P2 | ✅ |
| YC-SD-17 | **Lối đi giữa sân vào dãy 5 tầng**: dải bồn hoa mép sân chia đôi đúng chỗ trống trường, có bậc thang xuống hành lang trước mặt trong dãy 5 tầng (cửa các lớp Pháp, Nga, Tin, thư viện, phòng máy); dãy 5 tầng giữ nguyên, không chia đôi | P1 | ✅ |
| YC-SD-07 | Chạm/nhấp vào sân thì nhân vật tự tìm đường đi tới, không xuyên qua nhà, tường, cây, bậc chắn | P1 | ✅ |
| YC-SD-08 | Chạm vào nhãn địa điểm thì nhân vật đi tới đó và tự mở chức năng khi tới nơi (bản 1.3 sửa lỗi vùng chạm của nhãn bị sai nên chạm nhãn không có tác dụng) | P1 | ✅ |
| YC-SD-09 | Từ cổng trường đi tới được **mọi** địa điểm và cửa lớp | P1 | ✅ |
| YC-SD-10 | Nút 🗺️ mở **bản đồ toàn trường**; chạm vào chỗ nào trên bản đồ thì nhân vật đi tới đó; có danh sách các lớp chuyên | P1 | ✅ |
| YC-SD-11 | Trên máy tính: đi bằng phím mũi tên/WASD, cuộn chuột để phóng to/thu nhỏ; có nút +/− | P2 | ✅ |
| YC-SD-12 | Thanh trên hiện **tên khu vực đang đứng** (Sân trường, Dãy nhà 5 tầng, Cổng trường…) | P2 | ✅ |
| YC-SD-13 | Toàn bộ sơ đồ nằm trong một file dữ liệu; sửa số liệu ở đó là va chạm, tìm đường, bản đồ tự cập nhật | P1 | ✅ |
| YC-SD-14 | **Nhiều hoa**: bồn hoa tròn trên sân trường, dải hoa dọc mép sân và trước dãy 5 tầng, bồn hoa trong vườn; cây đang ra hoa (phượng đỏ, bằng lăng tím, hoa sữa) | P2 | ✅ |
| YC-SD-15 | **Ghế đá** đặt ở sân trường (6 ghế), vườn bên phải (2), vườn bên trái (1), trước cổng (1); mỗi ghế 2 chỗ ngồi | P2 | ✅ |
| YC-SD-16 | **Logo trường** ở thanh trên, màn chào mừng, biển cổng trường, khung ảnh kỷ yếu, bìa sổ lưu bút, biểu tượng trang | P1 | ✅ |

**Tiêu chí chấp nhận YC-SD-09:** chạy tìm đường từ điểm xuất phát tới toạ độ của từng điểm tương tác; điểm cuối của
đường đi cách đích < 25 px với cả 29 điểm (đã kiểm bằng script khi đổi sơ đồ).

### 4.4 Gặp gỡ trực tuyến

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-OL-01 | Người đã ghi danh thấy nhân vật của người khác đang online, di chuyển mượt | P1 | ✅ |
| YC-OL-02 | Hiện số người đang online trên thanh trên | P2 | ✅ |
| YC-OL-03 | Khách chưa ghi danh thấy người khác nhưng người khác không thấy khách | P2 | ✅ |
| YC-OL-04 | Người rời trang biến mất khỏi sân sau tối đa 20 giây | P2 | ✅ |
| YC-OL-05 | **Nói chuyện**: hàng câu nói nhanh ("Xin chào! 👋", "Lâu quá không gặp!"…), biểu cảm 😂 ❤️ 👍, ô chat tự do (≤ 80 ký tự); lời nói hiện thành bong bóng trên đầu ~5 giây cho mọi người cùng thấy | P1 | ✅ |
| YC-OL-06 | Chạm vào người khác: xem tên, vai, khóa/lớp; nút "Vẫy tay" và "Đi tới" | P2 | ✅ |
| YC-OL-07 | **Ném bóng nước 🎈**: bấm 🎈 mở **danh sách người đang online cùng chỗ** (sắp theo khoảng cách, có ảnh nhân vật) để **chọn người ném vào**; người ở xa hơn ~35 bước bị làm mờ; có nút "Ném ra phía trước"; cũng ném được từ thẻ của người đó; bóng bay vòng cung rồi vỡ; người trúng bị ướt 4 giây và nhận thông báo; mọi người online cùng thấy; mỗi lần ném cách nhau ≥ 1,2 giây | P2 | ✅ |

### 4.5 Lớp học

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-LH-01 | Mỗi lớp chuyên có một cửa có **biển tên lớp** trên mặt tiền; chạm nhãn "🚪 Lớp …" **hoặc chạm thẳng vào cánh cửa/biển tên** là đi tới và **vào trong lớp**: phòng dọc có bảng lớp (thứ, ngày, tên lớp), **Nội quy lớp học**, **5 điều Bác Hồ dạy**, khẩu hiệu "Tiên học lễ – Hậu học văn", đồng hồ, bục giảng, bàn giáo viên có sổ đầu bài, 18 bàn với **36 chỗ ngồi**, hành lang có lan can, chậu hoa, **ban công**, cửa sổ hai bên, giá sách lưu bút | P1 | ✅ |
| YC-LH-06 | Trong lớp chỉ thấy những người cũng đang ở lớp đó (mọi khóa); **Ra khỏi lớp** thì về đúng trước cửa lớp; mở bản đồ khi đang trong lớp thì tự ra sân trước | P1 | ✅ |
| YC-LH-07 | Trong lớp: chạm **bảng lớp** → menu Lưu bút lớp / Sổ đầu bài / Đố vui / Kiểm tra bài cũ / Kiểm tra vở ghi / Nộp sổ đầu bài; chạm **áp phích** → đọc Nội quy, 5 điều Bác Hồ dạy; **bàn giáo viên** → sổ đầu bài; **giá sách** → lưu bút lớp theo khóa; **ban công** → ra hóng gió | P1 | ✅ |
| YC-LH-02 | **Lưu bút** theo từng lớp + khóa: đọc 100 lời mới nhất, viết lời mới ≤ 600 ký tự | P1 | ✅ |
| YC-LH-03 | **Sổ đầu bài theo ngày** (đổi ngày lúc 5 giờ sáng, xem lại 30 ngày): sĩ số và giờ có mặt (tự ký khi ngồi vào ghế trong lớp mình), ghi chú buổi học, điểm miệng kiểm tra bài cũ, người nộp sổ, ghi tên vi phạm; dòng của mình được tô màu | P1 | ✅ |
| YC-LH-08 | **Ghi chú buổi học**: học sinh lớp đó và thầy cô viết ≤ 200 ký tự/ngày; học sinh lớp khác chỉ xem | P2 | ✅ |
| YC-LH-09 | **Kiểm tra vở ghi**: đã ghi chú hôm nay → cô khen, +5 điểm (một lần/ngày); chưa → cô nhắc đi ghi bài | P2 | ✅ |
| YC-LH-10 | **Nộp sổ đầu bài**: người đầu tiên mỗi ngày +10 điểm; người sau thấy ai đã nộp lúc mấy giờ | P2 | ✅ |
| YC-LH-11 | **Ghi tên vi phạm**: ném bóng nước trúng người trong lớp giữa giờ học thì tự động bị ghi tên; thầy cô ghi tên học sinh có mặt kèm lý do; bị ghi tên thì hôm sau điểm danh không được tiền ăn vặt | P2 | ✅ |
| YC-LH-12 | Lớp học vừa chiều ngang điện thoại, thấy trọn tường đầu lớp và cuối lớp (không bị thanh trên, thanh chat che) | P1 | ✅ |
| YC-LH-13 | Hotspot chạm được ở **cả nhãn lẫn đồ vật** (cửa lớp, bảng, áp phích, bàn giáo viên, giá sách) | P1 | ✅ |
| YC-LH-14 | **Sửa tên thầy cô chủ nhiệm**: chạm cô chủ nhiệm hoặc mục "Thầy cô chủ nhiệm" trên bảng lớp → chọn Thầy/Cô, nhập họ tên. Học sinh/cựu học sinh lớp đó sửa cho **khóa mình**; thầy cô sửa cho khóa bất kỳ hoặc "tất cả các khóa"; lớp khác không sửa được. Vào lớp thấy tên của khóa mình, chưa có thì tên chung, rồi tên được đặt gần nhất; xem được danh sách tên theo khóa và ai sửa | P1 | ✅ |
| YC-LH-15 | **Sửa tên thầy cô ở phòng chức năng**: cô thủ thư (thư viện), thầy dạy Tin (phòng máy), thầy dạy Hóa (phòng thí nghiệm), cô văn phòng (nhà hiệu bộ). Chạm nhân vật → "✏️ Sửa tên thầy cô": chọn Thầy/Cô (nhân vật đổi dáng theo), nhập họ tên. Học sinh/cựu học sinh lớp bất kỳ sửa cho khóa mình; thầy cô sửa cho khóa bất kỳ hoặc mọi khóa; khách không sửa được | P2 | ✅ |
| YC-LH-16 | **Quản trị sửa tên thầy cô hàng loạt**: người có **mã quản trị** mở bảng (từ Nhân vật của tôi, bảng sửa tên thầy cô, hoặc `/?quantri`, không cần nhân vật), chọn khóa áp dụng (tất cả các khóa hoặc một khóa), sửa cùng lúc 12 lớp + 4 phòng trong một bảng, hoặc **dán danh sách** từ Excel/Google Sheets (`Lớp | Thầy/Cô | Họ tên | Khóa`); xoá trắng tên để bỏ tên đã đặt; báo số tên đã lưu và từng dòng lỗi | P1 | ✅ |
| YC-LH-17 | **Mã quản trị** đặt trong biến bí mật của Cloudflare (`ADMIN_CODE`), không nằm trong mã nguồn; chưa đặt mã thì không ai dùng được bảng quản trị; nhập sai 10 lần trong 1 giờ thì bị khoá 1 giờ; trên bản chạy thử ngoại tuyến mã là `DEMO` | P1 | ✅ |
| YC-LH-18 | **Cấu hình nhân vật phụ** giống thầy cô: bác bảo vệ, đội cờ đỏ, bác Hùng, chị Mai, anh Tuấn, bạn Linh, cô căng tin, anh Dũng, bạn Nam. Chạm nhân vật → "✏️ Sửa tên nhân vật": danh xưng (Bác, Chú, Anh, Chị, Bạn, Em, Ông, Bà, Cô hoặc không), tên, dòng phụ dưới tên (vd "K1 · Toán"); học sinh/cựu học sinh sửa cho khóa mình, thầy cô và quản trị sửa cho mọi khóa; có trong bảng quản trị sửa hàng loạt và dán danh sách | P2 | ✅ |
| YC-QT-01 | **Quản trị xoá tin nhắn**: mục "💬 Tin nhắn" trong bảng quản trị liệt kê ~100 tin gần nhất (tên, khóa · lớp, khu, thời gian) với nút 🗑️ Xoá tin; khi đang mở quyền quản trị, mỗi dòng trong khung chat có nút ⋯ để xoá ngay. Tin bị xoá biến mất khỏi khung chat của mọi người (kể cả người gửi) trong vài giây | P1 | ✅ |
| YC-QT-02 | **Khoá thành viên thô lỗ**: từ một tin nhắn hoặc mục "🚫 Thành viên" (tìm theo tên, không cần dấu; lọc người đang bị khoá), nhập lý do, tuỳ chọn xoá luôn mọi tin nhắn của người đó. Người bị khoá biến khỏi sân ngay, nhận thông báo kèm lý do, chỉ còn xem như khách; không nhắn tin, viết lưu bút, tham gia hoạt động được; tải lại trang hay nhập mã khôi phục vẫn bị khoá. Mở khoá lại được | P1 | ✅ |

| YC-QT-03 | **Quản trị xoá lưu bút và ảnh**: khi đang mở quyền quản trị, mỗi lời lưu bút (mọi bảng lưu bút, sổ lưu bút cá nhân) có nút "🗑️ Xoá (quản trị)", mỗi ảnh trong album có nút "🗑️ Xoá ảnh"; bấm hai lần để chắc chắn. Mục Thành viên có nút "🗑️ Xoá lưu bút, ảnh" xoá mọi lưu bút và ảnh của một người; khi khoá có thể tích "xoá luôn lưu bút và ảnh" | P1 | ✅ |
| YC-BT-01 | **Bảng tin cho cựu học sinh**: mở bảng tin, cựu học sinh thấy ngay **lời chia tay của khóa mình** kèm **lời tri ân thầy cô** (dạng lá thư có logo, chữ viết tay); mỗi phiên có lời nhắc "Bảng tin có lời chia tay khóa …". Người khác chọn khóa để đọc (khóa đã tự viết có dấu ✍️) | P1 | ✅ |
| YC-BT-02 | Khóa chưa viết thì hiện **lời mẫu**; cựu học sinh của khóa đó viết lại được (mỗi phần ≤ 1500 ký tự). Quản trị sửa, xoá (về lời mẫu) hoặc **khôi phục bản trước** khi bị viết bậy | P1 | ✅ |

> YC-QT-02: người bị khoá vẫn có thể tạo nhân vật mới (trang không dùng mật khẩu, email); khi đó quản trị khoá tiếp nhân vật mới.
| YC-LH-04 | **Đố vui** 3 câu theo môn chuyên; mỗi câu đúng +1 điểm thi đua, tối đa 10 điểm/ngày | P3 | ✅ |

### 4.6 Hoạt động trong trường

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-HD-01 | **Điểm danh** khi gửi xe: mỗi ngày (theo giờ Việt Nam) một lần, +20.000đ vào ví, +2 điểm | P2 | ✅ |
| YC-HD-02 | **Căng tin**: thực đơn có giá, mua hoặc "đãi" một bạn; không đủ tiền thì báo và gợi ý điểm danh; danh sách 20 lượt mua gần nhất | P2 | ✅ |
| YC-HD-03 | Căng tin **giảm 20%** đúng giờ ra chơi thật (9:25–9:45 và 15:55–16:15, giờ Việt Nam) | P3 | ✅ |
| YC-HD-04 | **Lịch họp lớp** ở nhà hiệu bộ: tạo buổi (tên, ngày, giờ, địa điểm, ghi chú), đăng ký/huỷ tham gia, xem danh sách người tham gia; tách buổi sắp tới và đã diễn ra | P1 | ✅ |
| YC-HD-05 | **Tri ân thầy cô**, **phòng giáo viên**, **phòng truyền thống**: các góc lưu bút riêng | P2 | ✅ |
| YC-HD-06 | **Nhà đa năng**: gian từng CLB, mỗi gian một lưu bút | P3 | ✅ |
| YC-HD-07 | **Sân khấu**, **ghế đá sân trường**, **chỗ trốn học đá bóng**, **cổng phụ**, **tường "Ước mơ vào Chuyên"**: các góc lưu bút theo chủ đề | P3 | ✅ |
| YC-HD-08 | **Đá cầu** ở sân đá cầu: chạm quả cầu để tâng; lưu kỷ lục cá nhân; bảng xếp hạng 20 người cao nhất | P2 | ✅ |
| YC-HD-09 | **Trống trường**: hiện giờ và tiết hiện tại; nút "Đánh trống" phát 3 tiếng trống và hiện "Tùng! Tùng! Tùng!" cho mọi người | P3 | 🟡 |
| YC-HD-10 | **Bác bảo vệ** ở cổng, **cô căng tin** đi lại trước căng tin; bác bảo vệ có câu thoại vui | P3 | ✅ |
| YC-HD-11 | **Sổ lưu bút** của từng người, dạng quyển sổ: bìa có logo và tên chủ sổ, mỗi trang một lời lưu bút trên giấy kẻ dòng chữ viết tay ("Gửi …", nội dung, chữ ký, ngày), lật trang trước/sau, trang cuối để ký vào sổ (≤ 600 ký tự). Mở sổ của mình từ "Nhân vật của tôi", sổ của bạn từ thẻ của bạn | P1 | ✅ |
| YC-HD-12 | **Chụp ảnh kỷ yếu** (nút 📸 hoặc điểm "Chụp ảnh kỷ yếu" trước sân khấu): đếm ngược 3–2–1, nhân vật hô "📸 Cười lên nào!" cho mọi người cùng thấy; chụp khung cảnh quanh mình (không có nhãn), ghép vào **khung kỷ yếu** có logo, ngày, khóa/lớp, lời ghi, tên những người trong ảnh | P1 | ✅ |
| YC-HD-13 | Ảnh kỷ yếu **lưu về máy** (JPEG) hoặc **đăng lên album trường**; mỗi người tối đa 5 ảnh/ngày | P2 | 🟡 |
| YC-HD-17 | **Tải ảnh lên làm ảnh kỷ yếu**: nút "🖼️ Tải ảnh lên" chọn ảnh từ máy/điện thoại (JPG, PNG…, ≤ 20 MB); ảnh được xoay đúng chiều, thu nhỏ và đóng khung kỷ yếu ngay trên máy (khung giãn theo tỉ lệ ảnh, ảnh quá dài cắt giữa); nhập lời ghi và tên những người trong ảnh; lưu về máy hoặc đăng album (chung giới hạn 5 ảnh/ngày); có lời nhắc chỉ đăng ảnh được phép chia sẻ | P1 | ✅ |
| YC-HD-14 | **Album kỷ yếu** (từ phòng truyền thống, nút 📸, "Nhân vật của tôi"): lưới 60 ảnh mới nhất, chạm để xem ảnh lớn, người chụp, người trong ảnh, lưu về máy | P2 | ✅ |

> YC-HD-09: âm thanh tổng hợp bằng Web Audio, chưa nghe thử trên thiết bị thật.
> YC-HD-13: nút "Lưu ảnh về máy" không hoạt động trong link chạy thử trên Claude (khung nhúng chặn tải file); chạy bình thường khi tự triển khai.

### 4.7 Thi đua

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-TD-01 | Điểm thi đua: điểm danh +2, lưu bút +5, tạo họp lớp +3, đăng ký họp lớp +3, đố vui +1/câu (≤ 10/ngày), đá cầu ≥ 5 quả +1 | P2 | ✅ |
| YC-TD-02 | **Bảng tin** ở mép sân trường hiển thị xếp hạng theo khóa (tổng điểm, số người), theo lớp chuyên, và đá cầu | P2 | ✅ |

### 4.8 Âm thanh và không khí

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-AT-01 | Thanh trên hiện **đồng hồ giờ Việt Nam** và **tiết học hiện tại** (Tiết 1 sáng … Tiết 5 chiều, Ra chơi, Nghỉ trưa, Tan học) | P2 | ✅ |
| YC-AT-02 | **Nhạc nền 3 bài** phát lần lượt: *Hanoi n U (beat)* → *Tháng 5 không trở lại* → *Ngày ấy bạn và tôi*, hết bài cuối quay lại bài đầu. Nút **🎵** mở bảng có tên bài đang phát, ⏮ ⏯ ⏭ và âm lượng (không hiện danh sách bài) | P1 | ✅ |
| YC-AT-03 | Nhạc **tự phát** khi vào trường. Trên điện thoại (trình duyệt chỉ cho phát tiếng sau thao tác của người dùng) nhạc bắt đầu ngay ở **lần chạm đầu tiên** bất kỳ trên trang; chưa phát được thì thử lại ở lần chạm sau. Tạm dừng chỉ có hiệu lực trong lần truy cập đó; lần sau mở trang nhạc lại tự phát | P1 | ✅ |

> YC-AT-02/03: đã kiểm thử tự động việc phát, chuyển bài khi hết bài, quay vòng sau bài cuối; chưa nghe thử trên điện thoại thật.

### 4.9 Thông tin

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-TT-01 | Trang **Giới thiệu** (`/pages/gioi-thieu.html`): ai vào được, có gì trong trường, cách dùng | P2 | ✅ |
| YC-TT-02 | Ghi rõ đây là trang cộng đồng, **không phải website chính thức** của nhà trường, có link tới website chính thức | P1 | ✅ |
| YC-TT-03 | Nhắc người dùng không đăng số điện thoại, địa chỉ nhà | P2 | ✅ |

### 4.10 Tiến trình, ví và kết nối (theo trang mẫu)

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-TT2-01 | **Nhiệm vụ hằng ngày** (làm mới 5 giờ sáng): điểm danh vào trường, ngồi vào lớp mình, ghé căng tin, chơi một trò, dạo 3 khu, viết lưu bút, đãi bạn, ném trúng bóng nước; mỗi nhiệm vụ bấm "Nhận" để cộng tiền vào ví; nhận đủ 6 thì có thưởng "Chăm chỉ cả ngày" | P1 | ✅ |
| YC-TT2-02 | **Thành tựu** 37 mục chia 7 cấp: Lớp 10 → Lớp 11 → Lớp 12 → Ôn thi → Tốt nghiệp → Niềm tự hào → Huyền thoại; có thanh tiến độ; phải nhận gần đủ cấp hiện tại mới mở cấp sau; nhận thành tựu được tiền và +20 điểm thi đua | P1 | ✅ |
| YC-TT2-03 | Nút 📜 trên thanh trên có **chấm đỏ** báo số phần thưởng đang chờ nhận | P2 | ✅ |
| YC-TT2-04 | **Ví ăn vặt**: bấm số tiền trên thanh trên để xem số dư, chuỗi đi học và **lịch sử 30 giao dịch** gần nhất | P2 | ✅ |
| YC-TT2-05 | **Đến trường**: chọn xe đạp / xe máy điện / ô tô / xe bus / đi bộ; nhận **vé xe** có tên; **chuỗi đi học** liên tục, mỗi 5 ngày liền thưởng thêm 10.000đ | P1 | ✅ |
| YC-TT2-06 | **Đãi bạn**: ở căng tin chọn một bạn đang online cùng khu; bạn ấy nhận thông báo "🎁 … đã đãi bạn …" và nhân vật tự cảm ơn | P1 | ✅ |
| YC-TT2-07 | **Tỏ tình**: từ thẻ của một bạn chọn 1 trong 5 câu; người nhận thấy bảng "Lời tỏ tình" và chọn 💕 Đồng ý / 🤔 Để mình suy nghĩ / 🤝 Mình coi cậu là bạn thôi; người gửi nhận câu trả lời; tối đa 10 lần/ngày | P2 | ✅ |
| YC-TT2-08 | **Chào cờ thứ Hai**: 48 ghế nhựa (12 lớp chuyên × 4) có biển tên lớp trước sân khấu; sáng thứ Hai (trước 12 giờ) ngồi vào ghế → +20 điểm, +10.000đ, mỗi tuần một lần; mở trang sáng thứ Hai có banner "Tập trung chào cờ" | P2 | 🟡 |
| YC-TT2-09 | **Chuông trống**: khi tới giờ ra chơi / vào tiết hiện banner (kèm nút "Ra căng tin" / "Vào lớp") và tiếng trống, chuông | P2 | ✅ |
| YC-TT2-10 | **20/11**: tặng hoa tri ân (mỗi người 1 bó/ngày, đếm số bó cả trường trong ngày, danh sách người tặng gần đây); **thiệp tri ân** dạng ảnh ("Kính gửi…", lời cảm ơn, "Từ…"); sân khấu có lễ kỷ niệm Ngày Nhà giáo trong dịp 18–21/11 | P1 | ✅ |
| YC-TT2-11 | **Phòng cấp bằng** (nhà hiệu bộ): giấy chứng nhận tốt nghiệp / nhà giáo / tham quan dạng ảnh có logo, tên, khóa – lớp, câu đề tặng (đổi được), ngày, con dấu "Chuyên Thái Nguyên", ghi rõ "Bản kỷ niệm – không có giá trị pháp lý"; chia sẻ hoặc tải về | P2 | ✅ |
| YC-TT2-12 | **Trò chơi 5 vòng** (mỗi vòng 20 điểm): ⚽ sút penalty (chỗ trốn học), 🏀 bóng rổ (nhà đa năng), 🧪 pha chế hóa học (phòng thí nghiệm, 12 phản ứng thật), 💣 dò mìn (phòng máy); mỗi trò có bảng xếp hạng | P1 | ✅ |
| YC-TT2-13 | **Nhân vật phụ** có tên và lời thoại riêng, thỉnh thoảng tự nói: bác bảo vệ, đội cờ đỏ, cô văn phòng, cô căng tin, các anh chị cựu học sinh, thầy dạy Hóa; trong mỗi lớp có **cô chủ nhiệm** gọi lên **kiểm tra bài cũ** (2 câu, chấm /10) | P2 | ✅ |
| YC-TT2-14 | **Khiên** 🛡️: bật thì không ai ném bóng nước trúng mình; người khác thấy vòng khiên và trong danh sách ném bóng hiện "đang bật khiên" | P2 | ✅ |
| YC-TT2-15 | **Khung chat chung** góc trái: hiện tin nhắn của **mọi người ở mọi khu** (sân trường, lớp, phòng), tên kèm **khóa · lớp** (thầy cô: danh xưng · bộ môn; khách: tên trường); giữ 50 tin gần nhất, cuộn được; mở trang là thấy lịch sử gần đây; thu gọn được (có số tin chưa đọc, nhớ trên máy); khách chưa ghi danh vẫn đọc được | P1 | ✅ |
| YC-TT2-16 | **Ai đang online**: bấm số người trên thanh trên để xem danh sách theo khu, chạm để đi tới | P2 | ✅ |
| YC-TT2-17 | **Âm thanh**: bảng chỉnh âm lượng nhạc nền và hiệu ứng (lưu trên máy); hiệu ứng tổng hợp: chuông, trống, tiền, bóng nước, tim… | P2 | 🟡 |
| YC-TT2-18 | **Ngày / đêm** theo giờ Việt Nam: bình minh 6–7 h, hoàng hôn 16:30–18 h, chạng vạng 18–19:30, đêm 19:30–5 h, rạng sáng 5–6 h. Ban đêm: sân tối hẳn; **18 cột đèn** (giữa sân, cổng, lối vào, sân đá cầu, hành lang dãy 5 tầng, lối xuống căng tin, vườn, đèn đường) toả quầng sáng; **cửa sổ** các dãy nhà sáng vàng; **sân khấu** có hai luồng đèn chiếu; **biển trường** được rọi sáng; **trăng, sao** lấp lánh phía trên màn hình; **đom đóm** bay trên các bãi cỏ. Trong lớp học, các phòng luôn sáng đèn | P2 | ✅ |
| YC-TT2-19 | **Trang phục**: sơ mi cà vạt, sơ mi trắng/xanh/vàng, áo khoác trường, áo lớp (6 màu), áo dài trắng/tím/hồng/xanh/đỏ, vest, áo phông, khăn quàng đỏ, áo "Tôi yêu CTN" trắng/đen – danh sách tuỳ vai (xem YC-NV-02) | P2 | ✅ |
| YC-TT2-20 | **Phòng chức năng**: phòng thí nghiệm, phòng máy, thư viện (góc giới thiệu sách hay); **Sổ lưu bút của trường** đặt trên giá ở sân | P2 | ✅ |

### 4.11 Các phòng bên trong (giống trang mẫu)

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-PH-01 | Chạm cửa **thư viện, phòng máy, phòng thí nghiệm, nhà hiệu bộ (cả phòng giáo viên, phòng truyền thống), căng tin, nhà đa năng** thì nhân vật đi tới và **vào hẳn trong phòng**; có cửa "Ra sân" về đúng trước cửa đã vào | P1 | ✅ |
| YC-PH-02 | **Thư viện**: giá sách quanh tường, 4 bàn đọc 16 chỗ ngồi, bàn thủ thư (cô thủ thư) → giới thiệu sách hay, giá báo (Hoa học trò, Mực tím…) | P1 | ✅ |
| YC-PH-03 | **Phòng máy**: màn chiếu bài Pascal, nội quy phòng máy, 6 dãy bàn 18 máy tính có ghế ngồi, bàn thầy dạy Tin → Dò mìn, góc kỷ niệm | P1 | ✅ |
| YC-PH-04 | **Phòng thí nghiệm**: tủ hoá chất, bảng tuần hoàn, tủ hút khí độc, bàn của thầy Minh → Pha chế hóa học, 4 bàn thí nghiệm có bồn rửa và ghế đẩu, vòi rửa mắt | P1 | ✅ |
| YC-PH-05 | **Nhà hiệu bộ**: bảng thông báo họp lớp, phòng truyền thống (album), **bảng vàng đội tuyển** (lưu bút ghi giải thưởng), gian Tri ân thầy cô, Phòng giáo viên, Phòng cấp bằng; cô Lan văn phòng | P1 | ✅ |
| YC-PH-06 | **Căng tin**: bảng thực đơn có giá, quầy căng tin (cô căng tin) → mua đồ / đãi bạn, 5 bàn tròn 10 ghế đẩu ngồi được, tủ nước | P1 | ✅ |
| YC-PH-07 | **Nhà đa năng · CLB** (cửa ở **mặt trái, quay ra sân trường**; bên trong cửa cũng ở tường trái): nửa sân bóng rổ có rổ → ném bóng rổ, bảng tỉ số, 6 gian CLB (chạm gian để vào lưu bút CLB) | P1 | ✅ |
| YC-PH-08 | Trong phòng chỉ thấy người cùng phòng; vào phòng được tính "ghé khu" cho nhiệm vụ ngày | P2 | ✅ |

> YC-TT2-08: chưa kiểm thử vào đúng sáng thứ Hai trên trình duyệt (kiểm thử tự động đã giả lập giờ thứ Hai cho máy chủ).
> YC-TT2-17: chưa nghe thử trên thiết bị thật.

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu | Ưu tiên | TT |
|---|---|---|---|
| YC-PN-01 | **Điện thoại là chính**: dùng tốt ở màn hình rộng 360–430 px, thao tác bằng chạm; không cuộn ngang; tôn trọng vùng an toàn (tai thỏ, thanh điều hướng) | P1 | ✅ |
| YC-PN-02 | Chạy trên Chrome/Safari/Edge bản gần đây, cả Android và iOS, không cần cài đặt | P1 | 🟡 |
| YC-PN-03 | Tải trang nhẹ: không thư viện ngoài, không bước build; tổng mã JavaScript + CSS < 300 KB chưa nén (hiện ~280 KB) | P2 | ✅ |
| YC-PN-04 | Vẽ mượt ~60 khung hình/giây trên điện thoại tầm trung | P2 | 🟡 |
| YC-PN-05 | Vị trí người khác cập nhật mỗi 2,5 giây; độ trễ chấp nhận được ≤ 3 giây | P2 | ✅ |
| YC-PN-06 | **Chế độ ngoại tuyến**: khi không có máy chủ, trang vẫn chạy đầy đủ chức năng một người, dữ liệu lưu trên trình duyệt, có nhãn cảnh báo | P2 | ✅ |
| YC-PN-07 | Vận hành trong gói miễn phí Cloudflare Workers + D1 với vài trăm người online cùng lúc | P1 | 🟡 |
| YC-PN-08 | Toàn bộ giao diện và thông báo lỗi bằng tiếng Việt, dễ hiểu, nói cách khắc phục | P1 | ✅ |
| YC-PN-09 | **An toàn nội dung**: mọi nội dung người dùng nhập hiển thị dưới dạng văn bản thuần, không chạy được mã | P1 | ✅ |
| YC-PN-10 | **Kiểm tra dữ liệu vào** ở máy chủ: giới hạn độ dài, danh sách giá trị hợp lệ, định dạng ngày; thân request ≤ 8 KB (riêng đăng ảnh ≤ 400 KB, chỉ nhận JPEG) | P1 | ✅ |
| YC-PN-11 | **Riêng tư**: không thu thập email, số điện thoại; không dùng cookie theo dõi; nhạc nền là file trên chính trang, không gọi dịch vụ ngoài | P2 | ✅ |
| YC-PN-12 | **Chống lạm dụng**: giới hạn tần suất gọi API; báo cáo và ẩn lưu bút, **ảnh album** xấu; chặn người dùng | P1 trước khi công bố rộng | ⬜ |
| YC-PN-13 | **Khả năng bảo trì**: nghiệp vụ viết một lần, dùng chung cho máy chủ và chế độ ngoại tuyến; có kiểm thử tự động (`npm test`) | P1 | ✅ |
| YC-PN-14 | **Triển khai**: một lệnh `npm run deploy` sau khi tạo cơ sở dữ liệu | P2 | 🟡 |
| YC-PN-15 | **Truy cập**: nút có nhãn cho trình đọc màn hình, đóng bảng bằng phím Esc, chữ đủ tương phản | P3 | 🟡 |

> YC-PN-02, 04: mới kiểm thử trên Chromium giả lập iPhone 13 và máy tính, chưa thử trên máy Android/iOS thật.
> YC-PN-07, 14: chưa triển khai thật lên Cloudflare; mới chạy bằng `wrangler dev` cục bộ.

## 6. Ràng buộc và giả định

- Sơ đồ và vị trí lớp dựa trên trí nhớ của cựu học sinh (bản vẽ tay + mô tả), không phải bản vẽ kỹ thuật.
- Tên, logo, ảnh chính thức của nhà trường chỉ dùng ở mức chữ trên biển cổng; không dùng ảnh có bản quyền.
- Nhạc nền: 3 file MP3 do người đặt hàng cung cấp (`public/music/`). Đây là các bài hát có bản quyền của tác giả/ca sĩ;
  cần có quyền sử dụng trước khi đưa trang lên mạng công khai, nếu không thì thay bằng nhạc không bản quyền.
- Danh sách CLB, câu đố, thực đơn căng tin hiện là **nội dung mẫu**, cần thay bằng nội dung thật.
- Không có quản trị viên; nội dung người dùng tự chịu trách nhiệm cho tới khi có YC-PN-12.

## 7. Truy vết yêu cầu → mã nguồn → kiểm thử

| Nhóm yêu cầu | Hiện thực chính | Kiểm thử tự động (`tests/logic.test.js`) | Kiểm thử thủ công (Playwright) |
|---|---|---|---|
| YC-DT | `logic.js` (`register`, `recover`, `me`), `main.js` (`createFlow`, `recoverFlow`) | "đăng ký, khôi phục…", "thiếu lớp chuyên / khóa sai…", "…chưa đăng nhập 401" | Ghi danh 3 người, khách mở chat bị mời ghi danh |
| YC-NV | `avatar.js` (tư thế ngồi), `main.js` (`avatarEditor`), `world.js` (`_nameTag`, `sitOn`, `seatAt`) | "presence mang cảnh… và trạng thái ngồi" | Ngồi ghế đá, ngồi ghế trong lớp; người khác thấy "(ngồi)" |
| YC-SD | `campus.js` (`FLOWERBEDS`, `BENCHES`, `SEATS`), `world.js` (`Grid`, `CAMPUS_SCENE`, `drawOverview`) | – | Script tìm đường tới 30 điểm + 20 chỗ ngồi trên sân, 4 điểm + 24 chỗ ngồi trong lớp |
| YC-OL | `logic.js` (`presence`, `online`), `world.js` (`updateOthers`, `throwBalloon`), `main.js` (`balloonPicker`) | "presence trả về người khác…" (gồm cú ném bóng nước) | 2 người thấy nhau, lời nói, chọn người trong danh sách rồi ném bóng nước trúng |
| YC-LH | `classroom.js`, `logic.js` (`guestbook`, `sign`, `roster`, `attend`, `quiz`, `classlog`, `classlogAct`), `main.js` (`panels.enterClass`, `panels.classBoard`, `classLogSheet`, `panels.class`) | "lưu bút, sổ đầu bài, bảng thi đua", "đố vui giới hạn…", "sổ đầu bài: có mặt, ghi chú, nộp sổ…" | Chạm cánh cửa lớp Toán → vào lớp; ngồi → ký có mặt; ghi chú, kiểm tra vở, nộp sổ; bạn lớp Văn vào thăm thấy nhau và xem sổ; ra sân về đúng cửa |
| YC-HD | `logic.js` (`checkin`, `menu`, `buy`, `events`, `createEvent`, `joinEvent`, `score`, `albumPost`, `album`, `photo`), `games.js`, `main.js` (`bookSheet`, `panels.photo`, `composeYearbook`, `albumSheet`) | "đăng ký… điểm danh, mua đồ", "giờ ra chơi giảm 20%", "họp lớp: tạo, đăng ký, huỷ", "album kỷ yếu…" | Điểm danh, mua đồ, tạo họp lớp, đá cầu, chụp và đăng ảnh, ký sổ lưu bút |
| YC-TD | `logic.js` (`khoaBoard`, `leaderboard`, `POINTS`) | "lưu bút, sổ đầu bài, bảng thi đua" | Mở bảng tin |
| YC-AT | `logic.js` (`SCHEDULE`, `periodOf`), `main.js` (`music`, `beatDrum`) | "giờ ra chơi giảm 20%" (gồm `periodOf`) | Bấm 🎵 phát/dừng/tắt |
| YC-TT2 | `logic.js` (`DAILY_QUESTS`, `ACHIEVEMENTS`, `act`, `quests`, `claim`, `wallet`, `flag`, `flower`, `love`, `loveReply`, hộp thư trong `presence`), `minigames.js`, `cards.js`, `npcs.js`, `sound.js`, `main.js` | "điểm danh: chuỗi ngày…", "nhiệm vụ ngày và thành tựu…", "đãi bạn và tỏ tình…", "chào cờ chỉ sáng thứ Hai…" | 2 người: vé xe bus, nhận thưởng, đãi trà đá, tỏ tình – đồng ý, dò mìn, pha chế, penalty 5 quả, giấy chứng nhận, tặng hoa, ngồi lớp, kiểm tra bài cũ, khiên, ví |
| YC-PN | `ui.js` (`h`), `worker.js`, `api.js` (chế độ ngoại tuyến), `style.css` | "…chức năng lạ trả 404" | Chạy ngoại tuyến bằng `npm run static` |

## 8. Vấn đề mở

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | Phòng thí nghiệm, thư viện, phòng học bộ môn nằm ở đâu? | Thêm cửa phòng vào sơ đồ |
| 2 | Danh sách CLB thật của trường, thực đơn căng tin ngày xưa? | Thay nội dung mẫu |
| 3 | Ai là người kiểm duyệt nội dung khi công bố rộng? | Quyết định thiết kế YC-PN-12 |
| 4 | Có muốn tên miền riêng thay cho `*.workers.dev`? | Cấu hình triển khai |

## 9. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Ghi danh | Tạo nhân vật (đăng ký) |
| Mã khôi phục | Mã `CTN-XXXX-XXXX` dùng để lấy lại nhân vật trên máy khác |
| Khách | Người mở trang nhưng chưa ghi danh |
| Điểm tương tác | Nhãn trên sân; chạm vào thì nhân vật đi tới và mở chức năng |
| Chế độ ngoại tuyến | Chạy không cần máy chủ, dữ liệu chỉ trên trình duyệt |
| Presence | Bản tin vị trí + lời nói + cú ném gửi lên máy chủ mỗi 2,5 giây |

---

*Trang cộng đồng do cựu học sinh xây dựng, không phải website chính thức của nhà trường.*
