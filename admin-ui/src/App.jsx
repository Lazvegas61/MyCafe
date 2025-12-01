import "./dashboard.css";
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

// --- INITIAL IMPORT SYSTEM ---
import categoriesData from "./data/initial_categories.json";
import productsData from "./data/initial_products.json";

function loadInitialData() {
  const hasData = localStorage.getItem("mc_data_updated");
  if (hasData) return; // Zaten yüklenmişse dokunma

  console.log("🔄 İlk kurulum: kategori + ürün verileri localStorage'a yükleniyor...");

  localStorage.setItem("mc_kategoriler", JSON.stringify(categoriesData));
  localStorage.setItem("mc_urunler", JSON.stringify(productsData));
  localStorage.setItem("mc_data_updated", "1");

  console.log("✅ İlk kurulum tamamlandı.");
}

loadInitialData();
// ------------------------------------------------------------
//   🛠 AUTO-FIX: ESKİ FORMAT -> YENİ FORMAT DÖNÜŞTÜRME PATCHİ
// ------------------------------------------------------------
function autoFixCategoryAndProducts() {
  let cats = JSON.parse(localStorage.getItem("mc_kategoriler") || "[]");
  let prods = JSON.parse(localStorage.getItem("mc_urunler") || "[]");

  let changed = false;

  // CATEGORY FIX -------------------------------------------------
  cats = cats.map((c, index) => {
    let updated = { ...c };

    // ID yoksa ata
    if (!updated.id) {
      updated.id = index + 1;
      changed = true;
    }

    // parentId yoksa null ata
    if (updated.parentId === undefined) {
      updated.parentId = null;
      changed = true;
    }

    // Sipariş Yemek kategorisini koru
    if (updated.name?.toLowerCase().includes("sipariş yemek")) {
      updated.isSiparisYemek = true;
    } else {
      updated.isSiparisYemek = updated.isSiparisYemek || false;
    }

    return updated;
  });

  // ÜRÜN FIX -------------------------------------------------------
  prods = prods.map((p, index) => {
    let updated = { ...p };

    // ID yoksa ata
    if (!updated.id) {
      updated.id = Date.now() + index;
      changed = true;
    }

    // Kategori bağlama (categoryName -> categoryId)
    if (!updated.categoryId) {
      const cat = cats.find(
        (c) => c.name?.toLowerCase() === updated.categoryName?.toLowerCase()
      );
      if (cat) {
        updated.categoryId = cat.id;
        changed = true;
      }
    }

    // Sayısal dönüşümler
    updated.salePrice = Number(updated.salePrice || 0);
    updated.costPrice = Number(updated.costPrice || 0);
    updated.stock = Number(updated.stock || 0);
    updated.critical = Number(updated.critical || 0);

    return updated;
  });

  // KAYDET ----------------------------------------------------------
  if (changed) {
    console.log("🔧 AUTO-FIX PATCH ÇALIŞTI → Yeni format kaydedildi.");
    localStorage.setItem("mc_kategoriler", JSON.stringify(cats));
    localStorage.setItem("mc_urunler", JSON.stringify(prods));

    // Menü & adisyon için veri güncellendi
    localStorage.setItem("mc_data_updated", "1");

    // Adisyon sayfasına ürünlerin düşmesi için sayfayı yenile
    window.location.reload();
  }
}

autoFixCategoryAndProducts();


// --- SAYFALAR ---
import Login from "./pages/Login";
import AnaEkran from "./pages/AnaEkran";
import Masalar from "./pages/Masalar";
import Adisyon from "./pages/Adisyon";
import MusteriIslemleri from "./pages/MusteriIslemleri";
import UrunStokYonetimi from "./pages/UrunStokYonetimi";
import Giderler from "./pages/Giderler";
import Bilardo from "./pages/bilardo/Bilardo";
import ReportsIndex from "./pages/reports/ReportsIndex";
import Personel from "./pages/personel/Personel";
import Ayarlar from "./pages/ayarlar/Ayarlar";

// --- RAPORLAR ---
import KategoriBazli from "./pages/reports/KategoriBazli";
import UrunBazli from "./pages/reports/UrunBazli";
import KasaRaporu from "./pages/reports/KasaRaporu";
import MusteriBorcRaporu from "./pages/reports/MusteriBorcRaporu";
import GiderRaporu from "./pages/reports/GiderRaporu";
import MasaDetayRaporu from "./pages/reports/MasaDetayRaporu";

// --- DEMO MODU SABİT ADMIN KULLANICISI ---
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
  } catch (err) {
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

// ------------------------------------------------
// LAYOUT
// ------------------------------------------------
function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;

  const user = getUser();
  const role = user?.role || null;

  const hideSidebar = path === "/" || path === "/login";
  const isBilardo = path === "/bilardo";

  // GARSON
  if (user) {
    if (role === "GARSON") {
      const allowed = ["/masalar", "/giderler"];
      const starts = ["/adisyon/"];
      const isAllowed =
        allowed.includes(path) || starts.some((p) => path.startsWith(p));
      if (!isAllowed) return <Navigate to="/masalar" replace />;
    }

    // MUTFAK
    if (role === "MUTFAK") {
      const allowed = ["/masalar"];
      const starts = ["/adisyon/"];
      const isAllowed =
        allowed.includes(path) || starts.some((p) => path.startsWith(p));
      if (!isAllowed) return <Navigate to="/masalar" replace />;
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f5e7d0",
        color: "#4b2e05",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {!hideSidebar && <Sidebar user={user} />}

      <div
        style={{
          flex: 1,
          marginLeft: hideSidebar ? 0 : 280,
          width: hideSidebar ? "100%" : "calc(100% - 280px)",
          height: isBilardo ? "auto" : "100vh",
          overflowY: isBilardo ? "visible" : "auto",
          background: "#f5e7d0",
          padding: "25px",
          transition: "margin-left 0.2s ease",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------
// ROOT APP
// ------------------------------------------------
export default function App() {
  ensureDemoAdmin();

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />

        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />

        {/* ANA SAYFA */}
        <Route
          path="/ana"
          element={
            <Layout>
              <AnaEkran />
            </Layout>
          }
        />

        {/* MASALAR */}
        <Route
          path="/masalar"
          element={
            <Layout>
              <Masalar
                onOpenAdisyon={({ masaId }) => {
                  window.history.pushState({}, "", `/adisyon/${masaId}`);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
              />
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

        {/* MÜŞTERİ İŞLEMLERİ */}
        <Route
          path="/musteri-islemleri"
          element={
            <Layout>
              <MusteriIslemleri />
            </Layout>
          }
        />

        {/* ÜRÜN - STOK */}
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

        {/* RAPORLAR ANA MENU */}
        <Route
          path="/raporlar"
          element={
            <Layout>
              <ReportsIndex />
            </Layout>
          }
        />

        {/* RAPORLAR */}
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

        {/* ⭐ BİLARDO ⭐ */}
        <Route
          path="/bilardo"
          element={
            <Layout>
              <Bilardo />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
