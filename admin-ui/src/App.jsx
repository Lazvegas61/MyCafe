// File: admin-ui/src/App.jsx (GÜNCELLENMİŞ - ROUTE DÜZELTMELİ)
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import GlobalSureBittiPopup from "./components/GlobalSureBittiPopup";
import syncService from "./services/syncService";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GunDurumuProvider, useGunDurumu } from "./context/GunDurumuContext";
import { RaporFiltreProvider } from "@/context/RaporFiltreContext";
import "@/services/raporMotoruV2";

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

// AÇIK ADİSYONLARI SENKRONİZE ETME FONKSİYONU
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

/* ------------------------------------------------------------
   📌 GLOBAL EVENT LISTENER FONKSİYONU
------------------------------------------------------------ */
function initializeGlobalEventListeners() {
  console.log('🔔 Global event listeners başlatılıyor...');
  
  const globalEvents = {
    MASA_GUNCELLENDI: 'masaGuncellendi',
    ADISYON_GUNCELLENDI: 'adisyonGuncellendi',
    BİLARDO_ADİSYON_GUNCELLENDI: 'bilardoAdisyonGuncellendi',
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
   📌 SAYFA IMPORTLARI
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
import GarsonMasalar from "./pages/garson/GarsonMasalar.jsx";
import GarsonAdisyon from "./pages/garson/GarsonAdisyon.jsx";

/* ===== RAPORLAMA SİSTEMİ ===== */
// NOT: Raporlar artık tek bir bileşen olacak, nested route yok
import RaporlarIndex from "@/pages/Raporlar/RaporlarIndex";
import GunSonuDetay from "@/pages/Raporlar/RaporDetay/GunSonuDetay";
import KasaDetay from "@/pages/Raporlar/RaporDetay/KasaDetay";
import UrunDetay from "@/pages/Raporlar/RaporDetay/UrunDetay";
import KategoriDetay from "@/pages/Raporlar/RaporDetay/KategoriDetay";
import MasaDetayRapor from "@/pages/Raporlar/RaporDetay/MasaDetay";
import BilardoDetay from "@/pages/Raporlar/RaporDetay/BilardoDetay";
import GiderDetay from "@/pages/Raporlar/RaporDetay/GiderDetay";

/* ------------------------------------------------------------
   🔐 PROTECTED ROUTE BİLEŞENİ
------------------------------------------------------------ */
function ProtectedRoute({ children, requiredRole = null, requireAuth = true }) {
  const { user, loading } = useAuth();
  const { gunAktif } = useGunDurumu();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5e7d0"
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: "#4b2e05"
        }}>
          🔄 Yükleniyor...
        </div>
      </div>
    );
  }
  
  // Giriş yapmamışsa login'e yönlendir
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Rol kontrolü
  if (requiredRole && user?.rol !== requiredRole) {
    // Garson rolündeyse ve garson sayfalarına erişmeye çalışıyorsa izin ver
    if (user?.rol === "GARSON" && window.location.pathname.startsWith("/garson")) {
      return children;
    }
    // Admin rolündeyse tüm sayfalara erişim izni
    if (user?.rol === "ADMIN") {
      return children;
    }
    // Garson rolü için özel kontroller
    if (user?.rol === "GARSON") {
      // Garsonlar için izin verilen sayfalar
      const allowedPaths = ['/ana', '/masalar', '/adisyon', '/adisyondetay', '/bilardo', '/bilardo-adisyon'];
      const currentPath = window.location.pathname;
      
      // Eğer izin verilen bir sayfadaysa erişime izin ver
      const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));
      if (isAllowed) {
        return children;
      }
      
      // İzin verilmeyen sayfalarda ana sayfaya yönlendir
      return <Navigate to="/ana" replace />;
    }
    
    // Diğer durumlarda ana sayfaya yönlendir
    return <Navigate to="/ana" replace />;
  }
  
  return children;
}

/* ------------------------------------------------------------
   🔐 GARSON GUARD BİLEŞENİ
------------------------------------------------------------ */
function GarsonGuard({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5e7d0"
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: "#4b2e05"
        }}>
          🔄 Yükleniyor...
        </div>
      </div>
    );
  }
  
  // Sadece GARSON rolüne sahip kullanıcılar erişebilir
  if (!user || user.rol !== "GARSON") {
    return <Navigate to="/ana" replace />;
  }
  
  return children;
}

/* ------------------------------------------------------------
   📌 LAYOUT — Sidebar login harici HER YERDE görünsün
------------------------------------------------------------ */
function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user, canStartDay, canEndDay, loading } = useAuth();
  const { gunAktif, gunBaslat } = useGunDurumu();
  
  const hideSidebar = path === "/login" || path.startsWith("/garson");
  const initializedRef = useRef(false);
  const eventListenersInitializedRef = useRef(false);

  // Sayfa kontrolleri
  const isLoginPage = path === "/login";
  const isGarsonSayfasi = path.startsWith("/garson");

  // Sync service ve event listener'ları başlat
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

  // Garson sayfalarında sidebar gösterme
  if (isGarsonSayfasi) {
    return (
      <div style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f5e7d0",
        color: "#4b2e05",
      }}>
        {children}
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#f5e7d0",
          color: "#4b2e05",
        }}
      >
        {!hideSidebar && (
          <Sidebar 
            gunAktif={gunAktif}
            canStartDay={canStartDay}
            canEndDay={canEndDay}
            onGunBaslat={gunBaslat}
          />
        )}

        <div
          style={{
            flex: 1,
            marginLeft: hideSidebar ? 0 : 280,
            padding: "25px",
            transition: 'opacity 0.3s ease',
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
function MainApp() {
  const syncInitializedRef = useRef(false);
  const [globalSureBittiPopup, setGlobalSureBittiPopup] = useState(null);
  const { gunAktif, gunBaslat } = useGunDurumu();

  // İlk yüklemede verileri hazırla
  useEffect(() => {
    loadInitialData();
    autoFixCategoryAndProducts();
    ensureDemoAdmin();
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
        <RaporFiltreProvider>
          {globalSureBittiPopup && (
            <GlobalSureBittiPopup
              data={globalSureBittiPopup}
              onClose={() => setGlobalSureBittiPopup(null)}
            />
          )}
          
          <Routes>
            {/* 1. LOGIN İLK SAYFA OLSUN */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            
            {/* 2. ANA SAYFALAR */}
            <Route 
              path="/ana" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnaEkran />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* 3. DİĞER SAYFALAR - GARSON YETKİLERİ GÜNCELLENDİ */}
            <Route 
              path="/masalar" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Masalar />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/musteri-islemleri" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <MusteriIslemleri />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/urun-stok" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <UrunStokYonetimi />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/giderler" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <Giderler />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/personel" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <Personel />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ayarlar" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <Ayarlar />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bilardo" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bilardo />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* 4. PARAMETRELİ ROUTE'LAR - GARSON ERİŞEBİLİR */}
            <Route 
              path="/adisyon/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Adisyon />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/adisyondetay/:masaNo" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Adisyon />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/masa-detay/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MasaDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bilardo-adisyon/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BilardoAdisyon />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* 5. RAPORLAMA SİSTEMİ - DÜZELTİLMİŞ: NESTED ROUTE YOK, DOĞRUDAN ROUTE'LAR */}
            <Route 
              path="/raporlar" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <RaporlarIndex />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/gun-sonu" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <GunSonuDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/kasa" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <KasaDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/urun" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <UrunDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/kategori" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <KategoriDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/masa" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <MasaDetayRapor />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/bilardo" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <BilardoDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/raporlar/gider" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <GiderDetay />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* 6. GARSON SAYFALARI */}
            <Route
              path="/garson"
              element={
                <GarsonGuard>
                  <GarsonMasalar />
                </GarsonGuard>
              }
            />
            <Route
              path="/garson/adisyon/:id"
              element={
                <GarsonGuard>
                  <GarsonAdisyon />
                </GarsonGuard>
              }
            />

            {/* 7. 404 SAYFASI */}
            <Route
              path="*"
              element={
                <Layout>
                  <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f5e7d0 0%, #e8d9b5 100%)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: '#4b2e05', marginBottom: '1rem' }}>404</h1>
                      <p style={{ fontSize: '1.5rem', color: '#6b4210', marginBottom: '2rem' }}>Sayfa bulunamadı</p>
                      <button
                        onClick={() => navigate('/ana')}
                        style={{
                          padding: '0.75rem 2rem',
                          background: '#4b2e05',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(75, 46, 5, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Ana Sayfaya Dön
                      </button>
                    </div>
                  </div>
                </Layout>
              }
            />
          </Routes>
        </RaporFiltreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/* ------------------------------------------------------------
   🚀 ANA APP COMPONENT
------------------------------------------------------------ */
export default function App() {
  return (
    <AuthProvider>
      <GunDurumuProvider>
        <MainApp />
      </GunDurumuProvider>
    </AuthProvider>
  );
}