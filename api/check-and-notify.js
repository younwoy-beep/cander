const webpush = require("web-push");
const { kvGet, kvSet, kvDel } = require("./_lib/kv");
const { vnNow, vnDateStr, occursOn, toMinutes } = require("./_lib/schedule");

const OFFSETS = [30, 15, 5]; // báo trước bao nhiêu phút
const WINDOW_MIN = 6; // dung sai cho việc GitHub Actions không chạy đúng giây

module.exports = async (req, res) => {
  // Chỉ cho GitHub Actions (biết CRON_SECRET) gọi vào.
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const subscription = await kvGet("tkb:subscription");
    const courses = await kvGet("tkb:courses");

    if (!subscription || !Array.isArray(courses) || !courses.length) {
      res.status(200).json({ ok: true, sent: 0, note: "Chưa có subscription hoặc lịch học" });
      return;
    }

    webpush.setVapidDetails(
      "mailto:tkb-app@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const now = vnNow();
    const dateStr = vnDateStr(now);
    const dow = now.getUTCDay();
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();

    const todaysCourses = courses.filter((c) => c.dow === dow && occursOn(c, dateStr));

    let sent = 0;
    for (const course of todaysCourses) {
      const startMin = toMinutes(course.start);
      for (const offset of OFFSETS) {
        const target = startMin - offset;
        if (nowMin < target || nowMin > target + WINDOW_MIN) continue;

        const dedupeKey = `tkb:notified:${course.id}:${dateStr}:${offset}`;
        const already = await kvGet(dedupeKey);
        if (already) continue;

        const payload = JSON.stringify({
          title: `${offset} phút nữa: ${course.subject}`,
          body: [course.start, course.room, course.teacher].filter(Boolean).join(" · "),
          tag: `${course.id}-${dateStr}-${offset}`,
          url: "./",
        });

        try {
          await webpush.sendNotification(subscription, payload);
          await kvSet(dedupeKey, true, 2 * 60 * 60); // nhớ trong 2 tiếng là đủ, tự hết hạn
          sent++;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription hết hạn / người dùng đã gỡ — dọn luôn để đỡ báo lỗi lần sau.
            await kvDel("tkb:subscription");
          }
        }
      }
    }

    res.status(200).json({ ok: true, sent, checked: todaysCourses.length });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
