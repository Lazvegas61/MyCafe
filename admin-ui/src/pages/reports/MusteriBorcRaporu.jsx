/* ------------------------------------------------------------
   📌 MusteriBorcRaporu.jsx — MÜŞTERİ BORÇ RAPORU (FINAL)
   Kurallar:
   - Müşteri adı, toplam borç, ödeme, kalan borç
   - Inline tahsilat (popup yok)
   - Tahsilat kasa raporuna da yazılır
   - Premium Plus tema
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import "./../Raporlar/MusteriBorcRaporu.css";

export default function MusteriBorcRaporu() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [tahsilatAcik, setTahsilatAcik] = useState(null);
  const [tutar, setTutar] = useState("");
  const [odeme, setOdeme] = useState("Nakit");

  useEffect(() => {
    const borc = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
    setList(borc);
  }, []);

  // Tahsilat işlemi
  const tahsilEt = (id) => {
    if (!tutar) return;

    const yeniListe = list.map((m) => {
      if (m.id === id) {
        const yeniOdeme = Number(m.toplamOdeme || 0) + Number(tutar);

        return {
          ...m,
          toplamOdeme: yeniOdeme,
          kalan: Number(m.toplamBorc) - yeniOdeme,
          sonIslem: new Date().toLocaleDateString("tr-TR"),
        };
      }
      return m;
    });

    setList(yeniListe);
    localStorage.setItem("mc_borclar", JSON.stringify(yeniListe));

    // Kasa raporuna yaz
    const kasa = JSON.parse(localStorage.getItem("mc_kasa") || "[]");
    kasa.push({
      tarih: new Date().toLocaleString("tr-TR"),
      aciklama: "Müşteri Borç Tahsilatı",
      masa: "-",
      odemeYontemi: odeme,
      type: "TAHSİLAT",
      tutar: Number(tutar),
    });
    localStorage.setItem("mc_kasa", JSON.stringify(kasa));

    // Reset
    setTahsilatAcik(null);
    setTutar("");
  };

  // Filtreli liste
  const filtre = list.filter((x) => {
    const isim = x.musteri.toLowerCase().includes(search.toLowerCase());
    const tarihUyum =
      tarih === "" ||
      x.sonIslem === new Date(tarih).toLocaleDateString("tr-TR");

    return isim && tarihUyum;
  });

  return (
    <div className="borc-page">
      <h1 className="borc-title">MÜŞTERİ BORÇ RAPORU</h1>

      {/* Export Buttons */}
      <div className="borc-export">
        <button className="borc-btn">PDF</button>
        <button className="borc-btn">Excel</button>
      </div>

      {/* Filtreler */}
      <div className="borc-filters">
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
        />
      </div>

      {/* TABLO */}
      <div className="borc-table">
        <div className="borc-header">
          <div>Müşteri</div>
          <div>Borç</div>
          <div>Ödeme</div>
          <div>Kalan</div>
          <div>Son İşlem</div>
          <div>Tahsilat</div>
        </div>

        {filtre.map((m) => (
          <div key={m.id} className="borc-row">
            <div>{m.musteri}</div>
            <div>{m.toplamBorc} ₺</div>
            <div>{m.toplamOdeme} ₺</div>
            <div className={m.kalan > 0 ? "b-red" : "b-green"}>
              {m.kalan} ₺
            </div>
            <div>{m.sonIslem}</div>

            <div>
              {tahsilatAcik === m.id ? (
                <div className="tahsilat-box">
                  <input
                    type="number"
                    placeholder="Tutar"
                    value={tutar}
                    onChange={(e) => setTutar(e.target.value)}
                  />

                  <select value={odeme} onChange={(e) => setOdeme(e.target.value)}>
                    <option>Nakit</option>
                    <option>Kart</option>
                    <option>Havale</option>
                  </select>

                  <button className="tahsilat-btn" onClick={() => tahsilEt(m.id)}>
                    Kaydet
                  </button>
                </div>
              ) : (
                <button
                  className="borc-btn-mini"
                  onClick={() => setTahsilatAcik(m.id)}
                >
                  Tahsilat Yap
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
