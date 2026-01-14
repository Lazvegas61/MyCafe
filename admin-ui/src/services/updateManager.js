// src/services/updateManager.js

const APP_VERSION = "1.0.0";


const UPDATE_BASE_URL =
  "https://raw.codeberg.page/Lazvegas61/mycafe-updates";

const LATEST_JSON_URL = `${UPDATE_BASE_URL}/latest.json`;

export async function checkForUpdates() {
  try {
    console.log("🔄 Update kontrolü başladı");

    const response = await fetch(LATEST_JSON_URL, { cache: "no-store" });
    console.log("🌐 Response alındı:", response.status);

    if (!response.ok) {
      throw new Error("latest.json alınamadı");
    }

    const latest = await response.json();
    console.log("📦 latest.json:", latest);

    if (latest.app !== "MyCafe") {
      return { status: "INVALID_APP" };
    }

    if (latest.currentVersion <= APP_VERSION) {
      return {
        status: "NO_UPDATE",
        currentVersion: APP_VERSION,
      };
    }

    return {
      status: "UPDATE_AVAILABLE",
      latest,
    };
  } catch (error) {
    console.error("❌ Update kontrol hatası:", error);
    return {
      status: "ERROR",
      message: error.message || "Bilinmeyen hata",
    };
  }
}


export async function applyUpdates(updates = []) {
  const applied = [];

  for (const update of updates) {
    try {
      const fileUrl = `${UPDATE_BASE_URL}/${update.target}`;
      const res = await fetch(fileUrl, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Dosya alınamadı: ${update.target}`);
      }

      const content = await res.text();

      if (update.apply === "localStorage") {
        localStorage.setItem(update.key, content);
      }

      applied.push({
        target: update.target,
        success: true
      });
    } catch (err) {
      applied.push({
        target: update.target,
        success: false,
        error: err.message
      });
    }
  }

  return applied;
}
