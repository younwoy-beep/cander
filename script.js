/* ===================================================================
   DỮ LIỆU THỜI KHÓA BIỂU — HK1 2026-2027
   Lấy từ file .ics xuất ra từ portal.uit.edu.vn.
   Muốn cập nhật học kỳ mới: sửa mảng COURSES bên dưới là đủ,
   không cần đụng vào phần logic phía sau.

   dow: thứ trong tuần theo chuẩn JS Date.getDay() -> 0=CN,1=T2,...6=T7
   interval: 1 = học mỗi tuần, 2 = học cách tuần (2 tuần/lần)
   start/until: ngày buổi học ĐẦU TIÊN / ngày kết thúc học kỳ (yyyy-mm-dd)
=================================================================== */
const COURSES = [
  {
    id: "IT001.R118",
    subject: "Nhập môn lập trình",
    cls: "it",
    room: "B3.20",
    tiet: "Tiết 1-3",
    teacher: "ThS Phan Minh Quân",
    dow: 5, start: "07:30", end: "09:50",
    interval: 1, startDate: "2026-09-11", until: "2026-12-26",
  },
  {
    id: "IT001.R118.1",
    subject: "Nhập môn lập trình (TH)",
    cls: "it",
    room: "C111",
    tiet: "Tiết 6-10",
    teacher: "Trần Nhật Khoa",
    dow: 5, start: "13:00", end: "17:00",
    interval: 2, startDate: "2026-09-25", until: "2026-12-19",
  },
  {
    id: "MA003.R119",
    subject: "Đại số tuyến tính",
    cls: "ma003",
    room: "B4.16",
    tiet: "Tiết 1-4",
    teacher: "Quách Văn Chương",
    dow: 4, start: "07:30", end: "10:45",
    interval: 1, startDate: "2026-09-10", until: "2026-11-28",
  },
  {
    id: "MA006.R119",
    subject: "Giải tích",
    cls: "ma006",
    room: "B3.20",
    tiet: "Tiết 6-9",
    teacher: "ThS Lê Hoàng Tuấn",
    dow: 1, start: "13:00", end: "16:15",
    interval: 1, startDate: "2026-09-07", until: "2026-12-26",
  },
  {
    id: "NT005.R12",
    subject: "Giới thiệu ngành MMT&TTDL",
    cls: "nt",
    room: "B1.14",
    tiet: "Tiết 1-3",
    teacher: "ThS Nguyễn Khánh Thuật",
    dow: 3, start: "07:30", end: "09:50",
    interval: 2, startDate: "2026-09-16", until: "2026-11-21",
  },
  {
    id: "PH002.R13",
    subject: "Nhập môn mạch số",
    cls: "ph",
    room: "B3.16",
    tiet: "Tiết 6-9",
    teacher: "ThS Ngô Hiếu Trường",
    dow: 2, start: "13:00", end: "16:15",
    interval: 1, startDate: "2026-09-08", until: "2026-11-28",
  },
  {
    id: "PH002.R13.1",
    subject: "Nhập môn mạch số (TH)",
    cls: "ph",
    room: "B2.16",
    tiet: "Tiết 1-5",
    teacher: "ThS Ngô Hiếu Trường",
    dow: 2, start: "07:30", end: "11:30",
    interval: 2, startDate: "2026-09-22", until: "2026-12-19",
  },
];

const SUBJECT_LEGEND = [
  { cls: "it", label: "Nhập môn lập trình" },
  { cls: "ma003", label: "Đại số tuyến tính" },
  { cls: "ma006", label: "Giải tích" },
  { cls: "nt", label: "Giới thiệu ngành MMT&TTDL" },
  { cls: "ph", label: "Nhập môn mạch số" },
];

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const GRID_START_MIN = 7 * 60;      // 07:00
const GRID_END_MIN = 18 * 60;       // 18:00
const HOUR_PX = 64;

/* ---------------- Time helpers ---------------- */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function atMidnight(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// Monday of the week containing `d`
function mondayOf(d) {
  const c = atMidnight(d);
  const dow = c.getDay(); // 0=CN
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  return addDays(c, diffToMonday);
}

// Does `course` actually meet on calendar date `date` (given date already
// matches the course's weekday)? Checks range + biweekly parity.
function occursOn(course, date) {
  const start = atMidnight(new Date(course.startDate + "T00:00:00"));
  const until = atMidnight(new Date(course.until + "T00:00:00"));
  const d = atMidnight(date);
  if (d < start || d > until) return false;
  const daysDiff = Math.round((d - start) / 86400000);
  const weeksSince = Math.floor(daysDiff / 7);
  return weeksSince % course.interval === 0;
}

function fmtDate(d) {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function fmtDur(mins) {
  mins = Math.max(0, Math.round(mins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/* ---------------- Build the week + render grid ---------------- */
let activeDow = new Date().getDay(); // which day-tab is selected on mobile

function buildDayTabs(weekMonday) {
  const nav = document.getElementById("dayTabs");
  nav.innerHTML = "";
  const todayMid = atMidnight(new Date());
  const order = [1, 2, 3, 4, 5, 6, 0]; // T2..CN
  order.forEach((dow) => {
    const offset = dow === 0 ? 6 : dow - 1;
    const date = addDays(weekMonday, offset);
    const btn = document.createElement("button");
    btn.className = "day-tab";
    btn.dataset.dow = dow;
    if (date.getTime() === todayMid.getTime()) btn.classList.add("is-today");
    if (dow === activeDow) btn.classList.add("is-active");
    btn.innerHTML = `<span class="d-name">${DAY_NAMES[dow]}</span><span class="d-date">${fmtDate(date)}</span>`;
    btn.addEventListener("click", () => {
      activeDow = dow;
      render();
    });
    nav.appendChild(btn);
  });
}

function buildHourRuler() {
  const ruler = document.getElementById("hourRuler");
  ruler.innerHTML = "";
  for (let m = GRID_START_MIN; m <= GRID_END_MIN; m += 60) {
    const label = document.createElement("div");
    label.className = "h-label";
    label.style.top = ((m - GRID_START_MIN) / 60) * HOUR_PX + "px";
    const h = Math.floor(m / 60);
    label.textContent = String(h).padStart(2, "0") + "h";
    ruler.appendChild(label);
  }
}

function buildWeekGrid(weekMonday) {
  const grid = document.getElementById("weekGrid");
  const nowLine = document.getElementById("nowLine");
  grid.innerHTML = "";
  grid.appendChild(nowLine);

  const order = [1, 2, 3, 4, 5, 6, 0]; // T2..CN columns, left to right
  order.forEach((dow) => {
    const offset = dow === 0 ? 6 : dow - 1;
    const date = addDays(weekMonday, offset);
    const col = document.createElement("div");
    col.className = "day-col";
    col.dataset.dow = dow;
    if (dow === activeDow) col.classList.add("is-active");

    COURSES.filter((c) => c.dow === dow).forEach((course) => {
      const startMin = toMinutes(course.start);
      const endMin = toMinutes(course.end);
      const top = ((startMin - GRID_START_MIN) / 60) * HOUR_PX;
      const height = ((endMin - startMin) / 60) * HOUR_PX;

      const active = occursOn(course, date);
      const now = new Date();
      const isToday = atMidnight(date).getTime() === atMidnight(now).getTime();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const isLive = active && isToday && nowMin >= startMin && nowMin < endMin;

      const block = document.createElement("div");
      block.className = `block c-${course.cls}`;
      if (!active) block.classList.add("is-off");
      if (isLive) block.classList.add("is-live");
      block.style.top = top + "px";
      block.style.height = Math.max(height, 30) + "px";

      const biweeklyTag = course.interval === 2 ? `<span class="b-tag">cách tuần</span>` : "";
      block.innerHTML = `
        <div class="b-name">${course.subject}</div>
        <div class="b-meta">${course.start}–${course.end} · ${course.room} · ${course.tiet}</div>
        <div class="b-meta">${course.teacher}</div>
        ${biweeklyTag}
      `;
      col.appendChild(block);
    });

    grid.appendChild(col);
  });
}

function updateNowLine() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const line = document.getElementById("nowLine");
  if (nowMin < GRID_START_MIN || nowMin > GRID_END_MIN) {
    line.style.display = "none";
    return;
  }
  line.style.display = "block";
  line.style.top = ((nowMin - GRID_START_MIN) / 60) * HOUR_PX + "px";
}

function buildLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = SUBJECT_LEGEND.map(
    (s) => `<span class="legend-item"><span class="legend-dot" style="background:var(--c-${s.cls})"></span>${s.label}</span>`
  ).join("");
}

/* ---------------- Live status bar ---------------- */
function findCurrentOrNext(now) {
  // 1) Is a class happening right now?
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayDow = now.getDay();
  for (const c of COURSES) {
    if (c.dow !== todayDow) continue;
    if (!occursOn(c, now)) continue;
    const s = toMinutes(c.start), e = toMinutes(c.end);
    if (nowMin >= s && nowMin < e) {
      return { type: "live", course: c, date: atMidnight(now), endMin: e };
    }
  }
  // 2) Otherwise scan forward up to 14 days for the next occurrence.
  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const date = addDays(atMidnight(now), dayOffset);
    const dow = date.getDay();
    const candidates = COURSES.filter((c) => c.dow === dow && occursOn(c, date));
    for (const c of candidates) {
      const s = toMinutes(c.start);
      if (dayOffset === 0 && s <= nowMin) continue; // already passed today
      const startDateTime = new Date(date);
      startDateTime.setHours(Math.floor(s / 60), s % 60, 0, 0);
      candidates._dt = startDateTime;
    }
    const upcoming = candidates
      .filter((c) => {
        const s = toMinutes(c.start);
        return !(dayOffset === 0 && s <= nowMin);
      })
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    if (upcoming.length) {
      const c = upcoming[0];
      const s = toMinutes(c.start);
      const dt = new Date(date);
      dt.setHours(Math.floor(s / 60), s % 60, 0, 0);
      return { type: "next", course: c, date, dateTime: dt };
    }
  }
  return null;
}

function updateStatusBar() {
  const now = new Date();
  document.getElementById("clockNow").textContent = now.toLocaleTimeString("vi-VN", { hour12: false });
  document.getElementById("dateToday").textContent = now.toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  const statusMain = document.getElementById("statusMain");
  const result = findCurrentOrNext(now);

  if (!result) {
    statusMain.className = "status-main";
    statusMain.innerHTML = `<span class="status-dot"></span><span class="status-label">Không còn lịch học nào trong học kỳ này</span>`;
    return;
  }

  if (result.type === "live") {
    const remain = result.endMin - (now.getHours() * 60 + now.getMinutes());
    statusMain.className = "status-main is-live";
    statusMain.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">
        <span class="status-label">Đang học</span>
        <span class="status-title">${result.course.subject}</span>
        <span class="status-sub">${result.course.room} · ${result.course.tiet} · ${result.course.teacher}</span>
      </span>
      <span class="status-count">
        <span class="status-count-num">${fmtDur(remain)}</span>
        <span class="status-count-label">còn lại</span>
      </span>
    `;
  } else {
    const diffMs = result.dateTime - now;
    const diffMin = diffMs / 60000;
    const isToday = atMidnight(result.date).getTime() === atMidnight(now).getTime();
    const isTomorrow = atMidnight(result.date).getTime() === atMidnight(addDays(now, 1)).getTime();
    let whenLabel;
    if (isToday) whenLabel = `hôm nay lúc ${result.course.start}`;
    else if (isTomorrow) whenLabel = `ngày mai lúc ${result.course.start}`;
    else whenLabel = `${DAY_NAMES[result.date.getDay()]}, ${fmtDate(result.date)} lúc ${result.course.start}`;

    statusMain.className = "status-main";
    statusMain.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">
        <span class="status-label">Tiết học tiếp theo</span>
        <span class="status-title">${result.course.subject}</span>
        <span class="status-sub">${whenLabel} · ${result.course.room}</span>
      </span>
      <span class="status-count">
        <span class="status-count-num">${fmtDur(diffMin)}</span>
        <span class="status-count-label">còn lại</span>
      </span>
    `;
  }
}

/* ---------------- Main render / tick loop ---------------- */
function render() {
  const weekMonday = mondayOf(new Date());
  buildDayTabs(weekMonday);
  buildHourRuler();
  buildWeekGrid(weekMonday);
  updateNowLine();
  buildLegend();
  updateStatusBar();
}

function tick() {
  updateNowLine();
  updateStatusBar();
}

render();
setInterval(tick, 30 * 1000); // cập nhật mỗi 30 giây
// Rebuild the whole grid once a day rolls over (in case the page is left open).
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) render();
}, 60 * 1000);
