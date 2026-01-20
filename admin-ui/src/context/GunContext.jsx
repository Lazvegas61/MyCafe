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
const GUNLUK_GECIS_KEY = "mc_gunluk_gecisler"; // Gün başı/sonu logları için ayrı storage

const defaultState = {
  status: "CLOSED",        // OPEN | CLOSED
  gunId: null,             // YYYY-MM-DD (sadece referans için)
  baslangicZamani: null,
  durum: "KAPALI"
};

export const GunProvider = ({ children }) => {
  const [gun, setGun] = useState(() => {
    try {
      const raw = localStorage.getItem(GUN_STORAGE_KEY);
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
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
    if (!loading) {
      localStorage.setItem(GUN_STORAGE_KEY, JSON.stringify(gun));
    }
  }, [gun, loading]);

  /* =========================================
     🚪 GÜN BAŞI (SADECE DURUM DEĞİŞİKLİĞİ)
  ========================================= */
  const gunBaslat = () => {
    if (gun.status === "OPEN") return false;

    const now = new Date();
    const gunId = now.toISOString().split("T")[0];

    const yeniGun = {
      status: "OPEN",
      gunId,
      baslangicZamani: now.toISOString(),
      durum: "ACIK"
    };

    setGun(yeniGun);

    // ✅ Günlük geçiş logu (finans kaydı DEĞİL)
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

    localStorage.setItem(
      GUNLUK_GECIS_KEY,
      JSON.stringify(gecisLoglari)
    );

    return true;
  };

  /* =========================================
     🚪 GÜN SONU (SADECE DURUM YAZAR)
     ❌ Adisyon kontrolü YOK
     ❌ Finans kaydı YOK
     ❌ Operasyon engelleme YOK
  ========================================= */
  const gunKapat = () => {
    if (gun.status !== "OPEN") {
      throw new Error("Açık bir iş günü yok.");
    }

    // ✅ Sadece durum güncellenir
    const now = new Date();
    const gunId = gun.gunId || now.toISOString().split("T")[0];

    const yeniGun = {
      status: "CLOSED",
      gunId: null,
      baslangicZamani: null,
      durum: "KAPALI"
    };

    setGun(yeniGun);

    // ✅ Günlük geçiş logu (finans kaydı DEĞİL)
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

    localStorage.setItem(
      GUNLUK_GECIS_KEY,
      JSON.stringify(gecisLoglari)
    );

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