// Gọi thẳng Upstash Redis REST API — Vercel tự bơm 2 biến môi trường này
// vào project khi bạn nối 1 Redis (Upstash) integration trong tab Storage.
// Không dùng gói @vercel/kv vì gói đó đã bị deprecate.

const BASE = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

async function upstash(path) {
  if (!BASE || !TOKEN) {
    throw new Error("Thiếu KV_REST_API_URL / KV_REST_API_TOKEN — chưa nối Redis vào project trên Vercel.");
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function kvGet(key) {
  const raw = await upstash(`/get/${encodeURIComponent(key)}`);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function kvSet(key, value, exSeconds) {
  const body = encodeURIComponent(JSON.stringify(value));
  const ex = exSeconds ? `?EX=${exSeconds}` : "";
  return upstash(`/set/${encodeURIComponent(key)}/${body}${ex}`);
}

async function kvDel(key) {
  return upstash(`/del/${encodeURIComponent(key)}`);
}

module.exports = { kvGet, kvSet, kvDel };
