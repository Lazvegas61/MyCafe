import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GiderRaporu() {
  const navigate = useNavigate();

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [textFilter, setTextFilter] = useState("");

  const giderler = readJSON("mc_giderler", []);

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
    let list = (giderler || []).map((g) => {
      const tarihISO = g.tarihISO || g.tarih || g.createdAt;
      return {
        ...g,
        tarihISO,
      };
    });

    list = list.filter((g) => isInRange(g.tarihISO));

    if (textFilter.trim()) {
      const q = textFilter.trim().toLowerCase();
      list = list.filter(
        (g) =>
          (g.ad || g.urunAd || "")
            .toLowerCase()
            .includes(q) ||
          (g.not || g.aciklama || "")
            .toLowerCase()
            .includes(q)
      );
    }

    list.sort((a, b) => {
      const da = new Date(a.tarihISO || 0).getTime();
      const db = new Date(b.tarihISO || 0).getTime();
      return da - db;
    });

    return list;
  }, [JSON.stringify(giderler), startDate, endDate, textFilter]);

  const toplamTutar = useMemo(
    () => data.reduce((t, r) => t + Number(r.tutar || 0), 0),
    [data]
  );

  const formatTL = (n) =>
    (Number(n) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺";

  const formatTarih = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("tr-TR");
  };

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
    padding: "12px 14px",
    marginBottom: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    border: "1px solid #e2c9a7",
  };

  const tableCard = {
    background: "#fffaf2",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    border: "1px solid #e2c9a7",
  };

  const input = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #c9b99a",
    fontSize: 14,
    background: "#fff",
  };

  const thLeft = {
    textAlign: "left",
    borderBottom: "1px solid #d6c3a2",
    padding: "6px 4px",
    fontSize: 13,
  };

  const thRight = {
    textAlign: "right",
    borderBottom: "1px solid #d6c3a2",
    padding: "6px 4px",
    fontSize: 13,
  };

  const tdLeft = {
    textAlign: "left",
    padding: "4px 4px",
    borderBottom: "1px solid #eee2c9",
  };

  const tdRight = {
    textAlign: "right",
    padding: "4px 4px",
    borderBottom: "1px solid #eee2c9",
  };

  return (
    <div style={page}>
      {/* BAŞLIK KARTI + GERİ */}
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
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          ← GERİ
        </button>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "1px",
            marginBottom: 4,
          }}
        >
          GİDER RAPORU
        </div>
        <div style={{ fontSize: 14 }}>
          Gider kayıtlarını tarih ve açıklamaya göre filtreleyerek listeler.
        </div>
      </div>

      {/* FİLTRELER */}
      <div style={filterCard}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Başlangıç Tarihi
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={input}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Bitiş Tarihi
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={input}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Ürün / Not Ara
            </div>
            <input
              type="text"
              placeholder="Örn: Süt, Temizlik..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              style={input}
            />
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div style={tableCard}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          GİDER LİSTESİ
        </div>
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th style={thLeft}>Tarih</th>
                <th style={thLeft}>Ürün / Gider</th>
                <th style={thLeft}>Miktar</th>
                <th style={thLeft}>Birim</th>
                <th style={thRight}>Tutar</th>
                <th style={thLeft}>Not</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} style={tdLeft}>
                    Bu kriterlerle kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {data.map((g) => (
                <tr key={g.id || g.tarihISO + g.ad}>
                  <td style={tdLeft}>{formatTarih(g.tarihISO)}</td>
                  <td style={tdLeft}>{g.ad || g.urunAd}</td>
                  <td style={tdLeft}>{g.miktar}</td>
                  <td style={tdLeft}>{g.birim}</td>
                  <td style={tdRight}>{formatTL(g.tutar)}</td>
                  <td style={tdLeft}>{g.not || g.aciklama}</td>
                </tr>
              ))}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr>
                  <td
                    style={{
                      ...tdLeft,
                      fontWeight: 800,
                      borderTop: "2px solid #d6c3a2",
                    }}
                  >
                    TOPLAM
                  </td>
                  <td
                    colSpan={3}
                    style={{ ...tdLeft, borderTop: "2px solid #d6c3a2" }}
                  >
                    &nbsp;
                  </td>
                  <td
                    style={{
                      ...tdRight,
                      fontWeight: 800,
                      borderTop: "2px solid #d6c3a2",
                    }}
                  >
                    {formatTL(toplamTutar)}
                  </td>
                  <td style={{ ...tdLeft, borderTop: "2px solid #d6c3a2" }}>
                    &nbsp;
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
