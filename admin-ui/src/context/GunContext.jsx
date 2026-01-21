import React, { createContext, useContext, useEffect, useState } from "react";

const GunContext = createContext(null);

export const useGun = () => {
  const ctx = useContext(GunContext);
  if (!ctx) {
    throw new Error("useGun must be used within GunProvider");
  }
  return ctx;
};

// MODEL C storage key'leri
const GUN_STORAGE_KEY = "mc_gun_durumlari"; // ✅ MODEL C standartı
const GUNLUK_GECIS_KEY = "mc_gunluk_gecisler";

const defaultState = {
  status: "CLOSED",
  gunId: null,
  baslangicZamani: null,
  durum: "KAPALI"
};

export const GunProvider = ({ children }) => {
  const [gun, setGun] = useState(() => {
    try {
      const raw = localStorage.getItem(GUN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Son açık günü bul (array ise)
        if (Array.isArray(parsed)) {
          const acikGun = parsed.find(g => g.durum === "ACIK");
          if (acikGun) {
            return {
              ...defaultState,
              status: "OPEN",
              gunId: acikGun.gunId,
              baslangicZamani: acikGun.baslangicZamani || new Date().toISOString(),
              durum: "ACIK"
            };
          }
        } else if (parsed.durum === "ACIK") {
          // Object ise direk kontrol
          return {
            ...defaultState,
            ...parsed,
            status: "OPEN"
          };
        }
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && gun.gunId) {
      try {
        const gunDurumlari = JSON.parse(
          localStorage.getItem(GUN_STORAGE_KEY) || "[]"
        );
        
        let yeniDurumlar;
        const gunDurumu = {
          gunId: gun.gunId,
          durum: gun.durum,
          baslangicZamani: gun.baslangicZamani,
          status: gun.status,
          sonGuncelleme: new Date().toISOString()
        };
        
        if (Array.isArray(gunDurumlari)) {
          const mevcutIndex = gunDurumlari.findIndex(g => g.gunId === gun.gunId);
          if (mevcutIndex >= 0) {
            gunDurumlari[mevcutIndex] = gunDurumu;
          } else {
            gunDurumlari.push(gunDurumu);
          }
          yeniDurumlar = gunDurumlari;
        } else {
          yeniDurumlar = [gunDurumu];
        }
        
        localStorage.setItem(GUN_STORAGE_KEY, JSON.stringify(yeniDurumlar));
      } catch (error) {
        console.error("❌ Gun durumu kaydetme hatası:", error);
      }
    }
  }, [gun, loading]);

  /* =========================================
     🚪 GÜN BAŞI
  ========================================= */
  const gunBaslat = () => {
    if (gun.status === "OPEN") {
      console.warn("⚠️ Zaten açık bir gün var");
      return false;
    }

    const now = new Date();
    const gunId = now.toISOString().split("T")[0];

    const yeniGun = {
      status: "OPEN",
      gunId,
      baslangicZamani: now.toISOString(),
      durum: "ACIK"
    };

    setGun(yeniGun);

    // ✅ Günlük geçiş logu
    const gecisLoglari = JSON.parse(
      localStorage.getItem(GUNLUK_GECIS_KEY) || "[]"
    );

    gecisLoglari.push({
      id: `gecis_gunbasi_${Date.now()}`,
      tip: "GUN_BASI",
      tarih: now.toISOString(),
      gunId,
      createdAt: now.toISOString()
    });

    localStorage.setItem(GUNLUK_GECIS_KEY, JSON.stringify(gecisLoglari));

    console.log(`✅ Gün başlatıldı: ${gunId}`);
    return true;
  };

  /* =========================================
     🚪 GÜN KAPAT
  ========================================= */
  const gunKapat = () => {
    if (gun.status !== "OPEN") {
      throw new Error("Açık bir iş günü yok.");
    }

    const now = new Date();
    const gunId = gun.gunId;

    const yeniGun = {
      status: "CLOSED",
      gunId: null,
      baslangicZamani: null,
      durum: "KAPALI"
    };

    setGun(yeniGun);

    // ✅ Gün durumunu güncelle
    try {
      const gunDurumlari = JSON.parse(
        localStorage.getItem(GUN_STORAGE_KEY) || "[]"
      );
      
      const mevcutIndex = gunDurumlari.findIndex(g => g.gunId === gunId);
      const kapaliGun = {
        gunId,
        durum: "KAPALI",
        kapanisZamani: now.toISOString(),
        status: "CLOSED"
      };
      
      if (mevcutIndex >= 0) {
        gunDurumlari[mevcutIndex] = kapaliGun;
      } else {
        gunDurumlari.push(kapaliGun);
      }
      
      localStorage.setItem(GUN_STORAGE_KEY, JSON.stringify(gunDurumlari));
    } catch (error) {
      console.error("❌ Gün durumu güncelleme hatası:", error);
    }

    // ✅ Günlük geçiş logu
    const gecisLoglari = JSON.parse(
      localStorage.getItem(GUNLUK_GECIS_KEY) || "[]"
    );

    gecisLoglari.push({
      id: `gecis_gunsonu_${Date.now()}`,
      tip: "GUN_SONU",
      tarih: now.toISOString(),
      gunId,
      createdAt: now.toISOString()
    });

    localStorage.setItem(GUNLUK_GECIS_KEY, JSON.stringify(gecisLoglari));

    console.log(`✅ Gün kapatıldı: ${gunId}`);
    return true;
  };

  /* =========================================
     📊 GÜN DURUMU GETTER
  ========================================= */
  const getGunDurumu = () => {
    return gun;
  };

  const value = {
    gun,
    isOpen: gun.status === "OPEN",
    gunAktif: gun.durum === "ACIK",
    gunBaslat,
    gunKapat,
    getGunDurumu,
    loading
  };

  return (
    <GunContext.Provider value={value}>
      {children}
    </GunContext.Provider>
  );
};