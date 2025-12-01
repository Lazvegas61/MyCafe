import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function KasaTahsilat() {
  const navigate = useNavigate();
  const LOCAL_KEY = "mc_kasa_raporu_test";

  const [kayitlar, setKayitlar] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        setKayitlar(JSON.parse(stored));
        return;
      }
    } catch {}

    const ornek = [
      { id: 1, islem: "NAKIT TAHSiLAT", tutar: 150, tarih: "2025-11-20 14:42" },
      { id: 2, islem: "KART TAHSiLAT", tutar: 240, tarih: "2025-11-20 15:05" },
    ];
    setKayitlar(ornek);
  }, []);

  const data = useMemo(() => kayitlar, [kayitlar]);

  const pageStyle = {
    backgroundColor: "#f5e7d0",
    minHeight: "100vh",
    padding: "20px",
    color: "#4b2e05",
  };

  const cardStyle = {
    backgroundColor: "#fffaf0",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    padding: "16px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    border: "1px solid #e0c9a6",
  };

  const thStyle = {
    textAlign: "left",
    padding: "8px",
    borderBottom: "2px solid #d3b58a",
    backgroundColor: "#f2dec0",
  };

  const tdStyle = {
    padding: "6px 8px",
    borderBottom: "1px solid #ecd5b3",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* 🔙 GERİ BUTONU */}
        <button
          onClick={() => navigate("/raporlar")}
          style={{
            padding: "10px 18px",
            background: "#4b2e05",
            color: "#f5e7d0",
            border: "none",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          ← GERİ
        </button>

        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>
          KASA TAHSİLAT RAPORU
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>İşlem</th>
              <th style={thStyle}>Tutar</th>
              <th style={thStyle}>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {data.map((k) => (
              <tr key={k.id}>
                <td style={tdStyle}>{k.islem}</td>
                <td style={tdStyle}>{k.tutar} TL</td>
                <td style={tdStyle}>{k.tarih}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
