// updateService.js
import { APP_NAME, APP_VERSION } from "../config/appVersion";

const UPDATE_URL =
  "https://codeberg.org/Lazvegas61/mycafe-updates/raw/branch/main/latest.json";

// checkForUpdates olarak düzeltilmiş (Ayarlar.jsx'te bu isimle çağrılıyor)
export async function checkForUpdates() {
  try {
    const res = await fetch(UPDATE_URL, { cache: "no-store" });
    if (!res.ok) {
      return {
        status: "ERROR",
        message: "Güncelleme sunucusuna bağlanılamadı."
      };
    }

    const data = await res.json();

    if (data.app !== APP_NAME) {
      return {
        status: "ERROR",
        message: "Uygulama adı uyuşmuyor."
      };
    }

    // Versiyon karşılaştırması
    const currentVersion = APP_VERSION;
    const latestVersion = data.currentVersion;
    
    // Basit versiyon karşılaştırması
    const hasUpdate = latestVersion !== currentVersion;

    if (!hasUpdate) {
      return {
        status: "NO_UPDATE",
        message: "Uygulama güncel.",
        currentVersion,
        latestVersion
      };
    }

    return {
      status: "UPDATE_AVAILABLE",
      message: "Yeni güncelleme mevcut.",
      currentVersion,
      latest: {
        version: latestVersion,
        title: data.title || "Yeni Güncelleme",
        description: data.description || "",
        changes: data.changes || [],
        mandatory: data.mandatory || false,
        releaseDate: data.releaseDate,
        updates: data.updates || [] // Güncelleme detayları
      }
    };
  } catch (err) {
    console.error("Güncelleme kontrol hatası:", err);
    return {
      status: "ERROR",
      message: err.message || "Bilinmeyen bir hata oluştu."
    };
  }
}

// Güncelleme uygulama fonksiyonu
export async function applyUpdates(updates) {
  try {
    console.log("Güncelleme uygulanıyor:", updates);
    
    // Güncelleme işlemleri burada yapılacak
    // Örnek: localStorage'a güncelleme bilgisi kaydet
    localStorage.setItem("last_update", JSON.stringify({
      date: new Date().toISOString(),
      updates: updates || []
    }));
    
    // Uygulamaya özel güncelleme işlemleri
    // Örneğin: Yeni ayarları yükleme, veri yapısını güncelleme vb.
    
    return {
      success: true,
      message: "Güncelleme başarıyla uygulandı."
    };
  } catch (error) {
    console.error("Güncelleme uygulama hatası:", error);
    return {
      success: false,
      message: error.message || "Güncelleme uygulanırken hata oluştu."
    };
  }
}

// Manuel güncelleme kontrolü (isteğe bağlı)
export async function manualUpdateCheck() {
  const result = await checkForUpdates();
  
  if (result.status === "UPDATE_AVAILABLE") {
    // Kullanıcıya bildir
    const shouldUpdate = window.confirm(
      `Yeni güncelleme mevcut!\n\n` +
      `Versiyon: ${result.latest.version}\n` +
      `Başlık: ${result.latest.title}\n\n` +
      `${result.latest.description}\n\n` +
      `Güncellemeyi şimdi uygulamak istiyor musunuz?`
    );
    
    if (shouldUpdate) {
      const updateResult = await applyUpdates(result.latest.updates);
      
      if (updateResult.success) {
        alert("Güncelleme başarıyla uygulandı! Sayfayı yenileyin.");
        window.location.reload();
      } else {
        alert(`Güncelleme başarısız: ${updateResult.message}`);
      }
    }
  } else if (result.status === "NO_UPDATE") {
    alert("Uygulamanız güncel!");
  } else {
    alert(`Güncelleme kontrolü başarısız: ${result.message}`);
  }
  
  return result;
}

// Güncelleme geçmişini alma
export function getUpdateHistory() {
  try {
    const history = localStorage.getItem("update_history");
    return history ? JSON.parse(history) : [];
  } catch (error) {
    return [];
  }
}

// Güncelleme geçmişine ekleme
export function addToUpdateHistory(updateInfo) {
  try {
    const history = getUpdateHistory();
    history.unshift({
      ...updateInfo,
      appliedAt: new Date().toISOString()
    });
    
    // Son 10 güncellemeyi sakla
    const limitedHistory = history.slice(0, 10);
    localStorage.setItem("update_history", JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Güncelleme geçmişi kaydedilemedi:", error);
  }
}

// Uygulama versiyon bilgisi
export function getAppVersionInfo() {
  return {
    appName: APP_NAME,
    version: APP_VERSION,
    lastUpdate: localStorage.getItem("last_update") 
      ? JSON.parse(localStorage.getItem("last_update")).date 
      : null
  };
}