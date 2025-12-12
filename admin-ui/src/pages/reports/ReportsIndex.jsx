/* ------------------------------------------------------------
   📌 ReportsIndex.jsx — RAPORLAR ANA MENÜSÜ (FINAL)
   MyCafe Premium Plus altın–kahve tema
   - Büyük ikonlu kutular
   - Responsive grid
   - Tüm rapor sayfalarına yönlendirme
------------------------------------------------------------- */

import React from "react";
import { useNavigate } from "react-router-dom";
import "./../Raporlar/ReportsIndex.css";

export default function ReportsIndex() {
  const navigate = useNavigate();

  const raporlar = [
    { title: "Kasa Raporu", path: "/raporlar/kasa" },
    { title: "Gider Raporu", path: "/raporlar/gider" },
    { title: "Müşteri Borç Raporu", path: "/raporlar/musteri-borc" },
    { title: "Ürün Bazlı Satış", path: "/raporlar/urun" },
    { title: "Kategori Bazlı Satış", path: "/raporlar/kategori" },
    { title: "Masa Detay Raporu", path: "/raporlar/masadetay" },
    { title: "Stok Hareket Raporu", path: "/raporlar/stokhareket" }
  ];

  return (
    <div className="reports-page">
      <h1 className="reports-title">RAPORLAR</h1>

      <div className="reports-grid">
        {raporlar.map((r, i) => (
          <div
            key={i}
            className="report-card"
            onClick={() => navigate(r.path)}
          >
            <div className="report-icon">📊</div>
            <div className="report-text">{r.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
