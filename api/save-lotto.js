/**
 * Vercel 서버리스: 로또 추첨 결과를 Supabase에 저장
 * 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (권장) 또는 SUPABASE_ANON_KEY
 */
function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const url = (process.env.SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
  const key = serviceKey || anonKey;

  if (!url || !key) {
    send(res, 500, {
      ok: false,
      error: "환경 변수 없음",
      detail: "Vercel에 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_ANON_KEY)를 넣고 Redeploy 하세요.",
    });
    return;
  }

  let body;
  try {
    if (req.body === undefined || req.body === null) {
      const raw = await new Promise(function (resolve, reject) {
        let data = "";
        req.on("data", function (chunk) { data += chunk; });
        req.on("end", function () { resolve(data); });
        req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } else if (typeof req.body === "string") {
      body = req.body ? JSON.parse(req.body) : {};
    } else if (Buffer.isBuffer && Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString("utf8"));
    } else if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      body = req.body;
    } else {
      body = {};
    }
  } catch (e) {
    send(res, 400, { ok: false, error: "Invalid JSON body", detail: String(e.message) });
    return;
  }

  const numbers = body.numbers;
  const source = body.source;
  const fortune_index = body.fortune_index;
  const fortune_text = body.fortune_text;

  if (!Array.isArray(numbers) || numbers.length !== 7) {
    send(res, 400, { ok: false, error: "numbers must be array of 7 (6+bonus)" });
    return;
  }
  if (source !== "random" && source !== "fortune") {
    send(res, 400, { ok: false, error: "source must be random or fortune" });
    return;
  }

  const row = {
    numbers,
    source,
    fortune_index: fortune_index ?? null,
    fortune_text: fortune_text ?? null,
  };

  const apiUrl = url.replace(/\/$/, "") + "/rest/v1/lotto_draws";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      const errJson = JSON.parse(text);
      detail = errJson.message || errJson.error_description || text;
    } catch (_) {}
    console.error("Supabase insert failed", response.status, detail);
    send(res, 500, {
      ok: false,
      error: "Supabase 저장 실패",
      detail: (detail || "unknown").slice(0, 400),
    });
    return;
  }

  send(res, 200, { ok: true });
};
