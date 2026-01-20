
/* ============================================================
   📄 DOSYA: GenelOzet.jsx
   📌 AMAÇ:
   MODEL C – Genel Özet Raporu
   - Ortak TarihFiltresi kullanır
   - Tek veri kaynağı: mc_kasa_hareketleri
   - Rapor motoru üzerinden hesaplanır
============================================================ */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GenelOzet() {
  const [ozet, setOzet] = useState({
    gelir: 0,
    gider: 0,
    net: 0,
    adisyonSayisi: 0,
    islemSayisi: 0
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const navigate = useNavigate();

  // Raporlar menüsü
  const raporlar = [
    { id: "kasa", ad: "Kasa Raporu", path: "/raporlar/kasa", icon: "💰", aciklama: "Günlük kasa hareketleri ve bakiye" },
    { id: "bilardo", ad: "Bilardo Raporu", path: "/raporlar/bilardo", icon: "🎱", aciklama: "Bilardo masaları gelir raporu" },
    { id: "urun", ad: "Ürün Raporu", path: "/raporlar/urun", icon: "🍕", aciklama: "Ürün satışları ve analizleri" },
    { id: "kategori", ad: "Kategori Raporu", path: "/raporlar/kategori", icon: "📊", aciklama: "Kategori bazlı satış raporu" },
    { id: "masa", ad: "Masa Raporu", path: "/raporlar/masa", icon: "🍽️", aciklama: "Masa bazlı gelir analizi" },
    { id: "gider", ad: "Gider Raporu", path: "/raporlar/gider", icon: "💸", aciklama: "Gider kalemleri raporu" },
  ];

  // Özet hesaplama fonksiyonu
  const computeSummary = (date) => {
    try {
      // Kasa hareketlerini al
      const kasaHareketleri = JSON.parse(
        localStorage.getItem("mc_kasa_hareketleri") || "[]"
      );

      // Seçilen tarihe göre filtrele
      const filtered = kasaHareketleri.filter(item => 
        item.tarih && item.tarih.slice(0, 10) === date
      );

      // Adisyonları al
      const adisyonlar = JSON.parse(
        localStorage.getItem("mc_adisyonlar") || "[]"
      ).filter(item => 
        item.tarih && item.tarih.slice(0, 10) === date
      );

      // Hesaplamalar
      const gelir = filtered
        .filter(item => item.tip === "GELIR")
        .reduce((sum, item) => sum + (item.miktar || 0), 0);

      const gider = filtered
        .filter(item => item.tip === "GIDER")
        .reduce((sum, item) => sum + (item.miktar || 0), 0);

      return {
        gelir,
        gider,
        net: gelir - gider,
        adisyonSayisi: adisyonlar.length,
        islemSayisi: filtered.length
      };
    } catch (error) {
      console.error("Özet hesaplama hatası:", error);
      return {
        gelir: 0,
        gider: 0,
        net: 0,
        adisyonSayisi: 0,
        islemSayisi: 0
      };
    }
  };

  useEffect(() => {
    const data = computeSummary(selectedDate);
    setOzet(data);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h2 style={{ color: "#7a3e06", margin: 0 }}>
          📊 Raporlar - Genel Özet
        </h2>
        
        {/* Tarih Filtresi */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 600, color: "#555" }}>Tarih:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "2px solid #d4a574",
              fontSize: 14,
              color: "#333"
            }}
          />
        </div>
      </div>

      {/* Seçilen Tarih Bilgisi */}
      <div style={{
        background: "#f5e7d0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        textAlign: "center",
        border: "1px solid #e6d0b5"
      }}>
        <strong>{selectedDate}</strong> tarihine ait rapor verileri gösteriliyor
      </div>

      {/* ------------------ ÖZET KARTLARI ------------------ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <Box title="Toplam Gelir" value={ozet.gelir} color="#2ecc71" />
        <Box title="Toplam Gider" value={ozet.gider} color="#e74c3c" />
        <Box title="Net Sonuç" value={ozet.net} color={ozet.net >= 0 ? "#3498db" : "#e74c3c"} />
        <Box title="Adisyon Sayısı" value={ozet.adisyonSayisi} color="#9b59b6" />
        <Box title="İşlem Sayısı" value={ozet.islemSayisi} color="#f39c12" />
      </div>

      {/* ------------------ RAPOR MENÜSÜ ------------------ */}
      <h3 style={{ color: "#7a3e06", marginBottom: 20, borderBottom: "2px solid #e6d0b5", paddingBottom: 8 }}>
        📋 Detaylı Raporlar
      </h3>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20,
      }}>
        {raporlar.map((rapor) => (
          <div
            key={rapor.id}
            onClick={() => navigate(rapor.path)}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "2px solid transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              minHeight: 150,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "#d4a574";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{rapor.icon}</div>
            <h4 style={{ margin: "0 0 8px 0", color: "#4b2e05" }}>{rapor.ad}</h4>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.4, flex: 1 }}>
              {rapor.aciklama}
            </p>
            <div style={{
              marginTop: 12,
              padding: "6px 12px",
              background: "#4b2e05",
              color: "#fff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
            }}>
              Raporu Görüntüle →
            </div>
          </div>
        ))}
      </div>

      {/* Bilgi Notu */}
      <div style={{
        marginTop: 30,
        padding: 15,
        background: "#f8f9fa",
        borderRadius: 8,
        borderLeft: "4px solid #3498db",
        fontSize: 13,
        color: "#555"
      }}>
        <strong>ℹ️ Bilgi:</strong> Tüm raporlar seçilen tarihe ({selectedDate}) göre filtrelenmektedir. 
        Raporları daha detaylı görüntülemek için ilgili rapor başlığına tıklayabilirsiniz.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Yardımcı Bileşenler
------------------------------------------------------------ */
function Box({ title, value, color = "#333" }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 14, color: "#555", fontWeight: 600, marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: color,
        }}
      >
        {typeof value === "number" && title.includes("Sonuç")
          ? (value >= 0 ? "+" : "") + value.toLocaleString("tr-TR") + " ₺"
          : typeof value === "number"
          ? value.toLocaleString("tr-TR") + (title.includes("Sayısı") ? "" : " ₺")
          : value}
      </div>
    </div>
  );
}