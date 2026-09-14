# Thời khóa biểu HK1 2026-2027

Trang web hiển thị thời khóa biểu theo tuần, tự cập nhật theo thời gian
thực. Phần xem lịch (`index.html`, `style.css`, `script.js`,
`manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) vẫn là web tĩnh,
host ở đâu cũng chạy được (GitHub Pages hoặc Vercel). Phần **thông báo
đẩy** (mới thêm) cần chạy server nhỏ — chỉ hoạt động khi host bằng
**Vercel**, không chạy được trên GitHub Pages vì GitHub Pages không chạy
được code server.

## Có gì trong bản này

- **Thanh trạng thái** trên cùng luôn hiện: đang học môn gì (kèm đếm ngược
  còn bao lâu hết tiết) hoặc tiết tiếp theo là gì, mấy giờ, còn bao lâu —
  tự cập nhật mỗi 30 giây.
- **Lưới 7 ngày** (T2→CN), mỗi môn nằm đúng ô ngày/giờ, có vạch chạy theo
  giờ thực tế. Trên điện thoại (màn hẹp) tự gập lại thành xem từng ngày,
  bấm tab ngày để chuyển; trên máy tính hiện đủ 7 cột. Chữ và độ tương
  phản đã tăng để dễ đọc hơn, khung giờ mở rộng tới 21h để chứa cả ca tối
  (tiết 12-15).
- Lớp học **cách tuần** có nhãn riêng; tuần nào không học thì ô đó mờ đi
  và ghi rõ "Tuần này nghỉ" thay vì hiện như đang có lịch.
- **Xem tuần trước/tuần sau** bằng 2 nút mũi tên cạnh nhãn tuần, có nút
  "Về tuần này" để quay lại nhanh — giúp tự đối chiếu lịch cách tuần với
  portal của trường mà không cần đợi đến đúng tuần đó.
- **Nhãn hình thức giảng dạy (HTGD)** — LT/HT1/ĐA/HT2... — hiện ngay trên
  từng khối giờ học. File `.ics` của portal không có sẵn thông tin này,
  nên bạn cần gán tay 1 lần trong "Danh sách lớp" (chọn dropdown ngay
  dưới mỗi lớp) hoặc khi thêm lớp thủ công.
- **Bấm vào 1 khối giờ học** để xem chi tiết to hơn: mã lớp, HTGD, phòng,
  GV, chu kỳ, ngày bắt đầu/kết thúc học kỳ — tiện khi chữ trên khối quá
  nhỏ để đọc hết.
- Trang **tự cuộn tới đúng giờ hiện tại** khi mở lên, đỡ phải kéo tay
  tìm vạch "đang học".
- **Cài được thành app thật (PWA)** — có icon riêng, mở full-screen như
  app, dùng được khi mất mạng (nhờ cache sẵn). Trên điện thoại: mở trang
  bằng Chrome/Safari → menu trình duyệt → "Thêm vào màn hình chính" /
  "Cài đặt ứng dụng".
- **Thông báo đẩy trước giờ học (Android)** — báo trước 30, 15 và 5 phút
  mỗi khi sắp tới giờ học, kể cả khi đã tắt hẳn app (không cần mở app
  sẵn). Bật ở tab "Thông báo" trong bảng cài đặt. Cần dựng thêm 1 phần
  server nhỏ trên Vercel — xem mục riêng bên dưới. Chưa hỗ trợ iPhone.
- **Bảng "Cách đọc thời khoá biểu"** ở cuối trang (thu gọn được), tổng hợp
  cách đọc tiết học, các mã HTGD, quy tắc phòng học, ngôn ngữ giảng dạy —
  y như trên portal.
- **Nút bánh răng ở góc trên** mở bảng cài đặt để tự cập nhật lịch, không
  cần sửa code:
  - *Nhập file .ics*: chọn thẳng file `.ics` xuất từ
    `portal.uit.edu.vn/sinh-vien/tkb`, xem trước danh sách lớp đọc được,
    bấm **Lưu & sử dụng** là thay toàn bộ lịch cũ bằng lịch mới — dùng lại
    được mỗi học kỳ, không cần nhờ chỉnh sửa code nữa.
  - *Thêm thủ công*: điền form để thêm 1 lớp (hữu ích cho các lớp không
    xuất được qua .ics, hoặc lớp không có lịch cố định như ĐA/HT2/KLTN —
    ghi chú giờ tạm hoặc giờ hẹn gặp giảng viên).
  - *Danh sách lớp*: xem và xoá từng lớp, hoặc xoá hết để nhập lại từ đầu.

  **Lưu ý:** dữ liệu chỉ lưu trên trình duyệt/thiết bị đang dùng
  (localStorage của trình duyệt), không đồng bộ qua thiết bị khác hay qua
  server. Nếu bạn xem trên cả điện thoại lẫn máy tính, cần nhập file .ics
  một lần trên mỗi thiết bị/trình duyệt. Xoá cache trình duyệt cũng sẽ xoá
  dữ liệu đã nhập — khi đó trang sẽ tự quay về lịch mặc định đang có sẵn
  trong `script.js`.

## Cách host miễn phí bằng GitHub Pages (không cần Vercel)

1. Vào github.com, bấm **New repository**, đặt tên tuỳ ý (vd. `tkb`), để
   **Public**.
2. Upload 3 file `index.html`, `style.css`, `script.js` vào repo (kéo-thả
   qua nút **Add file → Upload files**, hoặc `git push` nếu quen dùng
   git).
3. Vào **Settings → Pages** của repo đó.
4. Ở mục **Build and deployment → Source**, chọn **Deploy from a
   branch**.
5. Ở mục **Branch**, chọn `main` và thư mục `/ (root)`, bấm **Save**.
6. Đợi khoảng 1 phút, load lại trang Settings → Pages sẽ thấy link dạng:
   `https://<tên-github-của-bạn>.github.io/tkb/`
7. Mở link đó trên điện thoại, thêm vào màn hình chính (Add to Home
   Screen) là dùng như một app luôn.

Mỗi lần bạn sửa file trong repo, GitHub Pages tự build lại sau khoảng
30 giây - 1 phút.

**Lưu ý:** cách host này KHÔNG chạy được phần "Thông báo đẩy" (mục bên
dưới) — trang lịch vẫn xem/dùng bình thường, chỉ riêng nút "Bật thông
báo" sẽ báo lỗi vì GitHub Pages không chạy được `api/`. Muốn có thông
báo thì dùng cách host Vercel bên dưới.

## Cách host bằng Vercel (nếu muốn, không bắt buộc)

1. Đăng nhập vercel.com bằng tài khoản GitHub.
2. **Add New → Project**, chọn repo `tkb` bạn vừa tạo ở trên.
3. Vercel tự nhận ra `api/*.js` là serverless function, `package.json`
   để cài `web-push` — bấm **Deploy** là xong, không cần chỉnh gì thêm.
4. Vercel cho bạn link dạng `tkb-xxxx.vercel.app`, mỗi lần push code mới
   lên GitHub thì Vercel tự deploy lại.

Chỉ cần chọn **một trong hai** cách trên cho phần xem lịch. Muốn có
thông báo đẩy thì bắt buộc phải dùng Vercel (đọc tiếp mục dưới).

## Thông báo đẩy trước giờ học (chỉ Android, cần Vercel)

Cơ chế: mỗi 5 phút, 1 "đồng hồ báo giờ" miễn phí trên **GitHub Actions**
gọi vào 1 API route trên Vercel; route đó xem giờ hiện tại có sắp tới
giờ học nào không (30/15/5 phút nữa) rồi gửi thông báo thẳng tới điện
thoại bạn qua cơ chế Push của Google — không cần app đang mở.

**Bước 1 — Sinh khoá VAPID (đã làm sẵn, khỏi làm lại):**
Khoá public đã nhúng sẵn trong `script.js` (biến `VAPID_PUBLIC_KEY`).
Khoá private bạn cần khi làm Bước 3, đây:
```
VAPID_PRIVATE_KEY = IX0nhQUMKJDfemvqmY1wT6RuGD29n9NjvK_p_NB8xk8
```
Giữ khoá private này kín, đừng để lộ hay commit vào code.

**Bước 2 — Tạo database Redis miễn phí (chỗ lưu subscription + lịch):**
1. Vào project trên Vercel dashboard → tab **Storage**.
2. **Create Database** → chọn **Redis** (do Upstash cung cấp, có gói
   free) → **Connect** vào đúng project `tkb` của bạn.
3. Vercel tự thêm 2 biến môi trường `KV_REST_API_URL` và
   `KV_REST_API_TOKEN` vào project — không cần bạn tự nhập.

**Bước 3 — Thêm biến môi trường trên Vercel:**
Vào project → **Settings → Environment Variables**, thêm:

| Tên | Giá trị |
|---|---|
| `VAPID_PUBLIC_KEY` | `BPqo6zbhxSMzhz4MGMGnp50IBxTkP9NgCSsnqAFdZYGMywKWtK-GiblFvbvljrJamqGTPXwtj7srZenNkl_eSeQ` |
| `VAPID_PRIVATE_KEY` | `IX0nhQUMKJDfemvqmY1wT6RuGD29n9NjvK_p_NB8xk8` |
| `CRON_SECRET` | tự đặt 1 chuỗi bất kỳ, đủ dài (vd. bấm đầu ngón tay lên bàn phím) |

Xong bấm **Redeploy** project 1 lần (biến môi trường chỉ áp dụng từ lần
deploy tiếp theo).

**Bước 4 — Cho GitHub Actions biết gọi vào đâu:**
Trên GitHub, vào repo → **Settings → Secrets and variables → Actions**
→ **New repository secret**, thêm 2 cái:

| Tên | Giá trị |
|---|---|
| `CRON_SECRET` | **giống hệt** giá trị bạn đặt ở Bước 3 |
| `APP_URL` | link Vercel của bạn, vd. `https://cander-tan.vercel.app` (không có dấu `/` ở cuối) |

File `.github/workflows/notify.yml` đã có sẵn trong bộ này — chỉ cần
đảm bảo nó nằm đúng đường dẫn đó trong repo. Vào tab **Actions** trên
GitHub, bật lên nếu đang tắt (repo mới tạo thường tự bật sẵn).

**Bước 5 — Bật trên điện thoại:**
Mở lại trang trên Android (Chrome) → bánh răng → tab **Thông báo** →
**Bật thông báo** → đồng ý xin quyền. Xong.

**Về độ trễ:** GitHub Actions không chạy đúng từng giây, có thể lệch
vài phút — thông báo "30 phút nữa" có thể tới lúc còn 24-30 phút, không
tới đúng giây thứ 1800. Đủ dùng cho việc nhắc giờ học, không phải đồng
hồ chính xác tuyệt đối.

**Không cần làm gì thêm để chống bị GitHub tự tắt lịch sau 60 ngày** —
workflow đã có sẵn 1 bước tự "nhá đèn" bằng 1 commit trống mỗi khoảng
45 ngày nếu repo im ắng, hoàn toàn tự động.

## Cập nhật lịch học kỳ sau

Cách khuyến khích: dùng nút bánh răng trên trang → **Nhập file .ics**,
không cần sửa code. Nếu đã bật thông báo đẩy, lịch mới sẽ tự động đồng
bộ lên server luôn, không cần bật lại thông báo.

Nếu muốn sửa dữ liệu mặc định đóng sẵn trong code (để ai mở trang lần đầu
trên thiết bị mới cũng thấy đúng lịch), mở `script.js`, sửa mảng
`DEFAULT_COURSES` ở đầu file. Mỗi môn cần:

- `dow`: thứ trong tuần, quy ước `0=CN, 1=T2, 2=T3, ... 6=T7`
- `start` / `end`: giờ bắt đầu / kết thúc, dạng `"HH:MM"`
- `interval`: `1` nếu học mỗi tuần, `2` nếu học cách tuần
- `startDate` / `until`: ngày buổi đầu tiên / ngày kết thúc học kỳ, dạng
  `"YYYY-MM-DD"`
- `groupKey`: mã môn dùng để gom màu (vd. lớp lý thuyết và lớp thực hành
  cùng môn nên dùng chung `groupKey` để lên cùng màu)
- `htgd`: hình thức giảng dạy, vd. `"LT"`, `"HT1"`, `"ĐA"`... (để trống
  `""` nếu không muốn hiện nhãn)
