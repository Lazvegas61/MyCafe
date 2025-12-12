/* ------------------------------------------------------------
   📌 KasaRaporu.jsx — PREMIUM ŞABLONLU SÜRÜM (FINAL)
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/KasaRaporu.css";

export default function KasaRaporu() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const kasa = JSON.parse(localStorage.getItem("mc_kasa") || "[]");
    setList(kasa);
  }, []);

  return (
    <PremiumRaporSablon title="KASA RAPORU">
      <div className="kasa-table">
        <div className="kasa-header">
          <div>Tarih</div>
          <div>Açıklama</div>
          <div>Masa</div>
          <div>Yöntem</div>
          <div>Tutar</div>
        </div>

        {list.map((x, i) => (
          <div key={i} className="kasa-row">
            <div>{x.tarih}</div>
            <div>{x.aciklama}</div>
            <div>{x.masa}</div>
            <div>{x.odemeYontemi}</div>
            <div className="kasa-tutar">{x.tutar} ₺</div>
          </div>
        ))}
      </div>
    </PremiumRaporSablon>
  );
}
