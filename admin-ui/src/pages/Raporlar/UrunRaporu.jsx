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
    <div style={{
      padding: 24,
      margin: 0,
      minHeight: "100vh",
      background: "#f9f6f0",
      boxSizing: "border-box"
    }}>
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
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 24
        }}
      >
        <div style={{ flex: "1", minWidth: "200px" }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: "500", 
            color: "#555",
            marginBottom: 8 
          }}>
            Başlangıç Tarihi
          </div>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ flex: "1", minWidth: "200px" }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: "500", 
            color: "#555",
            marginBottom: 8 
          }}>
            Bitiş Tarihi
          </div>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* ÖZET KARTLARI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
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
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
          overflow: "hidden",
          marginBottom: 16
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            minWidth: "600px"
          }}>
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
                  <td colSpan={4} style={{ 
                    padding: "40px 20px", 
                    textAlign: "center",
                    color: "#888",
                    fontSize: 15
                  }}>
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
      </div>

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 16, 
        fontSize: 13, 
        color: "#777",
        padding: "12px 16px",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,.05)"
      }}>
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
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,.08)",
      borderLeft: `5px solid ${renk}`,
      height: "100%",
      boxSizing: "border-box"
    }}
  >
    <div style={{ 
      fontSize: 14, 
      color: "#555", 
      marginBottom: 8,
      fontWeight: "500" 
    }}>
      {baslik}
    </div>
    <div style={{ 
      fontSize: 28, 
      fontWeight: "bold", 
      color: renk 
    }}>
      {deger}
    </div>
  </div>
);

const Th = ({ children, align, colSpan }) => (
  <th
    colSpan={colSpan}
    style={{
      padding: "16px 20px",
      textAlign: align || "left",
      borderBottom: "2px solid #ddd",
      fontWeight: "600",
      color: "#444",
      fontSize: 14
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td
    style={{
      padding: "14px 20px",
      textAlign: align || "left",
      borderBottom: "1px solid #eee",
      fontSize: 14
    }}
  >
    {children}
  </td>
);