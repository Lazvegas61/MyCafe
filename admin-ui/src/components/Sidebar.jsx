import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BilardoLogo from "../assets/mc-bilardo-small.png";
import { useGunDurumu } from "../context/GunDurumuContext";

/* --------------------------------------------------
   🎨 Tema
-------------------------------------------------- */
const RENK = {
  arka: "#4b2e05",
  hover: "#6b4210",
  secili: "#f5d085",
  yazi: "#ffffff",
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
export default function Sidebar({ gunAktif, canStartDay, canEndDay, onGunBaslat }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { gunSonuYap } = useGunDurumu();
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
     🚪 Çıkış
  -------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("mc_user");
    localStorage.removeItem("mc_token");
    navigate("/login");
  };

  /* --------------------------------------------------
     🚀 Gün Başlat
  -------------------------------------------------- */
  const handleGunBaslatClick = () => {
    if (!canStartDay) {
      alert("❌ Gün başlatma yetkiniz yok.");
      return;
    }

    if (onGunBaslat) {
      onGunBaslat();
      return;
    }

    const baslangicZamani = new Date().toISOString();

    localStorage.setItem("mycafe_gun_durumu", "aktif");
    localStorage.setItem("mycafe_gun_baslangic", baslangicZamani);
    localStorage.setItem("mycafe_gun_baslangic_kasa", "0");
    localStorage.setItem("mc_acik_adisyonlar", JSON.stringify([]));

    localStorage.setItem(
      "mycafe_gun_bilgileri",
      JSON.stringify({
        baslangicKasa: 0,
        nakitGiris: 0,
        krediKarti: 0,
        toplamAdisyon: 0,
        acikAdisyon: 0,
        gunlukSatis: 0,
        baslangicTarih: baslangicZamani,
        sonGuncelleme: baslangicZamani,
      })
    );

    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent("gunDurumuDegisti", { aktif: true });
      window.dispatchGlobalEvent("gunBaslatildi", { zaman: baslangicZamani });
    }

    alert("✅ Gün başarıyla başlatıldı.");
  };

  /* --------------------------------------------------
     🏁 Gün Sonu (TEK MOTOR)
  -------------------------------------------------- */
  const handleGunSonu = () => {
  if (!canEndDay) {
    alert("❌ Gün sonu yapma yetkiniz yok.");
    return;
  }

  if (!gunAktif) {
    alert("❌ Gün başlatılmamış.");
    return;
  }

  const onay = window.confirm(
    "GÜN SONU\n\nBugüne ait tüm veriler analiz edilecek ve gün sonu raporu oluşturulacaktır.\n\nDevam etmek istiyor musunuz?"
  );
  if (!onay) return;

  try {
    const gunBaslangic = localStorage.getItem("mycafe_gun_baslangic");
    const gunBitis = new Date().toISOString();

    // ✅ raporMotoruV2 global olarak kullan
    let rapor;
    
    if (window.raporMotoruV2 && window.raporMotoruV2.createGunSonuRaporu) {
      rapor = window.raporMotoruV2.createGunSonuRaporu(gunBaslangic, gunBitis);
    } else if (raporMotoruV2 && window.raporMotoruV2.createGunSonuRaporu) {
      // Import edilmişse onu kullan
      rapor = window.raporMotoruV2.createGunSonuRaporu(gunBaslangic, gunBitis);
    } else {
      throw new Error("Rapor motoru bulunamadı!");
    }

    localStorage.setItem("mycafe_gun_durumu", "kapali");
    gunSonuYap();

    window.dispatchEvent(
      new CustomEvent("gunSonuYapildi", { detail: rapor })
    );

    navigate(`/raporlar/gun-sonu/${rapor.id}`);
    
  } catch (err) {
    console.error("❌ Gün sonu hatası:", err);
    alert("Gün sonu oluşturulurken hata oluştu: " + err.message);
  }
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
        padding: "20px 16px",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 999,
        transform: visible ? "translateX(0)" : "translateX(-300px)",
        transition: "transform 0.35s ease-out",
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
        {gunAktif ? "🟢 Gün Aktif" : "🔴 Gün Kapalı"}
      </div>

      {!gunAktif && canStartDay && (
        <button
          onClick={handleGunBaslatClick}
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg,#2ecc71,#27ae60)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          🚀 Gün Başlat
        </button>
      )}

      {gunAktif && canEndDay && (
        <button
          onClick={handleGunSonu}
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg,#e74c3c,#c0392b)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          🏁 Gün Sonu
        </button>
      )}

      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <img
          src={BilardoLogo}
          alt="MyCafe"
          style={{ width: "100%", borderRadius: 12 }}
        />
      </div>

      {/* Menü */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled = !gunAktif && item.path !== "/ana";

          return (
            <Link
              key={item.key}
              to={disabled ? "#" : item.path}
              onClick={(e) => disabled && e.preventDefault()}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                marginBottom: 6,
                borderRadius: 12,
                textDecoration: "none",
                color: active ? RENK.secili : RENK.yazi,
                background: active ? "rgba(245,208,133,0.25)" : "transparent",
                opacity: disabled ? 0.5 : 1,
                fontWeight: active ? 800 : 600,
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
        }}
      >
        ⏻ Çıkış
      </button>
    </div>
  );
}
