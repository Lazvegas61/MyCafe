import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GarsonMasalar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [adisyonlar, setAdisyonlar] = useState([]);

  /* -----------------------------
     YETKİ KONTROLÜ
  ----------------------------- */
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("mc_user"));
    if (!u || u.role !== "GARSON") {
      navigate("/login");
      return;
    }
    setUser(u);
  }, [navigate]);

  /* -----------------------------
     VERİLERİ YÜKLE
  ----------------------------- */
  useEffect(() => {
    const t = JSON.parse(localStorage.getItem("mc_tables")) || [];
    const a = JSON.parse(localStorage.getItem("mc_adisyonlar")) || [];
    setTables(t);
    setAdisyonlar(a);
  }, []);

  /* -----------------------------
     MASA TIKLAMA
  ----------------------------- */
  const handleTableClick = (table) => {
    if (table.adisyonId) {
      // masa dolu → adisyona git
      navigate(`/adisyon/${table.adisyonId}`);
    } else {
      // masa boş → yeni adisyon aç
      const newAdisyon = {
        id: Date.now(),
        masaId: table.id,
        masaAdi: table.name,
        acilisZamani: new Date().toISOString(),
        durum: "ACIK",
        kalemler: [],
        toplam: 0,
      };

      const updatedAdisyonlar = [...adisyonlar, newAdisyon];
      localStorage.setItem(
        "mc_adisyonlar",
        JSON.stringify(updatedAdisyonlar)
      );

      const updatedTables = tables.map((m) =>
        m.id === table.id
          ? { ...m, adisyonId: newAdisyon.id }
          : m
      );

      localStorage.setItem(
        "mc_tables",
        JSON.stringify(updatedTables)
      );

      navigate(`/adisyon/${newAdisyon.id}`);
    }
  };

  if (!user) return null;

  /* -----------------------------
     UI
  ----------------------------- */
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>Masalar</h1>
        <div style={styles.user}>
          Garson: <strong>{user.name}</strong>
        </div>
      </div>

      <div style={styles.grid}>
        {tables.map((table) => {
          const dolu = !!table.adisyonId;

          return (
            <div
              key={table.id}
              style={{
                ...styles.tableCard,
                backgroundColor: dolu ? "#b33a3a" : "#3a7d3a",
              }}
              onClick={() => handleTableClick(table)}
            >
              <div style={styles.tableName}>{table.name}</div>
              <div style={styles.tableStatus}>
                {dolu ? "DOLU" : "BOŞ"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------
   STYLES (TAILWIND YOK)
----------------------------- */
const styles = {
  page: {
    padding: 24,
    background: "#f5efe6",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  user: {
    fontSize: 14,
    color: "#5a3e2b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 16,
  },
  tableCard: {
    height: 110,
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
  tableName: {
    fontSize: 20,
    marginBottom: 6,
  },
  tableStatus: {
    fontSize: 14,
    opacity: 0.9,
  },
};
