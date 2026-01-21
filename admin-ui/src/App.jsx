// ============================================================
// File: admin-ui/src/App.jsx
// TEK OTORİTE GÜN GUARD - GLOBAL MİMARİ (FINAL)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import GlobalSureBittiPopup from "./components/GlobalSureBittiPopup";
import ErrorBoundary from "./components/ErrorBoundary";
import syncService from "./services/syncService";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GunProvider, useGun } from "./context/GunContext";

/* ------------------------------------------------------------
   🔒 TEK GÜN DURUMU GUARD (GLOBAL - TEK KEZ)
------------------------------------------------------------ */
function GunDurumuGuard({ children }) {
  const location = useLocation();
  const { gunAktif } = useGun(); // ✅ GunContext'ten oku

  // Gün kapalıyken izin verilen sayfalar
  const whitelist = [
    "/ana",
    "/login",
    "/raporlar",  // ✅ Tüm rapor sayfalarına izin ver
    "/raporlar/", // ✅ Alt raporlar için de izin ver
    "/musteri-islemleri", // ✅ Müşteri işlemlerine izin ver
  ];

  const path = location.pathname;

  // Gün kapalıysa ve whitelist'te değilse ana sayfaya yönlendir
  if (!gunAktif && !whitelist.some(w => path.startsWith(w))) {
    return <Navigate to="/ana" replace />;
  }

  return children;
}

/* ------------------------------------------------------------
   PROTECTED ROUTE - SADECE LOGIN VE ROL KONTROLÜ
------------------------------------------------------------ */
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Yükleniyor...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/ana" replace />;
  }

  return children;
}

/* ------------------------------------------------------------
   GARSON GUARD
------------------------------------------------------------ */
function GarsonGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.rol !== "GARSON") {
    return <Navigate to="/ana" replace />;
  }
  return children;
}

/* ------------------------------------------------------------
   LAYOUT - SIDEBAR YÖNETİCİSİ
------------------------------------------------------------ */
function Layout({ children }) {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname.startsWith("/garson");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && typeof window !== "undefined") {
      window.syncService = syncService;
      initializedRef.current = true;
    }
  }, []);

  if (hideSidebar) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f5e7d0" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 280, padding: 25 }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   SAYFALAR
------------------------------------------------------------ */
import Login from "./pages/Login/Login.jsx";
import AnaEkran from "./pages/AnaEkran/AnaEkran.jsx";
import Masalar from "./pages/Masalar/Masalar.jsx";
import Adisyon from "./pages/Adisyon/Adisyon.jsx";
import UrunStokYonetimi from "./pages/UrunStokYonetimi/UrunStokYonetimi.jsx";
import Giderler from "./pages/Giderler/Giderler.jsx";
import Personel from "./pages/Personel/Personel.jsx";
import Ayarlar from "./pages/Ayarlar/Ayarlar.jsx";
import Bilardo from "./pages/Bilardo/Bilardo";
import BilardoAdisyon from "./pages/Bilardo/BilardoAdisyon.jsx";
import GarsonMasalar from "./pages/garson/GarsonMasalar.jsx";
import GarsonAdisyon from "./pages/garson/GarsonAdisyon.jsx";
import KasaRaporu from "./pages/Raporlar/KasaRaporu.jsx";
import BilardoRaporu from "./pages/Raporlar/BilardoRaporu.jsx";
import GenelOzet from "./pages/Raporlar/GenelOzet.jsx";
import GiderRaporu from "./pages/Raporlar/GiderRaporu.jsx";
import KategoriRaporu from "./pages/Raporlar/KategoriRaporu.jsx";
import MasaRaporu from "./pages/Raporlar/MasaRaporu.jsx";
import UrunRaporu from "./pages/Raporlar/UrunRaporu.jsx";
import MusteriIslemleri from "./pages/MusteriIslemleri/MusteriIslemleri.jsx"; // ✅ Yeni sayfa

/* ------------------------------------------------------------
   MAIN APP (GÜN GUARD İÇİNDE ÇALIŞIR)
------------------------------------------------------------ */
function MainApp() {
  const [popup, setPopup] = useState(null);

  // Bilardo süre kontrolü
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const adisyonlar = JSON.parse(
          localStorage.getItem("bilardo_adisyonlar") || "[]"
        );
        const aktif = adisyonlar.find((a) => a.durum === "ACIK");

        if (aktif && aktif.acilisZamani) {
          const gecen = Math.floor((Date.now() - aktif.acilisZamani) / 60000);
          if (
            (aktif.sureTipi === "30dk" && gecen >= 30) ||
            (aktif.sureTipi === "1saat" && gecen >= 60)
          ) {
            setPopup({
              masaNo: aktif.bilardoMasaNo,
              adisyonId: aktif.id,
              mesaj: "Bilardo süresi doldu",
            });
          }
        }
      } catch {}
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      {popup && (
        <GlobalSureBittiPopup
          data={popup}
          onClose={() => setPopup(null)}
        />
      )}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ROUTES (Auth + Rol kontrolü) */}
        
        <Route path="/ana" element={
          <ProtectedRoute>
            <Layout><AnaEkran /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/masalar" element={
          <ProtectedRoute>
            <Layout><Masalar /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/bilardo" element={
          <ProtectedRoute>
            <Layout><Bilardo /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/bilardo-adisyon/:id" element={
          <ProtectedRoute>
            <Layout><BilardoAdisyon /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/adisyon/:id" element={
          <ProtectedRoute>
            <Layout><Adisyon /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/urun-stok" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><UrunStokYonetimi /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/giderler" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><Giderler /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/personel" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><Personel /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/ayarlar" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><Ayarlar /></Layout>
          </ProtectedRoute>
        } />

        {/* ✅ MÜŞTERİ İŞLEMLERİ SAYFASI */}
        <Route path="/musteri-islemleri" element={
          <ProtectedRoute>
            <Layout><MusteriIslemleri /></Layout>
          </ProtectedRoute>
        } />

        {/* ✅ RAPOR SAYFALARI */}
        <Route path="/raporlar" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><GenelOzet /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/kasa" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><KasaRaporu /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/bilardo" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><BilardoRaporu /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/genel" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><GenelOzet /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/gider" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><GiderRaporu /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/kategori" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><KategoriRaporu /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/masa" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><MasaRaporu /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/raporlar/urun" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout><UrunRaporu /></Layout>
          </ProtectedRoute>
        } />

        {/* GARSON ROUTES */}
        <Route path="/garson" element={
          <GarsonGuard>
            <GarsonMasalar />
          </GarsonGuard>
        } />

        <Route path="/garson/adisyon/:id" element={
          <GarsonGuard>
            <GarsonAdisyon />
          </GarsonGuard>
        } />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/ana" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

/* ------------------------------------------------------------
   ROOT APP - TEK OTORİTE MİMARİSİ (GLOBAL GUARD)
------------------------------------------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ GUNPROVIDER EN ÜSTE */}
      <GunProvider>
        <AuthProvider>
          {/* ✅ GLOBAL GÜN GUARD TEK KEZ */}
          <GunDurumuGuard>
            <MainApp />
          </GunDurumuGuard>
        </AuthProvider>
      </GunProvider>
    </BrowserRouter>
  );
}