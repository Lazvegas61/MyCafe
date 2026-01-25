// ===================================================
// Sidebar.jsx – SADECE TETİKLEYİCİ (KİLİTLİ)
// ===================================================

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BilardoLogo from "../assets/mc-bilardo-small.png";
import { useGun } from "../context/GunContext";

/* --------------------------------------------------
   🎨 Tema
-------------------------------------------------- */
const RENK = {
  arka: "#4b2e05",
  hover: "#6b4210",
  secili: "#f5d085",
  yazi: "#ffffff",
  pasif: "rgba(255,255,255,0.45)",
};

/* --------------------------------------------------
   📋 Menü
-------------------------------------------------- */
const menuItems = [
  { key: "ana", label: "Ana Sayfa", path: "/ana", icon: "🏠" },
  { key: "masalar", label: "Masalar", path: "/masalar", icon: "🍽️" },
  { key: "bilardo", label: "Bilardo", path: "/bilardo", icon: "🎱" },
  { key: "musteri", label: "Müşteri İşlemleri", path: "/musteri-islemleri", icon: "👥" },
  { key: "urunstok", label: "Ürün / Stok", path: "/urun-stok", icon: "📦" },
  { key: "giderler", label: "Giderler", path: "/giderler", icon: "💸" },
  { key: "raporlar", label: "Raporlar", path: "/raporlar", icon: "📊" },
  { key: "personel", label: "Personel / Kullanıcı", path: "/personel", icon: "🧑‍🍳" },
  { key: "ayarlar", label: "Ayarlar", path: "/ayarlar", icon: "⚙️" },
];

/* ==================================================
   🧱 SIDEBAR
================================================== */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gunBaslat, gunKapat, isOpen } = useGun();

  const [visible, setVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem("mc_user") || "null");

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  const isActive = (path) => {
    if (path === "/ana") {
      return location.pathname === "/ana" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  /* --------------------------------------------------
     🚪 Gün Başı – SADECE TETİKLER
  -------------------------------------------------- */
  const onGunBasiClick = () => {
    const ok = gunBaslat();
    if (ok) {
      alert("Gün başlatıldı.");
      navigate("/ana");
    }
  };

  /* --------------------------------------------------
     🚪 Gün Sonu – SADECE TETİKLER
  -------------------------------------------------- */
  const onGunSonuClick = () => {
    const onay = window.confirm(
      "Gün sonu yapmak istediğinize emin misiniz? Bu işlem geri alınamaz."
    );
    if (!onay) return;

    const ok = gunKapat();
    if (ok) {
      alert("Gün kapatıldı.");
      navigate("/raporlar/kasa");
    }
  };

  /* --------------------------------------------------
     🚪 Çıkış
  -------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("mc_user");
    localStorage.removeItem("mc_token");
    navigate("/login");
  };

  /* ==================================================
     🖼️ UI
  ================================================== */
  return (
    <div
      style={{
        width: 280,
        background: RENK.arka,
        color: RENK.yazi,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 999,
        transform: visible ? "translateX(0)" : "translateX(-300px)",
        transition: "transform 0.35s ease-out",
      }}
    >
      {/* Sabit Üst Bölüm - Kaydırılmaz */}
      <div
        style={{
          padding: "20px 16px",
          background: RENK.arka,
        }}
      >
        {/* Gün Durumu */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.25)",
            textAlign: "center",
            fontWeight: 700,
          }}
        >
          {isOpen ? "🟢 Gün Aktif" : "🔴 Gün Kapalı"}

          {!isOpen && (
            <button
              onClick={onGunBasiClick}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📅 GÜN BAŞI
            </button>
          )}

          {isOpen && (
            <button
              onClick={onGunSonuClick}
              style={{
                marginTop: 8,
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              🔚 GÜN SONU
            </button>
          )}
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          <img
            src={BilardoLogo}
            alt="MyCafe"
            style={{ width: "100%", borderRadius: 12 }}
          />
        </div>
      </div>

      {/* Kaydırılabilir Menü Bölümü */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 20px 16px",
        }}
      >
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled =
            !isOpen &&
            item.path !== "/ana" &&
            item.path !== "/raporlar";

          return (
            <Link
              key={item.key}
              to={disabled ? "#" : item.path}
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault();
                  alert("Gün kapalıyken bu sayfaya erişilemez.");
                }
              }}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                marginBottom: 6,
                borderRadius: 12,
                textDecoration: "none",
                color: disabled
                  ? RENK.pasif
                  : active
                  ? RENK.secili
                  : RENK.yazi,
                background: active
                  ? "rgba(245,208,133,0.25)"
                  : "transparent",
                fontWeight: active ? 800 : 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <span style={{ width: 26, textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Sabit Alt Bölüm - Kaydırılmaz */}
      <div
        style={{
          padding: "0 16px 20px 16px",
          background: RENK.arka,
          marginTop: "auto",
        }}
      >
        {/* Kullanıcı Bilgisi */}
        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: "rgba(0,0,0,0.2)",
            borderRadius: 8,
            fontSize: 12,
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          👤 {user?.ad || user?.username || "Kullanıcı"}
        </div>

        {/* Çıkış */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg,#e74c3c,#c0392b)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            width: "100%",
          }}
        >
          ⏻ Çıkış
        </button>
      </div>
    </div>
  );
}