import React, { useEffect, useState } from "react";

export default function Ayarlar() {
  const [user, setUser] = useState(null);
  const [panel, setPanel] = useState(null);

  // 📌 GÜNCELLENMİŞ: Bilardo Ücretleri (daha net isimler)
  const [ucret, setUcret] = useState({
    bilardo30dk: 80,        // 30 dakika ücreti
    bilardo1saat: 120,      // 1 saat ücreti
    bilardoDakikaUcreti: 2, // Süresiz için 30dk sonrası dakika başı
  });

  useEffect(() => {
    const u = localStorage.getItem("mc_user");
    if (u) setUser(JSON.parse(u));

    // GÜNCELLENMİŞ: LocalStorage'dan bilardo ücretlerini yükle
    const saved = JSON.parse(localStorage.getItem("bilardo_ucretleri"));
    if (saved) {
      // Eski yapıyı yeni yapıya dönüştür
      setUcret({
        bilardo30dk: saved.ilk40 || 80,
        bilardo1saat: saved.u60 || 120,
        bilardoDakikaUcreti: saved.dk2 || 2,
      });
    }
  }, []);

  function resetLocalStorage() {
    if (!window.confirm("Tüm localStorage verileri silinecek. Emin misiniz?"))
      return;

    localStorage.clear();
    alert("LocalStorage tamamen temizlendi. Sistem sıfırlandı.");
    window.location.reload();
  }

  // GÜNCELLENMİŞ: Bilardo ücretlerini kaydet
  function kaydetBilardoUcret() {
    // Yeni yapıyı kaydet
    localStorage.setItem("bilardo_ucretleri", JSON.stringify(ucret));
    
    // Eski yapıyla uyumluluk için de kaydet
    const eskiYapi = {
      u30: ucret.bilardo30dk,
      u60: ucret.bilardo1saat,
      ilk40: ucret.bilardo30dk,
      dk2: ucret.bilardoDakikaUcreti
    };
    localStorage.setItem("bilardo_ucretleri_eski", JSON.stringify(eskiYapi));
    
    alert("Bilardo ücretleri güncellendi!");
  }

  // 📌 YENİ: Popup Ayarları
  const [popupAyarlari, setPopupAyarlari] = useState({
    sureBildirimi: true,
    otomatikKapatma: 30, // saniye
    sesliUyari: false
  });

  function kaydetPopupAyarlari() {
    localStorage.setItem("bilardo_popup_ayarlari", JSON.stringify(popupAyarlari));
    alert("Popup ayarları kaydedildi!");
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

          {/* Bilardo Ücreti */}
          <button
            className="btn btn-warning fw-bold"
            onClick={() => setPanel("bilardo_ucret")}
          >
            🎱 Bilardo Ücreti
          </button>

          {/* YENİ: Popup Ayarları */}
          <button
            className="btn btn-info fw-bold"
            onClick={() => setPanel("popup_ayarlari")}
          >
            🔔 Bildirim Ayarları
          </button>

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
      {(user?.role === "SUPERADMIN" || user?.role === "ADMIN") && (
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
      )}

      {/* ---------------------------------------------------- */}
      {/* 3) BİLARDO ÜCRET PANELİ — GÜNCELLENDİ */}
      {/* ---------------------------------------------------- */}
      {panel === "bilardo_ucret" && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm">
          <h4 className="fw-bold text-darkcoffee mb-3">🎱 Bilardo Ücret Tarifesi</h4>
          
          <div className="alert alert-info mb-4">
            <strong>Ücret Kuralları:</strong>
            <ul className="mb-0 mt-2">
              <li><strong>30 Dakika:</strong> Seçilirse bu ücret direkt uygulanır. 30dk'dan önce kapanırsa da aynı ücret alınır.</li>
              <li><strong>1 Saat:</strong> Saatlik ücret uygulanır.</li>
              <li><strong>Süresiz:</strong> İlk 30dk için 30dk ücreti alınır. 30dk sonrası dakika başı ücret eklenir.</li>
            </ul>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label>30 Dakika Ücreti (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.bilardo30dk}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardo30dk: Number(e.target.value) })
                }
                min="0"
                step="5"
              />
              <small className="text-muted">30dk seçilince bu ücret direkt uygulanır</small>
            </div>

            <div className="col-md-6 mb-3">
              <label>1 Saat Ücreti (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.bilardo1saat}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardo1saat: Number(e.target.value) })
                }
                min="0"
                step="5"
              />
              <small className="text-muted">1 saat seçilince bu ücret uygulanır</small>
            </div>

            <div className="col-md-6 mb-3">
              <label>Süresiz - Dakika Başı Ücret (₺)</label>
              <input
                type="number"
                className="form-control"
                value={ucret.bilardoDakikaUcreti}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardoDakikaUcreti: Number(e.target.value) })
                }
                min="0"
                step="0.5"
              />
              <small className="text-muted">Süresiz seçilince 30dk sonrası dakika başı bu ücret eklenir</small>
            </div>

            <div className="col-md-6 mb-3">
              <div className="p-3 bg-light rounded">
                <h6 className="fw-bold">Örnek Hesaplamalar:</h6>
                <ul className="mb-0">
                  <li>30dk: <strong>{ucret.bilardo30dk}₺</strong></li>
                  <li>1sa: <strong>{ucret.bilardo1saat}₺</strong></li>
                  <li>45dk (süresiz): <strong>{ucret.bilardo30dk + (15 * ucret.bilardoDakikaUcreti)}₺</strong></li>
                  <li>90dk (süresiz): <strong>{ucret.bilardo30dk + (60 * ucret.bilardoDakikaUcreti)}₺</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={kaydetBilardoUcret}
            className="btn btn-mycafe fw-bold px-4 py-2 mt-2"
          >
            💾 Bilardo Ücretlerini Kaydet
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4) POPUP AYARLARI PANELİ — YENİ EKLENDİ */}
      {/* ---------------------------------------------------- */}
      {panel === "popup_ayarlari" && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm">
          <h4 className="fw-bold text-darkcoffee mb-3">🔔 Bildirim ve Popup Ayarları</h4>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={popupAyarlari.sureBildirimi}
                  onChange={(e) =>
                    setPopupAyarlari({...popupAyarlari, sureBildirimi: e.target.checked})
                  }
                  id="sureBildirimiSwitch"
                />
                <label className="form-check-label" htmlFor="sureBildirimiSwitch">
                  <strong>Süre Bitimi Bildirimi</strong>
                </label>
                <div className="form-text">
                  30dk/1saat süre dolunca tüm ekranlarda popup göster
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={popupAyarlari.sesliUyari}
                  onChange={(e) =>
                    setPopupAyarlari({...popupAyarlari, sesliUyari: e.target.checked})
                  }
                  id="sesliUyariSwitch"
                />
                <label className="form-check-label" htmlFor="sesliUyariSwitch">
                  <strong>Sesli Uyarı</strong>
                </label>
                <div className="form-text">
                  Popup ile birlikte ses çal (tarayıcı izni gerekir)
                </div>
              </div>
            </div>

            <div className="col-md-12 mb-3">
              <label>Popup Otomatik Kapanma Süresi (saniye)</label>
              <input
                type="range"
                className="form-range"
                min="10"
                max="60"
                step="5"
                value={popupAyarlari.otomatikKapatma}
                onChange={(e) =>
                  setPopupAyarlari({...popupAyarlari, otomatikKapatma: Number(e.target.value)})
                }
              />
              <div className="d-flex justify-content-between">
                <small>10 sn</small>
                <small><strong>{popupAyarlari.otomatikKapatma} sn</strong></small>
                <small>60 sn</small>
              </div>
              <div className="form-text">
                Popup bu süre sonunda otomatik kapanır
              </div>
            </div>
          </div>

          <div className="alert alert-warning">
            <strong>Not:</strong> Popup'lar tüm ekranlarda (Masalar, Adisyon, Ana Sayfa) görünecektir.
            Popup'a tıklanınca ilgili Bilardo masasına yönlendirilir.
          </div>

          <button
            onClick={kaydetPopupAyarlari}
            className="btn btn-info fw-bold px-4 py-2 mt-2"
          >
            🔔 Bildirim Ayarlarını Kaydet
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