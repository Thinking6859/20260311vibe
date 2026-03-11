/**
 * 환경 변수 설정 여부 확인 (브라우저에서 /api/check-env 로 열어보기)
 * 키 값은 노출하지 않음
 */
module.exports = function (req, res) {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_ANON_KEY || "").trim();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    SUPABASE_URL: url ? "설정됨 (" + url.substring(0, 30) + "...)" : "없음",
    SUPABASE_ANON_KEY: key ? "설정됨 (길이 " + key.length + ")" : "없음",
    ok: !!(url && key),
  });
};
