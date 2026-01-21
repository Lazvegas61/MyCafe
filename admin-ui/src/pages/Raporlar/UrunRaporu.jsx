import React, { useEffect, useMemo, useState } from "react";

/*
  ÜRÜN RAPORU
  ----------
  - Veri Kaynağı: mc_finans_havuzu
  - SADECE GELIR kayıtları
  - Tarih filtresi
  - SADECE GÖRÜNÜM GÜNCELLENDİ
*/

const UrunRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  // VERİ OKU
  useEffect(() => {
    const havuz =
      JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    setVeriler(havuz);
  }, []);

  // RAPOR HESAPLAMA (AYNEN KORUNDU)
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

  // ÖZET HESAPLARI (GÖRSEL AMAÇLI)
  const genelToplam = rapor.reduce((s, r) => s + r.toplam, 0);
  const toplamAdet = rapor.reduce((s, r) => s + r.adet, 0);
  const urunSayisi = rapor.length;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06" }}>
          🍕 Ürün Satış Raporu
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          Seçilen tarih aralığında ürün bazlı satış gelirleri
        </p>
      </div>

      {/* FİLTRE */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          display: "flex",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <label>Başlangıç Tarihi</label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
          />
        </div>

        <div>
          <label>Bitiş Tarihi</label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
          />
        </div>
      </div>

      {/* ÖZET KARTLARI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <OzetKart
          baslik="Satılan Ürün Sayısı"
          deger={urunSayisi}
          renk="#9b59b6"
        />
        <OzetKart
          baslik="Toplam Adet"
          deger={toplamAdet}
          renk="#3498db"
        />
        <OzetKart
          baslik="Toplam Satış"
          deger={genelToplam.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
        />
      </div>

      {/* TABLO */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f1e2c6" }}>
            <tr>
              <Th>Ürün</Th>
              <Th>Kategori</Th>
              <Th align="center">Adet</Th>
              <Th align="right">Toplam</Th>
            </tr>
          </thead>

          <tbody>
            {rapor.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: "center" }}>
                  Seçilen aralıkta ürün satışı bulunamadı
                </td>
              </tr>
            )}

            {rapor.map((row, i) => (
              <tr
                key={row.urunAdi}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#faf5ea"
                }}
              >
                <Td>{row.urunAdi}</Td>
                <Td>{row.kategori}</Td>
                <Td align="center">{row.adet}</Td>
                <Td align="right">
                  {row.toplam.toLocaleString("tr-TR")} ₺
                </Td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr style={{ background: "#f5e7d0" }}>
              <Th colSpan={3}>GENEL TOPLAM</Th>
              <Th align="right">
                {genelToplam.toLocaleString("tr-TR")} ₺
              </Th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ALT BİLGİ */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
        Bu rapor yalnızca <strong>GELİR</strong> tipindeki ürün satışlarını içerir.
      </div>
    </div>
  );
};

export default UrunRaporu;

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk }) => (
  <div
    style={{
      background: "#fff",
      padding: 16,
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      borderLeft: `4px solid ${renk}`
    }}
  >
    <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
      {baslik}
    </div>
    <div style={{ fontSize: 22, fontWeight: "bold", color: renk }}>
      {deger}
    </div>
  </div>
);

const Th = ({ children, align, colSpan }) => (
  <th
    colSpan={colSpan}
    style={{
      padding: 12,
      textAlign: align || "left",
      borderBottom: "1px solid #ddd"
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td
    style={{
      padding: 12,
      textAlign: align || "left",
      borderBottom: "1px solid #eee"
    }}
  >
    {children}
  </td>
);
