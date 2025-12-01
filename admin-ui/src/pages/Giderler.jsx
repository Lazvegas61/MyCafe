import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Giderler() {
  const [giderler, setGiderler] = useState([]);
  const [urunAdi, setUrunAdi] = useState("");
  const [tutar, setTutar] = useState("");
  const [miktar, setMiktar] = useState("");
  const [birim, setBirim] = useState("");
  const [not, setNot] = useState("");

  const [tarihFiltre, setTarihFiltre] = useState("");
  const [arama, setArama] = useState("");

  // -----------------------------------------
  //   LOCALSTORAGE YÜKLE
  // -----------------------------------------
  useEffect(() => {
    const kayitli = localStorage.getItem("mc_giderler");
    if (kayitli) setGiderler(JSON.parse(kayitli));
  }, []);

  const kaydet = (yeniListe) => {
    localStorage.setItem("mc_giderler", JSON.stringify(yeniListe));
    setGiderler(yeniListe);
  };

  // -----------------------------------------
  //   TARİH FORMAT
  // -----------------------------------------
  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR");
  };

  // -----------------------------------------
  //   GİDER EKLE
  // -----------------------------------------
  const ekle = () => {
    if (!urunAdi || !tutar || !miktar || !birim) return;

    const yeni = {
      id: Date.now(),
      urunAdi,
      tutar: Number(tutar),
      miktar: Number(miktar),
      birim,
      not,
      tarih: new Date().toISOString(),
    };

    const liste = [...giderler, yeni];
    kaydet(liste);

    setUrunAdi("");
    setTutar("");
    setMiktar("");
    setBirim("");
    setNot("");
  };

  // -----------------------------------------
  //   FİLTRE
  // -----------------------------------------
  const filtrelenmisGiderler = giderler.filter((g) => {
    const tarihleUyum =
      !tarihFiltre || formatDate(g.tarih) === formatDate(tarihFiltre);

    const aramaylaUyum =
      !arama ||
      g.urunAdi.toLowerCase().includes(arama.toLowerCase()) ||
      g.not?.toLowerCase().includes(arama.toLowerCase());

    return tarihleUyum && aramaylaUyum;
  });

  const toplamTutar = filtrelenmisGiderler.reduce(
    (t, g) => t + Number(g.tutar),
    0
  );

  // -----------------------------------------
  //   PDF EXPORT
  // -----------------------------------------
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });

    const rows = filtrelenmisGiderler.map((g) => [
      formatDate(g.tarih),
      g.urunAdi,
      Number(g.tutar).toFixed(2),
      g.miktar,
      g.birim,
      g.not || "",
    ]);

    doc.autoTable({
      head: [["Tarih", "Ürün Adı", "Tutar (₺)", "Miktar", "Birim", "Not"]],
      body: rows,
      headStyles: { fillColor: [75, 46, 5] },
      styles: { fontSize: 10 },
    });

    doc.save("Giderler_Raporu.pdf");
  };

  // -----------------------------------------
  //   EXCEL EXPORT
  // -----------------------------------------
  const exportExcel = () => {
    const data = filtrelenmisGiderler.map((g) => ({
      Tarih: formatDate(g.tarih),
      "Ürün Adı": g.urunAdi,
      "Tutar (₺)": Number(g.tutar).toFixed(2),
      Miktar: g.miktar,
      Birim: g.birim,
      Not: g.not || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Giderler");
    XLSX.writeFile(wb, "Giderler_Rapor.xlsx");
  };

  // -----------------------------------------
  //   SAYFA
  // -----------------------------------------
  return (
    <div style={{ padding: 24, width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Giderler</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {/* SOL FORM */}
        <div
          style={{
            width: 350,
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          }}
        >
          <h2 style={{ marginBottom: 10 }}>Yeni Gider</h2>

          {/* ÜRÜN ADI */}
          <input
            value={urunAdi}
            onChange={(e) => setUrunAdi(e.target.value)}
            placeholder="Ürün Adı"
            style={input}
          />

          {/* TUTAR */}
          <input
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            placeholder="Tutar (₺)"
            type="number"
            style={{
              ...input,
              MozAppearance: "textfield",
            }}
          />

          {/* MİKTAR (OKLAR KALDIRILDI) */}
          <input
            value={miktar}
            onChange={(e) => setMiktar(e.target.value)}
            placeholder="Miktar"
            type="number"
            style={{
              ...input,
              MozAppearance: "textfield",
            }}
          />

          {/* Okları kaldırmak için */}
          <style>
            {`
              input[type=number]::-webkit-inner-spin-button,
              input[type=number]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
            `}
          </style>

          {/* BİRİM (DROPDOWN) */}
          <select
            value={birim}
            onChange={(e) => setBirim(e.target.value)}
            style={{
              ...input,
              background: "#fff",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            <option value="">Birim Seç</option>
            <option value="Adet">Adet</option>
            <option value="Kg">Kg</option>
            <option value="Gram">Gram</option>
            <option value="Litre">Litre</option>
            <option value="Paket">Paket</option>
            <option value="Koli">Koli</option>
            </select>

          {/* NOT */}
          <textarea
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Not"
            style={{ ...input, height: 70 }}
          />

          <button onClick={ekle} style={buttonStil}>
            + Ekle
          </button>
        </div>

        {/* SAĞ RAPOR PANELİ */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input
              type="date"
              value={tarihFiltre}
              onChange={(e) => setTarihFiltre(e.target.value)}
              style={input}
            />

            <input
              placeholder="Ara (Ürün / Not)"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              style={input}
            />

            <button onClick={() => setTarihFiltre("")} style={buttonStil}>
              Temizle
            </button>
          </div>

          {/* RAPOR BUTONLARI */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button onClick={exportPDF} style={buttonStil}>
              PDF İndir
            </button>
            <button onClick={exportExcel} style={buttonStil}>
              Excel İndir
            </button>
          </div>

          {/* TABLO */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#4b2e05", color: "#fff" }}>
                <th style={th}>Tarih</th>
                <th style={th}>Ürün Adı</th>
                <th style={th}>Tutar</th>
                <th style={th}>Miktar</th>
                <th style={th}>Birim</th>
                <th style={th}>Not</th>
              </tr>
            </thead>

            <tbody>
              {filtrelenmisGiderler.map((g) => (
                <tr key={g.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={td}>{formatDate(g.tarih)}</td>
                  <td style={td}>{g.urunAdi}</td>
                  <td style={td}>{g.tutar} ₺</td>
                  <td style={td}>{g.miktar}</td>
                  <td style={td}>{g.birim}</td>
                  <td style={td}>{g.not || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 10,
              fontWeight: "bold",
              fontSize: 20,
            }}
          >
            Toplam: {toplamTutar.toFixed(2)} ₺
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ STİLLER ------------------

const input = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box",
};

const buttonStil = {
  padding: "10px 14px",
  background: "#4b2e05",
  color: "#fff",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const th = {
  padding: 10,
  textAlign: "left",
};

const td = {
  padding: 10,
};
