# TKB Web — thời khóa biểu trực quan, chạy mọi lúc

Web tĩnh thuần (HTML + CSS + JS), hiển thị thời khóa biểu 7 ngày theo thời gian **thực**, host miễn phí trên **GitHub Pages**, xem được trên điện thoại mọi lúc không cần server.

## Tính năng

- Lưới 7 ngày (Thứ 2 → Chủ nhật), cột "hôm nay" được tô nổi bật.
- Banner "tiết tiếp theo" đếm ngược từng giây.
- Tự nhận trạng thái từng buổi học:
  - 🟢 **ĐANG HỌC** (còn bao nhiêu phút nữa hết tiết)
  - 🟡 **Sắp tới** (còn bao lâu nữa bắt đầu)
  - ⚪ **Đã học xong** (làm mờ)
- Xử lý đúng lớp **học cách tuần** (INTERVAL=2): tuần có học / tuần nghỉ.
- Bấm vào môn để xem chi tiết (giảng viên, phòng, mã lớp, thời gian học).

## Triển khai lên GitHub Pages

1. Đẩy code lên GitHub (repo hiện tại: `younwoy-beep/cander`).

   ```powershell
   git add .
   git commit -m "Static TKB web"
   git push
   ```

2. Trên GitHub: vào repo → **Settings** → **Pages** → mục **Branch** chọn nhánh `main`, thư mục `/(root)` → **Save**.
3. Sau 1–2 phút, web chạy tại: `https://younwoy-beep.github.io/cander/`

> Web tĩnh không cần `app.py` / Flask. Mở thẳng `index.html` trong trình duyệt cũng chạy được ngay.

## Cập nhật lịch mới (khi có file .ics học kỳ mới)

File `.ics` từ portal chứa `RRULE:FREQ=WEEKLY;INTERVAL=...` — dữ liệu này đã được chuyển sẵn vào `schedule.js`. Khi có học kỳ mới, mở `schedule.js` và thay mảng `events` bằng dữ liệu mới (giữ đúng các trường: `thu_idx`, `gio_bat_dau`, `gio_ket_thuc`, `ngay_bat_dau_iso`, `ngay_ket_thuc`, `cach_tuan`, `interval_tuan`).

## Cấu trúc

```
index.html        # giao diện
style.css         # theme dark, responsive (điện thoại tự xếp 1 cột)
app.js            # logic: tính tuần, đếm ngược, trạng thái buổi học
schedule.js       # dữ liệu lịch (window.SCHEDULE)
.nojekyll         # để GitHub Pages phục vụ đúng file tĩnh
```

## Ghi chú

- Múi giờ tính theo **Asia/Ho_Chi_Minh (UTC+7)**, không có giờ mùa hè.
- Lịch "cách tuần" được tính từ ngày bắt đầu thực của từng lớp (khớp với `.ics`).
- Dự án cũ còn `app.py` + `templates/` + `static/` (bản Flask tự host) — không cần cho GitHub Pages.
