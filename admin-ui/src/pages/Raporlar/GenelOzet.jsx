import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  GENEL ÖZET RAPORU
  ----------------
  - Veri Kaynağı: mc_kasa_hareketleri, mc_adisyonlar
  - Gün bazlı özet
  - SADECE GÖRÜNÜM GÜNCELLENDİ
*/

export default function GenelOzet() {
  const [ozet, setOzet] = useState({
    gelir: 0,
    gider: 0,
    net: 0,
    adisyonSayisi: 0,
    islemSayisi: 0
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const navigate = useNavigate();

  /* ------------------ RAPOR MENÜSÜ ------------------ */
  const raporlar = [
    {
      id: "kasa",
      ad: "Kasa Raporu",
      path: "/raporlar/kasa",
      icon: "💰",
      aciklama: "Gelir, gider ve net kasa hareketleri"
    },
    {
      id: "bilardo",
      ad: "Bilardo Raporu",
      path: "/raporlar/bilardo",
      icon: "🎱",
      aciklama: "Bilardo masalarına ait gelirler"
    },
    {
      id: "urun",
      ad: "Ürün Raporu",
      path: "/raporlar/urun",
      icon: "🍕",
      aciklama: "Ürün bazlı satış performansı"
    },
    {
      id: "kategori",
      ad: "Kategori Raporu",
      path: "/raporlar/kategori",
      icon: "📊",
      aciklama: "Kategori bazlı satış dağılımı"
    },
    {
      id: "masa",
      ad: "Masa Raporu",
      path: "/raporlar/masa",
      icon: "🍽️",
      aciklama: "Masa bazlı ciro analizi"
    },
    {
      id: "gider",
      ad: "Gider Raporu",
      path: "/raporlar/gider",
      icon: "💸",
      aciklama: "Gider kalemleri ve toplam gider"
    }
  ];

  /* ------------------ ÖZET HESAPLAMA (AYNEN KORUNDU) ------------------ */
  const computeSummary = date => {
    try {
      const kasaHareketleri = JSON.parse(
        localStorage.getItem("mc_kasa_hareketleri") || "[]"
      );

      const filtered = kasaHareketleri.filter(
        i => i.tarih && i.tarih.slice(0, 10) === date
      );

      const adisyonlar = JSON.parse(
        localStorage.getItem("mc_adisyonlar") || "[]"
      ).filter(
        i => i.tarih && i.tarih.slice(0, 10) === date
      );

      const gelir = filtered
        .filter(i => i.tip === "GELIR")
        .reduce((s, i) => s + (i.miktar || 0), 0);

      const gider = filtered
        .filter(i => i.tip === "GIDER")
        .reduce((s, i) => s + (i.miktar || 0), 0);

      return {
        gelir,
        gider,
        net: gelir - gider,
        adisyonSayisi: adisyonlar.length,
        islemSayisi: filtered.length
      };
    } catch (e) {
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
    setOzet(computeSummary(selectedDate));
  }, [selectedDate]);

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#7a3e06" }}>
            📊 Raporlar – Genel Özet
          </h2>
          <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
            Seçilen güne ait genel finansal durum özeti
          </p>
        </div>

        <div>
          <label style={{ fontWeight: 600, marginRight: 8 }}>
            Tarih
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* TARİH BİLGİSİ */}
      <div
        style={{
          background: "#f5e7d0",
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
          textAlign: "center"
        }}
      >
        <strong>{selectedDate}</strong> tarihine ait veriler
        görüntülenmektedir.
      </div>

      {/* ÖZET KARTLARI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 16,
          marginBottom: 32
        }}
      >
        <OzetKart
          baslik="Toplam Gelir"
          deger={ozet.gelir}
          renk="#2ecc71"
          para
        />
        <OzetKart
          baslik="Toplam Gider"
          deger={ozet.gider}
          renk="#e74c3c"
          para
        />
        <OzetKart
          baslik="Net Sonuç"
          deger={ozet.net}
          renk={ozet.net >= 0 ? "#3498db" : "#e74c3c"}
          para
        />
        <OzetKart
          baslik="Adisyon Sayısı"
          deger={ozet.adisyonSayisi}
          renk="#9b59b6"
        />
        <OzetKart
          baslik="İşlem Sayısı"
          deger={ozet.islemSayisi}
          renk="#f39c12"
        />
      </div>

      {/* RAPOR MENÜSÜ */}
      <h3
        style={{
          color: "#7a3e06",
          marginBottom: 16,
          borderBottom: "2px solid #e6d0b5",
          paddingBottom: 8
        }}
      >
        📋 Detaylı Raporlar
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
          gap: 20
        }}
      >
        {raporlar.map(r => (
          <div
            key={r.id}
            onClick={() => navigate(r.path)}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              cursor: "pointer",
              textAlign: "center",
              transition: "all .2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {r.icon}
            </div>
            <h4 style={{ margin: "0 0 6px", color: "#4b2e05" }}>
              {r.ad}
            </h4>
            <p style={{ fontSize: 14, color: "#666" }}>
              {r.aciklama}
            </p>
            <div
              style={{
                marginTop: 12,
                background: "#4b2e05",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 13,
                display: "inline-block"
              }}
            >
              Raporu Aç →
            </div>
          </div>
        ))}
      </div>

      {/* ALT BİLGİ */}
      <div
        style={{
          marginTop: 32,
          padding: 14,
          background: "#f8f9fa",
          borderRadius: 8,
          fontSize: 13,
          color: "#555",
          borderLeft: "4px solid #3498db"
        }}
      >
        <strong>ℹ️ Bilgi:</strong> Bu ekran yalnızca özet amaçlıdır.
        Detaylı inceleme için ilgili rapora giriniz.
      </div>
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞEN ------------------ */

function OzetKart({ baslik, deger, renk, para }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        borderLeft: `4px solid ${renk}`
      }}
    >
      <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
        {baslik}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: renk
        }}
      >
        {typeof deger === "number"
          ? para
            ? deger.toLocaleString("tr-TR") + " ₺"
            : deger.toLocaleString("tr-TR")
          : deger}
      </div>
    </div>
  );
}
