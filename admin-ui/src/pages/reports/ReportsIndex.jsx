import React from "react";
import { useNavigate } from "react-router-dom";

export default function ReportsIndex() {
  const navigate = useNavigate();

  const page = {
    background: "#f5e7d0",
    minHeight: "100vh",
    padding: "40px",
    boxSizing: "border-box",
    overflow: "auto",
  };

  const title = {
    fontSize: "46px",
    fontWeight: "900",
    color: "#3a2a14",
    marginBottom: "40px",
    textAlign: "center",
    letterSpacing: "1px",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "26px",
    maxWidth: "1500px",
    margin: "0 auto",
  };

  const card = {
    background: "linear-gradient(135deg, #fff9ec 0%, #f1ddba 100%)",
    padding: "26px",
    borderRadius: "20px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
    border: "1px solid rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "all 0.25s ease",
    textAlign: "center",
  };

  const hover = {
    transform: "translateY(-6px)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
  };

  const titleText = {
    fontSize: "21px",
    color: "#3a2a14",
    fontWeight: "800",
    marginTop: "10px",
  };

  const desc = {
    opacity: 0.65,
    fontSize: "14px",
    marginTop: "4px",
  };

  const [hi, setHi] = React.useState(null);

  const items = [
    {
      title: "Ürün Bazlı Satış",
      desc: "Ürünlere göre satış detaylarını listeler",
      icon: "📊",
      path: "/raporlar/urun-satis",
    },
    {
      title: "Kategori Bazlı Satış",
      desc: "Kategori toplam satışlarını gösterir",
      icon: "📦",
      path: "/raporlar/kategori-satis",
    },
    {
      title: "Kasa Tahsilat Raporu",
      desc: "Günlük ve toplam tahsilat hareketleri",
      icon: "💰",
      path: "/raporlar/kasa",
    },
    {
      title: "Müşteri Borç Raporu",
      desc: "Borç, tahsilat ve bakiye bilgileri",
      icon: "👤",
      path: "/raporlar/musteri-borc",
    },
    {
      title: "Gider Raporu",
      desc: "Günlük gider ve maliyet hareketleri",
      icon: "🧾",
      path: "/raporlar/gider-raporu",
    },
    {
      title: "Masa Detay Raporu",
      desc: "Masa bazlı geçmiş adisyon raporu",
      icon: "🍽️",
      path: "/raporlar/masa-detay",
    },
  ];

  return (
    <div style={page}>
      <h1 style={title}>RAPORLAR</h1>

      <div style={grid}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{ ...card, ...(hi === i ? hover : {}) }}
            onMouseEnter={() => setHi(i)}
            onMouseLeave={() => setHi(null)}
            onClick={() => navigate(item.path)}
          >
            <div style={{ fontSize: "3.4rem" }}>{item.icon}</div>
            <div style={titleText}>{item.title}</div>
            <div style={desc}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
