import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

/* ==================================================
   🧠 GÜN DURUMU CONTEXT
   - Gün Başlat = TERTEMİZ GÜN
   - Eski gün verileri UI’dan tamamen ayrılır
   - RaporMotoru ile çakışmaz
================================================== */

const GunDurumuContext = createContext(null);

export const useGunDurumu = () => {
  const ctx = useContext(GunDurumuContext);
  if (!ctx) {
    throw new Error("useGunDurumu must be used within GunDurumuProvider");
  }
  return ctx;
};

export const GunDurumuProvider = ({ children }) => {
  /* --------------------------------------------------
     🔁 STATE
  -------------------------------------------------- */

  const [gunAktif, setGunAktif] = useState(() => {
    return localStorage.getItem("mycafe_gun_durumu") === "aktif";
  });

  const [gunBilgileri, setGunBilgileri] = useState(() => {
    try {
      const raw = localStorage.getItem("mycafe_gun_bilgileri");
      return raw
        ? JSON.parse(raw)
        : {
            baslangicKasa: 0,
            nakitGiris: 0,
            krediKarti: 0,
            toplamAdisyon: 0,
            acikAdisyon: 0,
            gunlukSatis: 0,
            baslangicTarih: null,
            sonGuncelleme: null,
          };
    } catch {
      return {
        baslangicKasa: 0,
        nakitGiris: 0,
        krediKarti: 0,
        toplamAdisyon: 0,
        acikAdisyon: 0,
        gunlukSatis: 0,
        baslangicTarih: null,
        sonGuncelleme: null,
      };
    }
  });

  /* --------------------------------------------------
     🚀 GÜN BAŞLAT (TEK DOĞRU NOKTA)
  -------------------------------------------------- */
  const gunBaslat = useCallback(() => {
    const baslangicZamani = new Date().toISOString();

    // 🔑 GÜN DURUMU
    localStorage.setItem("mycafe_gun_durumu", "aktif");
    localStorage.setItem("mycafe_gun_baslangic", baslangicZamani);
    localStorage.setItem("mycafe_gun_baslangic_kasa", "0");

    // 🔥 EN KRITIK KURAL:
    // Önceki güne ait AÇIK / CACHE veriler TEMİZLENİR
    localStorage.setItem("mc_acik_adisyonlar", JSON.stringify([]));
    localStorage.setItem("mc_gunluk_cache", JSON.stringify({}));

    // 🔄 GÜN BİLGİLERİ RESET
    const yeniGunBilgileri = {
      baslangicKasa: 0,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: baslangicZamani,
      sonGuncelleme: baslangicZamani,
    };

    localStorage.setItem(
      "mycafe_gun_bilgileri",
      JSON.stringify(yeniGunBilgileri)
    );

    setGunAktif(true);
    setGunBilgileri(yeniGunBilgileri);

    // 🌍 GLOBAL EVENT
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent("gunDurumuDegisti", { aktif: true });
      window.dispatchGlobalEvent("gunBaslatildi", {
        zaman: baslangicZamani,
      });
    }

    console.log("✅ Gün başlatıldı (temiz gün):", baslangicZamani);
    return true;
  }, []);

  /* --------------------------------------------------
     🏁 GÜN SONU (SADECE DURUM KAPATIR)
     ❗ HESAP YAPMAZ
  -------------------------------------------------- */
  const gunSonuYap = useCallback(() => {
    localStorage.setItem("mycafe_gun_durumu", "kapali");
    setGunAktif(false);

    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent("gunDurumuDegisti", { aktif: false });
    }

    console.log("🏁 Gün durumu kapatıldı");
    return true;
  }, []);

  /* --------------------------------------------------
     🔍 DIŞ DEĞİŞİKLİKLERİ DİNLE
  -------------------------------------------------- */
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "mycafe_gun_durumu") {
        setGunAktif(e.newValue === "aktif");
      }

      if (e.key === "mycafe_gun_bilgileri") {
        try {
          setGunBilgileri(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /* --------------------------------------------------
     📦 CONTEXT VALUE
  -------------------------------------------------- */
  const value = {
    gunAktif,
    gunBilgileri,
    gunBaslat,
    gunSonuYap,
  };

  return (
    <GunDurumuContext.Provider value={value}>
      {children}
    </GunDurumuContext.Provider>
  );
};
