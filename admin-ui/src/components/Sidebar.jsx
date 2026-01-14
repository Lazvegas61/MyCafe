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
  { key: "ana", label: "Ana Sayfa", path: "/ana", icon: "🏠" }, // "/" yerine "/ana"
  { key: "masalar", label: "Masalar", path: "/masalar", icon: "🍽️" },
  { key: "bilardo", label: "Bilardo", path: "/bilardo", icon: "🎱" },
  { key: "musteri", label: "Müşteri İşlemleri", path: "/musteri-islemleri", icon: "👥" },
  { key: "urunstok", label: "Ürün / Stok", path: "/urun-stok", icon: "📦" },
  { key: "giderler", label: "Giderler", path: "/giderler", icon: "💸" },
  { key: "raporlar", label: "Raporlar", path: "/raporlar", icon: "📊" },
  { key: "personel", label: "Personel / Kullanıcı", path: "/personel", icon: "🧑‍🍳" },
  { key: "ayarlar", label: "Ayarlar", path: "/ayarlar", icon: "⚙️" },
];

export default function Sidebar({ gunAktif, canStartDay, canEndDay, onGunBaslat }) {
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
    // Ana sayfa için özel kontrol
    if (path === "/ana") {
      return location.pathname === "/ana" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Gün sonu fonksiyonu
  const handleGunSonu = () => {
    if (!canEndDay) {
      alert('❌ Gün sonu yapma yetkiniz yok. Sadece Admin gün sonu yapabilir.');
      return;
    }
    
    if (!gunAktif) {
      alert('❌ Gün başlatılmamış!');
      return;
    }
    
    // Açık adisyon kontrolü
    const acikAdisyonlar = JSON.parse(localStorage.getItem('mc_acik_adisyonlar') || '[]');
    
    if (acikAdisyonlar.length > 0) {
      const confirmMessage = `${acikAdisyonlar.length} açık adisyon bulunuyor. Yine de günü sonlandırmak istiyor musunuz?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    // Gün sonu raporu oluştur
    const gunSonuRaporId = `GUN_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}`;
    const baslangicZamani = new Date(localStorage.getItem('mycafe_gun_baslangic') || new Date());
    const bitisZamani = new Date();
    
    const gunVerileri = JSON.parse(localStorage.getItem('mycafe_gun_bilgileri') || '{}');
    
    const today = new Date().toISOString().split('T')[0];
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    
    const bugunkuNormalSatis = adisyonlar
      .filter(a => {
        const tarih = new Date(a.tarih || a.acilisZamani).toISOString().split('T')[0];
        return tarih === today;
      })
      .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
    
    const bugunkuBilardoSatis = bilardoAdisyonlar
      .filter(b => {
        const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
        return tarih === today;
      })
      .reduce((sum, b) => sum + (parseFloat(b.bilardoUcreti || 0) || 0), 0);
    
    const gunSonuRaporu = {
      id: gunSonuRaporId,
      baslangic: baslangicZamani.toISOString(),
      bitis: bitisZamani.toISOString(),
      sureDakika: Math.floor((bitisZamani - baslangicZamani) / 60000),
      sureSaat: Math.floor((bitisZamani - baslangicZamani) / 3600000),
      baslangicKasa: gunVerileri.baslangicKasa || 0,
      toplamCiro: bugunkuNormalSatis + bugunkuBilardoSatis,
      nakit: bugunkuNormalSatis * 0.6,
      krediKarti: bugunkuNormalSatis * 0.4,
      bilardoCiro: bugunkuBilardoSatis,
      toplamAdisyon: gunVerileri.toplamAdisyon || 0,
      acikAdisyon: acikAdisyonlar.length,
      kritikStok: 0,
      tarih: today,
      olusturulmaZamani: new Date().toISOString()
    };
    
    localStorage.setItem(`mycafe_gun_sonu_${gunSonuRaporId}`, JSON.stringify(gunSonuRaporu));
    
    const eskiGunler = JSON.parse(localStorage.getItem('mycafe_gun_sonu_listesi') || '[]');
    eskiGunler.unshift(gunSonuRaporu);
    localStorage.setItem('mycafe_gun_sonu_listesi', JSON.stringify(eskiGunler.slice(0, 30)));
    
    localStorage.setItem('mycafe_gun_durumu', 'kapali');
    
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: false });
      window.dispatchGlobalEvent('gunSonlandirildi', { 
        raporId: gunSonuRaporId,
        toplamCiro: gunSonuRaporu.toplamCiro
      });
    }
    
    alert(`✅ Gün sonlandırıldı!\n\n📊 Gün Sonu Raporu oluşturuldu:\n• Toplam Ciro: ${gunSonuRaporu.toplamCiro.toLocaleString('tr-TR')} ₺\n• Süre: ${gunSonuRaporu.sureSaat} saat ${gunSonuRaporu.sureDakika % 60} dakika`);
    
    // Gün sonu raporu sayfasına yönlendir
    navigate(`/gun-sonu-rapor/${gunSonuRaporId}`);
  };

  // Gün başlatma fonksiyonu
  const handleGunBaslatClick = () => {
    if (!canStartDay) {
      alert('❌ Gün başlatma yetkiniz yok.');
      return;
    }
    
    // Açık adisyon kontrolü (önceki günden kalan)
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    
    if (acikAdisyonlar.length > 0) {
      const confirmMessage = `${acikAdisyonlar.length} açık adisyon bulunuyor. Bunlar önceki güne ait olabilir. Günü başlatmak istiyor musunuz?\n\nNot: Bu adisyonlar otomatik olarak kapatılacak.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    // onGunBaslat fonksiyonunu çağır
    if (onGunBaslat) {
      onGunBaslat();
    } else {
      // Varsayılan gün başlatma işlemi
      const baslangicZamani = new Date();
      const baslangicKasa = 0;
      
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
      
      if (window.dispatchGlobalEvent) {
        window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: true });
        window.dispatchGlobalEvent('gunBaslatildi', { 
          zaman: baslangicZamani,
          kasa: baslangicKasa 
        });
      }
      
      console.log('✅ Gün başlatıldı:', baslangicZamani);
      alert('✅ Gün başarıyla başlatıldı!');
    }
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
      {/* Gün Durumu Göstergesi */}
      <div
        style={{
          marginBottom: 20,
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 16,
          fontWeight: 600,
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: gunAktif ? "#2ecc71" : "#e74c3c",
            boxShadow: `0 0 10px ${gunAktif ? "rgba(46, 204, 113, 0.8)" : "rgba(231, 76, 60, 0.8)"}`,
            transition: "all 0.3s ease",
          }}
        ></div>
        <span style={{ color: gunAktif ? "#f5d085" : "#ff9e7d" }}>
          {gunAktif ? 'Gün Aktif' : 'Gün Başlatılmamış'}
        </span>
      </div>

      {/* Gün Başlat Butonu */}
      {!gunAktif && canStartDay && (
        <button
          onClick={handleGunBaslatClick}
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            width: "100%",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #2ecc71, #27ae60)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)";
          }}
        >
          <span style={{ fontSize: 20 }}>🚀</span>
          <span>Gün Başlat</span>
        </button>
      )}

      {/* Gün Sonu Butonu */}
      {gunAktif && canEndDay && (
        <button
          onClick={handleGunSonu}
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            width: "100%",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #e74c3c, #c0392b)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)";
          }}
        >
          <span style={{ fontSize: 20 }}>🔴</span>
          <span>Gün Sonu</span>
        </button>
      )}

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
          // Ana sayfa hariç tüm menüler gün aktif değilse kilitli
          const disabled = !gunAktif && item.path !== "/ana";

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