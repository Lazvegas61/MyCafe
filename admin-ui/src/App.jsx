// App.jsx - TÜM GÜNCELLEMELERLE BİRLİKTE
/* ------------------------------------------------------------
   📌 App.jsx — MyCafe (FINAL - GÜN BAŞLATMA SİSTEMİ ENTEGRE)
------------------------------------------------------------ */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import GlobalSureBittiPopup from "./components/GlobalSureBittiPopup";
import syncService from "./services/syncService";

/* ------------------------------------------------------------
   🔧 İlk Kurulum Verileri
------------------------------------------------------------ */
import categoriesData from "./data/initial_categories.json";
import productsData from "./data/initial_products.json";

// SYNC EVENTS sabitleri
const SYNC_EVENTS = {
  MASA_GUNCELLENDI: 'MASA_GUNCELLENDI',
  ADISYON_GUNCELLENDI: 'ADISYON_GUNCELLENDI',
  FİYAT_GUNCELLENDİ: 'FİYAT_GUNCELLENDİ',
  SENKRONIZE_ET: 'SENKRONIZE_ET',
  KALEM_EKLENDI: 'KALEM_EKLENDI'
};

function loadInitialData() {
  const hasData = localStorage.getItem("mc_data_updated");
  if (hasData) return;

  localStorage.setItem("mc_kategoriler", JSON.stringify(categoriesData));
  localStorage.setItem("mc_urunler", JSON.stringify(productsData));
  localStorage.setItem("mc_data_updated", "1");
  
  const initialMasalar = [];
  for (let i = 1; i <= 30; i++) {
    initialMasalar.push({
      id: i,
      no: i.toString(),
      adisyonId: null,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00",
      acilisZamani: null,
      durum: "BOŞ",
      renk: "gri",
      musteriAdi: null,
      kisiSayisi: null,
      guncellemeZamani: new Date().toISOString()
    });
  }
  
  // BİLARDO MASALARI
  const bilardoMasalari = [];
  for (let i = 1; i <= 10; i++) {
    bilardoMasalari.push({
      id: 100 + i,
      no: `B${i}`,
      adisyonId: null,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00",
      acilisZamani: null,
      durum: "BOŞ",
      renk: "gri",
      musteriAdi: null,
      kisiSayisi: null,
      guncellemeZamani: new Date().toISOString(),
      tur: "BİLARDO"
    });
  }
  
  const tumMasalar = [...initialMasalar, ...bilardoMasalari];
  localStorage.setItem("mc_masalar", JSON.stringify(tumMasalar));
  localStorage.setItem("mc_adisyonlar", JSON.stringify([]));
  
  // BİLARDO VERİLERİ
  const bilardoVerileri = [];
  for (let i = 1; i <= 10; i++) {
    bilardoVerileri.push({
      id: 100 + i,
      no: `B${i}`,
      acik: false,
      durum: "KAPALI",
      sureTipi: null,
      acilisSaati: null,
      ucret: 0,
      aktifAdisyonId: null
    });
  }
  localStorage.setItem("bilardo", JSON.stringify(bilardoVerileri));
  
  localStorage.setItem("bilardo_adisyonlar", JSON.stringify([]));
  localStorage.setItem("mc_musteriler", JSON.stringify([]));
  localStorage.setItem("mc_borclar", JSON.stringify([]));
  localStorage.setItem("mc_giderler", JSON.stringify([]));
  
  // BİLARDO ÜCRET AYARLARI
  localStorage.setItem("bilardo_ucretleri", JSON.stringify({
    bilardo30dk: 80,
    bilardo1saat: 120,
    bilardoDakikaUcreti: 2
  }));
}

function autoFixCategoryAndProducts() {
  let cats = JSON.parse(localStorage.getItem("mc_kategoriler") || "[]");
  let prods = JSON.parse(localStorage.getItem("mc_urunler") || "[]");

  let changed = false;

  cats = cats.map((c, index) => {
    let updated = { ...c };

    if (!updated.id) {
      updated.id = index + 1;
      changed = true;
    }

    if (updated.parentId === undefined) {
      updated.parentId = null;
      changed = true;
    }

    updated.isSiparisYemek = updated.name
      ?.toLowerCase()
      .includes("sipariş yemek");

    return updated;
  });

  prods = prods.map((p, index) => {
    let updated = { ...p };

    if (!updated.id) {
      updated.id = Date.now() + index;
      changed = true;
    }

    if (!updated.categoryId) {
      const cat = cats.find(
        (c) => c.name?.toLowerCase() === updated.categoryName?.toLowerCase()
      );
      if (cat) {
        updated.categoryId = cat.id;
        changed = true;
      }
    }

    updated.salePrice = Number(updated.salePrice || 0);
    updated.costPrice = Number(updated.costPrice || 0);
    updated.stock = Number(updated.stock || 0);
    updated.critical = Number(updated.critical || 0);

    return updated;
  });

  if (changed) {
    localStorage.setItem("mc_kategoriler", JSON.stringify(cats));
    localStorage.setItem("mc_urunler", JSON.stringify(prods));
    localStorage.setItem("mc_data_updated", "1");
  }
}

/* ------------------------------------------------------------
   🔧 SYNC SERVICE ENTEGRASYONU
------------------------------------------------------------ */
let syncServiceInitialized = false;

function initializeSyncService() {
  if (syncServiceInitialized) {
    console.log('🔄 SyncService zaten başlatılmış');
    return;
  }
  
  console.log('🔄 SyncService başlatılıyor...');
  
  if (!window.syncService) {
    console.error('❌ SyncService başlatılamadı!');
    return;
  }
  
  if (window.syncService.on) {
    window.syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, (data) => {
      console.log('📢 SyncService: Masa güncellendi', data?.masaNo || data?.masaNum || data);
    });
    
    window.syncService.on(SYNC_EVENTS.ADISYON_GUNCELLENDI, (data) => {
      console.log('📢 SyncService: Adisyon güncellendi', data?.adisyonId || data);
    });
    
    window.syncService.on(SYNC_EVENTS.FİYAT_GUNCELLENDİ, (data) => {
      console.log('💰 SyncService: Fiyat güncellendi', data?.toplamTutar || data);
    });
    
    window.syncService.on(SYNC_EVENTS.KALEM_EKLENDI, (data) => {
      console.log('➕ SyncService: Kalem eklendi', data?.adisyonId || data);
    });
    
    window.syncService.on(SYNC_EVENTS.SENKRONIZE_ET, () => {
      console.log('🔄 SyncService: Tüm veriler senkronize edildi');
    });
    
    syncServiceInitialized = true;
    console.log('✅ SyncService başlatıldı ve event listener\'lar kuruldu');
    
    setTimeout(() => {
      if (window.syncService.senkronizeMasalar) {
        window.syncService.senkronizeMasalar();
      }
    }, 1500);
  } else {
    console.warn('⚠️ SyncService.on() methodu bulunamadı, event listener\'lar kurulamadı');
  }
}

// AÇIK ADİSYONLARI SENKRONİZE ETME FONKSİYONU - GÜNCELLENMİŞ VERSİYON
function syncAcikAdisyonlar() {
  try {
    const normalAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    
    // SADECE AÇIK OLAN NORMAL ADİSYONLARI AL
    const acikNormalAdisyonlar = normalAdisyonlar.filter(a => {
      const durum = a.durum?.toUpperCase();
      const isKapali = a.kapali || durum === "KAPALI" || durum === "KAPATILDI";
      const isAcil = a.isAcil;
      return !isKapali && !isAcil;
    });
    
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    
    // SADECE AÇIK OLAN BİLARDO ADİSYONLARI AL
    const acikBilardoAdisyonlar = bilardoAdisyonlar.filter(a => {
      const durum = a.durum?.toUpperCase();
      const isKapali = a.kapali || durum === "KAPALI" || durum === "KAPATILDI";
      const isAcil = a.isAcil;
      return !isKapali && !isAcil;
    });
    
    const tumAcikAdisyonlar = [
      ...acikNormalAdisyonlar.map(a => ({
        ...a,
        tur: "NORMAL",
        masaNo: a.masaNo || `MASA ${a.masaNum}`,
        toplamTutar: a.toplamTutar || 0
      })),
      ...acikBilardoAdisyonlar.map(a => ({
        ...a,
        tur: "BİLARDO",
        masaNo: a.bilardoMasaNo || "Bilinmiyor",
        toplamTutar: a.toplamTutar || a.bilardoUcreti || 0
      }))
    ];
    
    localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(tumAcikAdisyonlar));
    
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('adisyonGuncellendi', { 
        type: 'acik_adisyon_sync', 
        count: tumAcikAdisyonlar.length 
      });
    }
  } catch (error) {
    console.error("Açık adisyon senkronizasyon hatası:", error);
  }
}

// KRİTİK STOK KONTROL FONKSİYONU
function checkCriticalStock() {
  try {
    const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
    const criticalProducts = urunler.filter(u => 
      (parseInt(u.stock || 0) || 0) <= (parseInt(u.critical || 10) || 10)
    );
    
    const prevCritical = localStorage.getItem("mc_last_critical_count") || "0";
    const currentCritical = criticalProducts.length.toString();
    
    if (prevCritical !== currentCritical) {
      localStorage.setItem("mc_last_critical_count", currentCritical);
      
      if (window.dispatchGlobalEvent) {
        window.dispatchGlobalEvent('kritikStok', { 
          count: criticalProducts.length,
          products: criticalProducts.slice(0, 5)
        });
      }
    }
  } catch (error) {
    console.error("Kritik stok kontrol hatası:", error);
  }
}

/* ------------------------------------------------------------
   👤 DEMO ADMIN
------------------------------------------------------------ */
function ensureDemoAdmin() {
  const ls = localStorage.getItem("mc_personeller");

  const demoAdmin = {
    id: 1,
    adSoyad: "Demo Admin",
    username: "ADMIN",
    sifre: "1234",
    rol: "ADMIN",
  };

  if (!ls) {
    localStorage.setItem("mc_personeller", JSON.stringify([demoAdmin]));
    return;
  }

  try {
    const arr = JSON.parse(ls);
    const exists = arr.some((p) => p.username === "ADMIN");

    if (!exists) {
      arr.push(demoAdmin);
      localStorage.setItem("mc_personeller", JSON.stringify(arr));
    }
  } catch {
    localStorage.setItem("mc_personeller", JSON.stringify([demoAdmin]));
  }
}

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("mc_user") || "null");
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------
   📌 GLOBAL EVENT LISTENER FONKSİYONU
------------------------------------------------------------ */
function initializeGlobalEventListeners() {
  console.log('🔔 Global event listeners başlatılıyor...');
  
  const globalEvents = {
    MASA_GUNCELLENDI: 'masaGuncellendi',
    ADISYON_GUNCELLENDI: 'adisyonGuncellendi',
    BİLARDO_ADISYON_GUNCELLENDI: 'bilardoAdisyonGuncellendi',
    BİLARDO_MASA_GUNCELLENDI: 'bilardoMasaGuncellendi',
    STOK_GUNCELLENDI: 'stokGuncellendi',
    KRITIK_STOK: 'kritikStok',
    SENKRONIZE_ET: 'senkronizeEt'
  };
  
  window.dispatchGlobalEvent = (eventName, data = {}) => {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
    console.log(`📢 Global Event Gönderildi: ${eventName}`, data);
  };
  
  const handleStorageChange = (event) => {
    const key = event.key;
    
    if (key === 'mc_masalar') {
      window.dispatchGlobalEvent(globalEvents.MASA_GUNCELLENDI, { 
        type: 'storage_update', 
        key: key 
      });
    } 
    else if (key === 'mc_adisyonlar') {
      window.dispatchGlobalEvent(globalEvents.ADISYON_GUNCELLENDI, { 
        type: 'storage_update', 
        key: key 
      });
    }
    else if (key === 'bilardo_adisyonlar') {
      window.dispatchGlobalEvent(globalEvents.BİLARDO_ADİSYON_GUNCELLENDI, { 
        type: 'storage_update', 
        key: key 
      });
    }
    else if (key === 'bilardo') {
      window.dispatchGlobalEvent(globalEvents.BİLARDO_MASA_GUNCELLENDI, { 
        type: 'storage_update', 
        key: key 
      });
    }
    else if (key === 'mc_urunler') {
      window.dispatchGlobalEvent(globalEvents.STOK_GUNCELLENDI, { 
        type: 'storage_update', 
        key: key 
      });
    }
    else if (key.startsWith('mc_')) {
      window.dispatchGlobalEvent(globalEvents.SENKRONIZE_ET, { 
        type: 'storage_update', 
        key: key 
      });
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  const storageCheckInterval = setInterval(() => {
    syncAcikAdisyonlar();
    checkCriticalStock();
  }, 10000);
  
  console.log('✅ Global event listeners kuruldu');
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(storageCheckInterval);
  };
}

/* ------------------------------------------------------------
   📌 SAYFA IMPORTLARI — YENİ RAPOR YAPISI İLE
------------------------------------------------------------ */
import Login from "./pages/Login/Login.jsx";
import AnaEkran from "./pages/AnaEkran/AnaEkran.jsx";
import Masalar from "./pages/Masalar/Masalar.jsx";
import Adisyon from "./pages/Adisyon/Adisyon.jsx";
import MusteriIslemleri from "./pages/MusteriIslemleri/MusteriIslemleri.jsx";
import './pages/MusteriIslemleri/MusteriIslemleri.css';
import UrunStokYonetimi from "./pages/UrunStokYonetimi/UrunStokYonetimi.jsx";
import Giderler from './pages/Giderler/Giderler.jsx';
import Personel from "./pages/Personel/Personel.jsx";
import Ayarlar from "./pages/Ayarlar/Ayarlar.jsx";
import Bilardo from "./pages/Bilardo/Bilardo";
import BilardoAdisyon from "./pages/Bilardo/BilardoAdisyon.jsx";
import MasaDetay from "./pages/Masalar/MasaDetay.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// YENİ RAPOR SAYFALARI
import RaporlarDashboard from "./pages/Raporlar/Dashboard/RaporlarDashboard.jsx";
import GunSonuOzet from "./pages/Raporlar/GunSonu/GunSonuOzet.jsx";
import GunSonuDetay from "./pages/Raporlar/GunSonu/GunSonuDetay.jsx";
import GunSonuRapor from "./pages/Raporlar/GunSonu/GunSonuRapor.jsx";
import UrunBazliSatis from "./pages/Raporlar/UrunRaporlari/UrunBazliSatis.jsx";
import KategoriBazliSatis from "./pages/Raporlar/KategoriRaporlari/KategoriBazliSatis.jsx";
import GunlukGiderler from "./pages/Raporlar/GiderRaporlari/GunlukGiderler.jsx";
import MasaAnalizi from "./pages/Raporlar/MasaRaporlari/MasaAnalizi.jsx";

/* ------------------------------------------------------------
   📌 LAYOUT — Sidebar login harici HER YERDE görünsün
------------------------------------------------------------ */
function Layout({ children, gunAktif, onGunBaslat }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const user = getUser();
  const hideSidebar = path === "/login";
  const initializedRef = useRef(false);
  const eventListenersInitializedRef = useRef(false);
  const [showGunBaslatModal, setShowGunBaslatModal] = useState(false);
  const [gunSonuYapildi, setGunSonuYapildi] = useState(false);

  // Gün sonu sayfası kontrolü (özel durum)
  const isGunSonuRaporSayfasi = path.includes("/gun-sonu-rapor/");

  // Kullanıcı giriş yaptıktan sonra Gün Başlat modal'ını göster
  useEffect(() => {
    // EĞER GÜN SONU RAPOR SAYFASINDAYSAK MODAL GÖSTERME
    if (isGunSonuRaporSayfasi) {
      setShowGunBaslatModal(false);
      return;
    }
    
    // EĞER GÜN SONU YAPILDIYSA MODAL GÖSTERME
    if (gunSonuYapildi) {
      setShowGunBaslatModal(false);
      return;
    }
    
    if (user && path !== "/login" && !gunAktif) {
      // 1 saniye sonra modal'ı göster (sayfanın yüklenmesini bekle)
      const timer = setTimeout(() => {
        setShowGunBaslatModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, path, gunAktif, isGunSonuRaporSayfasi, gunSonuYapildi]);

  // Gün sonu event'ini dinle
  useEffect(() => {
    const handleGunSonlandirildi = () => {
      setGunSonuYapildi(true);
      setShowGunBaslatModal(false);
    };
    
    window.addEventListener('gunSonlandirildi', handleGunSonlandirildi);
    
    return () => {
      window.removeEventListener('gunSonlandirildi', handleGunSonlandirildi);
    };
  }, []);

  // Gün başlatıldığında modal'ı kapat
  useEffect(() => {
    if (gunAktif) {
      setShowGunBaslatModal(false);
      setGunSonuYapildi(false);
    }
  }, [gunAktif]);

  useEffect(() => {
    if (!hideSidebar && window.syncService && !initializedRef.current) {
      initializeSyncService();
      initializedRef.current = true;
    }
    
    if (!hideSidebar && !eventListenersInitializedRef.current) {
      initializeGlobalEventListeners();
      eventListenersInitializedRef.current = true;
    }
  }, [hideSidebar]);

  // Gün aktif değilse ve ana sayfa/login hariç diğer sayfalardaysak, ana sayfaya yönlendir
  useEffect(() => {
    const userLoggedIn = !!getUser();
    
    // GÜN SONU RAPOR SAYFASI ÖZEL İSTİSNA
    if (isGunSonuRaporSayfasi) {
      return; // Gün sonu rapor sayfasına gitmeye izin ver
    }
    
    if (userLoggedIn && !gunAktif && path !== "/login" && path !== "/" && path !== "/ana") {
      navigate('/');
    }
  }, [gunAktif, path, navigate, isGunSonuRaporSayfasi]);

  const handleGunBaslatClick = () => {
    if (onGunBaslat) {
      onGunBaslat();
      setShowGunBaslatModal(false);
      setGunSonuYapildi(false);
    }
  };

  const handleModalClose = () => {
    if (window.confirm("Gün başlatmadan devam edemezsiniz. Çıkış yapmak ister misiniz?")) {
      localStorage.removeItem("mc_user");
      navigate("/login");
    }
  };

  // Login sayfasında opacity ve pointer-events uygulama
  const isLoginPage = path === "/login";
  
  return (
    <>
      {/* GÜN BAŞLAT MODAL'ı - GÜN SONU RAPOR SAYFASINDA GÖSTERME */}
      {showGunBaslatModal && !isGunSonuRaporSayfasi && !gunSonuYapildi && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f5e7d0 0%, #e8d9b5 100%)',
            borderRadius: '20px',
            padding: '40px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            border: '3px solid #4b2e05',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              color: '#4b2e05'
            }}>
              ⏰
            </div>
            
            <h2 style={{
              color: '#4b2e05',
              fontSize: '28px',
              marginBottom: '10px'
            }}>
              GÜN BAŞLANGICI
            </h2>
            
            <p style={{
              color: '#6b4210',
              fontSize: '16px',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              Sistemi kullanmaya başlamak için gün başlatmanız gerekiyor.<br />
              Gün başlatıldıktan sonra tüm işlemler aktif olacaktır.
            </p>
            
            <div style={{
              backgroundColor: 'rgba(139, 69, 19, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '1px solid rgba(139, 69, 19, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{fontWeight: 'bold', color: '#4b2e05'}}>📅 Tarih:</span>
                <span>{new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{fontWeight: 'bold', color: '#4b2e05'}}>⏰ Saat:</span>
                <span>{new Date().toLocaleTimeString('tr-TR')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{fontWeight: 'bold', color: '#4b2e05'}}>👤 Kullanıcı:</span>
                <span>{user?.adSoyad || user?.username || 'Bilinmiyor'}</span>
              </div>
            </div>
            
            <button
              onClick={handleGunBaslatClick}
              style={{
                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '18px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(46, 204, 113, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                margin: '0 auto',
                transition: 'all 0.3s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(46, 204, 113, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 204, 113, 0.4)';
              }}
            >
              <span style={{fontSize: '28px'}}>🚀</span>
              GÜN BAŞLAT
            </button>
            
            <p style={{
              fontSize: '12px',
              color: '#8B4513',
              marginTop: '20px',
              opacity: 0.7
            }}>
              Not: Gün başlatmadan diğer işlemleri yapamazsınız.
            </p>
          </div>
        </div>
      )}
      
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#f5e7d0",
          color: "#4b2e05",
          // GÜN SONU RAPOR SAYFASINDA BLUR VE OPACITY UYGULAMA
          filter: (showGunBaslatModal && !isGunSonuRaporSayfasi) ? 'blur(5px)' : 'none',
          opacity: (showGunBaslatModal && !isGunSonuRaporSayfasi) ? 0.3 : 1,
          pointerEvents: (showGunBaslatModal && !isGunSonuRaporSayfasi) ? 'none' : 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        {!hideSidebar && <Sidebar user={user} gunAktif={gunAktif} />}

        <div
          style={{
            flex: 1,
            marginLeft: hideSidebar ? 0 : 280,
            padding: "25px",
            // GÜN SONU RAPOR SAYFASI ÖZEL DURUM
            opacity: isLoginPage ? 1 : (isGunSonuRaporSayfasi ? 1 : (gunAktif ? 1 : 0.5)),
            transition: 'opacity 0.3s ease',
            pointerEvents: isLoginPage ? 'auto' : (isGunSonuRaporSayfasi ? 'auto' : (gunAktif ? 'auto' : 'none')),
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------
   🚀 ROOT APP — ANA SAYFA
------------------------------------------------------------ */
export default function App() {
  const syncInitializedRef = useRef(false);
  const [globalSureBittiPopup, setGlobalSureBittiPopup] = useState(null);
  const [gunAktif, setGunAktif] = useState(() => {
    return localStorage.getItem('mycafe_gun_durumu') === 'aktif';
  });

  // İlk yüklemede verileri hazırla
  useEffect(() => {
    loadInitialData();
    autoFixCategoryAndProducts();
    ensureDemoAdmin();
  }, []);

  // Gün durumu değişikliklerini dinle
  useEffect(() => {
    const handleGunDurumuDegisti = (event) => {
      if (event.detail && typeof event.detail.aktif !== 'undefined') {
        setGunAktif(event.detail.aktif);
      }
    };
    
    window.addEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    
    return () => {
      window.removeEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    };
  }, []);

  // Gün başlatma fonksiyonu - App.jsx'ten Layout'a gönderilecek
  const handleGunBaslat = useCallback(() => {
    const baslangicZamani = new Date();
    const baslangicKasa = 0;
    
    // LocalStorage'a kaydet
    localStorage.setItem('mycafe_gun_durumu', 'aktif');
    localStorage.setItem('mycafe_gun_baslangic', baslangicZamani.toISOString());
    localStorage.setItem('mycafe_gun_baslangic_kasa', baslangicKasa.toString());
    
    const yeniGunBilgileri = {
      baslangicKasa: baslangicKasa,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: baslangicZamani.toISOString(),
      sonGuncelleme: new Date().toISOString()
    };
    
    localStorage.setItem('mycafe_gun_bilgileri', JSON.stringify(yeniGunBilgileri));
    
    // State'leri güncelle
    setGunAktif(true);
    
    // Global event gönder
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: true });
      window.dispatchGlobalEvent('gunBaslatildi', { 
        zaman: baslangicZamani,
        kasa: baslangicKasa 
      });
    }
    
    console.log('✅ Gün başlatıldı:', baslangicZamani);
    
  }, []);

  // Sync service ve interval'leri başlat
  useEffect(() => {
    // Sync service'i global scope'a ekle
    if (typeof window !== 'undefined') {
      window.syncService = syncService;
      console.log('🌟 SyncService global olarak yüklendi');
    }
    
    // Bilardo süre kontrol interval'i
    const checkBilardoSuresi = () => {
      try {
        const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
        const aktifAdisyonlar = bilardoAdisyonlar.filter(a => a.durum === "ACIK");
        
        let yeniPopup = null;
        const now = Date.now();
        
        aktifAdisyonlar.forEach(adisyon => {
          if (adisyon.acilisZamani) {
            const gecenDakika = Math.floor((now - adisyon.acilisZamani) / 60000);
            
            if (adisyon.sureTipi === "30dk" && gecenDakika >= 30) {
              yeniPopup = {
                type: "BİLARDO",
                masaNo: adisyon.bilardoMasaNo,
                mesaj: "30 dakika süresi doldu!",
                adisyonId: adisyon.id,
                timestamp: now
              };
            } else if (adisyon.sureTipi === "1saat" && gecenDakika >= 60) {
              yeniPopup = {
                type: "BİLARDO",
                masaNo: adisyon.bilardoMasaNo,
                mesaj: "1 saat süresi doldu!",
                adisyonId: adisyon.id,
                timestamp: now
              };
            }
          }
        });
        
        if (yeniPopup && (!globalSureBittiPopup || globalSureBittiPopup.adisyonId !== yeniPopup.adisyonId)) {
          setGlobalSureBittiPopup(yeniPopup);
          
          setTimeout(() => {
            setGlobalSureBittiPopup(prev => 
              prev?.adisyonId === yeniPopup.adisyonId ? null : prev
            );
          }, 30000);
        }
      } catch (error) {
        console.error("Bilardo süre kontrol hatası:", error);
      }
    };
    
    const bilardoInterval = setInterval(checkBilardoSuresi, 15000);
    
    if (!syncInitializedRef.current) {
      const handleStorageChange = (event) => {
        if (event.key && (event.key.startsWith('mc_') || event.key === 'bilardo_adisyonlar')) {
          console.log('💾 Storage değişti:', event.key);
          
          syncAcikAdisyonlar();
          
          if (window.syncService && window.syncService.senkronizeMasalar) {
            setTimeout(() => {
              window.syncService.senkronizeMasalar();
            }, 300);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      setTimeout(() => {
        if (window.syncService && window.syncService.senkronizeMasalar) {
          console.log('🔄 Uygulama başlangıç senkronizasyonu yapılıyor...');
          window.syncService.senkronizeMasalar();
        }
      }, 2000);
      
      syncInitializedRef.current = true;
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(bilardoInterval);
      };
    }
    
    return () => {
      // Cleanup function
    };
  }, [globalSureBittiPopup]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {globalSureBittiPopup && (
          <GlobalSureBittiPopup
            data={globalSureBittiPopup}
            onClose={() => setGlobalSureBittiPopup(null)}
          />
        )}
        
        <Routes>
          {/* 1. ÖZEL ROUTE'LAR */}
          <Route path="/login" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Login /></Layout>} />
          
          {/* 2. PARAMETRELİ ROUTE'LAR */}
          <Route path="/adisyon/:id" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Adisyon /></Layout>} />
          <Route path="/adisyondetay/:masaNo" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Adisyon /></Layout>} />
          <Route path="/masa-detay/:id" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><MasaDetay /></Layout>} />
          <Route path="/bilardo-adisyon/:id" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><BilardoAdisyon /></Layout>} />
          
          {/* 3. RAPOR ROUTE'LARI */}
          <Route path="/gun-sonu-rapor/:id" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><GunSonuRapor /></Layout>} />
          <Route path="/raporlar" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><RaporlarDashboard /></Layout>} />
          <Route path="/raporlar/dashboard" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><RaporlarDashboard /></Layout>} />
          <Route path="/raporlar/masa-analizi" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><MasaAnalizi /></Layout>} />
          <Route path="/raporlar/gun-sonu" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><GunSonuOzet /></Layout>} />
          <Route path="/raporlar/gun-sonu-detay" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><GunSonuDetay /></Layout>} />
          <Route path="/raporlar/urun-bazli" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><UrunBazliSatis /></Layout>} />
          <Route path="/raporlar/kategori-bazli" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><KategoriBazliSatis /></Layout>} />
          <Route path="/raporlar/gunluk-giderler" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><GunlukGiderler /></Layout>} />
          
          {/* 4. ANA SAYFALAR */}
          <Route path="/" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><AnaEkran setGunAktif={setGunAktif} /></Layout>} />
          <Route path="/ana" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><AnaEkran setGunAktif={setGunAktif} /></Layout>} />
          <Route path="/masalar" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Masalar /></Layout>} />
          <Route path="/musteri-islemleri" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><MusteriIslemleri /></Layout>} />
          <Route path="/urun-stok" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><UrunStokYonetimi /></Layout>} />
          <Route path="/giderler" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Giderler /></Layout>} />
          <Route path="/personel" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Personel /></Layout>} />
          <Route path="/ayarlar" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Ayarlar /></Layout>} />
          <Route path="/bilardo" element={<Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}><Bilardo /></Layout>} />
          
          {/* 5. 404 - EN ALTA */}
          <Route
            path="*"
            element={
              <Layout gunAktif={gunAktif} onGunBaslat={handleGunBaslat}>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-amber-900 mb-4">404</h1>
                    <p className="text-xl text-amber-700 mb-8">Sayfa bulunamadı</p>
                    <a 
                      href="/" 
                      className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-lg font-medium"
                    >
                      Ana Sayfaya Dön
                    </a>
                  </div>
                </div>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}