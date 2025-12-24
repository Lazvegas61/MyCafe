// App.jsx - GÜNCELLENMİŞ VE HATALARI DÜZELTİLMİŞ VERSİYON
/* ------------------------------------------------------------
   📌 App.jsx — MyCafe (FINAL - YENİ RAPOR YAPISI ENTEGRE)
------------------------------------------------------------ */

import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
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

// AÇIK ADİSYONLARI SENKRONİZE ETME FONKSİYONU
function syncAcikAdisyonlar() {
  try {
    const normalAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const acikNormalAdisyonlar = normalAdisyonlar.filter(a => 
      a.durum === "ACIK" || (a.kapali !== true && a.durum !== "KAPALI")
    );
    
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const acikBilardoAdisyonlar = bilardoAdisyonlar.filter(a => 
      a.durum === "ACIK" || (a.kapali !== true && a.durum !== "KAPALI")
    );
    
    const tumAcikAdisyonlar = [
      ...acikNormalAdisyonlar.map(a => ({
        ...a,
        tur: "NORMAL",
        masaNo: a.masaNo || "Bilinmiyor",
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
function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;
  const user = getUser();
  const hideSidebar = path === "/login";
  const initializedRef = useRef(false);
  const eventListenersInitializedRef = useRef(false);

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

  return (
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
      {!hideSidebar && <Sidebar user={user} />}

      <div
        style={{
          flex: 1,
          marginLeft: hideSidebar ? 0 : 280,
          padding: "25px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   🚀 ROOT APP — ANA SAYFA (YENİ RAPOR YAPISI İLE)
------------------------------------------------------------ */
export default function App() {
  const syncInitializedRef = useRef(false);
  const [globalSureBittiPopup, setGlobalSureBittiPopup] = useState(null);

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
        {globalSureBittiPopup && (
          <GlobalSureBittiPopup
            data={globalSureBittiPopup}
            onClose={() => setGlobalSureBittiPopup(null)}
          />
        )}
        
        <Routes>
  {/* 1. ÖZEL ROUTE'LAR */}
  <Route path="/login" element={<Layout><Login /></Layout>} />
  
  {/* 2. PARAMETRELİ ROUTE'LAR */}
  <Route path="/adisyon/:id" element={<Layout><Adisyon /></Layout>} />
  <Route path="/masa-detay/:id" element={<Layout><MasaDetay /></Layout>} />
  <Route path="/bilardo-adisyon/:id" element={<Layout><BilardoAdisyon /></Layout>} />
  
  {/* 3. RAPOR ROUTE'LARI - GUNSONU RAPOR ÖNCE */}
  <Route path="/gun-sonu-rapor/:id" element={<Layout><GunSonuRapor /></Layout>} />
  
  {/* Diğer rapor route'ları */}
  <Route path="/raporlar" element={<Layout><RaporlarDashboard /></Layout>} />
  <Route path="/raporlar/dashboard" element={<Layout><RaporlarDashboard /></Layout>} />
<Route path="/raporlar/masa-analizi" element={<Layout><MasaAnalizi /></Layout>} />
  <Route path="/raporlar/gun-sonu" element={<Layout><GunSonuOzet /></Layout>} />
  <Route path="/raporlar/gun-sonu-detay" element={<Layout><GunSonuDetay /></Layout>} />
  <Route path="/raporlar/urun-bazli" element={<Layout><UrunBazliSatis /></Layout>} />
  <Route path="/raporlar/kategori-bazli" element={<Layout><KategoriBazliSatis /></Layout>} />
  <Route path="/raporlar/gunluk-giderler" element={<Layout><GunlukGiderler /></Layout>} />
  
  {/* 4. ANA SAYFALAR */}
  <Route path="/" element={<Layout><AnaEkran /></Layout>} />
  <Route path="/ana" element={<Layout><AnaEkran /></Layout>} />
  <Route path="/masalar" element={<Layout><Masalar /></Layout>} />
  <Route path="/musteri-islemleri" element={<Layout><MusteriIslemleri /></Layout>} />
  <Route path="/urun-stok" element={<Layout><UrunStokYonetimi /></Layout>} />
  <Route path="/giderler" element={<Layout><Giderler /></Layout>} />
  <Route path="/personel" element={<Layout><Personel /></Layout>} />
  <Route path="/ayarlar" element={<Layout><Ayarlar /></Layout>} />
  <Route path="/bilardo" element={<Layout><Bilardo /></Layout>} />
  
  {/* 5. 404 - EN ALTA */}
  <Route
    path="*"
    element={
      <Layout>
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