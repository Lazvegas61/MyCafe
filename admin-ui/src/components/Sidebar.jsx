import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BilardoLogo from "../assets/mc-bilardo-small.png";

const RENK = {
  arka: "#4b2e05",
  hover: "#6b4210",
  secili: "#f5d085",
  yazi: "#ffffff",
};

const menuItems = [
  { key: "ana", label: "Ana Sayfa", path: "/", icon: "🏠" },
  { key: "masalar", label: "Masalar", path: "/masalar", icon: "🍽️" },
  { key: "bilardo", label: "Bilardo", path: "/bilardo", icon: "🎱" },
  { key: "musteri", label: "Müşteri İşlemleri", path: "/musteri-islemleri", icon: "👥" },
  { key: "urunstok", label: "Ürün / Stok", path: "/urun-stok", icon: "📦" },
  { key: "giderler", label: "Giderler", path: "/giderler", icon: "💸" },
  { key: "raporlar", label: "Raporlar", path: "/raporlar", icon: "📊" },
  { key: "personel", label: "Personel / Kullanıcı", path: "/personel", icon: "🧑‍🍳" },
  { key: "ayarlar", label: "Ayarlar", path: "/ayarlar", icon: "⚙️" },
];

export default function Sidebar({ gunAktif }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem("mc_user") || "null");

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mc_user");
    localStorage.removeItem("mc_token");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/ana";
    }
    return location.pathname.startsWith(path);
  };

  // Kullanıcı giriş yapmamışsa sidebar'ı gösterme
  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        width: 280,
        background: RENK.arka,
        color: RENK.yazi,
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
        boxSizing: "border-box",
        boxShadow: "6px 0 18px rgba(0,0,0,0.45)",
        zIndex: 999,
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transform: visible ? "translateX(0)" : "translateX(-300px)",
        transition: "transform 0.35s ease-out",
      }}
    >
      <div
        style={{
          marginBottom: 25,
          padding: 12,
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(245,208,133,0.95), rgba(228,184,110,0.9))",
          boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={BilardoLogo}
          alt="MyCafe Bilardo"
          style={{
            width: "100%",
            borderRadius: 14,
            objectFit: "contain",
          }}
        />
      </div>

      <div style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled = !gunAktif && item.path !== "/" && item.path !== "/ana";

          return (
            <Link 
              key={item.key} 
              to={disabled ? "#" : item.path} 
              style={{ textDecoration: "none" }}
              onClick={(e) => disabled && e.preventDefault()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 14px",
                  marginBottom: 8,
                  borderRadius: 14,
                  cursor: disabled ? "not-allowed" : "pointer",
                  background: active ? "rgba(245,208,133,0.25)" : "transparent",
                  boxShadow: active
                    ? "0 0 0 2px rgba(245,208,133,0.85), 0 4px 10px rgba(0,0,0,0.35)"
                    : "none",
                  color: active ? RENK.secili : (disabled ? "rgba(255,255,255,0.4)" : RENK.yazi),
                  fontWeight: active ? 800 : 550,
                  transition: "all 0.14s ease",
                  fontSize: 18,
                  opacity: disabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!active && !disabled) e.currentTarget.style.background = RENK.hover;
                }}
                onMouseLeave={(e) => {
                  if (!active && !disabled) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ 
                  fontSize: 24, 
                  width: 28, 
                  textAlign: "center",
                  opacity: disabled ? 0.5 : 1
                }}>
                  {item.icon}
                </div>

                <div style={{ letterSpacing: 0.4 }}>
                  {item.label}
                  {disabled && (
                    <span style={{
                      fontSize: '12px',
                      marginLeft: '8px',
                      color: 'rgba(255,255,255,0.5)',
                      fontStyle: 'italic'
                    }}>
                      (kilitli)
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 16,
          padding: "14px 14px",
          width: "100%",
          borderRadius: 16,
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #e74c3c, #c0392b)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 6px 14px rgba(0,0,0,0.45)",
        }}
      >
        <span style={{ fontSize: 24 }}>⏻</span>
        <span>Çıkış</span>
      </button>
    </div>
  );
}