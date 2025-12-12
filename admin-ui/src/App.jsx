/* ------------------------------------------------------------
   📌 App.jsx — MyCafe (FULL FINAL – IMPORT DÜZELTMELERİ)
------------------------------------------------------------ */

import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

/* ------------------------------------------------------------
   🔧 İlk Kurulum Verileri
------------------------------------------------------------ */
import categoriesData from "./data/initial_categories.json";
import productsData from "./data/initial_products.json";

function loadInitialData() {
  const hasData = localStorage.getItem("mc_data_updated");
  if (hasData) return;

  localStorage.setItem("mc_kategoriler", JSON.stringify(categoriesData));
  localStorage.setItem("mc_urunler", JSON.stringify(productsData));
  localStorage.setItem("mc_data_updated", "1");
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
    window.location.reload();
  }
}
autoFixCategoryAndProducts();

/* ------------------------------------------------------------
   📌 SAYFA IMPORTLARI — DÜZELTİLDİ
------------------------------------------------------------ */

// ANA SAYFALAR
import Login from "./pages/Login.jsx";
// ANA EKRAN IMPORT'U DÜZELTİLDİ
import AnaEkran from "./pages/AnaEkran/AnaEkran.jsx"; // BU DOĞRU OLMALI
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
  ensureDemoAdmin();

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