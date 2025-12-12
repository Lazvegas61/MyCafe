/* ------------------------------------------------------------
   📌 logger.js — MyCafe Frontend Log Sistemi (FINAL)
   - Tüm JS hataları buradan geçer.
   - localStorage içinde "mc_logs" olarak saklanır.
   - Her log kaydı tarih + mesaj + hata detayını içerir.
------------------------------------------------------------- */

export function logError(message, error = null) {
  const now = new Date().toISOString();

  const entry = {
    time: now,
    message,
    error: error ? error.toString() : "",
  };

  // localStorage'a yaz
  const logs = JSON.parse(localStorage.getItem("mc_logs") || "[]");
  logs.push(entry);

  localStorage.setItem("mc_logs", JSON.stringify(logs));

  console.error("🔴 LOGGED ERROR:", entry);
}
