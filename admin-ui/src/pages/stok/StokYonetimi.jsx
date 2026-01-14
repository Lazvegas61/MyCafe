// /home/qw/Desktop/MyCafe/admin-ui/src/pages/StokYonetimi.jsx
import React, { useEffect, useState } from "react";

const LS_KEYS = {
  KATEGORILER: "kategoriler",
  URUNLER: "urunler",
};

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const COLORS = {
  coffee: "#4b2e05",
  coffeeHover: "#3c2404",
  beige: "#f5e7d0",
  white: "#ffffff",
  red: "#b91c1c",
  green: "#15803d",
};

const styles = {
  page: { padding: 20, color: COLORS.coffee },
  h2: { fontSize: 26, fontWeight: 800, margin: "0 0 16px" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    padding: 16,
    marginBottom: 20,
  },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d5c6aa",
    backgroundColor: "#fffaf0",
    color: COLORS.coffee,
    width: 120,
  },
  btn: {
    backgroundColor: COLORS.coffee,
    color: COLORS.beige,
    padding: "8px 14px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnIn: {
    backgroundColor: COLORS.green,
    color: "#fff",
    padding: "8px 14px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnOut: {
    backgroundColor: COLORS.red,
    color: "#fff",
    padding: "8px 14px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnDanger: {
    backgroundColor: COLORS.red,
    color: "#fff",
    padding: "6px 12px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    borderBottom: "2px solid #e6dcc7",
    padding: "10px 6px",
    background: "#f8f1e1",
  },
  td: { borderBottom: "1px solid #eee3cb", padding: "8px 6px" },
};

export default function StokYonetimi() {
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [miktar, setMiktar] = useState({}); // { [urunId]: number }

  useEffect(() => {
    setKategoriler(loadLS(LS_KEYS.KATEGORILER, []));
    setUrunler(loadLS(LS_KEYS.URUNLER, []));
  }, []);

  useEffect(() => saveLS(LS_KEYS.URUNLER, urunler), [urunler]);

  const kategoriAdiById = (id) =>
    kategoriler.find((k) => k.id === id)?.ad || "-";

  const onMiktarChange = (id, v) =>
    setMiktar((m) => ({ ...m, [id]: v }));

  const stokGiris = (id) => {
    const val = parseInt(miktar[id]) || 0;
    if (val <= 0) return;
    const next = urunler.map((u) =>
      u.id === id ? { ...u, stok: (u.stok || 0) + val } : u
    );
    setUrunler(next);
    setMiktar((m) => ({ ...m, [id]: "" }));
  };

  const stokCikis = (id) => {
    const val = parseInt(miktar[id]) || 0;
    if (val <= 0) return;
    const next = urunler.map((u) =>
      u.id === id ? { ...u, stok: Math.max(0, (u.stok || 0) - val) } : u
    );
    setUrunler(next);
    setMiktar((m) => ({ ...m, [id]: "" }));
  };

  const urunSil = (id) => {
    if (!confirm("Bu ürünü silmek istiyor musunuz?")) return;
    setUrunler(urunler.filter((u) => u.id !== id));
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Stok Yönetimi</h2>

      <div style={styles.card}>
        {urunler.length === 0 ? (
          <p>Henüz ürün yok.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Ürün</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Stok</th>
                <th style={styles.th}>Miktar</th>
                <th style={styles.th}>İşlemler</th>
                <th style={styles.th}>Sil</th>
              </tr>
            </thead>
            <tbody>
              {urunler.map((u, i) => (
                <tr key={u.id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{u.ad}</td>
                  <td style={styles.td}>{kategoriAdiById(u.kategoriId)}</td>
                  <td style={styles.td}>{u.stok || 0}</td>
                  <td style={styles.td}>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Adet"
                      value={miktar[u.id] ?? ""}
                      onChange={(e) => onMiktarChange(u.id, e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnIn} onClick={() => stokGiris(u.id)}>
                      Giriş
                    </button>{" "}
                    <button style={styles.btnOut} onClick={() => stokCikis(u.id)}>
                      Çıkış
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnDanger} onClick={() => urunSil(u.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
