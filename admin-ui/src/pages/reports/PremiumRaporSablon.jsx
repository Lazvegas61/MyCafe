/* ------------------------------------------------------------
   📌 PremiumRaporSablon.jsx — RAPORLAR İÇİN GENEL ŞABLON (FINAL)
   Amaç:
   - Tüm raporlar için premium altın–kahve başlık ve içerik alanı
   - PDF / Excel butonları entegre
   - İçerik children üzerinden alınır
------------------------------------------------------------- */

import React from "react";
import "./../Raporlar/PremiumRaporSablon.css";

export default function PremiumRaporSablon({ title, children }) {
  return (
    <div className="rapor-sablon-page">
      {/* Başlık */}
      <h1 className="rapor-sablon-title">{title}</h1>

      {/* Export Butonları */}
      <div className="rapor-sablon-export">
        <button className="rs-btn">PDF</button>
        <button className="rs-btn">Excel</button>
      </div>

      {/* İçerik Alanı */}
      <div className="rapor-sablon-container">
        {children}
      </div>
    </div>
  );
}
