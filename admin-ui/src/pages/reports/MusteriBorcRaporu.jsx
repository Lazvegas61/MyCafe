import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function MusteriBorcRaporu() {
  const navigate = useNavigate();
  const [rapor, setRapor] = useState([]);
  const [filtre, setFiltre] = useState({
    baslangic: "",
    bitis: "",
    arama: "",
  });

  useEffect(() => {
    fetchRapor();
  }, []);

  const fetchRapor = async () => {
    try {
      const res = await api.get("/raporlar/musteri-borc", { params: filtre });
      setRapor(res.data);
    } catch (err) {
      console.error("Hata:", err);
    }
  };

  /* ------------ STYLES ------------- */
  const page = {
    background: "#f5e7d0",
    minHeight: "100vh",
    padding: "32px",
    boxSizing: "border-box",
  };

  const topBar = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "26px",
  };

  const backBtn = {
    padding: "10px 18px",
    background: "#4b2e05",
    color: "white",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
  };

  const title = {
    fontSize: "34px",
    fontWeight: "900",
    color: "#3a2a14",
  };

  const filterBox = {
    background: "linear-gradient(135deg, #fff9ec 0%, #f1ddba 100%)",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
    marginBottom: "22px",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    alignItems: "center",
  };

  const input = {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1c1a4",
    background: "#fffaf0",
    fontSize: "15px",
    color: "#3a2a14",
    minWidth: "160px",
  };

  const button = {
    padding: "12px 20px",
    background: "#4b2e05",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    whiteSpace: "nowrap",
  };

  const tableWrap = {
    background: "linear-gradient(135deg, #fff9ec 0%, #f1ddba 100%)",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
  };

  const table = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const th = {
    textAlign: "left",
    borderBottom: "2px solid #c7b08a",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#3a2a14",
  };

  const td = {
    padding: "10px",
    borderBottom: "1px solid #e8d9b9",
    fontSize: "14px",
    color: "#3a2a14",
  };

  return (
    <div style={page}>
      {/* ÜST BAR */}
      <div style={topBar}>
        <div style={title}>Müşteri Borç Raporu</div>

        <div style={backBtn} onClick={() => navigate("/raporlar")}>
          ← Geri
        </div>
      </div>

      {/* FİLTRE PANELİ */}
      <div style={filterBox}>
        <div>
          <label>Başlangıç</label>
          <br />
          <input
            type="date"
            style={input}
            value={filtre.baslangic}
            onChange={(e) =>
              setFiltre({ ...filtre, baslangic: e.target.value })
            }
          />
        </div>

        <div>
          <label>Bitiş</label>
          <br />
          <input
            type="date"
            style={input}
            value={filtre.bitis}
            onChange={(e) => setFiltre({ ...filtre, bitis: e.target.value })}
          />
        </div>

        <div>
          <label>Müşteri Ara</label>
          <br />
          <input
            type="text"
            placeholder="İsim yazın..."
            style={input}
            value={filtre.arama}
            onChange={(e) => setFiltre({ ...filtre, arama: e.target.value })}
          />
        </div>

        <div style={button} onClick={fetchRapor}>
          Filtrele
        </div>
      </div>

      {/* TABLO */}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Müşteri</th>
              <th style={th}>Toplam Borç</th>
              <th style={th}>Toplam Ödeme</th>
              <th style={th}>Kalan</th>
              <th style={th}>Son İşlem</th>
            </tr>
          </thead>

          <tbody>
            {rapor.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.musteri}</td>
                <td style={td}>{r.borc} ₺</td>
                <td style={td}>{r.odeme} ₺</td>
                <td style={td}>{r.kalan} ₺</td>
                <td style={td}>{r.sonIslemTarihi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
