/* ============================================================
   📄 DOSYA: GiderRaporu.jsx
   📌 AMAÇ:
   MODEL C – Gider Raporu
   - Ortak TarihFiltresi kullanır
   - Tek veri kaynağı: mc_kasa_hareketleri
   - Sadece tutar < 0 olan hareketler
============================================================ */

import React, { useEffect, useState } from "react";


export default function GiderRaporu() {
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);

  

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>
        Gider Raporu
      </h2>

      
      {/* ------------------ TOPLAM ------------------ */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          marginBottom: 16,
        }}
      >
        <strong>Toplam Gider:</strong>{" "}
        {toplam.toLocaleString("tr-TR")} ₺
      </div>

      {/* ------------------ TABLO ------------------ */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1e2c6" }}>
            <Th>Tarih</Th>
            <Th>Açıklama</Th>
            <Th align="right">Tutar</Th>
          </tr>
        </thead>
        <tbody>
          {liste.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: 16, textAlign: "center" }}>
                Kayıt yok
              </td>
            </tr>
          )}

          {liste.map((g, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}
            >
              <Td>{new Date(g.tarih).toLocaleString("tr-TR")}</Td>
              <Td>{g.aciklama}</Td>
              <Td align="right">
                {g.tutar.toLocaleString("tr-TR")} ₺
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------
   Yardımcı Bileşenler
------------------------------------------------------------ */
const Th = ({ children, align }) => (
  <th
    style={{
      padding: 10,
      textAlign: align || "left",
      borderBottom: "1px solid #ddd",
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td
    style={{
      padding: 10,
      textAlign: align || "left",
      borderBottom: "1px solid #eee",
    }}
  >
    {children}
  </td>
);
