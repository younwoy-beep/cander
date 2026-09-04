const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

function parseVNDate(str) {
  // dd/mm/yyyy -> Date
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStatus(ev) {
  const today = new Date();
  const start = parseVNDate(ev.ngay_bat_dau);
  const end = ev.ngay_ket_thuc ? parseVNDate(ev.ngay_ket_thuc) : null;

  if (start && mondayOf(today) < mondayOf(start)) return "not-started";
  if (end && mondayOf(today) > mondayOf(end)) return "ended";

  if (ev.cach_tuan && ev.interval_tuan > 1 && start) {
    const weeksDiff = Math.round((mondayOf(today) - mondayOf(start)) / (7 * 86400000));
    if (((weeksDiff % ev.interval_tuan) + ev.interval_tuan) % ev.interval_tuan !== 0) {
      return "off-week";
    }
  }
  return "active";
}

function renderModal(ev) {
  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <h2>${ev.ten_mon}</h2>
    <div class="modal-row"><span>Mã lớp</span><span>${ev.ma_lop}</span></div>
    <div class="modal-row"><span>Giảng viên</span><span>${ev.giang_vien || "—"}</span></div>
    <div class="modal-row"><span>Thời gian</span><span>${ev.thu}, tiết ${ev.tiet_start}-${ev.tiet_end} (${ev.gio_bat_dau}-${ev.gio_ket_thuc})</span></div>
    <div class="modal-row"><span>Phòng</span><span>${ev.phong}</span></div>
    <div class="modal-row"><span>Chu kỳ</span><span>${ev.cach_tuan ? "Cách tuần" : "Hàng tuần"}</span></div>
    <div class="modal-row"><span>Thời gian học</span><span>${ev.ngay_bat_dau} – ${ev.ngay_ket_thuc || "?"}</span></div>
  `;
  document.getElementById("modalOverlay").hidden = false;
}

function render(events) {
  const grid = document.getElementById("weekGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (!events || events.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon

  for (let d = 0; d < 7; d++) {
    const col = document.createElement("div");
    col.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header" + (d === todayIdx ? " today" : "");
    header.innerHTML = `<span>${WEEKDAY_LABELS[d]}</span>`;
    col.appendChild(header);

    const dayEvents = events.filter(e => e.thu_idx === d).sort((a, b) => (a.tiet_start || 0) - (b.tiet_start || 0));

    if (dayEvents.length === 0) {
      const none = document.createElement("div");
      none.className = "no-class";
      none.textContent = "Không có lịch";
      col.appendChild(none);
    }

    dayEvents.forEach(ev => {
      const status = weekStatus(ev);
      const card = document.createElement("div");
      card.className = "class-card" + (status === "off-week" || status === "ended" || status === "not-started" ? " off-week" : "");
      card.innerHTML = `
        <div class="class-card-top">
          <span class="class-title">${ev.ten_mon}</span>
          <span class="class-time">Tiết ${ev.tiet_start}-${ev.tiet_end}</span>
        </div>
        <div class="class-sub">
          <span>${ev.phong}</span>
          <span>${ev.giang_vien || ""}</span>
          ${ev.cach_tuan ? `<span class="badge${status === "off-week" ? " off" : ""}">${status === "off-week" ? "Tuần này nghỉ" : "Cách tuần"}</span>` : ""}
          ${status === "ended" ? '<span class="badge off">Đã kết thúc</span>' : ""}
          ${status === "not-started" ? '<span class="badge off">Chưa bắt đầu</span>' : ""}
        </div>
      `;
      card.addEventListener("click", () => renderModal(ev));
      col.appendChild(card);
    });

    grid.appendChild(col);
  }
}

async function loadSchedule() {
  const res = await fetch("/api/schedule");
  const data = await res.json();
  document.getElementById("updatedAt").textContent = data.updated_at ? `Cập nhật: ${data.updated_at}` : "";
  render(data.events || []);
}

document.getElementById("icsFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }
  document.getElementById("updatedAt").textContent = `Cập nhật: ${data.updated_at}`;
  render(data.events);
  e.target.value = "";
});

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modalOverlay").hidden = true;
});
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") document.getElementById("modalOverlay").hidden = true;
});

loadSchedule();
