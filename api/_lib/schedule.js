// Giờ Việt Nam là UTC+7 quanh năm (không có giờ mùa hè), nên chỉ cần cộng
// thẳng 7 tiếng vào UTC rồi đọc bằng các hàm getUTC*() — không cần Intl
// timezone gì phức tạp, và không phụ thuộc timezone của máy chủ Vercel.
function vnNow() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

function vnDateStr(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysSinceEpoch(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

// Lớp `course` có học vào đúng ngày `dateStr` ("YYYY-MM-DD") không?
function occursOn(course, dateStr) {
  const today = daysSinceEpoch(dateStr);
  const start = daysSinceEpoch(course.startDate);
  const until = daysSinceEpoch(course.until);
  if (today < start || today > until) return false;
  const weeksSince = Math.floor((today - start) / 7);
  return weeksSince % course.interval === 0;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

module.exports = { vnNow, vnDateStr, occursOn, toMinutes };
