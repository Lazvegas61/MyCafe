import React, { useEffect, useState } from "react";

export default function Ayarlar() {
  const [user, setUser] = useState(null);

  // 📌 Yeni eklenen panel kontrol değişkeni
  const [panel, setPanel] = useState(null);

  // 📌 Bilardo Ücretleri
  const [ucret, setUcret] = useState({
    u30: 80,
    u60: 120,
    ilk40: 80,
    dk2: 2,
  });

  useEffect(() => {
    const u = localStorage.getItem("mc_user");
    if (u) setUser(JSON.parse(u));

    const saved = JSON.parse(localStorage.getItem("bilardo_ucretleri"));
    if (saved) setUcret(saved);
  }, []);

  function resetLocalStorage() {
    if (!window.confirm("Tüm localStorage verileri silinecek. Emin misiniz?"))
      return;

    localStorage.clear();
    alert("LocalStorage tamamen temizlendi. Sistem sıfırlandı.");
    window.location.reload();
  }

  function kaydetUcret() {
    localStorage.setItem("bilardo_ucretleri", JSON.stringify(ucret));
    alert("Bilardo ücretleri güncellendi!");
  }

  return (
    <div>
      <h1 className="fw-bold fs-3 mb-4 text-darkcoffee">Ayarlar</h1>

      {/* ---------------------------------------------------- */}
      {/* 1) VAR OLAN KART — KORUNDU */}
      {/* ---------------------------------------------------- */}
      <div className="card p-3 bg-white">
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn btn-mycafe">Veri Yedeği Al (Demo)</button>
          <button className="btn btn-secondary">Sistem Sıfırla (Demo)</button>
          <button className="btn btn-outline-dark">Şifre Değiştir (Demo)</button>

          {/* YENİ → Bilardo Ücreti */}
          <button
            className="btn btn-warning fw-bold"
            onClick={() => setPanel("ucret")}
          >
            🎱 Bilardo Ücreti
          </button>

          {/* YENİ → Güncelleme Kontrol */}
          <button
            className="btn btn-info fw-bold"
            onClick={() => setPanel("guncelle")}
          >
            🔄 Güncellemeleri Kontrol Et
          </button>
        </div>

        <p className="mt-3 mb-0 text-muted">
          Not: Bu butonlar demo amaçlıdır; "DEMO BİTTİ" sonrasında gerçek API'ye
          bağlanacaktır.
        </p>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2) RESET PANEL — KORUNDU */}
      {/* ---------------------------------------------------- */}
      {user?.role === "SUPERADMIN" || (user?.role === "ADMIN" && (
        <div
          className="mt-4 p-3 border rounded bg-white"
          style={{ borderColor: "#d9534f" }}
        >
          <h5 className="fw-bold text-danger mb-2">
            Sistem Reset Paneli (Super Admin)
          </h5>
          <p className="text-muted mb-3">
            Bu işlem tüm localStorage verilerini temizler ve sistemi fabrika
            ayarlarına döndürür.
          </p>
          <button
            onClick={resetLocalStorage}
            className="btn btn-danger fw-bold px-4 py-2"
          >
            LocalStorage Temizle & Sistemi Resetle
          </button>
        </div>
      ))}

      {/* ---------------------------------------------------- */}
      {/* 3) YENİ PANEL ALANI — BUTONA GÖRE GÖRÜNECEK */}
      {/* ---------------------------------------------------- */}

      {panel === "ucret" && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm">
          <h4 className="fw-bold text-darkcoffee mb-3">🎱 Bilardo Ücret Tarifesi</h4>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label>30 Dakika (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.u30}
                onChange={(e) =>
                  setUcret({ ...ucret, u30: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label>1 Saat (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.u60}
                onChange={(e) =>
                  setUcret({ ...ucret, u60: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label>İlk 40 Dakika (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.ilk40}
                onChange={(e) =>
                  setUcret({ ...ucret, ilk40: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label>40 Dakika Sonrası Dakika Başı (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.dk2}
                onChange={(e) =>
                  setUcret({ ...ucret, dk2: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <button
            onClick={kaydetUcret}
            className="btn btn-mycafe fw-bold px-4 py-2 mt-2"
          >
            Kaydet
          </button>
        </div>
      )}

      {panel === "guncelle" && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm">
          <h4 className="fw-bold text-darkcoffee mb-3">
            🔄 Güncellemeleri Kontrol Et
          </h4>

          <p className="text-muted">
            Sistem güncelleme kontrolü kısa sürede aktif olacaktır.
          </p>

          <button
            className="btn btn-info text-dark fw-bold px-4 py-2"
            onClick={() =>
              alert("Güncelleme kontrol sistemi yakında aktif edilecek.")
            }
          >
            Güncellemeleri Kontrol Et
          </button>
        </div>
      )}
    </div>
  );
}
