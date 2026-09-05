/* ===================================================================
   THỜI KHÓA BIỂU — logic chính

   Dữ liệu lịch học được lưu trong biến `courses` (mảng), nạp theo thứ tự:
   1. localStorage (nếu bạn đã từng nhập file .ics hoặc thêm lớp thủ công
      trên chính thiết bị này), hoặc
   2. DEFAULT_COURSES bên dưới (lịch HK1 2026-2027, dùng khi chưa nhập gì).

   Mỗi course có dạng:
   { id, subject, groupKey, room, tiet, teacher,
     dow (0=CN..6=T7), start:"HH:MM", end:"HH:MM",
     interval (1=mỗi tuần, 2=cách tuần), startDate:"YYYY-MM-DD", until:"YYYY-MM-DD" }
=================================================================== */

const STORAGE_KEY = "tkb.courses.v1";

const DEFAULT_COURSES = [
  { id: "IT001.R118", subject: "Nhập môn lập trình", groupKey: "IT001", room: "B3.20", tiet: "Tiết 1-3", teacher: "ThS Phan Minh Quân", htgd: "LT", dow: 5, start: "07:30", end: "09:50", interval: 1, startDate: "2026-09-11", until: "2026-12-26" },
  { id: "IT001.R118.1", subject: "Nhập môn lập trình", groupKey: "IT001", room: "C111", tiet: "Tiết 6-10", teacher: "Trần Nhật Khoa", htgd: "HT1", dow: 5, start: "13:00", end: "17:00", interval: 2, startDate: "2026-09-25", until: "2026-12-19" },
  { id: "MA003.R119", subject: "Đại số tuyến tính", groupKey: "MA003", room: "B4.16", tiet: "Tiết 1-4", teacher: "Quách Văn Chương", htgd: "LT", dow: 4, start: "07:30", end: "10:45", interval: 1, startDate: "2026-09-10", until: "2026-11-28" },
  { id: "MA006.R119", subject: "Giải tích", groupKey: "MA006", room: "B3.20", tiet: "Tiết 6-9", teacher: "ThS Lê Hoàng Tuấn", htgd: "LT", dow: 1, start: "13:00", end: "16:15", interval: 1, startDate: "2026-09-07", until: "2026-12-26" },
  { id: "NT005.R12", subject: "Giới thiệu ngành MMT&TTDL", groupKey: "NT005", room: "B1.14", tiet: "Tiết 1-3", teacher: "ThS Nguyễn Khánh Thuật", htgd: "LT", dow: 3, start: "07:30", end: "09:50", interval: 2, startDate: "2026-09-16", until: "2026-11-21" },
  { id: "PH002.R13", subject: "Nhập môn mạch số", groupKey: "PH002", room: "B3.16", tiet: "Tiết 6-9", teacher: "ThS Ngô Hiếu Trường", htgd: "LT", dow: 2, start: "13:00", end: "16:15", interval: 1, startDate: "2026-09-08", until: "2026-11-28" },
  { id: "PH002.R13.1", subject: "Nhập môn mạch số", groupKey: "PH002", room: "B2.16", tiet: "Tiết 1-5", teacher: "ThS Ngô Hiếu Trường", htgd: "HT1", dow: 2, start: "07:30", end: "11:30", interval: 2, startDate: "2026-09-22", until: "2026-12-19" },
];

const HTGD_LABELS = {
  LT: "Lý thuyết", "ĐA": "Đồ án môn học", HT1: "Thực hành hình thức 1", HT2: "Thực hành hình thức 2",
  TTTN: "Thực tập tốt nghiệp", KLTN: "Khoá luận tốt nghiệp", TG: "Lớp trợ giảng",
  "CĐ": "Chuyên đề", NK: "Ngoại khoá", BT: "Bài tập",
};

const PALETTE = ["#6EC6FF", "#C9A8FF", "#FFB4A2", "#8CE0C4", "#FFD97D", "#FF9AD5", "#B7E28A", "#9FB8FF", "#FFC98C", "#8CDDEA"];

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const GRID_START_MIN = 7 * 60;   // 07:00
const GRID_END_MIN = 21 * 60;    // 21:00 (đủ cho ca tối, tiết 12-15)
const BASE_HOUR_PX = 64;

let courses = loadCourses();
let activeDow = new Date().getDay();
let viewedMonday = mondayOf(new Date());

/* =================== Storage =================== */
function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* ignore corrupt storage */ }
  return DEFAULT_COURSES.slice();
}

function saveCourses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (e) { /* storage full or blocked — data still works this session */ }
}

/* =================== Time helpers =================== */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function hourPx() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hour-h")) || BASE_HOUR_PX;
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
function mondayOf(d) {
  const c = atMidnight(d);
  const dow = c.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  return addDays(c, diffToMonday);
}
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

/* =================== Color assignment =================== */
function buildColorMap() {
  const map = {};
  let i = 0;
  courses.forEach((c) => {
    const key = c.groupKey || c.id;
    if (!(key in map)) {
      map[key] = PALETTE[i % PALETTE.length];
      i++;
    }
  });
  return map;
}

/* =================== ICS parsing =================== */
function icsUnescape(s) {
  return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}
function unfoldICS(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function parseDT(val) {
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return { dateStr: `${y}-${mo}-${d}`, timeStr: `${h}:${mi}`, y: +y, mo: +mo, d: +d };
}
function parseICSLine(line) {
  const idx = line.indexOf(":");
  if (idx === -1) return null;
  let key = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const semi = key.indexOf(";");
  if (semi !== -1) key = key.slice(0, semi);
  return { key: key.trim().toUpperCase(), value };
}
function parseICS(text) {
  const unfolded = unfoldICS(text);
  const events = [...unfolded.matchAll(/BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g)];
  const result = [];
  const warnings = [];

  events.forEach((m, i) => {
    const lines = m[1].split("\n").filter((l) => l.trim() !== "");
    const props = {};
    lines.forEach((l) => {
      const p = parseICSLine(l);
      if (p) props[p.key] = p.value;
    });

    const summary = props.SUMMARY || "";
    const location = props.LOCATION || "";
    const description = icsUnescape(props.DESCRIPTION || "");
    const dtstart = props.DTSTART ? parseDT(props.DTSTART) : null;
    const dtend = props.DTEND ? parseDT(props.DTEND) : null;
    const rrule = props.RRULE || "";

    if (!dtstart || !dtend) {
      warnings.push(`Bỏ qua một buổi học: thiếu ngày giờ bắt đầu/kết thúc.`);
      return;
    }

    let interval = 1, until = null;
    rrule.split(";").forEach((part) => {
      const [k, v] = part.split("=");
      if (k === "INTERVAL") interval = parseInt(v, 10) || 1;
      if (k === "UNTIL") {
        const u = parseDT(v);
        if (u) until = u.dateStr;
      }
    });
    if (!until) until = dtstart.dateStr;

    const maLopMatch = description.match(/Mã lớp:\s*(.+)/);
    const monMatch = description.match(/Môn:\s*(.+)/);
    const tietMatch = description.match(/Tiết\s*([\d]+(?:-[\d]+)?)/);
    const gvMatch = description.match(/GV:\s*(.+)/);

    let code = maLopMatch ? maLopMatch[1].trim() : null;
    if (!code) {
      const pm = summary.match(/\(([^)]+)\)\s*$/);
      code = pm ? pm[1].trim() : `EVT${i + 1}`;
    }

    let subjectName = monMatch ? monMatch[1].trim().replace(/^[A-Z0-9]+\s*-\s*/, "") : null;
    if (!subjectName) subjectName = summary.replace(/\s*\([^)]*\)\s*$/, "").trim();

    const dow = new Date(dtstart.y, dtstart.mo - 1, dtstart.d).getDay();

    result.push({
      id: code,
      subject: subjectName,
      groupKey: code.split(".")[0],
      room: location,
      tiet: tietMatch ? `Tiết ${tietMatch[1]}` : "",
      teacher: gvMatch ? gvMatch[1].trim() : "",
      htgd: "",
      dow,
      start: dtstart.timeStr,
      end: dtend.timeStr,
      interval,
      startDate: dtstart.dateStr,
      until,
    });
  });

  return { courses: result, warnings };
}

/* =================== Rendering: grid =================== */
function buildDayTabs(weekMonday) {
  const nav = document.getElementById("dayTabs");
  nav.innerHTML = "";
  const todayMid = atMidnight(new Date());
  const order = [1, 2, 3, 4, 5, 6, 0];
  order.forEach((dow) => {
    const offset = dow === 0 ? 6 : dow - 1;
    const date = addDays(weekMonday, offset);
    const btn = document.createElement("button");
    btn.className = "day-tab";
    btn.dataset.dow = dow;
    if (date.getTime() === todayMid.getTime()) btn.classList.add("is-today");
    if (dow === activeDow) btn.classList.add("is-active");
    btn.innerHTML = `<span class="d-name">${DAY_NAMES[dow]}</span><span class="d-date">${fmtDate(date)}</span>`;
    btn.addEventListener("click", () => { activeDow = dow; renderGrid(); });
    nav.appendChild(btn);
  });
}

function buildWeekNav() {
  const label = document.getElementById("weekRangeLabel");
  const btnThisWeek = document.getElementById("btnThisWeek");
  const sunday = addDays(viewedMonday, 6);
  label.textContent = `Tuần ${fmtDate(viewedMonday)} – ${fmtDate(sunday)}`;
  const isCurrentWeek = viewedMonday.getTime() === mondayOf(new Date()).getTime();
  btnThisWeek.hidden = isCurrentWeek;
}

function buildHourRuler() {
  const ruler = document.getElementById("hourRuler");
  ruler.innerHTML = "";
  const hpx = hourPx();
  for (let m = GRID_START_MIN; m <= GRID_END_MIN; m += 60) {
    const label = document.createElement("div");
    label.className = "h-label";
    label.style.top = ((m - GRID_START_MIN) / 60) * hpx + "px";
    label.textContent = String(Math.floor(m / 60)).padStart(2, "0") + "h";
    ruler.appendChild(label);
  }
}

function buildWeekGrid(weekMonday, colorMap) {
  const grid = document.getElementById("weekGrid");
  const nowLine = document.getElementById("nowLine");
  grid.innerHTML = "";
  grid.appendChild(nowLine);
  const hpx = hourPx();

  const order = [1, 2, 3, 4, 5, 6, 0];
  order.forEach((dow) => {
    const offset = dow === 0 ? 6 : dow - 1;
    const date = addDays(weekMonday, offset);
    const col = document.createElement("div");
    col.className = "day-col";
    col.dataset.dow = dow;
    if (dow === activeDow) col.classList.add("is-active");

    courses.filter((c) => c.dow === dow).forEach((course) => {
      const startMin = toMinutes(course.start);
      const endMin = toMinutes(course.end);
      const top = ((startMin - GRID_START_MIN) / 60) * hpx;
      const height = ((endMin - startMin) / 60) * hpx;

      const active = occursOn(course, date);
      const now = new Date();
      const isToday = atMidnight(date).getTime() === atMidnight(now).getTime();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const isLive = active && isToday && nowMin >= startMin && nowMin < endMin;
      const color = colorMap[course.groupKey || course.id] || PALETTE[0];

      const block = document.createElement("div");
      block.className = "block" + (!active ? " is-off" : "") + (isLive ? " is-live" : "");
      block.style.top = top + "px";
      block.style.height = Math.max(height, 30) + "px";
      if (!isLive) block.style.borderLeftColor = color;

      const biweeklyTag = course.interval === 2 ? `<span class="b-tag">cách tuần</span>` : "";
      const htgdTag = course.htgd ? `<span class="b-tag b-htgd">${course.htgd}</span>` : "";
      const offPill = !active ? `<span class="b-off-pill">Tuần này nghỉ</span>` : "";
      block.innerHTML = `
        <div class="b-name">${course.subject}</div>
        <div class="b-meta">${course.start}–${course.end}${course.room ? " · " + course.room : ""}${course.tiet ? " · " + course.tiet : ""}</div>
        ${course.teacher ? `<div class="b-meta">${course.teacher}</div>` : ""}
        ${htgdTag}${biweeklyTag}${offPill}
      `;
      block.addEventListener("click", () => showDetail(course, date, active));
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
  line.style.top = ((nowMin - GRID_START_MIN) / 60) * hourPx() + "px";
}

function buildLegend(colorMap) {
  const el = document.getElementById("legend");
  const seen = new Set();
  const items = [];
  courses.forEach((c) => {
    const key = c.groupKey || c.id;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ key, label: c.subject, color: colorMap[key] });
  });
  el.innerHTML = items
    .map((it) => `<span class="legend-item"><span class="legend-dot" style="background:${it.color}"></span>${it.label}</span>`)
    .join("");
}

/* =================== Live status bar =================== */
function findCurrentOrNext(now) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayDow = now.getDay();
  for (const c of courses) {
    if (c.dow !== todayDow || !occursOn(c, now)) continue;
    const s = toMinutes(c.start), e = toMinutes(c.end);
    if (nowMin >= s && nowMin < e) return { type: "live", course: c, endMin: e };
  }
  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const date = addDays(atMidnight(now), dayOffset);
    const dow = date.getDay();
    const upcoming = courses
      .filter((c) => c.dow === dow && occursOn(c, date))
      .filter((c) => !(dayOffset === 0 && toMinutes(c.start) <= nowMin))
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
        <span class="status-sub">${[result.course.room, result.course.tiet, result.course.teacher].filter(Boolean).join(" · ")}</span>
      </span>
      <span class="status-count">
        <span class="status-count-num">${fmtDur(remain)}</span>
        <span class="status-count-label">còn lại</span>
      </span>
    `;
  } else {
    const diffMin = (result.dateTime - now) / 60000;
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
        <span class="status-sub">${whenLabel}${result.course.room ? " · " + result.course.room : ""}</span>
      </span>
      <span class="status-count">
        <span class="status-count-num">${fmtDur(diffMin)}</span>
        <span class="status-count-label">còn lại</span>
      </span>
    `;
  }
}

/* =================== Main render =================== */
function renderGrid() {
  const colorMap = buildColorMap();
  buildWeekNav();
  buildDayTabs(viewedMonday);
  buildHourRuler();
  buildWeekGrid(viewedMonday, colorMap);
  updateNowLine();
  buildLegend(colorMap);
}

function renderAll() {
  renderGrid();
  updateStatusBar();
}

function tick() {
  updateNowLine();
  updateStatusBar();
}

function scrollToNow() {
  const line = document.getElementById("nowLine");
  if (line.style.display === "none") return;
  if (viewedMonday.getTime() !== mondayOf(new Date()).getTime()) return;
  line.scrollIntoView({ block: "center", behavior: "auto" });
}

/* =================== Week navigation =================== */
document.getElementById("btnPrevWeek").addEventListener("click", () => {
  viewedMonday = addDays(viewedMonday, -7);
  renderGrid();
});
document.getElementById("btnNextWeek").addEventListener("click", () => {
  viewedMonday = addDays(viewedMonday, 7);
  renderGrid();
});
document.getElementById("btnThisWeek").addEventListener("click", () => {
  viewedMonday = mondayOf(new Date());
  activeDow = new Date().getDay();
  renderGrid();
});

/* =================== Detail overlay =================== */
const detailOverlay = document.getElementById("detailOverlay");
const btnCloseDetail = document.getElementById("btnCloseDetail");

function showDetail(course, date, active) {
  document.getElementById("detailTitle").textContent = course.subject;
  const rows = [
    ["Mã lớp", course.id],
    ["Hình thức", course.htgd ? `${course.htgd} — ${HTGD_LABELS[course.htgd] || ""}` : "—"],
    ["Thứ / Giờ", `${DAY_NAMES[course.dow]} · ${course.start}–${course.end}`],
    ["Tiết", course.tiet || "—"],
    ["Phòng", course.room || "—"],
    ["Giảng viên", course.teacher || "—"],
    ["Chu kỳ", course.interval === 2 ? "Cách tuần (2 tuần/lần)" : "Học mỗi tuần"],
    ["Thời gian học", `${course.startDate} → ${course.until}`],
  ];
  document.getElementById("detailBody").innerHTML =
    rows.map(([label, value]) => `<div class="detail-row"><span class="d-label">${label}</span><span class="d-value">${value}</span></div>`).join("") +
    (active ? "" : `<div class="detail-off-note">Tuần đang xem (${fmtDate(date)}) không có buổi học này — lớp cách tuần chỉ học 2 tuần/lần.</div>`);
  detailOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeDetail() {
  detailOverlay.hidden = true;
  if (overlay.hidden) document.body.style.overflow = "";
}
btnCloseDetail.addEventListener("click", closeDetail);
detailOverlay.addEventListener("click", (e) => { if (e.target === detailOverlay) closeDetail(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !detailOverlay.hidden) closeDetail(); });

/* =================== Settings panel =================== */
const overlay = document.getElementById("settingsOverlay");
const btnSettings = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");

function openSettings() {
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderCourseList();
}
function closeSettings() {
  overlay.hidden = true;
  if (detailOverlay.hidden) document.body.style.overflow = "";
}
btnSettings.addEventListener("click", openSettings);
btnCloseSettings.addEventListener("click", closeSettings);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closeSettings(); });

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".panel-body").forEach((b) => (b.hidden = true));
    btn.classList.add("is-active");
    document.getElementById("tab" + btn.dataset.tab[0].toUpperCase() + btn.dataset.tab.slice(1)).hidden = false;
    if (btn.dataset.tab === "list") renderCourseList();
  });
});

/* --- Import tab --- */
let pendingImport = null;
const icsFileInput = document.getElementById("icsFileInput");
const fileDropLabel = document.getElementById("fileDropLabel");
const importPreview = document.getElementById("importPreview");
const btnConfirmImport = document.getElementById("btnConfirmImport");
const btnResetDefault = document.getElementById("btnResetDefault");

icsFileInput.addEventListener("change", () => {
  const file = icsFileInput.files[0];
  if (!file) return;
  fileDropLabel.textContent = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    const { courses: parsed, warnings } = parseICS(String(reader.result));
    if (!parsed.length) {
      importPreview.innerHTML = `<p class="preview-warn">Không đọc được lớp học nào từ file này. Kiểm tra lại file .ics.</p>`;
      btnConfirmImport.disabled = true;
      pendingImport = null;
      return;
    }
    pendingImport = parsed;
    importPreview.innerHTML = `
      <p class="preview-count">Tìm thấy ${parsed.length} lớp học:</p>
      ${parsed.map((c) => `<div class="preview-item"><span class="p-name">${c.subject}</span><span class="p-meta">${DAY_NAMES[c.dow]} · ${c.start}-${c.end}</span></div>`).join("")}
      ${warnings.length ? `<p class="preview-warn">${warnings.join("<br>")}</p>` : ""}
    `;
    btnConfirmImport.disabled = false;
  };
  reader.readAsText(file);
});

btnConfirmImport.addEventListener("click", () => {
  if (!pendingImport) return;
  courses = pendingImport;
  saveCourses();
  pendingImport = null;
  importPreview.innerHTML = `<p class="preview-count">Đã lưu ${courses.length} lớp học. Đang đóng…</p>`;
  btnConfirmImport.disabled = true;
  renderAll();
  setTimeout(closeSettings, 900);
});

btnResetDefault.addEventListener("click", () => {
  courses = DEFAULT_COURSES.slice();
  saveCourses();
  importPreview.innerHTML = `<p class="preview-count">Đã khôi phục lịch mặc định (HK1 2026-2027).</p>`;
  icsFileInput.value = "";
  fileDropLabel.textContent = "Chọn file .ics";
  renderAll();
});

/* --- Manual tab --- */
const manualForm = document.getElementById("manualForm");
const manualStatus = document.getElementById("manualStatus");

manualForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(manualForm);
  const subject = fd.get("subject").trim();
  const start = fd.get("start");
  const end = fd.get("end");
  const startDate = fd.get("startDate");
  const until = fd.get("until");
  if (!subject || !start || !end || !startDate || !until) return;

  let id = fd.get("id").trim();
  if (!id) id = "MANUAL-" + Date.now();

  courses.push({
    id,
    subject,
    groupKey: id.split(".")[0],
    room: fd.get("room").trim(),
    tiet: fd.get("tiet").trim(),
    teacher: fd.get("teacher").trim(),
    htgd: fd.get("htgd") || "",
    dow: parseInt(fd.get("dow"), 10),
    start, end,
    interval: parseInt(fd.get("interval"), 10),
    startDate, until,
  });
  saveCourses();
  manualStatus.textContent = `Đã thêm "${subject}".`;
  manualForm.reset();
  renderAll();
});

/* --- List tab --- */
const courseListEl = document.getElementById("courseList");
const btnClearAll = document.getElementById("btnClearAll");

function renderCourseList() {
  if (!courses.length) {
    courseListEl.innerHTML = `<p class="empty-note">Chưa có lớp học nào.</p>`;
    return;
  }
  const htgdOptions = ["", "LT", "ĐA", "HT1", "HT2", "TTTN", "KLTN", "TG", "CĐ", "NK", "BT"];
  courseListEl.innerHTML = courses
    .map(
      (c, i) => `
      <div class="course-row">
        <div>
          <div class="c-name">${c.subject}</div>
          <div class="c-meta">${DAY_NAMES[c.dow]} · ${c.start}-${c.end}${c.room ? " · " + c.room : ""}${c.interval === 2 ? " · cách tuần" : ""}</div>
          <select class="c-htgd-select" data-idx="${i}" aria-label="Hình thức giảng dạy">
            ${htgdOptions.map((h) => `<option value="${h}" ${c.htgd === h ? "selected" : ""}>${h || "— HTGD —"}</option>`).join("")}
          </select>
        </div>
        <button class="c-del" data-idx="${i}" aria-label="Xoá lớp này">✕</button>
      </div>`
    )
    .join("");

  courseListEl.querySelectorAll(".c-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      courses.splice(idx, 1);
      saveCourses();
      renderCourseList();
      renderAll();
    });
  });
  courseListEl.querySelectorAll(".c-htgd-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      const idx = parseInt(sel.dataset.idx, 10);
      courses[idx].htgd = sel.value;
      saveCourses();
      renderGrid();
    });
  });
}

btnClearAll.addEventListener("click", () => {
  if (!confirm("Xoá toàn bộ lớp học đang có?")) return;
  courses = [];
  saveCourses();
  renderCourseList();
  renderAll();
});

/* =================== Boot =================== */
renderAll();
setTimeout(scrollToNow, 50);
setInterval(tick, 30 * 1000);
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) renderAll();
}, 60 * 1000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline install optional, ignore failure */ });
  });
}
