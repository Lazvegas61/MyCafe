import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/KategoriBazli.css";

export default function KategoriBazli() {
  const [kategoriList, setKategoriList] = useState([]);

  useEffect(() => {
    const satis = JSON.parse(localStorage.getItem("mc_satis") || "[]");
    const map = {};

    satis.forEach((s) => {
      if (!s.kategori) return;
      if (s.kategori.toUpperCase() === "SİPARİŞ YEMEK") return;

      if (!map[s.kategori]) map[s.kategori] = 0;
      map[s.kategori] += Number(s.toplam || 0);
    });

    const arr = Object.keys(map)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((k) => ({ kategori: k, toplam: map[k] }));

    setKategoriList(arr);
  }, []);

  return (
    <PremiumRaporSablon title="KATEGORİ BAZLI SATIŞ RAPORU">
      <div className="kate-table">
        <div className="kate-header">
          <div>Kategori</div>
          <div>Toplam Satış</div>
        </div>

        {kategoriList.map((k, i) => (
          <div key={i} className="kate-row">
            <div>{k.kategori}</div>
            <div className="kate-tutar">{k.toplam} ₺</div>
          </div>
        ))}
      </div>
    </PremiumRaporSablon>
  );
}
