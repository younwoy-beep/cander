(function () {
  const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  const TZ_MS = 7 * 3600 * 1000;

  function pad(n) { return String(n).padStart(2, "0"); }
  function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; }
  function parseDMY(s) { const [d, m, y] = s.split("/").map(Number); return { y, m, d }; }
  function toISO(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
  function addDaysISO(iso, n) { const { y, m, d } = parseISO(iso); const dt = new Date(Date.UTC(y, m - 1, d + n)); return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); }
  function mondayOfISO(iso) { const { y, m, d } = parseISO(iso); const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); const diff = dow === 0 ? -6 : 1 - dow; const dt = new Date(Date.UTC(y, m - 1, d + diff)); return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); }
  function toEpochVN(y, m, d, h, min) { return Date.UTC(y, m - 1, d, h || 0, min || 0, 0) - TZ_MS; }
  function daysBetweenISO(aISO, bISO) { const a = parseISO(aISO); const b = parseISO(bISO); return Math.round((Date.UTC(a.y, a.m - 1, a.d) - Date.UTC(b.y, b.m - 1, b.d)) / 86400000); }
  function nowVN() { const d = new Date(Date.now() + TZ_MS); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay() }; }
  function todayISO() { const n = nowVN(); return toISO(n.y, n.m, n.d); }
  function fmtDuration(ms) { if (ms < 0) ms = 0; const totalSec = Math.floor(ms / 1000); const d = Math.floor(totalSec / 86400); const h = Math.floor((totalSec % 86400) / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; if (d > 0) return d + " ngày " + h + " giờ " + m + " phút"; if (h > 0) return h + " giờ " + m + " phút " + s + " giây"; if (m > 0) return m + " phút " + s + " giây"; return s + " giây"; }

  const events = (window.SCHEDULE && window.SCHEDULE.events) || [];

  function occurrenceForWeek(ev, weekMonISO) {
    if (!ev.ngay_bat_dau_iso) return null;
    const startISO = ev.ngay_bat_dau_iso;
    const endISO = ev.ngay_ket_thuc ? toISO(...Object.values(parseDMY(ev.ngay_ket_thuc)).reverse()) : null;
    const dayISO = addDaysISO(weekMonISO, ev.thu_idx);
    if (dayISO < startISO) return null;
    if (endISO && dayISO > endISO) return null;
    if (ev.cach_tuan && ev.interval_tuan > 1) {
      const startMon = mondayOfISO(startISO);
      const weeksDiff = daysBetweenISO(weekMonISO, startMon) / 7;
      if (((weeksDiff % ev.interval_tuan) + ev.interval_tuan) % ev.interval_tuan !== 0) return null;
    }
    const { y, m, d } = parseISO(dayISO);
    const [sh, sm] = ev.gio_bat_dau.split(":").map(Number);
    const [eh, em] = ev.gio_ket_thuc.split(":").map(Number);
    return { startMs: toEpochVN(y, m, d, sh, sm), endMs: toEpochVN(y, m, d, eh, em), dateISO: dayISO };
  }

  function statusOf(occ) {
    const now = Date.now();
    if (now < occ.startMs) return { key: "upcoming", ms: occ.startMs - now };
    if (now <= occ.endMs) return { key: "ongoing", ms: occ.endMs - now };
    return { key: "past", ms: 0 };
  }

  const modalOverlay = document.getElementById("modalOverlay");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  // SỬA LỖI: kiểm tra tồn tại và gán sự kiện an toàn
  function closeModal() {
    if (modalOverlay) modalOverlay.hidden = true;
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  function openModal(ev, occ) {
    const st = statusOf(occ);
    const statusText = st.key === "ongoing" ? "ĐANG HỌC" : st.key === "upcoming" ? "Sắp tới" : "Đã học xong";
    if (modalBody) {
      modalBody.innerHTML = 
        <h2></h2>
        <div class="modal-row"><span>Trạng thái</span><span></span></div>
        <div class="modal-row"><span>Mã lớp</span><span></span></div>
        <div class="modal-row"><span>Giảng viên</span><span></span></div>
        <div class="modal-row"><span>Thời gian</span><span>, tiết -</span></div>
        <div class="modal-row"><span>Giờ học</span><span> – </span></div>
        <div class="modal-row"><span>Phòng</span><span></span></div>
        <div class="modal-row"><span>Chu kỳ</span><span></span></div>
        <div class="modal-row"><span>Thời gian học</span><span> – </span></div>
      ;
    }
    if (modalOverlay) modalOverlay.hidden = false;
  }

  function render() {
    const now = nowVN();
    const clockEl = document.getElementById("clock");
    if (clockEl) {
      clockEl.textContent = "Hôm nay: " + WEEKDAY_LABELS[now.dow === 0 ? 6 : now.dow - 1] + " · " + pad(now.h) + ":" + pad(now.min) + ":" + pad(now.s);
    }
    const updatedEl = document.getElementById("updatedAt");
    if (updatedEl) {
      updatedEl.textContent = window.SCHEDULE && window.SCHEDULE.updated_at ? "Cập nhật: " + window.SCHEDULE.updated_at : "";
    }

    const weekMonISO = mondayOfISO(todayISO());
    const todayIdx = (now.dow + 6) % 7;

    const grid = document.getElementById("weekGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const weekOccs = [];
    events.forEach(ev => {
      const occ = occurrenceForWeek(ev, weekMonISO);
      if (occ) weekOccs.push({ ev, occ });
    });

    let next = null;
    for (const w of weekOccs) {
      const st = statusOf(w.occ);
      if (st.key === "ongoing") { next = w; break; }
      if (st.key === "upcoming" && (!next || w.occ.startMs < next.occ.startMs)) next = w;
    }

    const banner = document.getElementById("nextBanner");
    if (banner) {
      if (next) {
        const st = statusOf(next.occ);
        if (st.key === "ongoing") {
          banner.className = "next-banner ongoing";
          banner.innerHTML = `<div class="nb-label">Đang học ngay bây giờ</div><div class="nb-title">${next.ev.ten_mon}</div><div class="nb-sub">${next.ev.phong} · ${next.ev.gio_bat_dau} – ${next.ev.gio_ket_thuc}</div><div class="nb-count">Còn lại: ${fmtDuration(st.ms)}</div>`;
        } else {
          banner.className = "next-banner upcoming";
          const dt = parseISO(next.occ.dateISO);
          banner.innerHTML = `<div class="nb-label">Tiết tiếp theo</div><div class="nb-title">${next.ev.ten_mon}</div><div class="nb-sub">${WEEKDAY_LABELS[next.ev.thu_idx]} ${pad(dt.d)}/${pad(dt.m)} · ${next.ev.gio_bat_dau} – ${next.ev.gio_ket_thuc} · ${next.ev.phong}</div><div class="nb-count">Còn: ${fmtDuration(st.ms)}</div>`;
        }
      } else {
        banner.className = "next-banner";
        banner.innerHTML = `<div class="nb-label">Không còn tiết nào trong tuần này</div>`;
      }
    }

    for (let d = 0; d < 7; d++) {
      const dayISO = addDaysISO(weekMonISO, d);
      const dt = parseISO(dayISO);
      const col = document.createElement("div");
      col.className = "day-column" + (d === todayIdx ? " today" : "");

      const header = document.createElement("div");
      header.className = "day-header" + (d === todayIdx ? " today" : "");
      header.innerHTML = `<span class="day-name">${WEEKDAY_LABELS[d]}</span><span class="day-date">${pad(dt.d)}/${pad(dt.m)}</span>`;
      col.appendChild(header);

      const dayEvents = events.filter(e => e.thu_idx === d).sort((a, b) => (a.tiet_start || 0) - (b.tiet_start || 0));

      if (dayEvents.length === 0) {
        const none = document.createElement("div");
        none.className = "no-class";
        none.textContent = "Không có lịch";
        col.appendChild(none);
      }

      dayEvents.forEach(ev => {
        const occ = occurrenceForWeek(ev, weekMonISO);
        if (!occ) return;
        const st = statusOf(occ);
        const card = document.createElement("div");
        card.className = "class-card " + st.key;
        const statusLabel = st.key === "ongoing" ? "ĐANG HỌC" : st.key === "upcoming" ? "Còn " + fmtDuration(st.ms) : "Đã học xong";
        card.innerHTML = `<div class="class-title">${ev.ten_mon}</div><div class="class-time">Tiết ${ev.tiet_start}-${ev.tiet_end} · ${ev.gio_bat_dau}–${ev.gio_ket_thuc}</div><div class="class-loc">${ev.phong}${ev.cach_tuan ? " · Cách tuần" : ""}</div><span class="class-status ${st.key}">${statusLabel}</span>`;
        card.addEventListener("click", () => openModal(ev, occ));
        col.appendChild(card);
      });

      grid.appendChild(col);
    }
  }

  render();
  setInterval(render, 1000);
})();
