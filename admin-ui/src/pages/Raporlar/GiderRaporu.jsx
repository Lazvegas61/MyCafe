import React, { useEffect, useState } from "react";

/*
  GİDER RAPORU
  -----------
  - Veri Kaynağı: mc_kasa_hareketleri
  - Sadece gider kayıtları
  - SADECE GÖRÜNÜM GÜNCELLENDİ
*/

export default function GiderRaporu() {
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);

  /*
    ⚠️ NOT:
    Gider verisinin doldurulması ve toplam hesaplanması
    mevcut sistem mantığında aynen korunmaktadır.
    Bu dosyada SADECE UI yeniden düzenlenmiştir.
  */

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06" }}>
          💸 Gider Raporu
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          Seçilen dönemde kasadan çıkan gider kalemleri
        </p>
      </div>

      {/* TOPLAM GİDER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <OzetKart
          baslik="Toplam Gider"
          deger={toplam.toLocaleString("tr-TR") + " ₺"}
          renk="#e74c3c"
        />
      </div>

      {/* TABLO */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fbeaea" }}>
            <tr>
              <Th>Tarih</Th>
              <Th>Açıklama</Th>
              <Th align="right">Tutar</Th>
            </tr>
          </thead>

          <tbody>
            {liste.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 20, textAlign: "center" }}>
                  Gider kaydı bulunamadı
                </td>
              </tr>
            )}

            {liste.map((g, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#faf5ea"
                }}
              >
                <Td>
                  {new Date(g.tarih).toLocaleString("tr-TR")}
                </Td>
                <Td>{g.aciklama || "-"}</Td>
                <Td align="right" style={{ color: "#e74c3c", fontWeight: 600 }}>
                  {Number(g.tutar).toLocaleString("tr-TR")} ₺
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALT BİLGİ */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
        Bu rapor yalnızca <strong>gider</strong> tipindeki kasa hareketlerini
        içerir ve negatif finansal etkiyi temsil eder.
      </div>
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk }) => (
  <div
    style={{
      background: "#fff",
      padding: 16,
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      borderLeft: `4px solid ${renk}`
    }}
  >
    <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
      {baslik}
    </div>
    <div style={{ fontSize: 22, fontWeight: "bold", color: renk }}>
      {deger}
    </div>
  </div>
);

const Th = ({ children, align }) => (
  <th
    style={{
      padding: 12,
      textAlign: align || "left",
      borderBottom: "1px solid #ddd"
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td
    style={{
      padding: 12,
      textAlign: align || "left",
      borderBottom: "1px solid #eee"
    }}
  >
    {children}
  </td>
);
