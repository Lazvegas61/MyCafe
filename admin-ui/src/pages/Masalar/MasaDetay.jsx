/* ------------------------------------------------------------
   📌 MasaDetay.jsx — FULL FİNAL (Tasarım değişmedi)
   - masalar undefined hatası düzeltildi
   - toplam hesaplama Masalar ile uyumlu
   - interval memory leak giderildi
   - masa kapatma sonrası MASALAR ekranı anında yenilenir
   - hayalet adisyon / eski adisyon yükleme sorunları giderildi
------------------------------------------------------------- */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

// ------------------------------
// Helper Fonksiyonlar
// ------------------------------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const hesaplaAdisyonToplam = (adisyon) => {
  if (!adisyon) return 0;

  let toplam = 0;

  if (Array.isArray(adisyon.kalemler)) {
    toplam = adisyon.kalemler.reduce((sum, k) => {
      const adet = Number(k.adet || k.quantity || 0);
      const fiyat = Number(k.birimFiyat || k.fiyat || k.price || 0);
      return sum + adet * fiyat;
    }, 0);
  }

  if (adisyon.toplamTutar && Number(adisyon.toplamTutar) > toplam) {
    toplam = Number(adisyon.toplamTutar);
  }

  return Number(toplam.toFixed(2));
};

const formatSaat = (dateString) => {
  if (!dateString) return "--:--";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const gecenDakika = (acilis) => {
  if (!acilis) return 0;
  const bas = new Date(acilis);
  return Math.floor((Date.now() - bas.getTime()) / 60000);
};

// ------------------------------
// ANA BİLEŞEN
// ------------------------------
export default function MasaDetay() {
  const { masaNo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [masa, setMasa] = useState(null);
  const [adisyon, setAdisyon] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());

  // ------------------------------
  // MASA + ADİSYON YÜKLEME
  // ------------------------------
  const loadData = useCallback(() => {
    const masalar = readJSON("mc_masalar", []);
    const ads = readJSON("mc_adisyonlar", []);

    const mevcutMasa = masalar.find((m) => m.no === Number(masaNo)) || null;
    setMasa(mevcutMasa);

    // Bu masaya ait en güncel açık adisyonu bul
    const acikAdisyon = ads
      .filter((a) => a.masaNo === Number(masaNo))
      .filter((a) => {
        const d = (a.status || a.durum || "OPEN").toUpperCase();
        return !["CLOSED", "KAPALI"].includes(d);
      })
      .sort((a, b) => (a.acilisZamani > b.acilisZamani ? -1 : 1))[0];

    setAdisyon(acikAdisyon || null);
  }, [masaNo]);

  // ------------------------------
  // COMPONENT başlangıç
  // ------------------------------
  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("adisyonUpdated", handleUpdate);

    // 1 adet interval — memory leak yok
    const int = setInterval(() => setSimdi(Date.now()), 10000);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("adisyonUpdated", handleUpdate);
      clearInterval(int);
    };
  }, [loadData]);

  // ------------------------------
  // MASA KAPATMA
  // ------------------------------
  const masaKapat = () => {
    if (!adisyon) return;

    const ads = readJSON("mc_adisyonlar", []);

    const updated = ads.map((a) =>
      a.id === adisyon.id
        ? {
            ...a,
            status: "CLOSED",
            durum: "KAPALI",
            kapanisZamani: new Date().toISOString(),
          }
        : a
    );

    localStorage.setItem("mc_adisyonlar", JSON.stringify(updated));

    // Masayı boşalt
    const masalar = readJSON("mc_masalar", []);
    const yeniMasalar = masalar.map((m) =>
      m.no === Number(masaNo) ? { ...m, adisyonId: null } : m
    );

    localStorage.setItem("mc_masalar", JSON.stringify(yeniMasalar));

    // Masalar ekranına haber ver
    window.dispatchEvent(new StorageEvent("storage", { key: "mc_masalar" }));
    window.dispatchEvent(new CustomEvent("adisyonUpdated"));

    navigate("/masalar");
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  if (!masa || !adisyon) {
    return (
      <div className="masa-detay-container">
        <h2>Masa {masaNo}</h2>
        <p>Bu masa şu anda boş.</p>
        <button onClick={() => navigate("/masalar")}>← Masalara Dön</button>
      </div>
    );
  }

  const toplam = hesaplaAdisyonToplam(adisyon);

  return (
    <div className="masa-detay-container">
      <h1>Masa {masa.no}</h1>

      <div className="masa-detay-bilgi">
        <div>Açılış Saati: {formatSaat(adisyon.acilisZamani)}</div>
        <div>Geçen Süre: {gecenDakika(adisyon.acilisZamani)} dk</div>
        <div>Toplam Tutar: ₺ {toplam.toFixed(2)}</div>
      </div>

      <div className="masa-detay-kalemler">
        {adisyon.kalemler?.map((k, i) => (
          <div key={i}>
            {k.ad} — {k.adet || k.quantity} × ₺
            {(k.fiyat || k.price || k.birimFiyat).toFixed(2)}
          </div>
        ))}
      </div>

      <button className="masa-kapat-btn" onClick={masaKapat}>
        ✕ MASAYI KAPAT
      </button>

      <button className="masa-don-btn" onClick={() => navigate("/masalar")}>
        ← Masalara Dön
      </button>
    </div>
  );
}
