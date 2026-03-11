/**
 * Vercel 서버리스: 로또 추첨 결과를 Supabase에 저장
 * 환경 변수: SUPABASE_URL, SUPABASE_ANON_KEY
 */
module.exports = async function (req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) {
    res.status(500).json({
      ok: false,
      error: "SUPABASE_URL or SUPABASE_ANON_KEY not set in Vercel",
      hint: "Vercel 대시보드 → Settings → Environment Variables 확인 후 Redeploy",
    });
    return;
  }

  let body;
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else if (Buffer.isBuffer && Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString("utf8"));
    } else {
      body = req.body || {};
    }
  } catch (e) {
    res.status(400).json({ ok: false, error: "Invalid JSON body", detail: String(e.message) });
    return;
  }

  const { numbers, source, fortune_index, fortune_text } = body;
  if (!Array.isArray(numbers) || numbers.length !== 7) {
    res.status(400).json({ ok: false, error: "numbers must be array of 7 (6+bonus)" });
    return;
  }
  if (source !== "random" && source !== "fortune") {
    res.status(400).json({ ok: false, error: "source must be random or fortune" });
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
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Supabase insert failed", response.status, text);
    res.status(500).json({
      ok: false,
      error: "Supabase insert failed",
      detail: text.slice(0, 200),
    });
    return;
  }

  res.status(200).json({ ok: true });
};
