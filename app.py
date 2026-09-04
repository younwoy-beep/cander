import json
import os
import re
from datetime import datetime, timedelta

from flask import Flask, jsonify, render_template, request
from icalendar import Calendar

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "schedule.json")
TZ_OFFSET = timedelta(hours=7)  # Asia/Ho_Chi_Minh, no DST

WEEKDAY_VN = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

app = Flask(__name__)


def buoi_from_tiet(start_tiet):
    if start_tiet <= 5:
        return "Sáng"
    if start_tiet <= 10:
        return "Chiều"
    return "Tối"


def to_local(dt):
    """DTSTART/DTEND with TZID=Asia/Ho_Chi_Minh already carry the correct wall-clock
    time for that zone; UTC (Z) values need shifting by +7h. Naive values are used as-is."""
    if dt.tzinfo is not None:
        offset = dt.utcoffset()
        if offset == timedelta(0):
            # was UTC (Z) -> shift to Asia/Ho_Chi_Minh wall time
            return (dt + TZ_OFFSET).replace(tzinfo=None)
        return dt.replace(tzinfo=None)
    return dt


def parse_ics(file_bytes):
    cal = Calendar.from_ical(file_bytes)
    events = []
    for comp in cal.walk():
        if comp.name != "VEVENT":
            continue

        summary = str(comp.get("SUMMARY", ""))
        location = str(comp.get("LOCATION", ""))
        description = str(comp.get("DESCRIPTION", ""))
        dtstart_raw = comp.get("DTSTART").dt
        dtend_raw = comp.get("DTEND").dt
        rrule = comp.get("RRULE")

        dtstart = to_local(dtstart_raw)
        dtend = to_local(dtend_raw)

        weekday_idx = dtstart.weekday()  # 0=Mon
        interval = 1
        until = None
        if rrule:
            rr = dict(rrule)
            interval = int(rr.get("INTERVAL", [1])[0])
            until_raw = rr.get("UNTIL", [None])[0]
            if until_raw is not None:
                until = to_local(until_raw) if hasattr(until_raw, "weekday") else None

        # Extract fields from SUMMARY: "Tên môn (Mã lớp)"
        m = re.match(r"^(.*)\s\(([^)]+)\)\s*$", summary)
        ten_mon = m.group(1).strip() if m else summary
        ma_lop = m.group(2).strip() if m else ""

        # Extract from DESCRIPTION
        gv_match = re.search(r"GV:\s*(.+)", description)
        giang_vien = gv_match.group(1).strip() if gv_match else ""
        tiet_match = re.search(r"Tiết\s*(\d+)-(\d+)", description)
        tiet_start = int(tiet_match.group(1)) if tiet_match else None
        tiet_end = int(tiet_match.group(2)) if tiet_match else None
        cach_tuan = "cách" in description.lower() and "tuần" in description.lower()
        mon_code_match = re.search(r"Môn:\s*([A-Z0-9]+)", description)
        mon_code = mon_code_match.group(1) if mon_code_match else ""

        events.append({
            "ma_lop": ma_lop,
            "mon_code": mon_code,
            "ten_mon": ten_mon,
            "giang_vien": giang_vien,
            "phong": location,
            "thu_idx": weekday_idx,
            "thu": WEEKDAY_VN[weekday_idx],
            "tiet_start": tiet_start,
            "tiet_end": tiet_end,
            "buoi": buoi_from_tiet(tiet_start) if tiet_start else "",
            "gio_bat_dau": dtstart.strftime("%H:%M"),
            "gio_ket_thuc": dtend.strftime("%H:%M"),
            "cach_tuan": cach_tuan,
            "interval_tuan": interval,
            "ngay_bat_dau": dtstart.strftime("%d/%m/%Y"),
            "ngay_ket_thuc": until.strftime("%d/%m/%Y") if until else "",
            "ngay_bat_dau_iso": dtstart.strftime("%Y-%m-%d"),
        })

    events.sort(key=lambda e: (e["thu_idx"], e["tiet_start"] or 0))
    return events


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/schedule", methods=["GET"])
def get_schedule():
    if not os.path.exists(DATA_PATH):
        return jsonify({"events": [], "updated_at": None})
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


@app.route("/api/upload", methods=["POST"])
def upload_ics():
    if "file" not in request.files:
        return jsonify({"error": "Thiếu file .ics"}), 400
    f = request.files["file"]
    try:
        events = parse_ics(f.read())
    except Exception as e:
        return jsonify({"error": f"Không đọc được file: {e}"}), 400

    payload = {"events": events, "updated_at": datetime.now().strftime("%d/%m/%Y %H:%M")}
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=False, indent=2)
    return jsonify(payload)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
