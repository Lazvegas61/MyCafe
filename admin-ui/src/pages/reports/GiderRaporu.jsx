import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/GiderRaporu.css";

export default function GiderRaporu() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const gider = JSON.parse(localStorage.getItem("mc_gider") || "[]");
    setList(gider);
  }, []);

  return (
    <PremiumRaporSablon title="GİDER RAPORU">
      <div className="gider-table">
        <div className="gider-header">
          <div>Tarih</div>
          <div>Ürün</div>
          <div>Miktar</div>
          <div>Tutar</div>
          <div>Not</div>
        </div>

        {list.map((g, i) => (
          <div key={i} className="gider-row">
            <div>{g.tarih}</div>
            <div>{g.urun}</div>
            <div>{g.miktar}</div>
            <div>{g.tutar} ₺</div>
            <div>{g.not}</div>
          </div>
        ))}
      </div>
    </PremiumRaporSablon>
  );
}
