import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * PREMIUM RAPOR ORTAK ŞABLONU
 * - title: sayfa başlığı
 * - onFilterChange: tarih aralıkları değiştiğinde haber vermek için (isteğe bağlı)
 * - children: raporun kendi tablo/içeriği
 */

export default function PremiumRaporSablon({ title, onFilterChange, children }) {
  const navigate = useNavigate();

  // Çoklu tarih aralığı listesi
  const [ranges, setRanges] = useState([]);
  const [bas, setBas] = useState("");
  const [bit, setBit] = useState("");

  const renk = { bej: "#f5e7d0", kahve: "#4b2e05" };

  // Yeni aralık ekle
  const ekle = () => {
    if (!bas || !bit) return;
    const yeni = { bas, bit };
    setRanges((onceki) => [...onceki, yeni]);
    setBas("");
    setBit("");
  };

  // Aralık sil
  const sil = (i) => {
    setRanges((onceki) => onceki.filter((_, index) => index !== i));
  };

  // Tarih aralıkları değiştikçe alt sayfaya haber ver
  useEffect(() => {
    if (typeof onFilterChange === "function") {
      onFilterChange(ranges);
    }
  }, [ranges, onFilterChange]);

  return (
    <div
      style={{
        background: renk.bej,
        minHeight: "100vh",
        padding: "26px 26px",
        color: renk.kahve,
      }}
    >
      {/* ÜST BAR: GERİ + BAŞLIK */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => navigate("/raporlar")}
          style={{
            background: renk.kahve,
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← GERİ
        </button>

        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {title}
        </h1>

        {/* Sağ taraf boş denge için */}
        <div style={{ width: 120 }}></div>
      </div>

      {/* TARİH FİLTRESİ ALANI */}
      <div
        style={{
          background: "#fffaf2",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
          marginBottom: 25,
        }}
      >
        <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Tarih Filtresi</h3>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="date"
            value={bas}
            onChange={(e) => setBas(e.target.value)}
            style={inputStyle}
          />
          <span>—</span>
          <input
            type="date"
            value={bit}
            onChange={(e) => setBit(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={ekle}
            style={{
              background: renk.kahve,
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ARALIĞI EKLE
          </button>
        </div>

        {/* Eklenen tarih aralıkları listesi */}
        {ranges.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {ranges.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0e4cc",
                  padding: "8px 10px",
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <span>
                  {r.bas} — {r.bit}
                </span>

                <button
                  onClick={() => sil(i)}
                  style={{
                    background: "#c0392b",
                    color: "#fff",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}

        {ranges.length === 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              color: "#6e5635",
            }}
          >
            Tarih seçmezsen, tüm kayıtlar gösterilir.
          </div>
        )}
      </div>

      {/* RAPORUN KENDİ İÇERİĞİ */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 3px 14px rgba(0,0,0,0.12)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #c9b99a",
  fontSize: 16,
  background: "#fff",
  minWidth: 160,
};

