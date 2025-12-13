/* ------------------------------------------------------------
   📌 MusteriIslemleri.jsx — FINAL
   Açıklama:
   - Müşteri bazlı borç ve tahsilat yönetimi
   - Inline tahsilat (popup yok)
   - Kasa raporu ile uyumlu
   - localStorage tabanlı (DEMO)
------------------------------------------------------------- */

import React, { useEffect, useMemo, useState } from "react";
import "./MusteriIslemleri.css";

const MUSTERI_KEY = "mc_musteriler";
const BORC_KEY = "mc_borclar";
const KASA_KEY = "mc_kasa";

export default function MusteriIslemleri() {
  const [musteriler, setMusteriler] = useState([]);
  const [borclar, setBorclar] = useState([]);
  const [seciliMusteriId, setSeciliMusteriId] = useState(null);
  const [odemeTutar, setOdemeTutar] = useState("");
  const [odemeTur, setOdemeTur] = useState("NAKIT");

  // -----------------------------
  // LOAD
  // -----------------------------
  useEffect(() => {
    setMusteriler(JSON.parse(localStorage.getItem(MUSTERI_KEY)) || []);
    setBorclar(JSON.parse(localStorage.getItem(BORC_KEY)) || []);
  }, []);

  // -----------------------------
  // HESAPLAMALAR
  // -----------------------------
  const musteriOzetleri = useMemo(() => {
    return musteriler.map((m) => {
      const hareketler = borclar.filter(b => b.musteriId === m.id);

      const toplamBorc = hareketler
        .filter(h => h.tip === "BORC")
        .reduce((t, h) => t + h.tutar, 0);

      const toplamTahsilat = hareketler
        .filter(h => h.tip === "TAHSILAT")
        .reduce((t, h) => t + h.tutar, 0);

      return {
        ...m,
        toplamBorc,
        toplamTahsilat,
        kalan: toplamBorc - toplamTahsilat,
        hareketler
      };
    });
  }, [musteriler, borclar]);

  // -----------------------------
  // TAHSILAT
  // -----------------------------
  const tahsilatYap = (musteri) => {
    const tutar = Number(odemeTutar);
    if (!tutar || tutar <= 0) return alert("Geçerli tutar girin.");

    const yeniHareket = {
      id: Date.now(),
      musteriId: musteri.id,
      tip: "TAHSILAT",
      tutar,
      odemeTur,
      tarih: new Date().toISOString()
    };

    const yeniBorclar = [...borclar, yeniHareket];
    setBorclar(yeniBorclar);
    localStorage.setItem(BORC_KEY, JSON.stringify(yeniBorclar));

    // Kasa kaydı
    const kasa = JSON.parse(localStorage.getItem(KASA_KEY)) || [];
    kasa.push({
      id: Date.now(),
      tip: "TAHSILAT",
      musteri: musteri.adSoyad,
      tutar,
      odemeTur,
      tarih: new Date().toISOString()
    });
    localStorage.setItem(KASA_KEY, JSON.stringify(kasa));

    setOdemeTutar("");
    setSeciliMusteriId(null);
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="musteri-islemleri">
      <h2>Müşteri İşlemleri</h2>

      <table className="musteri-table">
        <thead>
          <tr>
            <th>Müşteri</th>
            <th>Toplam Borç</th>
            <th>Toplam Tahsilat</th>
            <th>Kalan</th>
            <th>İşlem</th>
          </tr>
        </thead>

        <tbody>
          {musteriOzetleri.map((m) => (
            <React.Fragment key={m.id}>
              <tr className={m.kalan > 0 ? "borclu" : ""}>
                <td>{m.adSoyad}</td>
                <td>{m.toplamBorc.toLocaleString()} ₺</td>
                <td>{m.toplamTahsilat.toLocaleString()} ₺</td>
                <td>{m.kalan.toLocaleString()} ₺</td>
                <td>
                  {m.kalan > 0 && (
                    <button onClick={() => setSeciliMusteriId(m.id)}>
                      Tahsilat Yap
                    </button>
                  )}
                </td>
              </tr>

              {seciliMusteriId === m.id && (
                <tr className="tahsilat-row">
                  <td colSpan="5">
                    <div className="tahsilat-panel">
                      <input
                        type="number"
                        placeholder="Tutar"
                        value={odemeTutar}
                        onChange={(e) => setOdemeTutar(e.target.value)}
                      />

                      <select
                        value={odemeTur}
                        onChange={(e) => setOdemeTur(e.target.value)}
                      >
                        <option value="NAKIT">Nakit</option>
                        <option value="KART">Kart</option>
                        <option value="HAVALE">Havale</option>
                      </select>

                      <button onClick={() => tahsilatYap(m)}>
                        Onayla
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
