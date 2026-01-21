import React, { useEffect, useState, useMemo } from "react";

/*
  MASA RAPORU
  -----------
  - Veri Kaynağı: mc_finans_havuzu
  - Ortak tarih filtresi
  - SADECE GÖRÜNÜM GÜNCELLENDİ
*/

export default function MasaRaporu() {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);

  useEffect(() => {
    const havuz =
      JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    setVeriler(havuz);
  }, []);

  const rapor = useMemo(() => {
    return veriler.filter(v => {
      if (v.kaynak !== "ADISYON") return false;

      const tarih = v.tarih?.slice(0, 10);
      if (baslangic && tarih < baslangic) return false;
      if (bitis && tarih > bitis) return false;

      return true;
    });
  }, [veriler, baslangic, bitis]);

  const toplamTutar = rapor.reduce(
    (s, r) => s + Number(r.tutar || 0),
    0
  );

  const masaSayisi = new Set(rapor.map(r => r.masaNo)).size;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06" }}>
          🍽️ Masa Bazlı Rapor
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          Seçilen tarih aralığında masalara ait adisyon gelirleri
        </p>
      </div>

      {/* FİLTRE */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          display: "flex",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <label>Başlangıç Tarihi</label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
          />
        </div>

        <div>
          <label>Bitiş Tarihi</label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
          />
        </div>
      </div>

      {/* ÖZET */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <OzetKart
          baslik="Toplam Masa"
          deger={masaSayisi}
          renk="#9b59b6"
        />
        <OzetKart
          baslik="Toplam Adisyon"
          deger={rapor.length}
          renk="#3498db"
        />
        <OzetKart
          baslik="Toplam Ciro"
          deger={toplamTutar.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
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
          <thead style={{ background: "#f1e2c6" }}>
            <tr>
              <Th>Masa</Th>
              <Th>Tarih</Th>
              <Th align="right">Tutar</Th>
            </tr>
          </thead>

          <tbody>
            {rapor.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 20, textAlign: "center" }}>
                  Seçilen aralıkta masa verisi bulunamadı
                </td>
              </tr>
            )}

            {rapor.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#faf5ea"
                }}
              >
                <Td>{r.masaNo}</Td>
                <Td>
                  {new Date(r.tarih).toLocaleDateString("tr-TR")}
                </Td>
                <Td align="right">
                  {Number(r.tutar || 0).toLocaleString("tr-TR")} ₺
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALT BİLGİ */}
      <div style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
        Bu rapor yalnızca <strong>ADİSYON</strong> kaynaklı kayıtları içerir.
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
