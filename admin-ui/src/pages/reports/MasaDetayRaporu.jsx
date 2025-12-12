import React, { useEffect, useState } from "react";
import PremiumRaporSablon from "./PremiumRaporSablon";
import "./../Raporlar/MasaDetayRaporu.css";

export default function MasaDetayRaporu() {
  const [list, setList] = useState([]);
  const [detayAcik, setDetayAcik] = useState(null);

  useEffect(() => {
    const rapor = JSON.parse(localStorage.getItem("mc_masadetay") || "[]");
    setList(rapor);
  }, []);

  return (
    <PremiumRaporSablon title="MASA DETAY RAPORU">
      <div className="masa-table">
        <div className="masa-header">
          <div>Masa</div>
          <div>Açılış</div>
          <div>Kapanış</div>
          <div>Toplam</div>
          <div>Ödeme</div>
          <div>Kalan</div>
          <div>Kâr</div>
          <div>Detay</div>
        </div>

        {list.map((m) => (
          <div key={m.id} className="masa-row">
            <div>{m.masa}</div>
            <div>{m.acilis}</div>
            <div>{m.kapanis}</div>
            <div>{m.toplam} ₺</div>
            <div>{m.odeme} ₺</div>

            <div className={m.kalan > 0 ? "red" : "green"}>{m.kalan} ₺</div>

            <div className={m.kar >= 0 ? "green" : "red"}>{m.kar} ₺</div>

            <button
              className="masa-detay-btn"
              onClick={() => setDetayAcik(detayAcik === m.id ? null : m.id)}
            >
              {detayAcik === m.id ? "Kapat" : "Detay"}
            </button>

            {detayAcik === m.id && (
              <div className="masa-detay-blok">
                <h3>Ürün Kırılımı</h3>
                {m.urunler.map((u, i) => (
                  <div key={i} className="masa-detay-row">
                    <div>{u.urun}</div>
                    <div>{u.adet} adet</div>
                    <div>{u.toplam} ₺</div>
                  </div>
                ))}

                <h3>Ödeme Kırılımı</h3>
                {m.odemeler.map((o, i) => (
                  <div key={i} className="masa-detay-row">
                    <div>{o.yontem}</div>
                    <div>{o.tutar} ₺</div>
                  </div>
                ))}

                <h3>Kâr Hesabı</h3>
                <div className="masa-detay-row">
                  <div>Maliyet</div>
                  <div>{m.maliyet} ₺</div>
                </div>
                <div className="masa-detay-row bold">
                  <div>Kâr</div>
                  <div className={m.kar >= 0 ? "green" : "red"}>
                    {m.kar} ₺
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </PremiumRaporSablon>
  );
}
