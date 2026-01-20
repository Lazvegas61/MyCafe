import React, { useEffect, useMemo, useState } from "react";

/*
  ÜRÜN RAPORU
  -----------
  - Veri Kaynağı: mc_finans_havuzu
  - Sadece GELIR kayıtları dahil edilir
  - Ortak tarih filtresi kullanılır
*/

const UrunRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  // --------------------------------------------------
  //   VERİ OKU (SINGLE SOURCE OF TRUTH)
  // --------------------------------------------------
  useEffect(() => {
    const havuz =
      JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    setVeriler(havuz);
  }, []);

  // --------------------------------------------------
  //   TARİH + ÜRÜN TOPLAMLARI
  // --------------------------------------------------
  const rapor = useMemo(() => {
    const filtreli = veriler.filter(item => {
      if (item.tur !== "GELIR") return false;

      const tarih = new Date(item.tarih)
        .toISOString()
        .slice(0, 10);

      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });

    const toplamlar = {};

    filtreli.forEach(item => {
      const urunAdi = item.urunAdi || "Bilinmeyen Ürün";

      if (!toplamlar[urunAdi]) {
        toplamlar[urunAdi] = {
          urunAdi,
          kategori: item.kategori || "Diğer",
          adet: 0,
          toplam: 0,
        };
      }

      toplamlar[urunAdi].adet += Number(item.adet || 1);
      toplamlar[urunAdi].toplam += Number(item.tutar || 0);
    });

    return Object.values(toplamlar).sort((a, b) =>
      a.urunAdi.localeCompare(b.urunAdi)
    );
  }, [veriler, baslangic, bitis]);

  // --------------------------------------------------
  //   GENEL TOPLAM
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
            <th>Ürün</th>
            <th>Kategori</th>
            <th style={{ textAlign: "center" }}>Adet</th>
            <th style={{ textAlign: "right" }}>Toplam (₺)</th>
          </tr>
        </thead>

        <tbody>
          {rapor.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                Veri bulunamadı
              </td>
            </tr>
          )}

          {rapor.map(row => (
            <tr key={row.urunAdi}>
              <td>{row.urunAdi}</td>
              <td>{row.kategori}</td>
              <td style={{ textAlign: "center" }}>
                {row.adet}
              </td>
              <td style={{ textAlign: "right" }}>
                {row.toplam.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <th colSpan={3}>GENEL TOPLAM</th>
            <th style={{ textAlign: "right" }}>
              {genelToplam.toFixed(2)} ₺
            </th>
          </tr>
        </tfoot>
      </table>

};

export default UrunRaporu;
