// src/pages/KarZararPaneli.jsx
import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "mc_karzarar_ciro";

export default function KarZararPaneli({ giderler }) {
  const [ciro, setCiro] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setCiro(raw);
  }, []);

  const toplamGider = useMemo(
    () =>
      (giderler || []).reduce(
        (t, g) => t + Number(g.tutar || 0),
        0
      ),
    [giderler]
  );

  const numCiro = Number(ciro || 0);
  const net = numCiro - toplamGider;

  const durumText =
    net > 0 ? "Kâr" : net < 0 ? "Zarar" : "Başabaş";
  const durumColor =
    net > 0 ? "#2e7d32" : net < 0 ? "#b71c1c" : "#6e5635";

  const handleCiroChange = (e) => {
    const v = e.target.value;
    setCiro(v);
    localStorage.setItem(STORAGE_KEY, v || "0");
  };

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Aylık Ciro (₺)
        </div>
        <input
          type="number"
          value={ciro}
          onChange={handleCiroChange}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid #c9b99a",
            fontSize: 13,
          }}
          placeholder="Örn: aylık toplam satış"
        />
      </div>

      <div
        style={{
          padding: 8,
          borderRadius: 10,
          backgroundColor: "#f0e4cc",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span>Toplam Gider</span>
          <b>{toplamGider.toFixed(2)} ₺</b>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Net Sonuç</span>
          <b style={{ color: durumColor }}>
            {durumText}: {net.toFixed(2)} ₺
          </b>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Not: Kâr–zarar hesabı, bu sayfada girilen giderler ve yukarıda
        girdiğiniz <b>aylık ciro</b> bilgisine göre hesaplanır. İleride
        satış raporlarıyla otomatik entegre edilebilir.
      </div>
    </div>
  );
}

