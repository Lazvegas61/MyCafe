import React, { useEffect, useMemo, useState } from "react";

/*
  KATEGORİ BAZLI RAPOR
  -------------------
  - Veri Kaynağı: mc_finans_havuzu (Single Source of Truth)
  - Sadece GELIR tipleri dahil edilir
  - Ortak tarih filtresi
  - TAM SAYFA GÖRÜNÜM GÜNCELLENDİ
*/

const KategoriRaporu = () => {
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
      .sort((a, b) => b.toplam - a.toplam); // En yüksek gelire göre sırala
  }, [veriler, baslangic, bitis]);

  // ÖZET HESAPLARI (SADECE GÖRSEL AMAÇLI)
  const genelToplam = rapor.reduce((s, r) => s + r.toplam, 0);
  const kategoriSayisi = rapor.length;

  return (
    <div style={{ 
      padding: "24px 16px", 
      minHeight: "100vh",
      background: "#f8f5f0",
      boxSizing: "border-box"
    }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
          📊 Kategori Bazlı Satış Raporu
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          Seçilen tarih aralığında kategori bazlı toplam satış gelirleri
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
          flexWrap: "wrap",
          gap: "16px 24px",
          marginBottom: 24
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#333" }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#333" }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* ÖZET */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <OzetKart
          baslik="Kategori Sayısı"
          deger={kategoriSayisi}
          renk="#9b59b6"
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
          overflow: "hidden",
          overflowX: "auto",
          marginBottom: 24
        }}
      >
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          minWidth: "500px"
        }}>
          <thead style={{ background: "#f1e2c6" }}>
            <tr>
              <Th>#</Th>
              <Th>Kategori</Th>
              <Th align="right">Toplam Satış</Th>
              <Th align="right">Oran</Th>
            </tr>
          </thead>

          <tbody>
            {rapor.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  Seçilen aralıkta kategori verisi bulunamadı
                </td>
              </tr>
            ) : (
              rapor.map((row, i) => {
                const oran = genelToplam > 0 ? (row.toplam / genelToplam * 100).toFixed(1) : 0;
                return (
                  <tr
                    key={row.kategori}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#faf5ea",
                      transition: "background 0.2s"
                    }}
                  >
                    <Td style={{ width: 50, fontWeight: 500, color: "#555" }}>
                      {i + 1}
                    </Td>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: "50%", 
                          background: getKategoriRenk(i),
                          marginRight: 10 
                        }} />
                        {row.kategori}
                      </div>
                    </Td>
                    <Td align="right" style={{ fontWeight: 600, color: "#2c3e50" }}>
                      {row.toplam.toLocaleString("tr-TR")} ₺
                    </Td>
                    <Td align="right" style={{ color: "#7f8c8d", minWidth: 80 }}>
                      {oran}%
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr style={{ background: "#f5e7d0", borderTop: "2px solid #ddd" }}>
              <Th colSpan={2}>GENEL TOPLAM</Th>
              <Th align="right" style={{ fontSize: "1.1rem" }}>
                {genelToplam.toLocaleString("tr-TR")} ₺
              </Th>
              <Th align="right">100%</Th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* GRAFİK GÖRSELLİĞİ */}
      {rapor.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          padding: 20,
          marginBottom: 24
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#333", fontSize: 16 }}>
            📈 Kategori Dağılımı
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rapor.slice(0, 8).map((row, i) => {
              const oran = genelToplam > 0 ? (row.toplam / genelToplam * 100).toFixed(1) : 0;
              return (
                <div key={row.kategori} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ 
                    flex: "0 0 120px", 
                    fontSize: 14, 
                    color: "#333",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {row.kategori}
                  </div>
                  <div style={{ flex: 1, margin: "0 12px" }}>
                    <div style={{
                      height: 24,
                      background: getKategoriRenk(i),
                      borderRadius: 4,
                      width: `${Math.min(oran, 100)}%`,
                      transition: "width 0.5s ease",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                    }} />
                  </div>
                  <div style={{ 
                    flex: "0 0 80px", 
                    textAlign: "right", 
                    fontSize: 14, 
                    fontWeight: 500,
                    color: "#2c3e50"
                  }}>
                    {oran}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 16, 
        fontSize: 13, 
        color: "#777",
        textAlign: "center",
        padding: 16
      }}>
        Bu rapor yalnızca <strong>GELİR</strong> tipindeki işlemleri kapsar ve kategori bazlı toplama yapar. • 
        Toplam {rapor.length} kategori gösteriliyor • 
        Veriler: <strong>mc_finans_havuzu</strong>
      </div>
    </div>
  );
};

export default KategoriRaporu;

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk }) => (
  <div
    style={{
      background: "#fff",
      padding: "20px 16px",
      borderRadius: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,.08)",
      borderLeft: `4px solid ${renk}`,
      transition: "transform 0.2s, box-shadow 0.2s"
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.12)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.08)";
    }}
  >
    <div style={{ fontSize: 14, color: "#555", marginBottom: 8, fontWeight: 500 }}>
      {baslik}
    </div>
    <div style={{ fontSize: "clamp(1.5rem, 3vw, 1.8rem)", fontWeight: "bold", color: renk }}>
      {deger}
    </div>
  </div>
);

const Th = ({ children, align, colSpan }) => (
  <th
    colSpan={colSpan}
    style={{
      padding: "16px 12px",
      textAlign: align || "left",
      borderBottom: "2px solid #ddd",
      fontSize: 14,
      fontWeight: 600,
      color: "#333",
      whiteSpace: "nowrap"
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align, style }) => (
  <td
    style={{
      padding: "14px 12px",
      textAlign: align || "left",
      borderBottom: "1px solid #eee",
      fontSize: 14,
      color: "#444",
      ...style
    }}
  >
    {children}
  </td>
);

/* ------------------ YARDIMCI FONKSİYONLAR ------------------ */

const getKategoriRenk = (index) => {
  const renkler = [
    "#3498db", // Mavi
    "#2ecc71", // Yeşil
    "#9b59b6", // Mor
    "#e74c3c", // Kırmızı
    "#f39c12", // Turuncu
    "#1abc9c", // Turkuaz
    "#d35400", // Kabak
    "#34495e", // Koyu gri
    "#16a085", // Deniz yeşili
    "#8e44ad"  // Mor
  ];
  return renkler[index % renkler.length];
};