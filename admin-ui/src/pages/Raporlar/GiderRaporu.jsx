import React, { useEffect, useState } from "react";

/*
  GİDER RAPORU
  -----------
  - Veri Kaynağı: mc_kasa_hareketleri
  - Sadece gider kayıtları
  - TAM SAYFA GÖRÜNÜM İÇİN GÜNCELLENDİ
*/

export default function GiderRaporu() {
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    loadGiderData();
  }, [selectedDate]);

  const loadGiderData = () => {
    try {
      const kasaHareketleri = JSON.parse(
        localStorage.getItem("mc_kasa_hareketleri") || "[]"
      );

      const filtered = kasaHareketleri.filter(
        item => item.tip === "GIDER" && item.tarih && item.tarih.slice(0, 10) === selectedDate
      );

      const total = filtered.reduce((sum, item) => sum + (Number(item.miktar) || 0), 0);

      setListe(filtered);
      setToplam(total);
    } catch (error) {
      console.error("Gider verisi yüklenirken hata:", error);
      setListe([]);
      setToplam(0);
    }
  };

  return (
    <div style={{ 
      padding: 32, 
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa"
    }}>
      {/* BAŞLIK VE TARİH SEÇİCİ */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 20
      }}>
        <div>
          <h2 style={{ margin: 0, color: "#7a3e06", fontSize: "2.2rem" }}>
            💸 Gider Raporu
          </h2>
          <p style={{ marginTop: 10, color: "#666", fontSize: 16 }}>
            Seçilen tarihte kasadan çıkan gider kalemleri
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 600, fontSize: 16 }}>
            Tarih
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: "10px 14px",
              fontSize: 16,
              borderRadius: 8,
              border: "1px solid #ddd",
              minWidth: 180
            }}
          />
        </div>
      </div>

      {/* TARİH BİLGİSİ */}
      <div
        style={{
          background: "#fbeaea",
          padding: 16,
          borderRadius: 10,
          marginBottom: 32,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 500,
          borderLeft: "4px solid #e74c3c"
        }}
      >
        <strong>{selectedDate}</strong> tarihine ait gider kayıtları görüntülenmektedir.
      </div>

      {/* TOPLAM GİDER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          marginBottom: 40
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 28,
            borderRadius: 14,
            boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
            borderLeft: "6px solid #e74c3c",
            textAlign: "center"
          }}
        >
          <div style={{ 
            fontSize: 16, 
            color: "#555", 
            marginBottom: 12,
            fontWeight: 500 
          }}>
            Toplam Gider
          </div>
          <div style={{ 
            fontSize: 36, 
            fontWeight: "bold", 
            color: "#e74c3c" 
          }}>
            {toplam.toLocaleString("tr-TR")} ₺
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: 32
        }}
      >
        <div style={{ 
          padding: 20, 
          background: "#fbeaea",
          borderBottom: "2px solid #e74c3c"
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#7a3e06", 
            fontSize: "1.5rem" 
          }}>
            Gider Detayları
          </h3>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            minWidth: 800
          }}>
            <thead style={{ background: "#f9f2f2" }}>
              <tr>
                <Th style={{ width: "25%" }}>Tarih</Th>
                <Th style={{ width: "50%" }}>Açıklama</Th>
                <Th style={{ width: "25%" }} align="right">Tutar</Th>
              </tr>
            </thead>

            <tbody>
              {liste.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ 
                    padding: 40, 
                    textAlign: "center",
                    fontSize: 16,
                    color: "#777"
                  }}>
                    📭 Seçilen tarihte gider kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                liste.map((g, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#fdf9f3",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#fef8e8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fdf9f3";
                    }}
                  >
                    <Td style={{ fontWeight: 500 }}>
                      {g.tarih ? new Date(g.tarih).toLocaleString("tr-TR", {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "-"}
                    </Td>
                    <Td style={{ fontSize: 15 }}>{g.aciklama || "-"}</Td>
                    <Td align="right" style={{ 
                      color: "#e74c3c", 
                      fontWeight: 700,
                      fontSize: 16
                    }}>
                      {Number(g.miktar || 0).toLocaleString("tr-TR")} ₺
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ÖZET BİLGİ */}
      {liste.length > 0 && (
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
          marginBottom: 32
        }}>
          <div style={{ 
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
              Toplam Gider Sayısı
            </div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#9b59b6" }}>
              {liste.length}
            </div>
          </div>
          
          <div style={{ 
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
              Ortalama Gider
            </div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#3498db" }}>
              {liste.length > 0 ? (toplam / liste.length).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) : "0"} ₺
            </div>
          </div>
        </div>
      )}

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 40,
        padding: 20,
        background: "#fff",
        borderRadius: 10,
        fontSize: 15,
        color: "#555",
        borderLeft: "6px solid #3498db",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ fontSize: 20 }}>ℹ️</div>
          <div>
            <strong>Bilgi:</strong> Bu rapor yalnızca <strong style={{ color: "#e74c3c" }}>gider</strong> tipindeki kasa hareketlerini içerir ve negatif finansal etkiyi temsil eder. 
            Giderlerin düzenli takibi mali kontrol için önemlidir.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const Th = ({ children, align, style }) => (
  <th
    style={{
      padding: "16px 20px",
      textAlign: align || "left",
      borderBottom: "2px solid #e74c3c",
      fontSize: 15,
      fontWeight: 700,
      color: "#7a3e06",
      ...style
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align, style }) => (
  <td
    style={{
      padding: "16px 20px",
      textAlign: align || "left",
      borderBottom: "1px solid #eee",
      fontSize: 14,
      ...style
    }}
  >
    {children}
  </td>
);