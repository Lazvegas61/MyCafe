/* ------------------------------------------------------------
   📌 Bilardo.jsx — FINAL V10
   Premium Latte Tasarım + Adisyon Entegrasyonu + Silme Koruması

   ✔ Masa açılır açılmaz otomatik adisyon oluşturulur
   ✔ Oyunu Bitir → Her zaman doğru adisyona gider
   ✔ Açık masa asla silinemez
   ✔ Bilardo ücret hesabı adisyon ekranında yapılır
   ✔ LocalStorage adisyon standartlarına %100 uyumlu
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import "./Bilardo.css";

export default function Bilardo() {
  const [masalar, setMasalar] = useState([]);

  /* ---------------------------------------
     📌 LocalStorage Yükleme
  --------------------------------------- */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("bilardo") || "[]");
    setMasalar(data);
  }, []);

  /* ---------------------------------------
     📌 LocalStorage Kaydet
  --------------------------------------- */
  const save = (arr) => {
    setMasalar(arr);
    localStorage.setItem("bilardo", JSON.stringify(arr));
  };

  /* ---------------------------------------
     📌 Yeni Masa Ekle
  --------------------------------------- */
  const masaEkle = () => {
    const yeni = {
      id: Date.now(),
      acik: false,
      acilisSaati: null,
      sureTipi: null,
      ucret: 0,
      adisyonId: null,
    };

    save([...masalar, yeni]);
  };

  /* ---------------------------------------
     📌 Masa Sil (Yalnızca Kapalı Masa)
  --------------------------------------- */
  const masaSil = (masa) => {
    if (masa.acik) {
      alert("Açık masa silinemez!");
      return;
    }

    const filtered = masalar.filter((m) => m.id !== masa.id);
    save(filtered);
  };

  /* ---------------------------------------
     📌 ADİSYON OLUŞTURMA
     → Masa açılır açılmaz otomatik çalışır.
  --------------------------------------- */
  const adisyonOlustur = (masaIndex, masaNo) => {
    const yeniAdisyon = {
      id: Date.now(),
      masaNo: masaNo,
      masaTuru: "bilardo",
      acilisZamani: Date.now(),
      kapanisZamani: null,
      durum: "ACIK",
      kapali: false,
      toplam: 0,
      items: [],
    };

    // Eski adisyonları çek
    const eski = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");

    // Yeni adisyonu ekle
    eski.push(yeniAdisyon);
    localStorage.setItem("mc_adisyonlar", JSON.stringify(eski));

    // Masaya adisyon ID ata
    const updated = [...masalar];
    updated[masaIndex].adisyonId = yeniAdisyon.id;

    // Kaydet
    save(updated);

    return yeniAdisyon.id;
  };

  /* ---------------------------------------
     📌 Masa Aç (Süre Seçimi)
  --------------------------------------- */
  const masaAc = (masa, tip, index) => {
    let adisyonId = masa.adisyonId;

    // Eğer daha önce adisyon oluşmadıysa şimdi oluştur
    if (!adisyonId) {
      adisyonId = adisyonOlustur(index, "BİLARDO " + (index + 1));
    }

    const updated = masalar.map((m, i) =>
      i === index
        ? {
            ...m,
            acik: true,
            sureTipi: tip,
            acilisSaati: Date.now(),
            adisyonId: adisyonId,
          }
        : m
    );

    save(updated);
  };

  /* ---------------------------------------
     📌 Geçen Dakika Hesaplama
  --------------------------------------- */
  const dakikaHesapla = (masa) => {
    if (!masa.acilisSaati) return 0;
    const now = Date.now();
    return Math.floor((now - masa.acilisSaati) / 60000);
  };

  /* ---------------------------------------
     📌 Oyunu Bitir → Adisyona Git
  --------------------------------------- */
  const oyunuBitir = (masa) => {
    if (!masa.adisyonId) {
      alert("Adisyon bulunamadı!");
      return;
    }

    window.location.href = `/adisyon/${masa.adisyonId}`;
  };

  /* ---------------------------------------
     📌 EKRAN
  --------------------------------------- */
  return (
    <div className="bilardo-container">

      {/* Başlık */}
      <div className="bilardo-header">
        <h1 className="bilardo-title">🎱 BİLARDO</h1>

        <div className="bilardo-actions">
          <button className="masa-btn-ekle" onClick={masaEkle}>
            + Masa Ekle
          </button>
        </div>
      </div>

      {/* MASA GRID */}
      <div className="bilardo-grid">
        {masalar.map((masa, index) => (
          <div key={masa.id} className="bilardo-card">

            {/* İKON + BAŞLIK */}
            <div className="bilardo-card-header">
              <span className="bilardo-icon">🎱</span>
              <span className="bilardo-name">BİLARDO {index + 1}</span>
            </div>

            {/* ADİSYON TOPLAMI */}
            <div className="bilardo-toplam">
              Toplam Adisyon: <strong>{masa.ucret || 0} TL</strong>
            </div>

            {/* MASA AÇIK DEĞİLSE — SÜRE SEÇİM PANELİ */}
            {!masa.acik && (
              <>
                <div className="bilardo-sure-secim">
                  <button
                    className="secim-btn"
                    onClick={() => masaAc(masa, "30dk", index)}
                  >
                    30 DK
                  </button>

                  <button
                    className="secim-btn"
                    onClick={() => masaAc(masa, "1saat", index)}
                  >
                    1 SAAT
                  </button>

                  <button
                    className="secim-btn"
                    onClick={() => masaAc(masa, "suresiz", index)}
                  >
                    SÜRESİZ
                  </button>
                </div>

                <button className="masa-sil" onClick={() => masaSil(masa)}>
                  🗑 Sil
                </button>
              </>
            )}

            {/* MASA AÇIKSA */}
            {masa.acik && (
              <>
                <div className="bilardo-info">
                  <div>
                    Açılış:{" "}
                    <strong>
                      {new Date(masa.acilisSaati).toLocaleTimeString()}
                    </strong>
                  </div>

                  <div>
                    Geçen Süre:{" "}
                    <strong>{dakikaHesapla(masa)} dk</strong>
                  </div>
                </div>

                <button
                  className="oyun-bitir-btn"
                  onClick={() => oyunuBitir(masa)}
                >
                  Oyunu Bitir → Adisyona Git
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
