/**
 * AI Context Generator v2 – MyCafe
 * --------------------------------
 * CORE  : DeepSeek uyumlu özet context
 * FULL  : Tüm dosyalar (büyük)
 * FILES : Dosya bazlı parçalar
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".vite"];
const IGNORE_FILES = ["package-lock.json"];

const FILES_DIR = "AI_CONTEXT_FILES";
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);

function shouldIgnore(p) {
  return IGNORE_DIRS.some(d => p.includes(d));
}

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (shouldIgnore(full)) continue;
    const stat = fs.statSync(full);
    stat.isDirectory() ? walk(full, list) : list.push(full);
  }
  return list;
}

const files = walk(ROOT);

// ---------------- CORE CONTEXT ----------------
let core = `# MyCafe – CORE AI CONTEXT
Bu dosya **DeepSeek uyumludur**.
Amaç: Projeyi tanıtmak, mimariyi anlatmak, devam etmeyi sağlamak.

## 📦 Proje Özeti
- Adı: MyCafe
- Tür: Local-first Cafe / POS sistemi
- Frontend: React (admin-ui)
- Veri: localStorage tabanlı (offline öncelikli)
- Hedef: Tek PC, sonra çoklu cihaz

## 📁 Klasör Yapısı (Özet)
`;

files.forEach(f => {
  core += `- ${path.relative(ROOT, f)}\n`;
});

core += `
## ⚙️ Temel Kurallar
- localStorage ana veri kaynağıdır
- Demo / prod ayrımı yoktur
- Kodlar admin-ui altında toplanır
- Geriye dönük refactor yapılmaz

## 🧠 AI Kullanım Talimatı
- Geliştirme bu yapı referans alınarak yapılır
- Eksik dosyalar AI_CONTEXT_FILES altından istenir
`;

fs.writeFileSync("AI_CONTEXT_CORE.md", core, "utf-8");

// ---------------- FULL CONTEXT ----------------
let full = `# MyCafe – FULL AI CONTEXT\n\n`;

files.forEach(f => {
  const rel = path.relative(ROOT, f);
  const content = fs.readFileSync(f, "utf-8");
  full += `## ${rel}\n\`\`\`\n${content}\n\`\`\`\n\n`;

  // Dosya bazlı context
  fs.writeFileSync(
    path.join(FILES_DIR, rel.replace(/[\/\\]/g, "__") + ".md"),
    `## ${rel}\n\`\`\`\n${content}\n\`\`\``,
    "utf-8"
  );
});

fs.writeFileSync("AI_CONTEXT_FULL.md", full, "utf-8");

console.log("✅ CORE, FULL ve FILES context üretildi.");
