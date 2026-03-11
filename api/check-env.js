/**
 * 환경 변수 설정 여부 확인 (브라우저에서 /api/check-env 로 열어보기)
 * 키 값은 노출하지 않음
 */
module.exports = function (req, res) {
  const url = (process.env.SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
  const hasKey = !!(serviceKey || anonKey);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    SUPABASE_URL: url ? "설정됨 (" + url.substring(0, 30) + "...)" : "없음",
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? "설정됨 (권장)" : "없음",
    SUPABASE_ANON_KEY: anonKey ? "설정됨" : "없음",
    ok: !!(url && hasKey),
  });
};
