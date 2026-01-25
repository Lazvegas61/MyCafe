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

  // 📌 TAM YEDEKLEME FONKSİYONU (Ürünler Dahil)
  const handleBackup = () => {
    // Önce tüm verileri topla
    const backupData = {
      date: new Date().toISOString(),
      version: "2.0",
      system: "MyCafe Bilardo & Kafe Yönetim Sistemi",
      
      // Kullanıcı ve Sistem
      user: localStorage.getItem("mc_user") ? JSON.parse(localStorage.getItem("mc_user")) : null,
      sistemAyarlari: localStorage.getItem("sistem_ayarlari") ? JSON.parse(localStorage.getItem("sistem_ayarlari")) : null,
      
      // Bilardo
      bilardoUcretleri: localStorage.getItem("bilardo_ucretleri") ? JSON.parse(localStorage.getItem("bilardo_ucretleri")) : null,
      bilardoMasalari: localStorage.getItem("bilardo_masalar") ? JSON.parse(localStorage.getItem("bilardo_masalar")) : null,
      bilardoPopupAyarlari: localStorage.getItem("bilardo_popup_ayarlari") ? JSON.parse(localStorage.getItem("bilardo_popup_ayarlari")) : null,
      
      // Müşteri İşlemleri (HESABA YAZ kayıtları)
      musteriler: localStorage.getItem("mc_musteriler") ? JSON.parse(localStorage.getItem("mc_musteriler")) : null,
      adisyonlar: localStorage.getItem("mc_adisyonlar") ? JSON.parse(localStorage.getItem("mc_adisyonlar")) : null,
      borclar: localStorage.getItem("mc_borclar") ? JSON.parse(localStorage.getItem("mc_borclar")) : null,
      tahsilatlar: localStorage.getItem("mc_tahbilat") ? JSON.parse(localStorage.getItem("mc_tahbilat")) : null,
      
      // Finans
      finansHavuzu: localStorage.getItem("mc_finans_havuzu") ? JSON.parse(localStorage.getItem("mc_finans_havuzu")) : null,
      giderler: localStorage.getItem("mc_giderler") ? JSON.parse(localStorage.getItem("mc_giderler")) : null,
      
      // Ürünler ve Menü
      urunler: localStorage.getItem("mc_urunler") ? JSON.parse(localStorage.getItem("mc_urunler")) : null,
      urunKategorileri: localStorage.getItem("mc_urun_kategorileri") ? JSON.parse(localStorage.getItem("mc_urun_kategorileri")) : null,
      urunFiyatListesi: localStorage.getItem("urun_fiyat_listesi") ? JSON.parse(localStorage.getItem("urun_fiyat_listesi")) : null,
      menuKategorileri: localStorage.getItem("mc_menu_kategorileri") ? JSON.parse(localStorage.getItem("mc_menu_kategorileri")) : null,
      
      // Siparişler
      siparisler: localStorage.getItem("siparisler") ? JSON.parse(localStorage.getItem("siparisler")) : null,
      aktifSiparisler: localStorage.getItem("mc_aktif_siparisler") ? JSON.parse(localStorage.getItem("mc_aktif_siparisler")) : null,
      
      // Raporlar
      raporlar: localStorage.getItem("mc_raporlar") ? JSON.parse(localStorage.getItem("mc_raporlar")) : null,
      gunlukRaporlar: localStorage.getItem("mc_gunluk_raporlar") ? JSON.parse(localStorage.getItem("mc_gunluk_raporlar")) : null,
      
      // Diğer Ayarlar
      masaAyarlari: localStorage.getItem("mc_masa_ayarlari") ? JSON.parse(localStorage.getItem("mc_masa_ayarlari")) : null,
      printerAyarlari: localStorage.getItem("mc_printer_ayarlari") ? JSON.parse(localStorage.getItem("mc_printer_ayarlari")) : null,
    };

    // backupInfo hesaplamasını ayrı yap
    const dataKeys = Object.keys(backupData).filter(key => 
      backupData[key] !== null && 
      backupData[key] !== undefined &&
      !['date', 'version', 'system'].includes(key)
    );
    
    // JSON string'ini al
    const dataStr = JSON.stringify(backupData, null, 2);
    
    // backupInfo'yu ekle
    backupData.backupInfo = {
      totalSize: dataStr.length,
      itemCount: dataKeys.length,
      timestamp: new Date().toISOString(),
      generatedBy: user?.username || "System"
    };

    // Şimdi backupInfo ile birlikte yeniden stringify yap
    const finalDataStr = JSON.stringify(backupData, null, 2);
    
    // Dosyayı indir
    const dataBlob = new Blob([finalDataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mycafe_complete_backup_${new Date().toISOString().split("T")[0]}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ Tam yedek başarıyla indirildi!\n\n📦 Toplam ${backupData.backupInfo.itemCount} kategori yedeklendi.\n💾 Boyut: ${Math.round(backupData.backupInfo.totalSize / 1024)} KB`);
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

  // 📌 GERİ YÜKLEME FONKSİYONU (Ürünler Dahil)
  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (!backupData.version || !backupData.system) {
          alert("❌ Geçersiz yedek dosyası! Bu MyCafe yedek dosyası değil.");
          return;
        }
        
        // Kullanıcıya onay al
        const confirmRestore = window.confirm(
          `Yedek Dosyası Bilgileri:\n\n` +
          `• Sistem: ${backupData.system}\n` +
          `• Versiyon: ${backupData.version}\n` +
          `• Tarih: ${backupData.date ? new Date(backupData.date).toLocaleString('tr-TR') : 'Bilinmiyor'}\n` +
          `• Öğe Sayısı: ${backupData.backupInfo?.itemCount || 'Bilinmiyor'}\n\n` +
          `Bu yedek dosyasını geri yüklemek istiyor musunuz?\n\n` +
          `⚠️ UYARI: Mevcut verilerin üzerine yazılacak!`
        );
        
        if (!confirmRestore) {
          event.target.value = '';
          return;
        }
        
        // Her bir veriyi localStorage'a geri yükle
        let restoredCount = 0;
        const keysToRestore = [
          'user', 'sistemAyarlari',
          'bilardoUcretleri', 'bilardoMasalari', 'bilardoPopupAyarlari',
          'musteriler', 'adisyonlar', 'borclar', 'tahsilatlar',
          'finansHavuzu', 'giderler',
          'urunler', 'urunKategorileri', 'urunFiyatListesi', 'menuKategorileri',
          'siparisler', 'aktifSiparisler',
          'raporlar', 'gunlukRaporlar',
          'masaAyarlari', 'printerAyarlari'
        ];
        
        keysToRestore.forEach(key => {
          if (backupData[key] !== null && backupData[key] !== undefined) {
            let storageKey;
            switch(key) {
              case 'user': storageKey = 'mc_user'; break;
              case 'musteriler': storageKey = 'mc_musteriler'; break;
              case 'adisyonlar': storageKey = 'mc_adisyonlar'; break;
              case 'borclar': storageKey = 'mc_borclar'; break;
              case 'tahsilatlar': storageKey = 'mc_tahbilat'; break;
              case 'finansHavuzu': storageKey = 'mc_finans_havuzu'; break;
              case 'giderler': storageKey = 'mc_giderler'; break;
              case 'urunler': storageKey = 'mc_urunler'; break;
              case 'urunKategorileri': storageKey = 'mc_urun_kategorileri'; break;
              case 'menuKategorileri': storageKey = 'mc_menu_kategorileri'; break;
              case 'aktifSiparisler': storageKey = 'mc_aktif_siparisler'; break;
              case 'raporlar': storageKey = 'mc_raporlar'; break;
              case 'gunlukRaporlar': storageKey = 'mc_gunluk_raporlar'; break;
              case 'masaAyarlari': storageKey = 'mc_masa_ayarlari'; break;
              case 'printerAyarlari': storageKey = 'mc_printer_ayarlari'; break;
              default: storageKey = key;
            }
            
            localStorage.setItem(storageKey, JSON.stringify(backupData[key]));
            restoredCount++;
            console.log(`✅ Geri yüklendi: ${key} → ${storageKey}`);
          }
        });
        
        event.target.value = '';
        
        alert(`✅ Geri yükleme tamamlandı!\n\n📥 ${restoredCount} veri kategorisi geri yüklendi.\n🔄 Sayfayı yenilemeniz önerilir.`);
        
        setTimeout(() => {
          if (window.confirm("Sayfa yenilensin mi?")) {
            window.location.reload();
          }
        }, 1000);
        
      } catch (error) {
        console.error("Geri yükleme hatası:", error);
        alert(`❌ Geri yükleme başarısız!\n\nHata: ${error.message}\n\nLütfen geçerli bir yedek dosyası seçtiğinizden emin olun.`);
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

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
              <p><strong>Öneri:</strong> Yedekleri Google Drive veya başka bir bulut servisine yükleyin.</p>
            </div>
          </div>

          <div className="temizleme-bilgi">
          </div>

          <div className="input-grup">
            <button onClick={handleBackup} className="kaydet-button">
              💾 Tüm Verilerin Yedeğini Al (JSON İndir)
            </button>
            <small className="text-muted">Tüm sistem verilerini tek dosyada yedekler</small>
          </div>

          <div className="input-grup">
            <label>📥 Veri Geri Yükle</label>
            <input 
              type="file" 
              accept=".json"
              onChange={handleRestore}
              id="restoreFileInput"
            />
            <small className="text-muted">MyCafe yedek dosyası seçin (.json formatında)</small>
          </div>

          <div className="temizleme-bilgi">
            <h3>🔄 Parçalı Yedek İşlemleri</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
              <button 
                onClick={() => {
                  const masalar = localStorage.getItem("bilardo_masalar");
                  if (masalar) {
                    const blob = new Blob([masalar], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `bilardo_masalar_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    alert("🎱 Sadece bilardo masaları yedeklendi!");
                  } else {
                    alert("❌ Yedeklenecek masa verisi bulunamadı!");
                  }
                }}
                className="kaydet-button"
                style={{ flex: '1', minWidth: '200px', background: '#9b59b6', fontSize: '14px', padding: '12px' }}
              >
                🎱 Sadece Masaları Yedekle
              </button>
              
              <button 
                onClick={() => {
                  const siparisler = localStorage.getItem("siparisler");
                  if (siparisler) {
                    const blob = new Blob([siparisler], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `siparisler_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    alert("☕ Sadece sipariş geçmişi yedeklendi!");
                  } else {
                    alert("❌ Yedeklenecek sipariş verisi bulunamadı!");
                  }
                }}
                className="kaydet-button"
                style={{ flex: '1', minWidth: '200px', background: '#2ecc71', fontSize: '14px', padding: '12px' }}
              >
                ☕ Sadece Siparişleri Yedekle
              </button>
              
              <button 
                onClick={() => {
                  // Tüm müşteri işlem verilerini topla
                  const musteriData = {
                    musteriler: localStorage.getItem("mc_musteriler"),
                    adisyonlar: localStorage.getItem("mc_adisyonlar"),
                    borclar: localStorage.getItem("mc_borclar"),
                    tahsilatlar: localStorage.getItem("mc_tahbilat")
                  };
                  
                  const availableData = Object.entries(musteriData)
                    .filter(([key, value]) => value !== null)
                    .map(([key]) => key);
                  
                  if (availableData.length > 0) {
                    const blob = new Blob([JSON.stringify(musteriData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `musteri_islemleri_backup_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    
                    alert(`👥 Müşteri işlemleri yedeklendi!\n\n📋 Yedeklenen veriler:\n${availableData.map(item => `• ${item}`).join('\n')}`);
                  } else {
                    alert("❌ Yedeklenecek müşteri işlem verisi bulunamadı!");
                  }
                }}
                className="kaydet-button"
                style={{ flex: '1', minWidth: '200px', background: '#16a085', fontSize: '14px', padding: '12px' }}
              >
                👥 Sadece Müşteri İşlemlerini Yedekle
              </button>
              
              <button 
                onClick={() => {
                  // Ürün verilerini topla
                  const urunData = {
                    urunler: localStorage.getItem("mc_urunler"),
                    urunKategorileri: localStorage.getItem("mc_urun_kategorileri"),
                    urunFiyatListesi: localStorage.getItem("urun_fiyat_listesi"),
                    menuKategorileri: localStorage.getItem("mc_menu_kategorileri")
                  };
                  
                  const availableData = Object.entries(urunData)
                    .filter(([key, value]) => value !== null)
                    .map(([key]) => key);
                  
                  if (availableData.length > 0) {
                    const blob = new Blob([JSON.stringify(urunData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `urunler_backup_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    
                    alert(`🛒 Ürünler yedeklendi!\n\n📋 Yedeklenen veriler:\n${availableData.map(item => `• ${item}`).join('\n')}`);
                  } else {
                    alert("❌ Yedeklenecek ürün verisi bulunamadı!");
                  }
                }}
                className="kaydet-button"
                style={{ flex: '1', minWidth: '200px', background: '#f39c12', fontSize: '14px', padding: '12px' }}
              >
                🛒 Sadece Ürünleri Yedekle
              </button>
              
              <button 
                onClick={() => {
                  const finansHavuzu = localStorage.getItem("mc_finans_havuzu");
                  if (finansHavuzu) {
                    const blob = new Blob([finansHavuzu], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `finans_havuzu_backup_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    alert("💰 Sadece finans havuzu yedeklendi!");
                  } else {
                    alert("❌ Finans havuzu verisi bulunamadı!");
                  }
                }}
                className="kaydet-button"
                style={{ flex: '1', minWidth: '200px', background: '#8e44ad', fontSize: '14px', padding: '12px' }}
              >
                💰 Sadece Finans Havuzunu Yedekle
              </button>
            </div>
          </div>

          {(user?.role === "SUPERADMIN" || user?.role === "ADMIN") && (
            <div className="temizleme-bilgi" style={{ borderLeft: '4px solid #e74c3c' }}>
              <h3 style={{ color: '#e74c3c' }}>⚠️ Tehlikeli İşlemler (Yönetici)</h3>
              <p>Bu işlemler tüm verileri kalıcı olarak silecektir. Sadece gerektiğinde kullanın.</p>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                <button 
                  onClick={() => {
                    if (window.confirm("Sadece bilardo masaları sıfırlanacak. Emin misiniz?")) {
                      localStorage.removeItem("bilardo_masalar");
                      alert("🎱 Bilardo masaları sıfırlandı!");
                    }
                  }}
                  className="temizle-button"
                  style={{ flex: '1', minWidth: '150px', background: '#e67e22', fontSize: '14px', padding: '12px' }}
                >
                  🎱 Sadece Masaları Temizle
                </button>
                
                <button 
                  onClick={() => {
                    if (window.confirm("Sadece sipariş geçmişi silinecek. Emin misiniz?")) {
                      localStorage.removeItem("siparisler");
                      alert("☕ Sipariş geçmişi temizlendi!");
                    }
                  }}
                  className="temizle-button"
                  style={{ flex: '1', minWidth: '150px', background: '#d35400', fontSize: '14px', padding: '12px' }}
                >
                  ☕ Sadece Siparişleri Temizle
                </button>
                
                <button 
                  onClick={() => {
                    if (window.confirm("TÜM müşteri işlem verileri silinecek!\n\nBu işlem şunları silecek:\n• Müşteri kayıtları\n• Adisyon kayıtları\n• Borç kayıtları\n• Tahsilatlar\n\nEmin misiniz?")) {
                      localStorage.removeItem("mc_musteriler");
                      localStorage.removeItem("mc_adisyonlar");
                      localStorage.removeItem("mc_borclar");
                      localStorage.removeItem("mc_tahbilat");
                      alert("✅ Müşteri işlem verileri temizlendi!\n\nNot: Finans havuzu verileri korundu.");
                    }
                  }}
                  className="temizle-button"
                  style={{ flex: '1', minWidth: '150px', background: '#16a085', fontSize: '14px', padding: '12px' }}
                >
                  👥 Müşteri İşlemlerini Temizle
                </button>
                
                <button 
                  onClick={() => {
                    if (window.confirm("Ürün verileri silinecek! Bu işlem tüm ürünleri, kategorileri ve fiyat listesini silecek. Emin misiniz?")) {
                      localStorage.removeItem("mc_urunler");
                      localStorage.removeItem("mc_urun_kategorileri");
                      localStorage.removeItem("urun_fiyat_listesi");
                      localStorage.removeItem("mc_menu_kategorileri");
                      alert("🛒 Ürün verileri temizlendi!");
                    }
                  }}
                  className="temizle-button"
                  style={{ flex: '1', minWidth: '150px', background: '#f39c12', fontSize: '14px', padding: '12px' }}
                >
                  🛒 Ürünleri Temizle
                </button>
                
                <button 
                  onClick={() => {
                    if (window.confirm("Finans havuzu verileri silinecek. Bu işlem tüm parasal hareket kayıtlarını silecektir. Emin misiniz?")) {
                      localStorage.removeItem("mc_finans_havuzu");
                      alert("💰 Finans havuzu temizlendi!");
                    }
                  }}
                  className="temizle-button"
                  style={{ flex: '1', minWidth: '150px', background: '#9b59b6', fontSize: '14px', padding: '12px' }}
                >
                  💰 Sadece Finans Havuzunu Temizle
                </button>
              </div>
              
              <button onClick={resetLocalStorage} className="temizle-button" style={{ marginTop: '15px' }}>
                🗑️ TÜM VERİLERİ TEMİZLE & SİSTEMİ SIFIRLA
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
              <button 
                onClick={() => {
                  const urunler = localStorage.getItem("mc_urunler");
                  if (urunler) {
                    const blob = new Blob([urunler], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `urunler_backup_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    alert("🛒 Ürünler hızlı yedeklendi!");
                  } else {
                    alert("❌ Ürün verisi bulunamadı!");
                  }
                }}
                className="kaydet-button" 
                style={{ flex: '1', minWidth: '200px', background: '#f39c12' }}
              >
                🛒 Ürünleri Hızlı Yedekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}