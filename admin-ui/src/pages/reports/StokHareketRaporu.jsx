import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/StokHareketRaporu.css";

export default function StokHareketRaporu() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("mc_stok_hareket") || "[]");

    const filtered = data.filter((x) => {
      if (x.tip !== "SATIŞ") return false;
      const kategori = x.kategori?.toUpperCase() || "";
      if (kategori === "ÇAY" || kategori === "ORALET") return false;
      return true;
    });

    setList(filtered);
  }, []);

  return (
    <PremiumRaporSablon title="STOK HAREKET RAPORU">
      <div className="stok-table">
        <div className="stok-header">
          <div>Tarih</div>
          <div>Ürün</div>
          <div>Adet</div>
          <div>Maliyet</div>
          <div>Kazanç</div>
          <div>Durum</div>
        </div>

        {list.map((r, i) => {
          const kazanc = Number(r.satisFiyati) - Number(r.maliyet);
          const kritik = Number(r.kalanStok) <= Number(r.kritikLimit);

          return (
            <div key={i} className="stok-row">
              <div>{r.tarih}</div>
              <div>{r.urun}</div>
              <div>{r.adet}</div>
              <div>{r.maliyet} ₺</div>

              <div className={kazanc >= 0 ? "stok-green" : "stok-red"}>
                {kazanc} ₺
              </div>

              <div>{kritik ? "⚠ Kritik" : "Normal"}</div>
            </div>
          );
        })}
      </div>
    </PremiumRaporSablon>
  );
}
