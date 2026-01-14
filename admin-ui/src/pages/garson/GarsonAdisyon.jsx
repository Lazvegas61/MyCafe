import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function GarsonAdisyon() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [adisyon, setAdisyon] = useState(null);

  useEffect(() => {
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar")) || [];
    const found = adisyonlar.find(a => String(a.id) === String(id));

    if (!found) {
      navigate("/garson");
      return;
    }

    setAdisyon(found);
  }, [id, navigate]);

  if (!adisyon) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5efe6",
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate("/garson")}
          style={{
            padding: "8px 16px",
            background: "#4b2e05",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ← Masalara Dön
        </button>
      </div>

      <h2 style={{ marginBottom: 10 }}>
        Masa: {adisyon.masaAdi || adisyon.masaNo}
      </h2>

      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 16,
        }}
      >
        {(!adisyon.kalemler || adisyon.kalemler.length === 0) && (
          <div>Henüz ürün eklenmedi</div>
        )}

        {adisyon.kalemler?.map((k, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div>{k.urunAdi}</div>
            <div>{k.adet} × {k.fiyat}</div>
          </div>
        ))}

        <div
          style={{
            marginTop: 12,
            fontWeight: "bold",
            textAlign: "right",
          }}
        >
          Toplam: {adisyon.toplam || adisyon.toplamTutar || 0} ₺
        </div>
      </div>
    </div>
  );
}
