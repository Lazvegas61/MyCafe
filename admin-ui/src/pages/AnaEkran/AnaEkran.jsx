import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGun } from "../../context/GunContext";
import "./AnaEkran.css";

// Premium renkler
const RENK = {
  zemin: "#e5cfa5",
  kart: "#f9edd7",
  kartYazi: "#4a3722",
  altin: "#f5d085",
  yesil: "#2ecc71",
  kirmizi: "#c0392b",
  griYazi: "#7f8c8d",
  bilardoMavi: "#3498db",
  bilardoYesil: "#27ae60"
};

// ======================================================
//                     UTILITY FUNCTIONS
// ======================================================
const formatTL = (val) => Number(val || 0).toFixed(2) + " ₺";
const bugunStr = () => new Date().toISOString().split("T")[0];

/**
 * Timestamp veya string tarihten gün ID'sini al
 */
const tarihToGunId = (tarih) => {
  if (!tarih) return bugunStr();
  
  try {
    // Eğer timestamp (number) ise
    if (typeof tarih === 'number') {
      const date = new Date(tarih);
      return date.toISOString().split('T')[0];
    }
    
    // Eğer string ise
    if (typeof tarih === 'string') {
      // ISO formatı mı?
      if (tarih.includes('T')) {
        return tarih.split('T')[0];
      }
      
      // Timestamp string'i mi?
      if (!isNaN(Number(tarih))) {
        const date = new Date(Number(tarih));
        return date.toISOString().split('T')[0];
      }
      
      // Doğrudan tarih mi? (YYYY-MM-DD)
      if (tarih.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return tarih;
      }
    }
    
    // Date objesi ise
    if (tarih instanceof Date) {
      return tarih.toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn('Tarih parse hatası:', error, 'tarih:', tarih);
  }
  
  return bugunStr();
};

/**
 * Adisyondan gün ID'sini al (typo-safe)
 */
const getAdisyonGunId = (adisyon) => {
  if (!adisyon) return bugunStr();
  
  // 1. Önce gunId'yi dene
  if (adisyon.gunId) return adisyon.gunId;
  
  // 2. Sonra gunld'yi dene (typo için)
  if (adisyon.gunld) return adisyon.gunld;
  
  // 3. Sonra kapanış zamanından
  if (adisyon.kapanisZamani) {
    return tarihToGunId(adisyon.kapanisZamani);
  }
  
  // 4. Sonra açılış zamanından
  if (adisyon.acilisZamani) {
    return tarihToGunId(adisyon.acilisZamani);
  }
  
  // 5. Son çare: bugün
  return bugunStr();
};

/**
 * Adisyon kapalı mı kontrol et
 */
const isAdisyonKapali = (adisyon) => {
  if (!adisyon) return true;
  
  // 1. kapali alanı
  if (adisyon.kapali === true) return true;
  
  // 2. status alanı
  if (adisyon.status) {
    const status = adisyon.status.toUpperCase();
    if (status === "CLOSED" || status === "KAPALI") return true;
  }
  
  // 3. durum alanı
  if (adisyon.durum) {
    const durum = adisyon.durum.toUpperCase();
    if (durum === "CLOSED" || durum === "KAPALI") return true;
  }
  
  return false;
};

/**
 * Adisyon toplam tutarını hesapla
 */
const getAdisyonToplam = (adisyon) => {
  if (!adisyon) return 0;
  
  let toplam = 0;
  
  // 1. Önce toplamTutar'dan dene
  if (adisyon.toplamTutar) {
    toplam = Number(adisyon.toplamTutar);
  }
  
  // 2. Hala 0 ise, cache'ten dene
  if (toplam === 0 && localStorage.getItem(`mc_adisyon_toplam_${adisyon.id}`)) {
    toplam = Number(localStorage.getItem(`mc_adisyon_toplam_${adisyon.id}`));
  }
  
  // 3. Hala 0 ise, kalemlerden hesapla
  if (toplam === 0 && adisyon.kalemler && Array.isArray(adisyon.kalemler)) {
    toplam = adisyon.kalemler.reduce((sum, kalem) => {
      const fiyat = Number(kalem.birimFiyat || kalem.fiyat || 0);
      const adet = Number(kalem.adet || kalem.miktar || 1);
      return sum + (fiyat * adet);
    }, 0);
    
    // Cache'e kaydet
    if (toplam > 0) {
      localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplam.toString());
    }
  }
  
  return toplam;
};

/**
 * Masa numarasını normalize et
 */
const getMasaNoFromAdisyon = (adisyon) => {
  if (!adisyon) return "0";
  
  // 1. masaNo'dan ("MASA 1" formatı)
  if (adisyon.masaNo) {
    const match = adisyon.masaNo.match(/MASA\s*(\d+)/);
    if (match) return match[1];
    return adisyon.masaNo.replace("MASA ", "");
  }
  
  // 2. masaNum'dan
  if (adisyon.masaNum) {
    return adisyon.masaNum.toString();
  }
  
  return "0";
};

/**
 * BİLARDO: Bilardo adisyonundan gün ID'sini al (FIXED - timestamp safe)
 */
const getBilardoAdisyonGunId = (bilardoAdisyon) => {
  if (!bilardoAdisyon) return bugunStr();
  
  // 1. gunId veya gunld
  if (bilardoAdisyon.gunId) return tarihToGunId(bilardoAdisyon.gunId);
  if (bilardoAdisyon.gunld) return tarihToGunId(bilardoAdisyon.gunld);
  
  // 2. Açılış zamanından (FIXED: split() hatası için)
  if (bilardoAdisyon.acilisZamani) {
    return tarihToGunId(bilardoAdisyon.acilisZamani);
  }
  
  return bugunStr();
};

/**
 * BİLARDO: Bilardo adisyonu kapalı mı?
 */
const isBilardoAdisyonKapali = (bilardoAdisyon) => {
  if (!bilardoAdisyon) return true;
  
  if (bilardoAdisyon.durum === "KAPANDI") return true;
  if (bilardoAdisyon.kapali === true) return true;
  
  return false;
};

/**
 * BİLARDO: Bilardo adisyonu toplamını hesapla
 */
const getBilardoAdisyonToplam = (bilardoAdisyon) => {
  if (!bilardoAdisyon) return 0;
  
  // 1. Önce toplamTutar'dan dene
  if (bilardoAdisyon.toplamTutar) {
    return Number(bilardoAdisyon.toplamTutar);
  }
  
  let toplam = 0;
  
  // 2. Bilardo ücreti
  if (bilardoAdisyon.bilardoUcret) {
    toplam += Number(bilardoAdisyon.bilardoUcret);
  } else if (bilardoAdisyon.hesaplananUcret) {
    toplam += Number(bilardoAdisyon.hesaplananUcret);
  }
  
  // 3. Ek ürünler
  if (bilardoAdisyon.ekUrunler && Array.isArray(bilardoAdisyon.ekUrunler)) {
    toplam += bilardoAdisyon.ekUrunler.reduce((sum, urun) => {
      return sum + (Number(urun.fiyat || 0) * Number(urun.adet || 1));
    }, 0);
  }
  
  return toplam;
};

// ======================================================
//                     MAIN COMPONENT
// ======================================================
const AnaEkran = () => {
  const navigate = useNavigate();
  const { gun, gunAktif } = useGun();

  const [dashboard, setDashboard] = useState({
    gunlukGelir: 0,
    gunlukGider: 0,
    netKasa: 0,
    acikAdisyonlar: [],
    kritikStoklar: [],
    gunlukGiderler: [],
    sonYenileme: new Date(),
    aktifGunId: "",
    acikAdisyonSayisi: 0,
    kapaliAdisyonSayisi: 0,
    toplamAdisyonSayisi: 0,
    bilardoAnalizi: {
      acik: 0,
      kapali: 0,
      toplam: 0
    }
  });

  // ======================================================
  //              YENİ VERİ OKUMA SİSTEMİ (BİLARDO DAHİL)
  // ======================================================
  const okuDashboard = () => {
    console.log('🔍 AnaEkran: Veriler okunuyor (Bilardo dahil)...');
    
    // 1. AKTİF GÜN ID'sini al
    const aktifGunId = gun?.gunId || bugunStr();
    console.log('📅 Aktif Gün:', { aktifGunId, gunAktif });
    
    try {
      // 2. TÜM VERİLERİ AL
      const adisyonlarStr = localStorage.getItem("mc_adisyonlar");
      const adisyonlar = adisyonlarStr ? JSON.parse(adisyonlarStr) : [];
      
      const finansHavuzuStr = localStorage.getItem("mc_finans_havuzu");
      const finansHavuzu = finansHavuzuStr ? JSON.parse(finansHavuzuStr) : [];
      
      const stoklarStr = localStorage.getItem("mc_urunler");
      const stoklar = stoklarStr ? JSON.parse(stoklarStr) : [];
      
      // 3. BİLARDO ADİSYONLARINI AL
      const bilardoAdisyonlarStr = localStorage.getItem("bilardo_adisyonlar");
      let bilardoAdisyonlar = [];
      
      try {
        bilardoAdisyonlar = bilardoAdisyonlarStr ? JSON.parse(bilardoAdisyonlarStr) : [];
      } catch (error) {
        console.error('❌ Bilardo adisyonları parse hatası:', error);
        bilardoAdisyonlar = [];
      }
      
      console.log('📊 Veri Sayıları:', {
        adisyonlar: adisyonlar.length,
        bilardoAdisyonlar: bilardoAdisyonlar.length,
        finansHavuzu: finansHavuzu.length,
        stoklar: stoklar.length
      });

      // ======================================================
      // 4. NORMAL ADİSYON ANALİZİ
      // ======================================================
      const adisyonAnalizi = {
        tumAdisyonlar: adisyonlar.length,
        acikAdisyonlar: [],
        kapaliAdisyonlar: []
      };
      
      adisyonlar.forEach(ad => {
        try {
          const adisyonGunu = getAdisyonGunId(ad);
          const kapali = isAdisyonKapali(ad);
          const toplam = getAdisyonToplam(ad);
          
          if (kapali) {
            adisyonAnalizi.kapaliAdisyonlar.push({ ...ad, adisyonGunu, toplam });
          } else {
            adisyonAnalizi.acikAdisyonlar.push({ ...ad, adisyonGunu, toplam });
          }
        } catch (error) {
          console.warn('❌ Adisyon parse hatası:', error, ad);
        }
      });
      
      // ======================================================
      // 5. BİLARDO ADİSYON ANALİZİ (TRY-CATCH ile güvenli)
      // ======================================================
      const bilardoAnalizi = {
        tumBilardoAdisyonlar: bilardoAdisyonlar.length,
        acikBilardoAdisyonlar: [],
        kapaliBilardoAdisyonlar: []
      };
      
      bilardoAdisyonlar.forEach(ad => {
        try {
          const adisyonGunu = getBilardoAdisyonGunId(ad);
          const kapali = isBilardoAdisyonKapali(ad);
          const toplam = getBilardoAdisyonToplam(ad);
          
          if (kapali) {
            bilardoAnalizi.kapaliBilardoAdisyonlar.push({ ...ad, adisyonGunu, toplam });
          } else {
            bilardoAnalizi.acikBilardoAdisyonlar.push({ ...ad, adisyonGunu, toplam });
          }
        } catch (error) {
          console.warn('❌ Bilardo adisyon parse hatası:', error, ad);
        }
      });
      
      console.log('📈 Adisyon Analizi:', {
        normal: {
          toplam: adisyonAnalizi.tumAdisyonlar,
          acik: adisyonAnalizi.acikAdisyonlar.length,
          kapali: adisyonAnalizi.kapaliAdisyonlar.length
        },
        bilardo: {
          toplam: bilardoAnalizi.tumBilardoAdisyonlar,
          acik: bilardoAnalizi.acikBilardoAdisyonlar.length,
          kapali: bilardoAnalizi.kapaliBilardoAdisyonlar.length
        }
      });

      // ======================================================
      // 6. GÜNLÜK GELİR HESAPLA (NORMAL + BİLARDO)
      // ======================================================
      // Normal kapalı adisyonlar
      const aktifGunKapaliAdisyonlar = adisyonAnalizi.kapaliAdisyonlar.filter(
        ad => ad.adisyonGunu === aktifGunId
      );
      
      const normalGelir = aktifGunKapaliAdisyonlar.reduce(
        (toplam, ad) => toplam + ad.toplam, 0
      );
      
      // Bilardo kapalı adisyonlar
      const aktifGunKapaliBilardoAdisyonlar = bilardoAnalizi.kapaliBilardoAdisyonlar.filter(
        ad => ad.adisyonGunu === aktifGunId
      );
      
      const bilardoGelir = aktifGunKapaliBilardoAdisyonlar.reduce(
        (toplam, ad) => toplam + ad.toplam, 0
      );
      
      // TOPLAM GELİR = Normal + Bilardo
      const gunlukGelir = normalGelir + bilardoGelir;
      
      console.log('💰 Günlük Gelir Hesaplandı:', {
        normalAdisyon: aktifGunKapaliAdisyonlar.length,
        bilardoAdisyon: aktifGunKapaliBilardoAdisyonlar.length,
        normalGelir: normalGelir,
        bilardoGelir: bilardoGelir,
        toplamGelir: gunlukGelir
      });

      // ======================================================
      // 7. GÜNLÜK GİDER HESAPLA
      // ======================================================
      let gunlukGider = 0;
      const gunlukGiderler = [];
      
      finansHavuzu.forEach(item => {
        try {
          if (!item.tarih || !item.tur) return;
          
          const tarih = tarihToGunId(item.tarih);
          const tur = item.tur.toUpperCase();
          
          if (tarih === aktifGunId && (tur === "GIDER" || tur === "MANUEL_GIDER")) {
            const tutar = Number(item.tutar || 0);
            gunlukGider += tutar;
            
            gunlukGiderler.push({
              id: item.id || Date.now().toString(),
              aciklama: item.aciklama || "Gider",
              tutar: tutar
            });
          }
        } catch (error) {
          console.warn('❌ Finans hareketi parse hatası:', error, item);
        }
      });
      
      const netKasa = gunlukGelir - gunlukGider;

      // ======================================================
      // 8. AÇIK ADİSYONLAR (NORMAL + BİLARDO)
      // ======================================================
      const acikAdisyonlar = [];
      
      // NORMAL açık adisyonlar
      const aktifGunAcikAdisyonlar = adisyonAnalizi.acikAdisyonlar.filter(
        ad => ad.adisyonGunu === aktifGunId
      );
      
      aktifGunAcikAdisyonlar.forEach(ad => {
        try {
          const masaNo = getMasaNoFromAdisyon(ad);
          
          // Masa toplamını güncelle
          if (masaNo !== "0") {
            localStorage.setItem(`mc_masa_toplam_${masaNo}`, ad.toplam.toString());
          }
          
          acikAdisyonlar.push({
            id: ad.id,
            masaNo: masaNo,
            toplam: ad.toplam,
            acilisZamani: ad.acilisZamani,
            musteriAdi: ad.musteriAdi,
            tip: "NORMAL",
            icon: "🪑"
          });
        } catch (error) {
          console.warn('❌ Normal adisyon parse hatası:', error, ad);
        }
      });
      
      // BİLARDO açık adisyonlar
      const aktifGunAcikBilardoAdisyonlar = bilardoAnalizi.acikBilardoAdisyonlar.filter(
        ad => ad.adisyonGunu === aktifGunId
      );
      
      aktifGunAcikBilardoAdisyonlar.forEach(ad => {
        try {
          const masaNo = ad.bilardoMasaNo || `Bilardo ${ad.bilardoMasaId || ""}`.trim();
          
          acikAdisyonlar.push({
            id: ad.id,
            masaNo: masaNo || "Bilardo",
            toplam: ad.toplam,
            acilisZamani: ad.acilisZamani,
            musteriAdi: ad.musteriAdi,
            tip: "BİLARDO",
            icon: "🎱",
            sureTipi: ad.sureTipi,
            bilardoUcret: ad.bilardoUcret || ad.hesaplananUcret
          });
        } catch (error) {
          console.warn('❌ Bilardo adisyon parse hatası:', error, ad);
        }
      });
      
      console.log('📊 Açık Adisyonlar:', {
        normal: aktifGunAcikAdisyonlar.length,
        bilardo: aktifGunAcikBilardoAdisyonlar.length,
        toplam: acikAdisyonlar.length
      });

      // ======================================================
      // 9. DASHBOARD'U GÜNCELLE (KRİTİK STOKLAR KALDIRILDI)
      // ======================================================
      const yeniDashboard = {
        gunlukGelir,
        gunlukGider,
        netKasa,
        acikAdisyonlar,
        gunlukGiderler,
        sonYenileme: new Date(),
        aktifGunId,
        acikAdisyonSayisi: acikAdisyonlar.length,
        kapaliAdisyonSayisi: aktifGunKapaliAdisyonlar.length + aktifGunKapaliBilardoAdisyonlar.length,
        toplamAdisyonSayisi: adisyonlar.length + bilardoAdisyonlar.length,
        bilardoAnalizi: {
          acik: aktifGunAcikBilardoAdisyonlar.length,
          kapali: aktifGunKapaliBilardoAdisyonlar.length,
          toplam: bilardoAdisyonlar.length,
          gelir: bilardoGelir
        },
        normalAnalizi: {
          acik: aktifGunAcikAdisyonlar.length,
          kapali: aktifGunKapaliAdisyonlar.length,
          toplam: adisyonlar.length,
          gelir: normalGelir
        }
      };
      
      console.log('✅ AnaEkran Dashboard Güncellendi:', {
        gelir: gunlukGelir,
        gider: gunlukGider,
        net: netKasa,
        acikAdisyon: acikAdisyonlar.length,
        kapaliAdisyon: aktifGunKapaliAdisyonlar.length + aktifGunKapaliBilardoAdisyonlar.length,
        normalGelir: normalGelir,
        bilardoGelir: bilardoGelir
      });
      
      setDashboard(yeniDashboard);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in okuDashboard:', error);
      // Hata durumunda boş dashboard göster
      setDashboard({
        gunlukGelir: 0,
        gunlukGider: 0,
        netKasa: 0,
        acikAdisyonlar: [],
        gunlukGiderler: [],
        sonYenileme: new Date(),
        aktifGunId: gun?.gunId || bugunStr(),
        acikAdisyonSayisi: 0,
        kapaliAdisyonSayisi: 0,
        toplamAdisyonSayisi: 0,
        bilardoAnalizi: { acik: 0, kapali: 0, toplam: 0, gelir: 0 },
        normalAnalizi: { acik: 0, kapali: 0, toplam: 0, gelir: 0 }
      });
    }
  };

  // ======================================================
  //                     EFFECTS
  // ======================================================
  useEffect(() => {
    // İlk yükleme
    okuDashboard();

    // Her 30 saniyede bir yenile
    const interval = setInterval(okuDashboard, 30000);

    // Event dinleyiciler
    const handleAdisyonDegisti = () => {
      console.log('📢 Adisyon değişikliği algılandı, dashboard yenileniyor...');
      setTimeout(okuDashboard, 100);
    };
    
    const handleBilardoDegisti = () => {
      console.log('🎱 Bilardo değişikliği algılandı, dashboard yenileniyor...');
      setTimeout(okuDashboard, 100);
    };
    
    const handleGunDegisti = () => {
      console.log('📢 Gün değişikliği algılandı, dashboard yenileniyor...');
      setTimeout(okuDashboard, 100);
    };

    window.addEventListener("adisyonDegisti", handleAdisyonDegisti);
    window.addEventListener("bilardoDegisti", handleBilardoDegisti);
    window.addEventListener("gunDurumuDegisti", handleGunDegisti);

    return () => {
      clearInterval(interval);
      window.removeEventListener("adisyonDegisti", handleAdisyonDegisti);
      window.removeEventListener("bilardoDegisti", handleBilardoDegisti);
      window.removeEventListener("gunDurumuDegisti", handleGunDegisti);
    };
  }, [gun]);

  // ======================================================
  //                     RENDER
  // ======================================================
  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #f9e3b4, #e5cfa5 50%, #d3b98b)",
        minHeight: "100vh",
        padding: "38px 48px",
        boxSizing: "border-box",
      }}
    >
      {/* ÜST BAŞLIK */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8e1b6, #e2b66a)",
          borderRadius: 26,
          padding: "28px 36px",
          marginBottom: 32,
          boxShadow: "0 14px 26px rgba(0,0,0,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "#4a3016",
              marginRight: 8,
            }}
          >
            MyCafe
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#6a4a27" }}>
             Yönetim Paneli 
          </span>
        </div>
        
        {/* Son yenileme bilgisi */}
        <div style={{ fontSize: 14, color: "#7f5539" }}>
          Son yenileme: {dashboard.sonYenileme.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* GÜN DURUMU BİLGİSİ (SADELEŞTİRİLMİŞ) */}
      <div style={{
        marginBottom: "20px",
        padding: "15px 20px",
        borderRadius: "16px",
        background: gunAktif ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)",
        border: `2px solid ${gunAktif ? "#27ae60" : "#e74c3c"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "28px", color: gunAktif ? "#27ae60" : "#e74c3c" }}>
            {gunAktif ? "✅" : "⚠️"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: gunAktif ? "#27ae60" : "#e74c3c" }}>
              {gunAktif ? 'Gün Aktif' : 'Gün Başlatılmamış'}
            </div>
            <div style={{ fontSize: "14px", color: "#636e72", marginTop: "4px" }}>
              Gün ID: <strong>{gun?.gunId || 'Yok'}</strong> • 
              Açık Adisyon: <strong>{dashboard.acikAdisyonSayisi}</strong>
            </div>
          </div>
        </div>
        
        <button
          onClick={okuDashboard}
          style={{
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #3498db, #2980b9)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          <span>🔄</span>
          <span>Yenile</span>
        </button>
      </div>

      {/* HIZLI MENÜ */}
      <div
        style={{
          background: "linear-gradient(145deg, #f4dfc1, #f0d2a6)",
          borderRadius: 24,
          padding: "24px 26px 32px",
          marginBottom: 32,
          boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: "#4a3016" }}>
          HIZLI MENÜ
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 22,
          }}
        >
          <QuickMenuCard key="urun-yonetimi" label="Ürün Yönetimi" icon="📦" onClick={() => navigate("/urun-stok")} />
          <QuickMenuCard key="raporlar" label="Raporlar" icon="📊" onClick={() => navigate("/raporlar")} />
          <QuickMenuCard key="stok-yonetimi" label="Stok Yönetimi" icon="📈" onClick={() => navigate("/urun-stok")} />
          <QuickMenuCard key="masalar" label="Masalar" icon="🪑" onClick={() => navigate("/masalar")} />
          <QuickMenuCard key="bilardo" label="Bilardo" icon="🎱" onClick={() => navigate("/bilardo")} />
        </div>
      </div>

      {/* GÜNLÜK FİNANS ÖZETİ (NORMAL + BİLARDO) */}
      <div
        style={{
          background: "linear-gradient(145deg, #f4dfc1, #f0d2a6)",
          borderRadius: 24,
          padding: "24px 26px",
          marginBottom: 32,
          boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: "#4a3016" }}>
          GÜNLÜK FİNANS ÖZETİ
          <div style={{ fontSize: 14, color: "#7f5539", fontWeight: 400, marginTop: 4 }}>
            Gün ID: <strong>{dashboard.aktifGunId}</strong> • 
            {gunAktif ? ' Gün Aktif' : ' Gün Başlatılmamış'}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <SummaryCard 
            key="gunluk-gelir"
            title="Günlük Gelir" 
            value={formatTL(dashboard.gunlukGelir)}
            subtitle={`${dashboard.kapaliAdisyonSayisi} kapalı adisyon`}
            color="#27ae60"
            icon="💰"
          />
          <SummaryCard 
            key="normal-gelir"
            title="Normal Gelir" 
            value={formatTL(dashboard.normalAnalizi?.gelir || 0)}
            subtitle={`${dashboard.normalAnalizi?.kapali || 0} normal adisyon`}
            color="#2ecc71"
            icon="🪑"
          />
          <SummaryCard 
            key="bilardo-gelir"
            title="Bilardo Gelir" 
            value={formatTL(dashboard.bilardoAnalizi?.gelir || 0)}
            subtitle={`${dashboard.bilardoAnalizi?.kapali || 0} bilardo adisyon`}
            color="#3498db"
            icon="🎱"
          />
          <SummaryCard 
            key="net-kasa"
            title="Net Kasa" 
            value={formatTL(dashboard.netKasa)}
            subtitle={dashboard.netKasa >= 0 ? "Kârlı" : "Zarar"}
            color={dashboard.netKasa >= 0 ? "#27ae60" : "#c0392b"}
            icon={dashboard.netKasa >= 0 ? "📈" : "📉"}
          />
        </div>
        
        {/* GİDER BİLGİSİ */}
        <div style={{
          marginTop: 20,
          padding: "15px",
          background: "#fff7e6",
          borderRadius: "12px",
          border: "1px solid #f5d085"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "16px",
            fontWeight: 600,
            color: "#5a3921"
          }}>
            <span>📋 Günlük Giderler: <strong>{dashboard.gunlukGiderler.length}</strong> kayıt</span>
            <span>📉 Toplam Gider: <strong style={{ color: "#c0392b" }}>{formatTL(dashboard.gunlukGider)}</strong></span>
          </div>
        </div>
      </div>

      {/* ALT 2 PANEL (KRİTİK STOKLAR KALDIRILDI) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 26,
        }}
      >
        {/* Açık adisyonlar (NORMAL + BİLARDO) */}
        <div
          style={{
            backgroundColor: RENK.kart,
            borderRadius: 26,
            padding: "28px",
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 18,
              color: "#4a3016",
            }}
          >
            AÇIK ADİSYONLAR (Normal + Bilardo)
            <span style={{ fontSize: 14, marginLeft: 8, color: RENK.griYazi }}>
              ({dashboard.acikAdisyonlar.length} adet)
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#f5e6cf",
              borderRadius: 18,
              padding: "16px",
              maxHeight: 400,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "12px"
            }}
          >
            {dashboard.acikAdisyonlar.length === 0 ? (
              <div
                key="no-adisyon"
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: RENK.griYazi,
                  gridColumn: "1 / -1"
                }}
              >
                {gunAktif ? 
                  'Açık adisyon yok. Masalar veya Bilardo sayfasından yeni adisyon açabilirsiniz.' : 
                  'Gün başlatılmamış. Önce günü başlatın.'
                }
              </div>
            ) : (
              dashboard.acikAdisyonlar.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "12px 16px",
                    background: a.tip === "BİLARDO" ? "#e3f2fd" : "#fff3dc",
                    borderRadius: 14,
                    fontWeight: 700,
                    color: "#4a3016",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    borderLeft: `4px solid ${a.tip === "BİLARDO" ? RENK.bilardoMavi : "#f5d085"}`,
                    position: "relative"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => {
                    if (a.tip === "BİLARDO") {
                      navigate(`/bilardo/adisyon/${a.id}`);
                    } else {
                      navigate(`/adisyon/${a.id}`);
                    }
                  }}
                  title={`${a.tip === "BİLARDO" ? "Bilardo adisyonu" : "Normal adisyon"} - Tıklayarak detaya git`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      fontSize: "24px",
                      color: a.tip === "BİLARDO" ? RENK.bilardoMavi : "#f5d085"
                    }}>
                      {a.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{a.masaNo}</span>
                        {a.tip === "BİLARDO" && a.sureTipi && (
                          <span style={{
                            fontSize: "11px",
                            background: "#bbdefb",
                            color: "#1565c0",
                            padding: "2px 6px",
                            borderRadius: "8px",
                            fontWeight: 600
                          }}>
                            {a.sureTipi === "30dk" ? "30dk" : 
                             a.sureTipi === "1saat" ? "1sa" : "Süresiz"}
                          </span>
                        )}
                      </div>
                      {a.musteriAdi && (
                        <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>
                          {a.musteriAdi}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: a.tip === "BİLARDO" ? RENK.bilardoMavi : RENK.altin }}>
                      {formatTL(a.toplam)}
                    </div>
                    {a.tip === "BİLARDO" && a.bilardoUcret && (
                      <div style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "2px" }}>
                        Bilardo: {formatTL(a.bilardoUcret)}
                      </div>
                    )}
                  </div>
                  
                  {/* Tip badge */}
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    fontSize: "10px",
                    background: a.tip === "BİLARDO" ? "#bbdefb" : "#fff3dc",
                    color: a.tip === "BİLARDO" ? "#1565c0" : "#8B7355",
                    padding: "2px 6px",
                    borderRadius: "8px",
                    fontWeight: 700
                  }}>
                    {a.tip === "BİLARDO" ? "BİLARDO" : "NORMAL"}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {gunAktif && dashboard.acikAdisyonlar.length > 0 && (
            <div key="adisyon-info" style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#7f5539",
              textAlign: "center",
              fontStyle: "italic",
              display: "flex",
              justifyContent: "center",
              gap: "20px"
            }}>
              <span>💡 Tıklayarak adisyon detayına gidebilirsiniz</span>
              <span>•</span>
              <span>🎱 Mavi: Bilardo • 🪑 Sarı: Normal masa</span>
            </div>
          )}
          
          {gunAktif && dashboard.acikAdisyonSayisi === 0 && (
            <div key="no-adisyon-buttons" style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => navigate("/masalar")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #f5d085, #e2b66a)",
                  color: "#5a3921",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🪑 Masalar Sayfası
              </button>
              <button
                onClick={() => navigate("/bilardo")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #3498db, #2980b9)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🎱 Bilardo Sayfası
              </button>
            </div>
          )}
        </div>

        {/* GÜNLÜK GİDER LİSTESİ (KRİTİK STOKLAR KALDIRILDI) */}
        <div
          style={{
            backgroundColor: RENK.kart,
            borderRadius: 26,
            padding: "28px",
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 18,
              color: "#4a3016",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ color: RENK.kirmizi }}>📉</span>
            GÜNLÜK GİDERLER
            <span style={{ fontSize: 14, marginLeft: 8, color: RENK.griYazi }}>
              ({dashboard.gunlukGiderler.length} adet)
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#f5e6cf",
              borderRadius: 18,
              padding: "16px",
              height: "380px",
              overflowY: "auto",
            }}
          >
            {dashboard.gunlukGiderler.length === 0 ? (
              <div
                key="no-gider"
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: RENK.griYazi,
                  fontSize: "16px",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Bugün gider kaydı bulunmamaktadır.
              </div>
            ) : (
              <>
                {dashboard.gunlukGiderler.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      padding: "12px 14px",
                      marginBottom: 10,
                      background: "#fdecea",
                      borderRadius: 12,
                      fontWeight: 700,
                      color: RENK.kirmizi,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "15px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(192, 57, 43, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ 
                      maxWidth: "65%", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {g.aciklama}
                    </span>
                    <span style={{ fontWeight: 800 }}>{formatTL(g.tutar)}</span>
                  </div>
                ))}
                
                <div
                  key="gider-total"
                  style={{
                    padding: "14px",
                    marginTop: 15,
                    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                    borderRadius: 12,
                    fontWeight: 900,
                    color: "white",
                    textAlign: "center",
                    fontSize: "16px",
                    boxShadow: "0 4px 12px rgba(192, 57, 43, 0.3)"
                  }}
                >
                  TOPLAM GİDER: {formatTL(dashboard.gunlukGider)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* DEBUG BİLGİ */}
      <div
        style={{
          marginTop: 32,
          padding: "16px",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: 12,
          fontSize: 12,
          color: "#7f5539",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
          <span>📊 SİSTEM DURUMU (Bilardo Dahil):</span>
          <button
            onClick={() => {
              console.log('🔄 Manuel debug tetiklendi');
              okuDashboard();
            }}
            style={{
              padding: "4px 8px",
              fontSize: "10px",
              background: "#7f8c8d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Debug
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { key: "gun-id", label: "Gün ID:", value: dashboard.aktifGunId },
            { key: "gun-aktif", label: "Gün Aktif:", value: gunAktif ? "✅ EVET" : "❌ HAYIR" },
            { key: "acik-adisyon", label: "Açık Adisyon:", value: dashboard.acikAdisyonSayisi },
            { key: "kapali-adisyon", label: "Kapalı Adisyon:", value: dashboard.kapaliAdisyonSayisi },
            { key: "normal-acik", label: "Normal Açık:", value: dashboard.normalAnalizi?.acik || 0 },
            { key: "bilardo-acik", label: "Bilardo Açık:", value: dashboard.bilardoAnalizi?.acik || 0 },
            { key: "normal-gelir", label: "Normal Gelir:", value: `${dashboard.normalAnalizi?.gelir?.toFixed(2) || "0.00"} ₺` },
            { key: "bilardo-gelir", label: "Bilardo Gelir:", value: `${dashboard.bilardoAnalizi?.gelir?.toFixed(2) || "0.00"} ₺` }
          ].map((item) => (
            <div key={item.key}>
              <strong>{item.label}</strong> {item.value}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "8px", fontSize: "11px", opacity: 0.7 }}>
          💡 Normal + Bilardo adisyonları birleştirildi • Tıklanabilir adisyon kartları
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ALT BİLEŞENLER
// ------------------------------------------------------
const QuickMenuCard = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: "#fdf5ea",
      borderRadius: 24,
      padding: "22px",
      fontSize: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(0,0,0,0.22)",
      color: "#4a3016",
      fontWeight: 700,
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 14px 24px rgba(0,0,0,0.3)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.22)";
    }}
  >
    <div style={{ fontSize: 42 }}>{icon}</div>
    <div>{label}</div>
  </button>
);

const SummaryCard = ({ title, value, subtitle, color = "#4a3016", icon }) => (
  <div
    style={{
      backgroundColor: "#fdf5ea",
      borderRadius: 18,
      padding: "18px 20px",
      boxShadow: "0 10px 18px rgba(0,0,0,0.22)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.22)";
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 700, color: "#4a3016", display: "flex", alignItems: "center", gap: "8px" }}>
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    {subtitle && (
      <div style={{ fontSize: 12, color: "#7f8c8d", fontStyle: "italic" }}>
        {subtitle}
      </div>
    )}
  </div>
);

export default AnaEkran;