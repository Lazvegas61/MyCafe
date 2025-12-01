import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MasaDetayRaporu() {
  const navigate = useNavigate();

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  // INPUT STATE
  const [masaInput, setMasaInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  // UYGULANAN FİLTRE STATE
  const [masaNo, setMasaNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const applyFilters = () => {
    setMasaNo(masaInput);
    setStartDate(startInput);
    setEndDate(endInput);
  };

  const adisyonlar = readJSON("mc_adisyonlar", []);

  const isInRange = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;

    if (startDate) {
      const s = new Date(startDate + "T00:00:00");
      if (d < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate + "T23:59:59");
      if (d > e) return false;
    }
    return true;
  };

  const data = useMemo(() => {
    let list = (adisyonlar || []).filter(
      (a) => a.durum === "KAPALI" && a.kapanis
    );

    // MASA FİLTRESİ
    if (masaNo) {
      list = list.filter(
        (a) => String(a.masaNo || "") === String(masaNo)
      );
    }

    // TARİH FİLTRESİ
    list = list.filter((a) => isInRange(a.kapanis));

    // VERİYİ DÜZENLE
    list = list.map((a) => {
      const kapanisSaat = new Date(a.kapanis);

      const odemeler = a.odemeler || [];
      const son = odemeler.length > 0 ? odemeler[odemeler.length - 1] : null;
      const odemeTuru = son ? son.tur : "Ödeme Yok";

      const araToplam = (a.kalemler || []).reduce(
        (t, u) => t + (u.adet || 0) * (u.fiyat || 0),
        0
      );
      const indirim = Number(a.indirim || 0);
      const genelToplam = Math.max(0, araToplam - indirim);

      return {
        id: a.id,
        masaNo: a.masaNo,
        kapanis: a.kapanis,
        kapanisSaat,
        odemeTuru,
        tutar: genelToplam.toFixed(2),
      };
    });

    // KAPANIŞ SAATİ SIRALAMA
    list.sort((a, b) => a.kapanisSaat - b.kapanisSaat);

    return list;
  }, [JSON.stringify(adisyonlar), masaNo, startDate, endDate]);

  const formatSaat = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTL = (n) =>
    (Number(n) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺";

  // PREMIUM STİL
  const page = {
    background: "#f5e7d0",
    minHeight: "100vh",
    padding: "24px 30px",
    color: "#4b2e05",
  };

  const headerCard = {
    background:
      "linear-gradient(135deg, rgba(252,244,220,1) 0%, rgba(222,182,118,1) 100%)",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    marginBottom: 18,
    border: "1px solid rgba(150,110,50,0.4)",
    position: "relative",
  };

  const filterCard = {
    background: "#fffaf2",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    border: "1px solid #e2c9a7",
    position: "relative",
  };

  const btnApply = {
    position: "absolute",
    top: 12,
    right: 12,
    background: "#4b2e05",
    color: "#f5e7d0",
    border: "none",
    padding: "10px 20px",
    fontSize: 15,
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
  };

  const input = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #c9b99a",
    fontSize: 14,
    background: "#fff",
  };

  const tableCard = {
    background: "#fffaf2",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    border: "1px solid #e2c9a7",
  };

  return (
    <div style={page}>
      {/* BAŞLIK */}
      <div style={headerCard}>
        <button
          onClick={() => navigate("/raporlar")}
          style={{
            position: "absolute",
            top: 10,
            right: 14,
            padding: "8px 14px",
            background: "#4b2e05",
            color: "#f5e7d0",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ← GERİ
        </button>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
          MASA DETAY RAPORU
        </div>
        <div style={{ fontSize: 14 }}>
          Kapanış saatine göre sıralanmış ödeme hareketleri.
        </div>
      </div>

      {/* FİLTRE ALANI */}
      <div style={filterCard}>
        <button style={btnApply} onClick={applyFilters}>
          UYGULA
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Masa No</div>
            <input
              type="number"
              value={masaInput}
              onChange={(e) => setMasaInput(e.target.value)}
              style={input}
              placeholder="Masa No"
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Başlangıç Tarihi
            </div>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              style={input}
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Bitiş Tarihi
            </div>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              style={input}
            />
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div style={tableCard}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
          KAPANAN ADİSYONLAR
        </div>

        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 6 }}>
                  Kapanış Saati
                </th>
                <th style={{ textAlign: "left", padding: 6 }}>Ödeme Türü</th>
                <th style={{ textAlign: "right", padding: 6 }}>Tutar</th>
                <th style={{ textAlign: "left", padding: 6 }}>Masa</th>
                <th style={{ textAlign: "left", padding: 6 }}>Adisyon</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 6 }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}

              {data.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid #eee2c9" }}
                >
                  <td style={{ padding: 6 }}>{formatSaat(r.kapanis)}</td>
                  <td style={{ padding: 6 }}>{r.odemeTuru}</td>
                  <td
                    style={{
                      padding: 6,
                      textAlign: "right",
                      color: "#2e7d32",
                      fontWeight: 700,
                    }}
                  >
                    {formatTL(r.tutar)}
                  </td>
                  <td style={{ padding: 6 }}>{r.masaNo}</td>
                  <td style={{ padding: 6 }}>{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
