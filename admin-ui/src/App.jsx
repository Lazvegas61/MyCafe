/* ------------------------------------------------------------
   📌 App.jsx — MyCafe (FULL FINAL – SYNC SERVICE ENTEGRASYONLU)
------------------------------------------------------------ */

import React, { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
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
  
  // İlk masa verilerini oluştur - MASA NUMARALARI 1'DEN 30'A KADAR
  const initialMasalar = [];
  for (let i = 1; i <= 30; i++) {
    initialMasalar.push({
      id: i,
      no: i.toString(),  // Masa numarası string olarak (1, 2, 3, ... 30)
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
  
  localStorage.setItem("mc_masalar", JSON.stringify(initialMasalar));
  localStorage.setItem("mc_adisyonlar", JSON.stringify([]));
  localStorage.setItem("mc_musteriler", JSON.stringify([]));
  localStorage.setItem("mc_borclar", JSON.stringify([]));
}
loadInitialData();

/* ------------------------------------------------------------
   🔧 AUTO-FIX PATCH — Yeni Format Normalizasyonu
------------------------------------------------------------ */
function autoFixCategoryAndProducts() {
  let cats = JSON.parse(localStorage.getItem("mc_kategoriler") || "[]");
  let prods = JSON.parse(localStorage.getItem("mc_urunler") || "[]");

  let changed = false;

  // CATEGORY FIX
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

  // PRODUCT FIX
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
autoFixCategoryAndProducts();

/* ------------------------------------------------------------
   🔧 SYNC SERVICE ENTEGRASYONU
------------------------------------------------------------ */

// SyncService'i global olarak yükle
if (typeof window !== 'undefined') {
  window.syncService = syncService;
  console.log('🌟 SyncService global olarak yüklendi');
  
  // Test fonksiyonlarını ekle
  window.testSyncService = () => {
    if (window.syncService) {
      console.log('🧪 SyncService Test Fonksiyonları:');
      console.log('1. Masa temizleme:', window.syncService.masaBosalt ? '✅ VAR' : '❌ YOK');
      console.log('2. Kalem ekleme:', window.syncService.kalemEkleVeToplamGuncelle ? '✅ VAR' : '❌ YOK');
      console.log('3. Senkronizasyon:', window.syncService.senkronizeMasalar ? '✅ VAR' : '❌ YOK');
      
      // Tüm masaları senkronize et
      if (window.syncService.senkronizeMasalar) {
        window.syncService.senkronizeMasalar();
      }
      return true;
    }
    console.error('❌ SyncService bulunamadı!');
    return false;
  };
}

// SyncService initializasyonu - useRef ile takip edelim
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
  
  // Event listener'ları kur
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
    
    // Uygulama başladığında tüm masaları senkronize et
    setTimeout(() => {
      if (window.syncService.senkronizeMasalar) {
        window.syncService.senkronizeMasalar();
      }
    }, 1500);
  } else {
    console.warn('⚠️ SyncService.on() methodu bulunamadı, event listener\'lar kurulamadı');
  }
}

/* ------------------------------------------------------------
   📌 SAYFA IMPORTLARI — DÜZELTİLDİ
------------------------------------------------------------ */

// ANA SAYFALAR
import Login from "./pages/Login.jsx";
import AnaEkran from "./pages/AnaEkran/AnaEkran.jsx";
import Masalar from "./pages/Masalar/Masalar.jsx";
import Adisyon from "./pages/Adisyon/Adisyon.jsx";
import MusteriIslemleri from "./pages/MusteriIslemleri/MusteriIslemleri.jsx";
import UrunStokYonetimi from "./pages/UrunStokYonetimi.jsx";
import Giderler from "./pages/Giderler.jsx";
import Personel from "./pages/Personel/Personel.jsx";

// AYARLAR
import Ayarlar from "./pages/Ayarlar/Ayarlar.jsx";

// BİLARDO
import Bilardo from "./pages/Bilardo/Bilardo.jsx";

// RAPORLAR
import ReportsIndex from "./pages/reports/ReportsIndex.jsx";
import KategoriBazli from "./pages/reports/KategoriBazli.jsx";
import UrunBazli from "./pages/reports/UrunBazli.jsx";
import KasaRaporu from "./pages/reports/KasaRaporu.jsx";
import MusteriBorcRaporu from "./pages/reports/MusteriBorcRaporu.jsx";
import GiderRaporu from "./pages/reports/GiderRaporu.jsx";
import MasaDetayRaporu from "./pages/reports/MasaDetayRaporu.jsx";

// MASA DETAY
import MasaDetay from "./pages/Masalar/MasaDetay.jsx";

// HATA YAKALAYICI
import ErrorBoundary from "./components/ErrorBoundary.jsx";

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
   📌 LAYOUT — Sidebar login harici HER YERDE görünsün
------------------------------------------------------------ */
function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;
  const user = getUser();
  const hideSidebar = path === "/login";
  const initializedRef = useRef(false);

  // SyncService'i başlat - sadece bir kez
  useEffect(() => {
    if (!hideSidebar && window.syncService && !initializedRef.current) {
      initializeSyncService();
      initializedRef.current = true;
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
   🚀 ROOT APP — ANA SAYFA DÜZELTİLDİ
------------------------------------------------------------ */
export default function App() {
  const syncInitializedRef = useRef(false);

  useEffect(() => {
    ensureDemoAdmin();
    
    // Sadece bir kez başlat
    if (!syncInitializedRef.current) {
      // SyncService global event listener'larını kur
      const handleStorageChange = (event) => {
        if (event.key && event.key.startsWith('mc_')) {
          console.log('💾 Storage değişti:', event.key);
          
          // Storage değişikliğinde senkronizasyon tetikle
          if (window.syncService && window.syncService.senkronizeMasalar) {
            setTimeout(() => {
              window.syncService.senkronizeMasalar();
            }, 300);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Uygulama başlangıç senkronizasyonu - gecikmeli
      setTimeout(() => {
        if (window.syncService && window.syncService.senkronizeMasalar) {
          console.log('🔄 Uygulama başlangıç senkronizasyonu yapılıyor...');
          window.syncService.senkronizeMasalar();
        }
      }, 2000);
      
      syncInitializedRef.current = true;
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ANA SAYFA */}
          <Route
            path="/"
            element={
              <Layout>
                <AnaEkran />
              </Layout>
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />

          {/* MASALAR */}
          <Route
            path="/masalar"
            element={
              <Layout>
                <Masalar />
              </Layout>
            }
          />

          {/* ADİSYON */}
          <Route
            path="/adisyon/:id"
            element={
              <Layout>
                <Adisyon />
              </Layout>
            }
          />

          {/* MÜŞTERİ */}
          <Route
            path="/musteri-islemleri"
            element={
              <Layout>
                <MusteriIslemleri />
              </Layout>
            }
          />

          {/* ÜRÜN & STOK */}
          <Route
            path="/urun-stok"
            element={
              <Layout>
                <UrunStokYonetimi />
              </Layout>
            }
          />

          {/* GİDERLER */}
          <Route
            path="/giderler"
            element={
              <Layout>
                <Giderler />
              </Layout>
            }
          />

          {/* RAPORLAR */}
          <Route
            path="/raporlar"
            element={
              <Layout>
                <ReportsIndex />
              </Layout>
            }
          />

          <Route
            path="/raporlar/kategori-satis"
            element={
              <Layout>
                <KategoriBazli />
              </Layout>
            }
          />

          <Route
            path="/raporlar/urun-satis"
            element={
              <Layout>
                <UrunBazli />
              </Layout>
            }
          />

          <Route
            path="/raporlar/kasa"
            element={
              <Layout>
                <KasaRaporu />
              </Layout>
            }
          />

          <Route
            path="/raporlar/musteri-borc"
            element={
              <Layout>
                <MusteriBorcRaporu />
              </Layout>
            }
          />

          <Route
            path="/raporlar/gider-raporu"
            element={
              <Layout>
                <GiderRaporu />
              </Layout>
            }
          />

          <Route
            path="/raporlar/masa-detay"
            element={
              <Layout>
                <MasaDetayRaporu />
              </Layout>
            }
          />

          {/* MASA DETAY */}
          <Route
            path="/masa-detay/:id"
            element={
              <Layout>
                <MasaDetay />
              </Layout>
            }
          />

          {/* PERSONEL */}
          <Route
            path="/personel"
            element={
              <Layout>
                <Personel />
              </Layout>
            }
          />

          {/* AYARLAR */}
          <Route
            path="/ayarlar"
            element={
              <Layout>
                <Ayarlar />
              </Layout>
            }
          />

          {/* BİLARDO */}
          <Route
            path="/bilardo"
            element={
              <Layout>
                <Bilardo />
              </Layout>
            }
          />

          {/* 404 - SAYFA BULUNAMADI */}
          <Route
            path="*"
            element={
              <Layout>
                <div style={{ padding: "50px", textAlign: "center" }}>
                  <h1>404 - Sayfa Bulunamadı</h1>
                  <p>Ana sayfaya yönlendiriliyorsunuz...</p>
                </div>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}