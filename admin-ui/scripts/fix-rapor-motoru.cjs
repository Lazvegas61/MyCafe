/**
 * raporMotoruV2 GLOBAL STANDARD FIX
 * --------------------------------
 * - Tüm raporMotoruV2 importlarını kaldırır
 * - raporMotoruV2.xxx → window.raporMotoruV2.xxx yapar
 * - Çift window.window hatalarını düzeltir
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

// DOKUNULMAYACAK DOSYALAR
const IGNORE_FILES = [
  "src/services/raporMotoruV2.js"
];

// UZANTILAR
const VALID_EXT = [".js", ".jsx", ".ts", ".tsx"];

function shouldIgnore(filePath) {
  return IGNORE_FILES.some(ignore => filePath.endsWith(ignore));
}

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else if (VALID_EXT.includes(path.extname(fullPath))) {
      callback(fullPath);
    }
  });
}

function fixFile(filePath) {
  if (shouldIgnore(filePath)) return;

  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // 1️⃣ raporMotoruV2 importlarını TAMAMEN kaldır
  content = content.replace(
    /import\s+\{\s*raporMotoruV2\s*\}\s*from\s*['"][^'"]*raporMotoruV2['"];?\n?/g,
    ""
  );

  content = content.replace(
    /import\s+raporMotoruV2\s+from\s*['"][^'"]*raporMotoruV2['"];?\n?/g,
    ""
  );

  // 2️⃣ raporMotoruV2.xxx → window.raporMotoruV2.xxx
  content = content.replace(
    /([^.\w])raporMotoruV2\./g,
    "$1window.raporMotoruV2."
  );

  // 3️⃣ window.window.raporMotoruV2 → window.raporMotoruV2
  content = content.replace(
    /window\.window\.raporMotoruV2/g,
    "window.raporMotoruV2"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("✅ Düzenlendi:", path.relative(ROOT_DIR, filePath));
  }
}

// ÇALIŞTIR
console.log("🔧 raporMotoruV2 global standart düzeltme başlıyor...\n");

walk(SRC_DIR, fixFile);

console.log("\n🎉 Tamamlandı. raporMotoruV2 artık GLOBAL TEK OTORİTE.");
