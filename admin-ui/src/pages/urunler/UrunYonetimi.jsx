// /home/qw/Desktop/MyCafe/admin-ui/src/pages/UrunYonetimi.jsx
import React, { useEffect, useState } from "react";

/** ====== Ortak Yardımcılar ====== */
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
};

const styles = {
  page: { padding: 20, color: COLORS.coffee, background: "transparent" },
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
  },
  btn: {
    backgroundColor: COLORS.coffee,
    color: COLORS.beige,
    padding: "8px 16px",
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
  btnGhost: {
    backgroundColor: "transparent",
    color: COLORS.coffee,
    padding: "6px 12px",
    border: `1px solid ${COLORS.coffee}`,
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

export default function UrunYonetimi() {
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);

  // Kategori formu
  const [kategoriAdi, setKategoriAdi] = useState("");
  const [kategoriTuru, setKategoriTuru] = useState("NORMAL");

  // Ürün formu
  const [urunAdi, setUrunAdi] = useState("");
  const [seciliKategori, setSeciliKategori] = useState("");
  const [maliyet, setMaliyet] = useState("");
  const [satisFiyati, setSatisFiyati] = useState("");
  const [stok, setStok] = useState("");

  // Ürün düzenleme state (satır içi)
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({
    ad: "",
    kategoriId: "",
    maliyet: "",
    satis: "",
    stok: "",
  });

  /** İlk yükleme */
  useEffect(() => {
    setKategoriler(loadLS(LS_KEYS.KATEGORILER, []));
    setUrunler(loadLS(LS_KEYS.URUNLER, []));
  }, []);

  /** Değişince kaydet */
  useEffect(() => saveLS(LS_KEYS.KATEGORILER, kategoriler), [kategoriler]);
  useEffect(() => saveLS(LS_KEYS.URUNLER, urunler), [urunler]);

  /** ---- KATEGORİ İŞLEMLERİ ---- */
  const kategoriEkle = () => {
    if (!kategoriAdi.trim()) {
      alert("Kategori adı giriniz.");
      return;
    }
    const yeni = {
      id: Date.now(),
      ad: kategoriAdi.trim(),
      tur: kategoriTuru,
    };
    const next = [...kategoriler, yeni];
    setKategoriler(next);
    setKategoriAdi("");
    setKategoriTuru("NORMAL");
  };

  const kategoriSil = (id) => {
    if (!confirm("Bu kategoriyi silmek istiyor musunuz? İlgili ürünler kategori bilgisini kaybeder.")) return;
    // Ürünler silinmez, ancak kategoriId'si uyuşanlara kategoriId = null çekebiliriz.
    const guncelUrunler = urunler.map((u) =>
      u.kategoriId === id ? { ...u, kategoriId: null } : u
    );
    setUrunler(guncelUrunler);
    setKategoriler(kategoriler.filter((k) => k.id !== id));
  };

  /** ---- ÜRÜN İŞLEMLERİ ---- */
  const urunEkle = () => {
    if (!urunAdi.trim() || !seciliKategori) {
      alert("Ürün adı ve kategori seçimi zorunludur.");
      return;
    }
    const yeni = {
      id: Date.now(),
      ad: urunAdi.trim(),
      kategoriId: parseInt(seciliKategori),
      maliyet: parseFloat(maliyet) || 0,
      satis: parseFloat(satisFiyati) || 0,
      stok: parseInt(stok) || 0,
    };
    setUrunler([...urunler, yeni]);
    setUrunAdi("");
    setSeciliKategori("");
    setMaliyet("");
    setSatisFiyati("");
    setStok("");
  };

  const urunSil = (id) => {
    if (!confirm("Ürünü silmek istiyor musunuz? Bu işlem geri alınamaz.")) return;
    setUrunler(urunler.filter((u) => u.id !== id));
  };

  /** ---- ÜRÜN DÜZENLEME (satır içi) ---- */
  const startEdit = (u) => {
    setEditId(u.id);
    setEditRow({
      ad: u.ad,
      kategoriId: u.kategoriId ?? "",
      maliyet: u.maliyet,
      satis: u.satis,
      stok: u.stok,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditRow({ ad: "", kategoriId: "", maliyet: "", satis: "", stok: "" });
  };

  const saveEdit = () => {
    const updated = urunler.map((u) =>
      u.id === editId
        ? {
            ...u,
            ad: editRow.ad.trim(),
            kategoriId: editRow.kategoriId ? parseInt(editRow.kategoriId) : null,
            maliyet: parseFloat(editRow.maliyet) || 0,
            satis: parseFloat(editRow.satis) || 0,
            stok: parseInt(editRow.stok) || 0,
          }
        : u
    );
    setUrunler(updated);
    cancelEdit(); // isim + stok tek kaynaktan güncellendi → Stok sayfası da senkron
  };

  const kategoriAdiById = (id) =>
    kategoriler.find((k) => k.id === id)?.ad || "-";

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Ürün Yönetimi (Tümleşik)</h2>

      {/* KATEGORİ EKLE */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 10px" }}>Kategori Ekle</h3>
        <div style={styles.row}>
          <input
            style={styles.input}
            type="text"
            placeholder="Kategori adı"
            value={kategoriAdi}
            onChange={(e) => setKategoriAdi(e.target.value)}
          />
          <select
            style={styles.input}
            value={kategoriTuru}
            onChange={(e) => setKategoriTuru(e.target.value)}
          >
            <option value="NORMAL">NORMAL</option>
            <option value="SİPARİŞ_YEMEK">SİPARİŞ_YEMEK</option>
          </select>
          <button style={styles.btn} onClick={kategoriEkle}>
            Ekle
          </button>
        </div>

        {kategoriler.length > 0 && (
          <table style={{ ...styles.table, marginTop: 14 }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Kategori Adı</th>
                <th style={styles.th}>Tür</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {kategoriler.map((k, i) => (
                <tr key={k.id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{k.ad}</td>
                  <td style={styles.td}>{k.tur}</td>
                  <td style={styles.td}>
                    <button style={styles.btnDanger} onClick={() => kategoriSil(k.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ÜRÜN EKLE */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 10px" }}>Ürün Ekle</h3>
        <div style={styles.row}>
          <input
            style={styles.input}
            type="text"
            placeholder="Ürün adı"
            value={urunAdi}
            onChange={(e) => setUrunAdi(e.target.value)}
          />
          <select
            style={styles.input}
            value={seciliKategori}
            onChange={(e) => setSeciliKategori(e.target.value)}
          >
            <option value="">Kategori Seç</option>
            {kategoriler.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ad}
              </option>
            ))}
          </select>
          <input
            style={styles.input}
            type="number"
            placeholder="Maliyet (₺)"
            value={maliyet}
            onChange={(e) => setMaliyet(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Satış Fiyatı (₺)"
            value={satisFiyati}
            onChange={(e) => setSatisFiyati(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Stok Miktarı"
            value={stok}
            onChange={(e) => setStok(e.target.value)}
          />
          <button style={styles.btn} onClick={urunEkle}>
            Kaydet
          </button>
        </div>
      </div>

      {/* ÜRÜN LİSTESİ */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 10px" }}>Ürün Listesi</h3>
        {urunler.length === 0 ? (
          <p>Henüz ürün yok.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Ürün</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Maliyet</th>
                <th style={styles.th}>Satış</th>
                <th style={styles.th}>Stok</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {urunler.map((u, i) => {
                const editing = editId === u.id;
                return (
                  <tr key={u.id}>
                    <td style={styles.td}>{i + 1}</td>

                    {/* Ürün adı */}
                    <td style={styles.td}>
                      {editing ? (
                        <input
                          style={styles.input}
                          value={editRow.ad}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, ad: e.target.value }))
                          }
                        />
                      ) : (
                        u.ad
                      )}
                    </td>

                    {/* Kategori */}
                    <td style={styles.td}>
                      {editing ? (
                        <select
                          style={styles.input}
                          value={editRow.kategoriId ?? ""}
                          onChange={(e) =>
                            setEditRow((r) => ({
                              ...r,
                              kategoriId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Seçilmedi</option>
                          {kategoriler.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.ad}
                            </option>
                          ))}
                        </select>
                      ) : (
                        kategoriAdiById(u.kategoriId)
                      )}
                    </td>

                    {/* Maliyet */}
                    <td style={styles.td}>
                      {editing ? (
                        <input
                          style={styles.input}
                          type="number"
                          value={editRow.maliyet}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, maliyet: e.target.value }))
                          }
                        />
                      ) : (
                        `${u.maliyet.toFixed(2)} ₺`
                      )}
                    </td>

                    {/* Satış */}
                    <td style={styles.td}>
                      {editing ? (
                        <input
                          style={styles.input}
                          type="number"
                          value={editRow.satis}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, satis: e.target.value }))
                          }
                        />
                      ) : (
                        `${u.satis.toFixed(2)} ₺`
                      )}
                    </td>

                    {/* Stok */}
                    <td style={styles.td}>
                      {editing ? (
                        <input
                          style={styles.input}
                          type="number"
                          value={editRow.stok}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, stok: e.target.value }))
                          }
                        />
                      ) : (
                        u.stok
                      )}
                    </td>

                    {/* İşlemler */}
                    <td style={styles.td}>
                      {editing ? (
                        <>
                          <button style={styles.btn} onClick={saveEdit}>
                            Kaydet
                          </button>{" "}
                          <button style={styles.btnGhost} onClick={cancelEdit}>
                            Vazgeç
                          </button>
                        </>
                      ) : (
                        <>
                          <button style={styles.btnGhost} onClick={() => startEdit(u)}>
                            Düzenle
                          </button>{" "}
                          <button style={styles.btnDanger} onClick={() => urunSil(u.id)}>
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
