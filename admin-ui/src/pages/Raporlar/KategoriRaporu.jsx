import React, { useEffect, useMemo, useState } from "react";

/*
  KATEGORİ BAZLI RAPOR
  -------------------
  - Veri Kaynağı: mc_finans_havuzu (Single Source of Truth)
  - Sadece GELİR tipleri dahil edilir
  - Tarih filtresi ortaktır
*/

const KategoriRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  // --------------------------------------------------
  //   VERİYİ OKU
  // --------------------------------------------------
  useEffect(() => {
    const havuz = JSON.parse(
      localStorage.getItem("mc_finans_havuzu")
    ) || [];

    setVeriler(havuz);
  }, []);

  // --------------------------------------------------
  //   TARİH FİLTRELİ + KATEGORİ TOPLAMI
  // --------------------------------------------------
  const rapor = useMemo(() => {
    const filtreli = veriler.filter(item => {
      if (item.tur !== "GELIR") return false;

      const tarih = new Date(item.tarih).toISOString().slice(0, 10);

      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });

    const toplamlar = {};

    filtreli.forEach(item => {
      const kategori = item.kategori || "Diğer";
      if (!toplamlar[kategori]) toplamlar[kategori] = 0;
      toplamlar[kategori] += Number(item.tutar || 0);
    });

    return Object.entries(toplamlar)
      .map(([kategori, toplam]) => ({ kategori, toplam }))
      .sort((a, b) => a.kategori.localeCompare(b.kategori));
  }, [veriler, baslangic, bitis]);

  // --------------------------------------------------
  //   TOPLAM GELİR
  // --------------------------------------------------
  const genelToplam = rapor.reduce(
    (acc, r) => acc + r.toplam,
    0
  );

  // --------------------------------------------------
  //   UI
  // --------------------------------------------------
 
      {/* FİLTRE */}
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
            <th>Kategori</th>
            <th style={{ textAlign: "right" }}>Toplam (₺)</th>
          </tr>
        </thead>
        <tbody>
          {rapor.length === 0 && (
            <tr>
              <td colSpan={2} style={{ textAlign: "center" }}>
                Veri bulunamadı
              </td>
            </tr>
          )}

          {rapor.map(row => (
            <tr key={row.kategori}>
              <td>{row.kategori}</td>
              <td style={{ textAlign: "right" }}>
                {row.toplam.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <th>GENEL TOPLAM</th>
            <th style={{ textAlign: "right" }}>
              {genelToplam.toFixed(2)} ₺
            </th>
          </tr>
        </tfoot>
      </table>

};

export default KategoriRaporu;
