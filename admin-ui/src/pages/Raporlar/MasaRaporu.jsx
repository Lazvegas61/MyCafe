import React, { useEffect, useState, useMemo } from "react";

/*
  MASA RAPORU
  -----------
  - Veri Kaynağı: mc_finans_havuzu
  - Ortak tarih filtresi (inline)
*/

export default function MasaRaporu() {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  // -------------------------------------------
  // VERİ OKU
  // -------------------------------------------
  useEffect(() => {
    const havuz =
      JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    setVeriler(havuz);
  }, []);

  // -------------------------------------------
  // FİLTRELİ VERİ
  // -------------------------------------------
  const rapor = useMemo(() => {
    return veriler.filter(v => {
      if (v.kaynak !== "ADISYON") return false;

      const tarih = v.tarih?.slice(0, 10);
      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });
  }, [veriler, baslangic, bitis]);

  // -------------------------------------------
  // UI
  // -------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Masa Bazlı Rapor
      </h1>

      {/* TARİH FİLTRESİ */}
      <div className="flex gap-4 mb-4">
        <div>
          <label>Başlangıç</label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
          />
        </div>

        <div>
          <label>Bitiş</label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
          />
        </div>
      </div>

      {/* TABLO */}
      <table className="table w-full">
        <thead>
          <tr>
            <th>Masa</th>
            <th>Tarih</th>
            <th style={{ textAlign: "right" }}>Tutar (₺)</th>
          </tr>
        </thead>

        <tbody>
          {rapor.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>
                Veri bulunamadı
              </td>
            </tr>
          )}

          {rapor.map(r => (
            <tr key={r.id}>
              <td>{r.masaNo}</td>
              <td>
                {new Date(r.tarih).toLocaleDateString("tr-TR")}
              </td>
              <td style={{ textAlign: "right" }}>
                {Number(r.tutar || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
