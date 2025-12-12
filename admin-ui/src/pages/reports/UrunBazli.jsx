import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/UrunBazli.css";

export default function UrunBazli() {
  const [list, setList] = useState([]);
  const [isAdmin] = useState(true);

  useEffect(() => {
    const satis = JSON.parse(localStorage.getItem("mc_satis") || "[]");
    const map = {};

    satis.forEach((s) => {
      if (!s.urun) return;
      if (s.kategori?.toUpperCase() === "SİPARİŞ YEMEK") return;

      if (!map[s.urun]) {
        map[s.urun] = {
          urun: s.urun,
          adet: 0,
          birim: Number(s.birimFiyat || 0),
          toplam: 0,
          maliyet: Number(s.maliyet || 0),
        };
      }

      map[s.urun].adet += Number(s.adet || 0);
      map[s.urun].toplam += Number(s.toplam || 0);
    });

    const arr = Object.values(map).map((x) => ({
      ...x,
      toplamMaliyet: x.maliyet * x.adet,
      kar: x.toplam - x.maliyet * x.adet,
    }));

    arr.sort((a, b) => a.urun.localeCompare(b.urun, "tr"));
    setList(arr);
  }, []);

  return (
    <PremiumRaporSablon title="ÜRÜN BAZLI SATIŞ RAPORU">
      <div className="urun-table">
        <div className="urun-header">
          <div>Ürün</div>
          <div>Adet</div>
          <div>Birim</div>
          <div>Toplam</div>
          <div>Maliyet</div>
          <div>Top. Maliyet</div>
          {isAdmin && <div>Kâr</div>}
        </div>

        {list.map((u, i) => (
          <div key={i} className="urun-row">
            <div>{u.urun}</div>
            <div>{u.adet}</div>
            <div>{u.birim} ₺</div>
            <div>{u.toplam} ₺</div>
            <div>{u.maliyet} ₺</div>
            <div>{u.toplamMaliyet} ₺</div>
            {isAdmin && (
              <div className={u.kar >= 0 ? "u-green" : "u-red"}>
                {u.kar} ₺
              </div>
            )}
          </div>
        ))}
      </div>
    </PremiumRaporSablon>
  );
}
