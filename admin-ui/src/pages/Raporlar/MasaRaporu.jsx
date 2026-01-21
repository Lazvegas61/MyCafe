import React, { useEffect, useState, useMemo } from "react";

/*
  MASA RAPORU
  -----------
  - Veri Kaynağı: mc_finans_havuzu
  - Ortak tarih filtresi
  - KAR SIRALAMASI EKLENDİ
*/

export default function MasaRaporu() {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  useEffect(() => {
    const havuz =
      JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    setVeriler(havuz);
  }, []);

  const rapor = useMemo(() => {
    // Önce tüm adisyonları filtrele
    const adisyonlar = veriler.filter(v => {
      if (v.kaynak !== "ADISYON") return false;

      const tarih = v.tarih?.slice(0, 10);
      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });

    // Masa bazında toplamları hesapla
    const masaToplamlari = {};
    
    adisyonlar.forEach(r => {
      const masaNo = r.masaNo || "Belirsiz";
      const tutar = Number(r.tutar || 0);
      
      if (!masaToplamlari[masaNo]) {
        masaToplamlari[masaNo] = {
          masaNo,
          toplamTutar: 0,
          adisyonSayisi: 0,
          adisyonlar: []
        };
      }
      
      masaToplamlari[masaNo].toplamTutar += tutar;
      masaToplamlari[masaNo].adisyonSayisi += 1;
      masaToplamlari[masaNo].adisyonlar.push({
        ...r,
        tarih: r.tarih
      });
    });

    // Masaları toplam tutara göre sırala (en yüksekten en düşüğe)
    const siralanmisMasalar = Object.values(masaToplamlari)
      .sort((a, b) => b.toplamTutar - a.toplamTutar);

    return siralanmisMasalar;
  }, [veriler, baslangic, bitis]);

  // Tüm adisyonları düz liste olarak da al (tablo için)
  const tumAdisyonlar = useMemo(() => {
    const adisyonlar = veriler.filter(v => {
      if (v.kaynak !== "ADISYON") return false;

      const tarih = v.tarih?.slice(0, 10);
      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });

    // Adisyonları masaya göre gruplandır ve sırala
    return adisyonlar.sort((a, b) => {
      // Önce masa no'ya göre sırala
      const masaA = a.masaNo || "Z";
      const masaB = b.masaNo || "Z";
      
      if (masaA < masaB) return -1;
      if (masaA > masaB) return 1;
      
      // Aynı masa ise tarihe göre sırala
      return new Date(a.tarih) - new Date(b.tarih);
    });
  }, [veriler, baslangic, bitis]);

  const toplamTutar = rapor.reduce(
    (s, r) => s + Number(r.toplamTutar || 0),
    0
  );

  const toplamAdisyon = tumAdisyonlar.length;
  const masaSayisi = rapor.length;

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
          🍽️ Masa Bazlı Rapor
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          En karlı masadan en az kar yapan masaya göre sıralanmış adisyon gelirleri
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
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <OzetKart
          baslik="Toplam Masa"
          deger={masaSayisi}
          renk="#9b59b6"
        />
        <OzetKart
          baslik="Toplam Adisyon"
          deger={toplamAdisyon}
          renk="#3498db"
        />
        <OzetKart
          baslik="Toplam Ciro"
          deger={toplamTutar.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
        />
      </div>

      {/* MASA SIRALAMASI TABLOSU */}
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
              <Th>Sıralama</Th>
              <Th>Masa No</Th>
              <Th align="right">Adisyon Sayısı</Th>
              <Th align="right">Toplam Tutar</Th>
              <Th align="right">Ortalama/Adisyon</Th>
            </tr>
          </thead>

          <tbody>
            {rapor.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  Seçilen aralıkta masa verisi bulunamadı
                </td>
              </tr>
            )}

            {rapor.map((masa, index) => {
              const ortalama = masa.adisyonSayisi > 0 
                ? masa.toplamTutar / masa.adisyonSayisi 
                : 0;
              
              // Sıralama ikonu belirle
              let siralamaIkon = "";
              let siralamaRenk = "";
              
              if (index === 0) {
                siralamaIkon = "🥇";
                siralamaRenk = "#FFD700";
              } else if (index === 1) {
                siralamaIkon = "🥈";
                siralamaRenk = "#C0C0C0";
              } else if (index === 2) {
                siralamaIkon = "🥉";
                siralamaRenk = "#CD7F32";
              } else {
                siralamaIkon = `#${index + 1}`;
                siralamaRenk = "#666";
              }

              return (
                <tr
                  key={masa.masaNo}
                  style={{
                    background: index % 2 === 0 ? "#fff" : "#faf5ea",
                    transition: "background 0.2s"
                  }}
                >
                  <Td style={{ width: 50, fontWeight: 500, color: "#555" }}>
                    {index + 1}
                  </Td>
                  <Td style={{ width: 80, fontWeight: "bold", color: siralamaRenk }}>
                    {siralamaIkon}
                  </Td>
                  <Td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: "50%", 
                        background: getMasaRenk(index),
                        marginRight: 10 
                      }} />
                      Masa {masa.masaNo}
                    </div>
                  </Td>
                  <Td align="right" style={{ color: "#3498db" }}>
                    {masa.adisyonSayisi} adet
                  </Td>
                  <Td align="right" style={{ fontWeight: 600, color: "#27ae60" }}>
                    {masa.toplamTutar.toLocaleString("tr-TR")} ₺
                  </Td>
                  <Td align="right" style={{ color: "#7f8c8d" }}>
                    {ortalama.toFixed(2).toLocaleString("tr-TR")} ₺
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DETAYLI ADİSYON TABLOSU */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#7a3e06", fontSize: "1.2rem" }}>
          📋 Detaylı Adisyon Listesi
        </h3>
      </div>
      
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden",
          overflowX: "auto"
        }}
      >
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          minWidth: "600px"
        }}>
          <thead style={{ background: "#f1e2c6" }}>
            <tr>
              <Th>Masa</Th>
              <Th>Tarih</Th>
              <Th align="right">Tutar</Th>
            </tr>
          </thead>

          <tbody>
            {tumAdisyonlar.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  Seçilen aralıkta adisyon verisi bulunamadı
                </td>
              </tr>
            ) : (
              tumAdisyonlar.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#faf5ea",
                    transition: "background 0.2s"
                  }}
                >
                  <Td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: "50%", 
                        background: getMasaRenkByNo(r.masaNo, rapor),
                        marginRight: 10 
                      }} />
                      {r.masaNo}
                    </div>
                  </Td>
                  <Td>
                    {new Date(r.tarih).toLocaleDateString("tr-TR")}
                  </Td>
                  <Td align="right" style={{ fontWeight: 500 }}>
                    {Number(r.tutar || 0).toLocaleString("tr-TR")} ₺
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 24, 
        fontSize: 13, 
        color: "#777",
        textAlign: "center",
        padding: 16
      }}>
        Bu rapor yalnızca <strong>ADİSYON</strong> kaynaklı kayıtları içerir. • 
        Sıralama: En yüksek gelirden en düşüğe doğru • 
        Toplam {toplamAdisyon} adet adisyon gösteriliyor
      </div>
    </div>
  );
}

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

const Th = ({ children, align }) => (
  <th
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

const getMasaRenk = (index) => {
  const renkler = [
    "#e74c3c", // Kırmızı (1.)
    "#f39c12", // Turuncu (2.)
    "#f1c40f", // Sarı (3.)
    "#2ecc71", // Yeşil
    "#3498db", // Mavi
    "#9b59b6", // Mor
    "#1abc9c", // Turkuaz
    "#34495e", // Koyu gri
    "#16a085", // Deniz yeşili
    "#8e44ad"  // Mor
  ];
  return renkler[index % renkler.length];
};

const getMasaRenkByNo = (masaNo, rapor) => {
  // Masayı sıralamada bul
  const masaIndex = rapor.findIndex(m => m.masaNo === masaNo);
  if (masaIndex >= 0) {
    return getMasaRenk(masaIndex);
  }
  return "#bdc3c7"; // Varsayılan renk
};