const { kvSet, kvDel } = require("./_lib/kv");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  try {
    if (body.subscription === null) {
      // Người dùng bấm "Tắt thông báo".
      await kvDel("tkb:subscription");
      res.status(200).json({ ok: true, cleared: true });
      return;
    }

    if (!body.subscription || !body.subscription.endpoint) {
      res.status(400).json({ error: "Thiếu subscription hợp lệ" });
      return;
    }

    await kvSet("tkb:subscription", body.subscription);
    if (Array.isArray(body.courses)) {
      await kvSet("tkb:courses", body.courses);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
