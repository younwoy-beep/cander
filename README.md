# TKB Web — lịch học cá nhân

Web nhỏ tự host: upload file `.ics` từ portal.uit.edu.vn, backend Flask parse và lưu vào `data/schedule.json`, frontend hiển thị lịch tuần (dark theme), tự tính "tuần này có học không" cho các lớp cách tuần.

## Chạy thử (local / Termux)

```bash
pip install -r requirements.txt
python app.py
# mở http://<ip-may>:5000
```

## Deploy lên VPS/hosting riêng

- **Có Python 3 + có thể chạy process nền**: dùng `gunicorn`:
  ```bash
  pip install gunicorn
  gunicorn -w 2 -b 0.0.0.0:8000 app:app
  ```
  rồi proxy qua Nginx/Caddy về domain (ví dụ `tkb.ice.fo`).
- **Termux (điện thoại)**: chạy thẳng `python app.py`, dùng Tailscale/Cloudflare Tunnel nếu muốn truy cập từ ngoài.

## Cấu trúc

```
app.py              # Flask: /api/upload (POST ics), /api/schedule (GET)
templates/index.html
static/style.css
static/app.js
data/schedule.json  # "database" — 1 file JSON, đủ dùng cho 1 người
```

## Ghi chú

- Chỉ hỗ trợ 1 người dùng (không có đăng nhập) — đúng mục đích "lịch cá nhân".
- Mỗi lần upload .ics mới sẽ **ghi đè** toàn bộ lịch cũ.
- Nếu muốn multi-user thật, cần thêm auth + đổi `schedule.json` thành DB (SQLite) theo user_id — báo mình nếu cần mở rộng.
