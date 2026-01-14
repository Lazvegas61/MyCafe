import React, { useEffect, useState } from "react";
import { checkForUpdates, applyUpdates } from "@/services/updateManager";
import "./Ayarlar.css";

export default function Ayarlar() {
  const [user, setUser] = useState(null);
  const [panel, setPanel] = useState(null);

  // GÜNCELLEME BUTON AYARLARI
  const [updating, setUpdating] = useState(false);

  const handleCheckUpdates = async () => {
    setUpdating(true);
    const result = await checkForUpdates();
    setUpdating(false);

    if (result.status === "NO_UPDATE") {
      alert("Uygulama güncel.");
    }

    if (result.status === "UPDATE_AVAILABLE") {
      const confirmUpdate = window.confirm(
        `${result.latest.title}\n\n${result.latest.description}\n\nGüncelleme uygulansın mı?`
      );

      if (confirmUpdate) {
        setUpdating(true);
        await applyUpdates(result.latest.updates);
        setUpdating(false);
        alert("Güncelleme tamamlandı. Sayfayı yenileyin.");
      }
    }

    if (result.status === "ERROR") {
      alert("Güncelleme kontrolü başarısız: " + result.message);
    }
  };

  // 📌 GÜNCELLENMİŞ: Bilardo Ücretleri
  const [ucret, setUcret] = useState({
    bilardo30dk: 80,
    bilardo1saat: 120,
    bilardoDakikaUcreti: 2,
  });

  useEffect(() => {
    const u = localStorage.getItem("mc_user");
    if (u) setUser(JSON.parse(u));

    const saved = JSON.parse(localStorage.getItem("bilardo_ucretleri"));
    if (saved) {
      setUcret({
        bilardo30dk: saved.ilk40 || 80,
        bilardo1saat: saved.u60 || 120,
        bilardoDakikaUcreti: saved.dk2 || 2,
      });
    }

    const popupSaved = JSON.parse(localStorage.getItem("bilardo_popup_ayarlari"));
    if (popupSaved) {
      setPopupAyarlari(popupSaved);
    }
  }, []);

  function resetLocalStorage() {
    if (!window.confirm("Tüm localStorage verileri silinecek. Emin misiniz?"))
      return;

    localStorage.clear();
    alert("LocalStorage tamamen temizlendi. Sistem sıfırlandı.");
    window.location.reload();
  }

  // 📌 VERİ YEDEĞİ AL
  const handleBackup = () => {
    const backupData = {
      date: new Date().toISOString(),
      user: localStorage.getItem("mc_user") ? JSON.parse(localStorage.getItem("mc_user")) : null,
      bilardoUcretleri: localStorage.getItem("bilardo_ucretleri") ? JSON.parse(localStorage.getItem("bilardo_ucretleri")) : null,
      popupAyarlari: localStorage.getItem("bilardo_popup_ayarlari") ? JSON.parse(localStorage.getItem("bilardo_popup_ayarlari")) : null,
      masalar: localStorage.getItem("bilardo_masalar") ? JSON.parse(localStorage.getItem("bilardo_masalar")) : null,
      siparisler: localStorage.getItem("siparisler") ? JSON.parse(localStorage.getItem("siparisler")) : null,
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mycafe_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Veri yedeği başarıyla indirildi!");
  };

  // GÜNCELLENMİŞ: Bilardo ücretlerini kaydet
  function kaydetBilardoUcret() {
    localStorage.setItem("bilardo_ucretleri", JSON.stringify(ucret));
    
    const eskiYapi = {
      u30: ucret.bilardo30dk,
      u60: ucret.bilardo1saat,
      ilk40: ucret.bilardo30dk,
      dk2: ucret.bilardoDakikaUcreti
    };
    localStorage.setItem("bilardo_ucretleri_eski", JSON.stringify(eskiYapi));
    
    alert("Bilardo ücretleri güncellendi!");
  }

  // 📌 POPUP AYARLARI
  const [popupAyarlari, setPopupAyarlari] = useState({
    sureBildirimi: true,
    otomatikKapatma: 30,
    sesliUyari: false
  });

  function kaydetPopupAyarlari() {
    localStorage.setItem("bilardo_popup_ayarlari", JSON.stringify(popupAyarlari));
    alert("Popup ayarları kaydedildi!");
  }

  // 📌 TAB YÖNETİMİ
  const tabs = [
    { id: "genel", label: "🌐 Genel Ayarlar", icon: "⚙️" },
    { id: "bilardo_ucret", label: "🎱 Bilardo Ücret", icon: "💰" },
    { id: "popup_ayarlari", label: "🔔 Bildirimler", icon: "🔔" },
    { id: "guncelle", label: "🔄 Güncelleme", icon: "🔄" },
    { id: "yedek", label: "💾 Yedek & Kurtarma", icon: "💾" },
  ];

  return (
    <div className="ayarlar-sayfa">
      <h1 className="sayfa-baslik">⚙️ Sistem Ayarları</h1>

      {/* TAB MENÜ */}
      <div className="tab-menu">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={panel === tab.id ? "active" : ""}
            onClick={() => setPanel(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* GENEL AYARLAR PANELİ */}
      {panel === "genel" && (
        <div className="ayar-kutu">
          <h2>🌐 Genel Sistem Ayarları</h2>
          
          <div className="uyari-kutu">
            <div className="uyari-icon">ℹ️</div>
            <div className="uyari-icerik">
              <h3>Sistem Bilgisi</h3>
              <p>MyCafe Bilardo & Kafe Yönetim Sistemi v2.0</p>
            </div>
          </div>

          <div className="input-grup">
            <label>Kafe Adı</label>
            <input 
              type="text" 
              placeholder="Kafe adınızı girin"
              defaultValue="MyCafe Bilardo & Kafe"
            />
          </div>

          <div className="input-grup">
            <label>Çalışma Saatleri</label>
            <input 
              type="text" 
              placeholder="09:00 - 02:00"
              defaultValue="09:00 - 02:00"
            />
          </div>

          <button className="kaydet-button">
            💾 Genel Ayarları Kaydet
          </button>
        </div>
      )}

      {/* BİLARDO ÜCRET PANELİ */}
      {panel === "bilardo_ucret" && (
        <div className="ayar-kutu">
          <h2>🎱 Bilardo Ücret Tarifesi</h2>
          
          <div className="uyari-kutu">
            <div className="uyari-icon">💡</div>
            <div className="uyari-icerik">
              <h3>Ücret Kuralları</h3>
              <p><strong>30 Dakika:</strong> Seçilirse bu ücret direkt uygulanır</p>
              <p><strong>1 Saat:</strong> Saatlik ücret uygulanır</p>
              <p><strong>Süresiz:</strong> İlk 30dk ücreti + sonrası dakika başı</p>
            </div>
          </div>

          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', margin: '-10px' }}>
            <div className="input-grup" style={{ flex: '1 0 300px', padding: '10px' }}>
              <label>30 Dakika Ücreti (₺)</label>
              <input
                type="number"
                value={ucret.bilardo30dk}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardo30dk: Number(e.target.value) })
                }
                min="0"
                step="5"
              />
              <small className="text-muted">30dk seçilince bu ücret direkt uygulanır</small>
            </div>

            <div className="input-grup" style={{ flex: '1 0 300px', padding: '10px' }}>
              <label>1 Saat Ücreti (₺)</label>
              <input
                type="number"
                value={ucret.bilardo1saat}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardo1saat: Number(e.target.value) })
                }
                min="0"
                step="5"
              />
              <small className="text-muted">1 saat seçilince bu ücret uygulanır</small>
            </div>

            <div className="input-grup" style={{ flex: '1 0 300px', padding: '10px' }}>
              <label>Süresiz - Dakika Başı Ücret (₺)</label>
              <input
                type="number"
                value={ucret.bilardoDakikaUcreti}
                onChange={(e) =>
                  setUcret({ ...ucret, bilardoDakikaUcreti: Number(e.target.value) })
                }
                min="0"
                step="0.5"
              />
              <small className="text-muted">Süresiz seçilince 30dk sonrası dakika başı bu ücret eklenir</small>
            </div>
          </div>

          <div className="onizleme-kutu">
            <h3>🎯 Örnek Hesaplamalar</h3>
            <ul>
              <li><span>30 dakika:</span> <strong>{ucret.bilardo30dk}₺</strong></li>
              <li><span>1 saat:</span> <strong>{ucret.bilardo1saat}₺</strong></li>
              <li><span>45dk (süresiz):</span> <strong>{ucret.bilardo30dk + (15 * ucret.bilardoDakikaUcreti)}₺</strong></li>
              <li><span>90dk (süresiz):</span> <strong>{ucret.bilardo30dk + (60 * ucret.bilardoDakikaUcreti)}₺</strong></li>
            </ul>
          </div>

          <button onClick={kaydetBilardoUcret} className="kaydet-button">
            💾 Bilardo Ücretlerini Kaydet
          </button>
        </div>
      )}

      {/* POPUP AYARLARI PANELİ */}
      {panel === "popup_ayarlari" && (
        <div className="ayar-kutu">
          <h2>🔔 Bildirim ve Popup Ayarları</h2>

          <div className="input-grup">
            <div className="form-check form-switch" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={popupAyarlari.sureBildirimi}
                onChange={(e) =>
                  setPopupAyarlari({...popupAyarlari, sureBildirimi: e.target.checked})
                }
                id="sureBildirimiSwitch"
                style={{ width: '50px', height: '25px' }}
              />
              <label className="form-check-label" htmlFor="sureBildirimiSwitch">
                <strong>Süre Bitimi Bildirimi</strong>
                <div className="form-text">30dk/1saat süre dolunca tüm ekranlarda popup göster</div>
              </label>
            </div>
          </div>

          <div className="input-grup">
            <div className="form-check form-switch" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={popupAyarlari.sesliUyari}
                onChange={(e) =>
                  setPopupAyarlari({...popupAyarlari, sesliUyari: e.target.checked})
                }
                id="sesliUyariSwitch"
                style={{ width: '50px', height: '25px' }}
              />
              <label className="form-check-label" htmlFor="sesliUyariSwitch">
                <strong>Sesli Uyarı</strong>
                <div className="form-text">Popup ile birlikte ses çal (tarayıcı izni gerekir)</div>
              </label>
            </div>
          </div>

          <div className="input-grup">
            <label>Popup Otomatik Kapanma Süresi: <strong>{popupAyarlari.otomatikKapatma} saniye</strong></label>
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
              style={{ width: '100%' }}
            />
            <div className="d-flex justify-content-between">
              <small>10 sn</small>
              <small>60 sn</small>
            </div>
          </div>

          <div className="uyari-kutu">
            <div className="uyari-icon">📢</div>
            <div className="uyari-icerik">
              <h3>Bildirim Bilgisi</h3>
              <p>Popup'lar tüm ekranlarda (Masalar, Adisyon, Ana Sayfa) görünecektir. Popup'a tıklanınca ilgili Bilardo masasına yönlendirilir.</p>
            </div>
          </div>

          <button onClick={kaydetPopupAyarlari} className="kaydet-button">
            🔔 Bildirim Ayarlarını Kaydet
          </button>
        </div>
      )}

      {/* GÜNCELLEME PANELİ */}
{panel === "guncelle" && (
  <div className="ayar-kutu">
    <h2>🔄 Sistem Güncellemeleri</h2>
    
    <div className="input-grup">
      <button
        className="kaydet-button"
        onClick={handleCheckUpdates}
        disabled={updating}
        style={{ background: updating ? '#95a5a6' : '#3498db' }}
      >
        {updating ? "🔄 Kontrol Ediliyor..." : "🔄 Güncellemeleri Kontrol Et"}
      </button>
    </div>
    
    <div className="uyari-kutu">
      <div className="uyari-icon">💡</div>
      <div className="uyari-icerik">
        <h3>Güncelleme Bilgisi</h3>
        <p>Güncelleme kontrolü yapmak için butona tıklayın. Yeni güncelleme varsa size bildirilecektir.</p>
      </div>
    </div>
  </div>
)}
      {/* YEDEK & KURTARMA PANELİ */}
      {panel === "yedek" && (
        <div className="ayar-kutu">
          <h2>💾 Veri Yönetimi</h2>
          
          <div className="uyari-kutu">
            <div className="uyari-icon">⚠️</div>
            <div className="uyari-icerik">
              <h3>Önemli Uyarı</h3>
              <p>Veri yedekleri sadece bu tarayıcıda geçerlidir. Düzenli yedek almayı unutmayın!</p>
            </div>
          </div>

          <div className="temizleme-bilgi">
            <h3>📦 Yedeklenecek Veriler:</h3>
            <ul>
              <li>• Kullanıcı Bilgileri</li>
              <li>• Bilardo Masaları</li>
              <li>• Ücret Tarifesi</li>
              <li>• Popup Ayarları</li>
              <li>• Sipariş Geçmişi</li>
            </ul>
          </div>

          <div className="input-grup">
            <button onClick={handleBackup} className="kaydet-button">
              💾 Veri Yedeği Al (JSON İndir)
            </button>
          </div>

          <div className="input-grup">
            <label>Veri Geri Yükle</label>
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target.result);
                      alert("Geri yükleme özelliği yakında eklenecek!");
                      console.log("Yedek verisi:", data);
                    } catch (error) {
                      alert("Geçersiz yedek dosyası!");
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <small className="text-muted">JSON formatında yedek dosyası seçin</small>
          </div>

          {(user?.role === "SUPERADMIN" || user?.role === "ADMIN") && (
            <div className="temizleme-bilgi" style={{ borderLeft: '4px solid #e74c3c' }}>
              <h3 style={{ color: '#e74c3c' }}>⚠️ Tehlikeli İşlemler</h3>
              <p>Bu işlem tüm verileri kalıcı olarak silecektir. Sadece gerektiğinde kullanın.</p>
              
              <button onClick={resetLocalStorage} className="temizle-button">
                🗑️ Tüm Verileri Temizle & Sistemi Sıfırla
              </button>
            </div>
          )}
        </div>
      )}

      {/* PANEL SEÇİLMEDİYSE */}
      {!panel && (
        <div className="ayar-kutu">
          <h2>👋 Hoş Geldiniz!</h2>
          <p>Sol taraftaki menüden ayar kategorisi seçerek sistemi yapılandırabilirsiniz.</p>
          
          <div className="onizleme-kutu">
            <h3>⚡ Hızlı İşlemler</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setPanel("bilardo_ucret")} className="kaydet-button" style={{ flex: '1', minWidth: '200px' }}>
                🎱 Bilardo Ücreti Ayarla
              </button>
              <button onClick={handleBackup} className="kaydet-button" style={{ flex: '1', minWidth: '200px', background: '#27ae60' }}>
                💾 Hızlı Yedek Al
              </button>
              <button onClick={() => setPanel("guncelle")} className="kaydet-button" style={{ flex: '1', minWidth: '200px', background: '#3498db' }}>
                🔄 Güncelleme Kontrolü
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}