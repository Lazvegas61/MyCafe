/* ============================================================
   📄 DOSYA: BilardoRaporu.jsx
   📌 AMAÇ:
   MODEL C – Bilardo Raporu
   - Tek veri kaynağı: mc_kasa_hareketleri
   - Pozitif tutarlı bilardo gelirleri
   - Tarih filtresi vardır
   - Bilardo kaydı yoksa rapor ÇALIŞMAZ (bilinçli)
============================================================ */

import React, { useEffect, useState } from "react";

const KASA_KEY = "mc_kasa_hareketleri";
const toDay = (iso) => iso.split("T")[0];

const isBilardo = (h) => {
  if ((h.kaynak || "").toUpperCase() === "BILARDO") return true;
  if ((h.tip || "").toUpperCase() === "BILARDO") return true;
  if ((h.aciklama || "").toLowerCase().includes("bilardo")) return true;
  return false;
};

export default function BilardoRaporu() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [bilardoVar, setBilardoVar] = useState(true);

  const yukle = () => {
    const hareketler = JSON.parse(
      localStorage.getItem(KASA_KEY) || "[]"
    );

    const gunluk = hareketler.filter((h) => {
      if (!h.tarih) return false;
      if (Number(h.tutar || 0) <= 0) return false;
      if (!isBilardo(h)) return false;

      const gun = toDay(h.tarih);
      if (from && gun < from) return false;
      if (to && gun > to) return false;

      return true;
    });

    setBilardoVar(gunluk.length > 0);

    setListe(gunluk);
    setToplam(
      gunluk.reduce((s, h) => s + Number(h.tutar || 0), 0)
    );
  };

  useEffect(() => {
    yukle();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>
        Bilardo Raporu
      </h2>

      {/* ------------------ FİLTRE ------------------ */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          marginBottom: 16,
          background: "#fff",
          padding: 12,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
      >
        <div>
          <label>Başlangıç Tarihi</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label>Bitiş Tarihi</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button onClick={yukle}>Filtrele</button>
      </div>

      {/* ------------------ UYARI ------------------ */}
      {!bilardoVar && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            color: "#856404",
          }}
        >
          <strong>Bilardo raporu oluşturulamadı.</strong>
          <br />
          Seçilen tarih aralığında bilardo gelir kaydı bulunmuyor.
          <br />
          Bu bilinçli bir durumdur; tahmini rapor üretilmez.
        </div>
      )}

      {/* ------------------ ÖZET ------------------ */}
      {bilardoVar && (
        <div
          style={{
            background: "#f5e7d0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          }}
        >
          <strong>Toplam Bilardo Geliri:</strong>{" "}
          {toplam.toLocaleString("tr-TR")} ₺
        </div>
      )}

      {/* ------------------ TABLO ------------------ */}
      {bilardoVar && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1e2c6" }}>
              <Th>Tarih</Th>
              <Th>Açıklama</Th>
              <Th align="right">Tutar</Th>
            </tr>
          </thead>
          <tbody>
            {liste.map((h, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}
              >
                <Td>{new Date(h.tarih).toLocaleString("tr-TR")}</Td>
                <Td>{h.aciklama || "Bilardo Geliri"}</Td>
                <Td align="right">
                  {Number(h.tutar).toLocaleString("tr-TR")} ₺
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
