// admin-ui/src/pages/Bilardo/Bilardo.jsx - SÜRE UZATMA MANTIĞI GÜNCELLENDİ + MINI DASHBOARD
/* ------------------------------------------------------------
   📌 Bilardo.jsx — YENİ SÜRE UZATMA MANTIĞI + MINI DASHBOARD
   - İlk açılış: Normal bilardo ücreti (80₺ veya 120₺)
   - Süre uzatma: Dakika başı ücret eklenir
   - Tasarımlar korundu, sadece süre bitimi popup'ı kaldı
   - Üst kısma Mini Dashboard eklendi
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bilardo.css";

// Mini Dashboard bileşeni - direkt bu dosya içinde
const BilardoMiniDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    gunlukCiro: 0,
    acikMasaSayisi: 0,
    toplamOyunSuresi: 0, // dakika olarak
    ortalamaMasaGeliri: 0,
    tamamlananMasaSayisi: 0
  });

  // Dashboard verilerini hesapla
  useEffect(() => {
    const calculateDashboardData = () => {
      try {
        // 1. Bilardo adisyonlarını yükle
        const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
        
        // Bugünün tarihi (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();
        
        // 2. Bugünkü adisyonları filtrele
        const bugunkuAdisyonlar = adisyonlar.filter(adisyon => {
          const adisyonTarihi = new Date(adisyon.acilisZamani || adisyon.kapanisZamani || Date.now());
          return adisyonTarihi >= today;
        });

        // 3. Günlük toplam bilardo cirosu
        const gunlukCiro = bugunkuAdisyonlar.reduce((toplam, adisyon) => {
          // Sadece kapanan adisyonlar (iptal edilenler hariç)
          if (adisyon.durum === "KAPANDI" && !adisyon.iptal) {
            const bilardoUcret = adisyon.bilardoUcret || 0;
            const ekUrunToplam = (adisyon.ekUrunler || []).reduce((sum, urun) => 
              sum + (urun.fiyat * urun.adet), 0);
            return toplam + bilardoUcret + ekUrunToplam;
          }
          return toplam;
        }, 0);

        // 4. Açık masa sayısı (anlık)
        const bilardoMasalar = JSON.parse(localStorage.getItem("bilardo") || "[]");
        const acikMasaSayisi = bilardoMasalar.filter(masa => masa.durum === "ACIK").length;

        // 5. Toplam oynanan süre (dakika)
        let toplamDakika = 0;
        
        bugunkuAdisyonlar.forEach(adisyon => {
          // Kapanan adisyonlar için geçen süre
          if (adisyon.durum === "KAPANDI" && !adisyon.iptal) {
            const gecenDakika = adisyon.gecenDakika || 0;
            toplamDakika += gecenDakika;
          }
          // Açık adisyonlar için anlık geçen süre
          else if (adisyon.durum === "ACIK") {
            const acilisZamani = adisyon.acilisZamani || adisyon.kapanisZamani;
            if (acilisZamani) {
              const gecenDakika = Math.floor((Date.now() - new Date(acilisZamani).getTime()) / 60000);
              toplamDakika += gecenDakika;
            }
          }
        });

        // 6. Tamamlanan masa sayısı
        const tamamlananMasaSayisi = bugunkuAdisyonlar.filter(
          adisyon => adisyon.durum === "KAPANDI" && !adisyon.iptal
        ).length;

        // 7. Ortalama masa geliri
        const ortalamaMasaGeliri = tamamlananMasaSayisi > 0 
          ? gunlukCiro / tamamlananMasaSayisi 
          : 0;

        // 8. State'i güncelle
        setDashboardData({
          gunlukCiro,
          acikMasaSayisi,
          toplamOyunSuresi: toplamDakika,
          ortalamaMasaGeliri,
          tamamlananMasaSayisi
        });

      } catch (error) {
        console.error("Dashboard veri hesaplama hatası:", error);
      }
    };

    // İlk yükleme
    calculateDashboardData();

    // Her 30 saniyede bir güncelle
    const interval = setInterval(calculateDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Dakikayı saat:dakika formatına çevir
  const formatSure = (dakika) => {
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return `${saat.toString().padStart(2, '0')}:${dk.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bilardo-mini-dashboard">
      {/* Günlük Toplam Bilardo Cirosu */}
      <div className="dashboard-card ciro-card">
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4CAF50"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#4CAF50"/>
            <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {dashboardData.gunlukCiro.toFixed(2)}₺
          </div>
          <div className="dashboard-card-label">
            Günlük Ciro
          </div>
          <div className="dashboard-card-subtext">
            Bugün
          </div>
        </div>
      </div>

      {/* Açık Masa Sayısı */}
      <div className="dashboard-card masa-card">
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" rx="2" fill="#2196F3"/>
            <circle cx="9" cy="10" r="2" fill="white"/>
            <circle cx="15" cy="10" r="2" fill="white"/>
            <path d="M9 16H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {dashboardData.acikMasaSayisi}
          </div>
          <div className="dashboard-card-label">
            Aktif Masalar
          </div>
          <div className="dashboard-card-subtext">
            Anlık
          </div>
        </div>
      </div>

      {/* Toplam Oynanan Süre */}
      <div className="dashboard-card sure-card">
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FF9800" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#FF9800" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value digital-clock">
            {formatSure(dashboardData.toplamOyunSuresi)}
          </div>
          <div className="dashboard-card-label">
            Toplam Oyun Süresi
          </div>
          <div className="dashboard-card-subtext">
            Saat:Dakika
          </div>
        </div>
      </div>

      {/* Ortalama Masa Geliri */}
      <div className="dashboard-card ortalama-card">
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="#9C27B0"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="white"/>
            <path d="M12 9.5V14.5" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 12H14.5" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {dashboardData.ortalamaMasaGeliri.toFixed(2)}₺
          </div>
          <div className="dashboard-card-label">
            Ortalama Masa
          </div>
          <div className="dashboard-card-subtext">
            {dashboardData.tamamlananMasaSayisi} masa tamamlandı
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Bilardo() {
  const navigate = useNavigate();
  
  // ANA STATE'LER
  const [masalar, setMasalar] = useState([]);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  const [sureBittiPopup, setSureBittiPopup] = useState(null);
  const [uzatModal, setUzatModal] = useState({
    acik: false,
    masa: null,
    index: null
  });
  
  // MODAL STATE'LERİ
  const [aktarimModal, setAktarimModal] = useState({
    acik: false,
    bilardoMasa: null,
    seciliMasa: null,
    normalMasalar: []
  });
  
  // BİLARDO İKONU (Premium SVG)
  const BilardoIkon = ({ size = 48, className = "" }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={`bilardo-icon-svg ${className}`}
    >
      <rect x="4" y="12" width="40" height="24" rx="8" fill="#4A3722" stroke="#D4AF37" strokeWidth="3"/>
      <rect x="8" y="16" width="32" height="16" rx="4" fill="#2E7D32"/>
      <circle cx="15" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="24" cy="16" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="33" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="18" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="30" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="3" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1"/>
      <rect x="12" y="36" width="4" height="8" fill="#8B4513"/>
      <rect x="32" y="36" width="4" height="8" fill="#8B4513"/>
    </svg>
  );

  /* ============================================================
     📌 1. MASA AKTAR MODAL AÇMA FONKSİYONU
  ============================================================ */
  
  const masaAktarModalAc = (masa, index, e) => {
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      
      // TÜM MASALARI YÜKLE (dolu olanlar dahil)
      const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
      
      // Tüm masaları göster (boş ve dolu olanlar)
      const tumMasalar = masalarData.filter(m => 
        m.durum?.toUpperCase() !== "KAPALI"
      ).sort((a, b) => parseInt(a.no) - parseInt(b.no));
      
      // Modal'ı aç
      setAktarimModal({
        acik: true,
        bilardoMasa: { ...masa, index },
        seciliMasa: null,
        normalMasalar: tumMasalar
      });
      
    } catch (error) {
      console.error("❌ Masayı aktar modal açma hatası:", error);
    }
  };

  /* ============================================================
     📌 2. LOCALSTORAGE İŞLEMLERİ ve ANLIK HESAPLAMA
  ============================================================ */
  
  useEffect(() => {
    const loadAndCalculate = () => {
      // 1. Bilardo masalarını yükle
      let bilardoData = JSON.parse(localStorage.getItem("bilardo") || "[]");
      
      // Eğer bilardo masaları boşsa, oluştur
      if (bilardoData.length === 0) {
        const yeniMasalar = [];
        for (let i = 1; i <= 10; i++) {
          yeniMasalar.push({
            id: 100 + i,
            no: `B${i}`,
            acik: false,
            durum: "KAPALI",
            sureTipi: null,
            acilisSaati: null,
            ucret: 0,
            aktifAdisyonId: null,
            uzatmaSayisi: 0,
            uzatmaBaslangicZamani: null // Yeni: Uzatma başlangıç zamanı
          });
        }
        bilardoData = yeniMasalar;
        localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
      }
      
      // 2. Bilardo adisyonlarını yükle
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      
      // 3. Ücret ayarları
      const ayarlar = JSON.parse(localStorage.getItem("bilardo_ucretleri")) || {
        bilardo30dk: 80,
        bilardo1saat: 120,
        bilardoDakikaUcreti: 2
      };
      setUcretAyarlari(ayarlar);
      
      // 4. Masaları güncelle ve anlık ücretleri hesapla
      const updatedMasalar = bilardoData.map(masa => {
        const masaAdisyonu = adisyonlar.find(a => a.id === masa.aktifAdisyonId);
        
        if (masaAdisyonu && masaAdisyonu.durum === "ACIK") {
          const now = Date.now();
          const acilisZamani = masaAdisyonu.acilisZamani || masa.acilisSaati;
          const gecenDakika = acilisZamani ? 
            Math.floor((now - acilisZamani) / 60000) : 0;
          
          // ANLIK ÜCRET HESAPLA
          let anlikUcret = 0;
          const bilardo30dk = ayarlar.bilardo30dk || 80;
          const bilardo1saat = ayarlar.bilardo1saat || 120;
          const bilardoDakikaUcreti = ayarlar.bilardoDakikaUcreti || 2;
          
          // YENİ MANTIK: Uzatma durumuna göre hesapla
          if (masaAdisyonu.uzatmaDurumu === true && masa.uzatmaBaslangicZamani) {
            // UZATMA DURUMUNDA: Dakika başı ücret
            const uzatmaBaslangic = masa.uzatmaBaslangicZamani;
            const uzatmaGecenDakika = Math.floor((now - uzatmaBaslangic) / 60000);
            anlikUcret = masaAdisyonu.baslangicUcreti + (uzatmaGecenDakika * bilardoDakikaUcreti);
          } else {
            // NORMAL DURUM: Orijinal hesaplama
            switch(masaAdisyonu.sureTipi) {
              case "30dk":
                anlikUcret = bilardo30dk;
                break;
              case "1saat":
                anlikUcret = bilardo1saat;
                break;
              case "suresiz":
                if (gecenDakika <= 30) {
                  anlikUcret = bilardo30dk;
                } else {
                  const ekDakika = gecenDakika - 30;
                  anlikUcret = bilardo30dk + (Math.ceil(ekDakika) * bilardoDakikaUcreti);
                }
                break;
              default:
                anlikUcret = 0;
            }
          }
          
          // Ek ürünlerin toplamını hesapla
          const ekUrunler = masaAdisyonu.ekUrunler || [];
          const ekUrunToplam = ekUrunler.reduce((sum, u) => 
            sum + (u.fiyat * u.adet), 0);
          
          const toplamTutar = anlikUcret + ekUrunToplam;
          
          // BİLARDO ÜCRETİNİ ADİSYONA KAYDET
          const adisyonIndex = adisyonlar.findIndex(a => a.id === masa.aktifAdisyonId);
          if (adisyonIndex !== -1) {
            adisyonlar[adisyonIndex].bilardoUcret = anlikUcret;
            adisyonlar[adisyonIndex].toplamTutar = toplamTutar;
            adisyonlar[adisyonIndex].gecenDakika = gecenDakika;
            localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
          }
          
          // AÇIK ADİSYONLARA EKLE (Ana Sayfa için)
          updateAcikAdisyonlar(masaAdisyonu, anlikUcret, ekUrunToplam, gecenDakika, masa.no);
          
          return {
            ...masa,
            acik: true,
            durum: "ACIK",
            sureTipi: masaAdisyonu.sureTipi,
            acilisSaati: acilisZamani,
            aktifAdisyonId: masaAdisyonu.id,
            ucret: anlikUcret,
            ekUrunToplam: ekUrunToplam,
            toplamTutar: toplamTutar,
            gecenDakika: gecenDakika,
            ekUrunSayisi: ekUrunler.length,
            uzatmaSayisi: masa.uzatmaSayisi || 0,
            uzatmaBaslangicZamani: masa.uzatmaBaslangicZamani || null
          };
        }
        
        return {
          ...masa,
          ekUrunToplam: 0,
          toplamTutar: 0,
          gecenDakika: 0,
          ekUrunSayisi: 0,
          uzatmaSayisi: 0,
          uzatmaBaslangicZamani: null
        };
      });
      
      setMasalar(updatedMasalar);
      kontrolSureBitti(updatedMasalar);
    };
    
    loadAndCalculate();
    
    const interval = setInterval(loadAndCalculate, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // AÇIK ADİSYONLARI GÜNCELLE (Ana Sayfa için)
  const updateAcikAdisyonlar = (adisyon, bilardoUcret, ekUrunToplam, gecenDakika, masaNo) => {
    try {
      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      
      const bilardoAdisyonu = {
        id: adisyon.id,
        masaNo: masaNo || adisyon.bilardoMasaNo,
        tur: "BİLARDO",
        sureTipi: adisyon.sureTipi,
        gecenDakika: gecenDakika,
        bilardoUcret: bilardoUcret,
        ekUrunToplam: ekUrunToplam,
        toplamTutar: bilardoUcret + ekUrunToplam,
        acilisZamani: adisyon.acilisZamani,
        durum: "ACIK",
        updatedAt: Date.now(),
        no: masaNo || adisyon.bilardoMasaNo,
        musteriAdi: adisyon.musteriAdi || "Bilardo Müşterisi",
        urunSayisi: (adisyon.ekUrunler || []).length,
        isBilardo: true,
        uzatmaDurumu: adisyon.uzatmaDurumu || false
      };
      
      // Var mı kontrol et
      const existingIndex = acikAdisyonlar.findIndex(a => a.id === adisyon.id);
      
      if (existingIndex !== -1) {
        acikAdisyonlar[existingIndex] = bilardoAdisyonu;
      } else {
        acikAdisyonlar.push(bilardoAdisyonu);
      }
      
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(acikAdisyonlar));
      
    } catch (error) {
      console.error("Açık adisyon güncelleme hatası:", error);
    }
  };

  /* ============================================================
     📌 3. ÜCRET HESAPLAMA FONKSİYONLARI
  ============================================================ */
  
  const ucretHesapla = (sureTipi, dakika) => {
    if (!ucretAyarlari) return 0;
    
    const bilardo30dk = ucretAyarlari.bilardo30dk || 80;
    const bilardo1saat = ucretAyarlari.bilardo1saat || 120;
    const bilardoDakikaUcreti = ucretAyarlari.bilardoDakikaUcreti || 2;
    
    switch(sureTipi) {
      case "30dk":
        return bilardo30dk;
      case "1saat":
        return bilardo1saat;
      case "suresiz":
        if (dakika <= 30) {
          return bilardo30dk;
        } else {
          const ekDakika = dakika - 30;
          return bilardo30dk + (Math.ceil(ekDakika) * bilardoDakikaUcreti);
        }
      default:
        return 0;
    }
  };

  /* ============================================================
     📌 4. MASA İŞLEMLERİ
  ============================================================ */
  
  const masaEkle = () => {
    const yeniMasa = {
      id: Date.now(),
      no: `B${masalar.length + 1}`,
      acik: false,
      durum: "KAPALI",
      sureTipi: null,
      acilisSaati: null,
      ucret: 0,
      aktifAdisyonId: null,
      uzatmaSayisi: 0,
      uzatmaBaslangicZamani: null
    };
    
    const yeniMasalar = [...masalar, yeniMasa];
    setMasalar(yeniMasalar);
    localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
  };
  
  const masaNoIleSil = () => {
    const masaNo = parseInt(silMasaNo.trim());
    if (isNaN(masaNo) || masaNo < 1) {
      return;
    }
    
    const masaIndex = masaNo - 1;
    if (masaIndex < 0 || masaIndex >= masalar.length) {
      return;
    }
    
    const masa = masalar[masaIndex];
    
    if (masa.durum === "ACIK" || masa.acik) {
      return;
    }
    
    // Eğer adisyon varsa sil
    if (masa.aktifAdisyonId) {
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const yeniAdisyonlar = adisyonlar.filter(a => a.id !== masa.aktifAdisyonId);
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(yeniAdisyonlar));
    }
    
    const filtered = masalar.filter((m, index) => index !== masaIndex);
    
    // Masa numaralarını yeniden düzenle
    const numberedMasalar = filtered.map((m, index) => ({
      ...m,
      no: `B${index + 1}`
    }));
    
    setMasalar(numberedMasalar);
    localStorage.setItem("bilardo", JSON.stringify(numberedMasalar));
    setSilMasaNo("");
  };
  
  const masaAc = (masa, tip, index) => {
    // İlk açılış ücreti
    const baslangicUcreti = ucretHesapla(tip, 0);
    
    // Yeni bilardo adisyonu oluştur
    const yeniAdisyon = {
      id: `bilardo_${Date.now()}`,
      bilardoMasaId: masa.id,
      bilardoMasaNo: `B${index + 1}`,
      sureTipi: tip,
      acilisZamani: Date.now(),
      kapanisZamani: null,
      durum: "ACIK",
      gecenDakika: 0,
      hesaplananUcret: 0,
      bilardoUcret: baslangicUcreti,
      baslangicUcreti: baslangicUcreti, // Yeni: Başlangıç ücretini kaydet
      ekUrunler: [],
      odemeler: [],
      toplamOdenen: 0,
      toplamTutar: baslangicUcreti,
      not: "",
      uzatmaSayisi: 0,
      uzatmaDurumu: false, // Yeni: Uzatma durumu
      uzatmaBaslangicZamani: null // Yeni: Uzatma başlangıç zamanı
    };
    
    // Adisyonları kaydet
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    adisyonlar.push(yeniAdisyon);
    localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    
    // Masayı güncelle
    const updated = masalar.map((m, i) =>
      i === index
        ? {
            ...m,
            acik: true,
            durum: "ACIK",
            sureTipi: tip,
            acilisSaati: Date.now(),
            aktifAdisyonId: yeniAdisyon.id,
            ucret: baslangicUcreti,
            toplamTutar: baslangicUcreti,
            uzatmaSayisi: 0,
            uzatmaBaslangicZamani: null
          }
        : m
    );
    
    setMasalar(updated);
    localStorage.setItem("bilardo", JSON.stringify(updated));
    
    // Açık adisyonlara ekle
    updateAcikAdisyonlar(yeniAdisyon, baslangicUcreti, 0, 0, `B${index + 1}`);
    
    // DİREKT ADİSYONA YÖNLENDİR
    setTimeout(() => {
      navigate(`/bilardo-adisyon/${yeniAdisyon.id}`);
    }, 100);
  };
  
  // ÇİFT TIKLAMA: Bilardo adisyonuna git
  const handleCardDoubleClick = (masa) => {
    if (!masa.aktifAdisyonId) {
      return;
    }
    
    navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
  };
  
  // TEK TIKLAMA: Ödeme yap
  const handleCardClick = (masa) => {
    if (masa.acik && masa.aktifAdisyonId) {
      navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
    }
  };

  /* ============================================================
     📌 5. MASAYA AKTARIM
  ============================================================ */
  
  const masaAktar = () => {
    const { bilardoMasa, seciliMasa } = aktarimModal;
    
    if (!bilardoMasa || !seciliMasa) {
      return;
    }
    
    try {
      const bilardoAdisyonlar = JSON.parse(
        localStorage.getItem("bilardo_adisyonlar") || "[]"
      );
      const bilardoAdisyon = bilardoAdisyonlar.find(
        a => a.id === bilardoMasa.aktifAdisyonId
      );
      if (!bilardoAdisyon) {
        return;
      }

      const bilardoUcret = Number(bilardoMasa.ucret || 0);
      const gecenDakika = bilardoAdisyon.gecenDakika || 0;
      const ekUrunler = bilardoAdisyon.ekUrunler || [];
      const ekUrunToplam = ekUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);

      const mcAdisyonlar = JSON.parse(
        localStorage.getItem("mc_adisyonlar") || "[]"
      );

      let hedefAdisyon = mcAdisyonlar.find(
        a => a.masaNo === `MASA ${seciliMasa.no}` && a.durum === "ACIK"
      );

      if (!hedefAdisyon) {
        hedefAdisyon = {
          id: `masa_${seciliMasa.no}_${Date.now()}`,
          masaId: seciliMasa.id,
          masaNo: `MASA ${seciliMasa.no}`,
          masaNum: seciliMasa.no,
          durum: "ACIK",
          acilisZamani: new Date().toISOString(),
          kalemler: [],
          odemeler: [],
          toplamTutar: 0,
          odenenTutar: 0,
          kalanTutar: 0,
          isBilardo: false,
          not: ""
        };
        mcAdisyonlar.push(hedefAdisyon);
      }

      const timestamp = Date.now();

      const bilardoKalemiVarMi = hedefAdisyon.kalemler?.some(
        k => k.urunId === "BILARDO_UCRET"
      ) || false;

      if (!bilardoKalemiVarMi && bilardoUcret > 0) {
        if (!hedefAdisyon.kalemler) {
          hedefAdisyon.kalemler = [];
        }
        
        hedefAdisyon.kalemler.push({
          id: `bilardo_ucret_${timestamp}`,
          adisyonId: hedefAdisyon.id,
          urunId: "BILARDO_UCRET",
          urunAdi: `🎱 Bilardo Ücreti - Masa ${bilardoMasa.no}`,
          birimFiyat: bilardoUcret,
          adet: 1,
          toplam: bilardoUcret,
          tur: "URUN",
          isBilardo: true,
          aciklama: `${bilardoAdisyon.sureTipi} - ${gecenDakika} dakika`,
          tarih: new Date().toISOString(),
          kategori: "BİLARDO",
          bilardoTransfer: true,
          bilardoMasaNo: bilardoMasa.no,
          bilardoSureTipi: bilardoAdisyon.sureTipi
        });
      }

      ekUrunler.forEach((urun, i) => {
        if (!hedefAdisyon.kalemler) {
          hedefAdisyon.kalemler = [];
        }
        
        hedefAdisyon.kalemler.push({
          id: `bilardo_urun_${timestamp}_${i}`,
          adisyonId: hedefAdisyon.id,
          urunId: urun.mcUrunId || `bilardo_urun_${i}`,
          urunAdi: `📦 ${urun.ad}`,
          birimFiyat: urun.fiyat,
          adet: urun.adet,
          toplam: urun.fiyat * urun.adet,
          tur: "URUN",
          isBilardo: true,
          aciklama: "Bilardo'dan transfer",
          tarih: new Date().toISOString(),
          kategori: "EK ÜRÜNLER",
          bilardoTransfer: true,
          originalUrun: urun
        });
      });

      hedefAdisyon.toplamTutar = (hedefAdisyon.kalemler || []).reduce(
        (s, k) => s + Number(k.toplam || 0),
        0
      );

      hedefAdisyon.odenenTutar = (hedefAdisyon.odemeler || []).reduce(
        (s, o) => s + Number(o.tutar || 0),
        0
      );

      hedefAdisyon.kalanTutar = hedefAdisyon.toplamTutar - hedefAdisyon.odenenTutar;

      const bilardoNot = `🎱 Bilardo Masa ${bilardoMasa.no} Transfer Edildi\n` +
                         `• Süre Tipi: ${bilardoAdisyon.sureTipi === "30dk" ? "30 Dakika" : 
                                       bilardoAdisyon.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}\n` +
                         `• Geçen Süre: ${gecenDakika} dakika\n` +
                         `• Bilardo Ücreti: ${bilardoUcret.toFixed(2)}₺\n` +
                         `• Ek Ürünler: ${ekUrunler.length} adet (${ekUrunToplam.toFixed(2)}₺)\n` +
                         `• Transfer Tarihi: ${new Date().toLocaleString('tr-TR')}`;

      hedefAdisyon.not = hedefAdisyon.not
        ? `${hedefAdisyon.not}\n\n--- BİLARDO TRANSFER ---\n${bilardoNot}`
        : bilardoNot;

      hedefAdisyon.bilardoTransfer = true;
      hedefAdisyon.bilardoMasaNo = bilardoMasa.no;
      hedefAdisyon.bilardoAdisyonId = bilardoAdisyon.id;
      hedefAdisyon.bilardoUcreti = bilardoUcret;
      hedefAdisyon.bilardoEkUrunToplam = ekUrunToplam;
      hedefAdisyon.bilardoGecenDakika = gecenDakika;

      const adisyonIndex = mcAdisyonlar.findIndex(a => a.id === hedefAdisyon.id);
      if (adisyonIndex !== -1) {
        mcAdisyonlar[adisyonIndex] = hedefAdisyon;
      }
      
      localStorage.setItem("mc_adisyonlar", JSON.stringify(mcAdisyonlar));

      const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
      const updatedMasalar = masalarData.map(m => {
        if (m.id === seciliMasa.id) {
          return {
            ...m,
            durum: "DOLU",
            adisyonId: hedefAdisyon.id,
            toplamTutar: hedefAdisyon.toplamTutar,
            acilisZamani: m.acilisZamani || new Date().toISOString(),
            guncellemeZamani: new Date().toISOString(),
            bilardoTransfer: true,
            bilardoMasaNo: bilardoMasa.no,
            musteriAdi: m.musteriAdi ? 
              `${m.musteriAdi} + 🎱 Bilardo ${bilardoMasa.no}` : 
              `🎱 Bilardo ${bilardoMasa.no} Transfer`
          };
        }
        return m;
      });
      
      localStorage.setItem("mc_masalar", JSON.stringify(updatedMasalar));

      const bilardoAdisyonIndex = bilardoAdisyonlar.findIndex(
        a => a.id === bilardoAdisyon.id
      );
      if (bilardoAdisyonIndex !== -1) {
        bilardoAdisyonlar[bilardoAdisyonIndex].durum = "KAPANDI";
        bilardoAdisyonlar[bilardoAdisyonIndex].transferEdildi = true;
        bilardoAdisyonlar[bilardoAdisyonIndex].transferMasaNo = seciliMasa.no;
        bilardoAdisyonlar[bilardoAdisyonIndex].transferAdisyonId = hedefAdisyon.id;
        bilardoAdisyonlar[bilardoAdisyonIndex].kapanisZamani = new Date().toISOString();
        localStorage.setItem(
          "bilardo_adisyonlar",
          JSON.stringify(bilardoAdisyonlar)
        );
      }

      const updatedBilardoMasalar = masalar.map((m, i) => 
        i === bilardoMasa.index 
          ? { 
              ...m, 
              acik: false, 
              durum: "KAPALI", 
              sureTipi: null, 
              acilisSaati: null,
              ucret: 0,
              aktifAdisyonId: null,
              ekUrunToplam: 0,
              toplamTutar: 0,
              uzatmaSayisi: 0,
              uzatmaBaslangicZamani: null
            }
          : m
      );
      
      setMasalar(updatedBilardoMasalar);
      localStorage.setItem("bilardo", JSON.stringify(updatedBilardoMasalar));

      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      const filteredAcikAdisyonlar = acikAdisyonlar.filter(a => a.id !== bilardoMasa.aktifAdisyonId);
      
      const yeniAcikAdisyon = {
        id: hedefAdisyon.id,
        masaNo: `MASA ${seciliMasa.no}`,
        tur: "NORMAL",
        sureTipi: "AKTİF",
        gecenDakika: 0,
        bilardoUcret: bilardoUcret,
        ekUrunToplam: ekUrunToplam,
        toplamTutar: hedefAdisyon.toplamTutar,
        acilisZamani: hedefAdisyon.acilisZamani,
        durum: "ACIK",
        updatedAt: Date.now(),
        no: seciliMasa.no,
        musteriAdi: hedefAdisyon.musteriAdi || `Masa ${seciliMasa.no}`,
        urunSayisi: (hedefAdisyon.kalemler || []).length,
        isBilardo: false,
        bilardoTransfer: true,
        transferKaynak: `Bilardo Masa ${bilardoMasa.no}`,
        bilardoMasaNo: bilardoMasa.no
      };
      
      const existingAcikIndex = filteredAcikAdisyonlar.findIndex(a => a.id === hedefAdisyon.id);
      if (existingAcikIndex !== -1) {
        filteredAcikAdisyonlar[existingAcikIndex] = yeniAcikAdisyon;
      } else {
        filteredAcikAdisyonlar.push(yeniAcikAdisyon);
      }
      
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(filteredAcikAdisyonlar));

      setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] });
      
      window.dispatchEvent(new CustomEvent('masaGuncellendi', {
        detail: { 
          masaNo: seciliMasa.no, 
          action: 'bilardo_transfer',
          bilardoMasaNo: bilardoMasa.no,
          tutar: bilardoUcret + ekUrunToplam
        }
      }));

      navigate("/masalar");
      
    } catch (err) {
      console.error("Bilardo → Masa aktarım hatası:", err);
      navigate("/masalar");
    }
  };

  /* ============================================================
     📌 6. SÜRE UZATMA FONKSİYONLARI - YENİ MANTIK
  ============================================================ */
  
  const uzatModalAc = (masa, index) => {
    setUzatModal({
      acik: true,
      masa: masa,
      index: index
    });
  };
  
  const sureUzat = (uzatmaTipi) => {
    const { masa, index } = uzatModal;
    if (!masa) return;
    
    try {
      // 1. Bilardo adisyonunu bul
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const adisyonIndex = adisyonlar.findIndex(a => a.id === masa.aktifAdisyonId);
      
      if (adisyonIndex === -1) {
        setUzatModal({ acik: false, masa: null, index: null });
        return;
      }
      
      const adisyon = adisyonlar[adisyonIndex];
      
      // 2. Uzatma için NOT ekle
      const uzatmaNotu = `⏱️ SÜRE UZATMA BAŞLATILDI\n` +
                        `• Uzatma Tipi: ${uzatmaTipi === "30dk" ? "30 Dakika" : "1 Saat"}\n` +
                        `• Uzatma Tarihi: ${new Date().toLocaleString('tr-TR')}\n` +
                        `• Uzatma Sayısı: ${(masa.uzatmaSayisi || 0) + 1}\n` +
                        `• NOT: Dakika başı ücret uygulanacak (${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk)`;
      
      adisyon.not = adisyon.not ? `${adisyon.not}\n\n${uzatmaNotu}` : uzatmaNotu;
      
      // 3. Uzatma durumunu aktif et
      const yeniUzatmaSayisi = (masa.uzatmaSayisi || 0) + 1;
      const simdi = Date.now();
      
      // 4. Adisyonu güncelle (uzatma durumunu aktif et)
      adisyon.uzatmaDurumu = true;
      adisyon.uzatmaSayisi = yeniUzatmaSayisi;
      adisyon.uzatmaBaslangicZamani = simdi;
      adisyonlar[adisyonIndex] = adisyon;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
      
      // 5. Masayı güncelle (uzatma başlangıç zamanını kaydet)
      const updatedMasalar = masalar.map((m, i) =>
        i === index
          ? {
              ...m,
              uzatmaSayisi: yeniUzatmaSayisi,
              uzatmaBaslangicZamani: simdi,
              // NOT: Burada ücret güncellemesi YAPMIYORUZ
              // Ücret, anlık hesaplama ile otomatik güncellenecek
            }
          : m
      );
      
      setMasalar(updatedMasalar);
      localStorage.setItem("bilardo", JSON.stringify(updatedMasalar));
      
      // 6. Modalı kapat
      setUzatModal({ acik: false, masa: null, index: null });
      
    } catch (error) {
      console.error("Süre uzatma hatası:", error);
      setUzatModal({ acik: false, masa: null, index: null });
    }
  };

  /* ============================================================
     📌 7. SÜRE TAKİBİ ve POPUP
  ============================================================ */
  
  const kontrolSureBitti = (currentMasalar = masalar) => {
    const now = Date.now();
    let yeniPopup = null;
    
    currentMasalar.forEach(masa => {
      if (masa.acik && masa.acilisSaati) {
        const gecenDakika = Math.floor((now - masa.acilisSaati) / 60000);
        
        // SADECE SÜRELİ OYUNLARDA (30dk veya 1saat) VE UZATMA DURUMU YOKSA
        if ((masa.sureTipi === "30dk" && gecenDakika >= 30 && !masa.uzatmaBaslangicZamani) ||
            (masa.sureTipi === "1saat" && gecenDakika >= 60 && !masa.uzatmaBaslangicZamani)) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masa.no,
            mesaj: masa.sureTipi === "30dk" ? "30 dakika süresi doldu!" : "1 saat süresi doldu!",
            timestamp: now,
            uzatmaGerekli: true
          };
        }
      }
    });
    
    if (yeniPopup && (!sureBittiPopup || sureBittiPopup.masaId !== yeniPopup.masaId)) {
      setSureBittiPopup(yeniPopup);
      
      setTimeout(() => {
        setSureBittiPopup(prev => 
          prev?.masaId === yeniPopup.masaId ? null : prev
        );
      }, 30000);
    }
  };
  
  const popupTiklandi = () => {
    if (!sureBittiPopup) return;
    
    setSureBittiPopup(null);
    
    const masaIndex = masalar.findIndex(m => m.id === sureBittiPopup.masaId);
    if (masaIndex !== -1 && masalar[masaIndex].aktifAdisyonId) {
      if (sureBittiPopup.uzatmaGerekli) {
        uzatModalAc(masalar[masaIndex], masaIndex);
      } else {
        navigate(`/bilardo-adisyon/${masalar[masaIndex].aktifAdisyonId}`);
      }
    }
  };

  /* ============================================================
     📌 8. EKRAN RENDER
  ============================================================ */
  
  return (
    <div className="bilardo-container">
      
      {/* SÜRE BİTTİ POPUP */}
      {sureBittiPopup && (
        <div className="bilardo-sure-bitti-popup" onClick={popupTiklandi}>
          <div className="bilardo-popup-baslik">
            <BilardoIkon size={24} /> ⏰ SÜRE DOLDU!
          </div>
          <div className="bilardo-popup-mesaj">
            BİLARDO {sureBittiPopup.masaNo}: {sureBittiPopup.mesaj}
          </div>
          <div className="bilardo-popup-not">
            {sureBittiPopup.uzatmaGerekli 
              ? "Tıklayarak süre uzatma seçeneklerini görün..." 
              : "Tıklayarak adisyona gidin..."}
          </div>
        </div>
      )}
      
      {/* MODERN BAŞLIK ALANI */}
      <div className="bilardo-header">
        <div className="bilardo-title-section">
          <div className="bilardo-main-icon">
            <BilardoIkon size={40} />
          </div>
          <h1 className="bilardo-title">BİLARDO MASALARI</h1>
        </div>
        
        <div className="bilardo-actions">
          {/* MASA SİLME ALANI */}
          <div className="bilardo-silme-alani">
            <label>Masa Sil:</label>
            <input
              type="number"
              placeholder="No"
              value={silMasaNo}
              onChange={(e) => setSilMasaNo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && masaNoIleSil()}
              className="bilardo-silme-input"
              min="1"
            />
            <button onClick={masaNoIleSil} className="bilardo-silme-btn">
              Sil
            </button>
          </div>
          
          <button 
            className="bilardo-ayarlar-btn"
            onClick={() => navigate("/ayarlar?tab=bilardo_ucret")}
          >
            ⚙️ Ayarlar
          </button>
          
          <button className="masa-btn-ekle" onClick={masaEkle}>
            + Masa Ekle
          </button>
        </div>
      </div>
      
      {/* YENİ: MINI DASHBOARD */}
      <BilardoMiniDashboard />
      
      {/* ÜCRET BİLGİSİ BANNER */}
      {ucretAyarlari && (
        <div className="bilardo-ucret-banner">
          <div className="bilardo-ucret-item">
            <span>30 Dakika</span>
            <strong>{ucretAyarlari.bilardo30dk || 80}₺</strong>
            <small>İlk 30dk ücreti</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>1 Saat</span>
            <strong>{ucretAyarlari.bilardo1saat || 120}₺</strong>
            <small>İlk saat ücreti</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>Dakika Ücreti</span>
            <strong>{ucretAyarlari.bilardoDakikaUcreti || 2}₺/dk</strong>
            <small>Uzatma sonrası dakika başı</small>
          </div>
        </div>
      )}
      
      {/* MODERN MASA GRID */}
      <div className="bilardo-grid">
        {masalar.map((masa, index) => {
          const toplamTutar = masa.toplamTutar || 0;
          const bilardoUcret = masa.ucret || 0;
          const ekUrunSayisi = masa.ekUrunSayisi || 0;
          const ekUrunToplam = masa.ekUrunToplam || 0;
          const uzatmaSayisi = masa.uzatmaSayisi || 0;
          const uzatmaDurumunda = masa.uzatmaBaslangicZamani !== null;
          
          return (
            <div 
              key={masa.id} 
              className={`bilardo-card ${masa.durum === "ACIK" ? "acik" : "kapali"}`}
              data-masa-id={masa.id}
              onClick={() => handleCardClick(masa)}
              onDoubleClick={() => handleCardDoubleClick(masa)}
              title={masa.acik ? "Çift tıkla: Adisyona git | Tek tıkla: Ödeme yap" : ""}
            >
              
              {/* KART BAŞLIĞI */}
              <div className="bilardo-card-header">
                <div className="bilardo-card-icon-title">
                  <div className="bilardo-card-icon">
                    <BilardoIkon size={32} />
                  </div>
                  <span className="bilardo-card-name">BİLARDO {masa.no || `B${index + 1}`}</span>
                </div>
                <span className={`bilardo-card-durum ${masa.durum}`}>
                  {masa.durum === "ACIK" ? "AÇIK" : "KAPALI"}
                </span>
              </div>
              
              {/* ANLIK ÜCRET GÖSTERİMİ */}
              <div className="bilardo-card-ucret">
                <div className="aciklama">
                  {masa.acik ? "ANLIK ÜCRET" : "SON ÜCRET"}
                </div>
                <div className="tutar">{bilardoUcret.toFixed(2)}₺</div>
                {uzatmaDurumunda && (
                  <div className="uzatma-aciklama" style={{
                    fontSize: '11px',
                    color: '#ff9800',
                    marginTop: '3px',
                    fontWeight: '600'
                  }}>
                    (Dakika ücreti işliyor)
                  </div>
                )}
              </div>
              
              {/* TOPLAM TUTAR (Bilardo + Ek Ürünler) */}
              {masa.acik && (
                <div className="bilardo-toplam-tutar">
                  <span>TOPLAM TUTAR:</span>
                  <span>{toplamTutar.toFixed(2)}₺</span>
                </div>
              )}
              
              {/* UZATMA DURUMU */}
              {uzatmaDurumunda && (
                <div style={{
                  margin: "5px 0",
                  padding: "5px 10px",
                  background: "#fff3e0",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#ef6c00",
                  textAlign: "center",
                  fontWeight: "600",
                  border: "1px solid #ffb74d"
                }}>
                  🔄 UZATMA AKTİF ({uzatmaSayisi}. kez)
                </div>
              )}
              
              {uzatmaSayisi > 0 && !uzatmaDurumunda && (
                <div style={{
                  margin: "5px 0",
                  padding: "5px 10px",
                  background: "#e8f5e9",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#2e7d32",
                  textAlign: "center",
                  fontWeight: "600",
                  border: "1px solid #81c784"
                }}>
                  🔄 {uzatmaSayisi} kez uzatıldı
                </div>
              )}
              
              {/* EK ÜRÜN BİLGİSİ */}
              {ekUrunSayisi > 0 && (
                <div style={{
                  margin: "10px 0",
                  padding: "8px 12px",
                  background: "#e8f5e9",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#2e7d32",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>📦 {ekUrunSayisi} ek ürün</span>
                  <span>+{ekUrunToplam.toFixed(2)}₺</span>
                </div>
              )}
              
              {/* GEÇEN SÜRE */}
              {masa.acik && masa.gecenDakika > 0 && (
                <div style={{
                  margin: "10px 0",
                  padding: "8px 12px",
                  background: uzatmaDurumunda 
                    ? "linear-gradient(135deg, #fff3e0, #ffe0b2)" 
                    : "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: uzatmaDurumunda ? "#ef6c00" : "#1565c0",
                  textAlign: "center",
                  fontWeight: "600",
                  border: `1px solid ${uzatmaDurumunda ? "#ffb74d" : "#90caf9"}`
                }}>
                  ⏱️ {masa.gecenDakika} dakika geçti
                  {uzatmaDurumunda && " (uzatma aktif)"}
                </div>
              )}
              
              {/* MASA AÇIK DEĞİLSE - SÜRE SEÇİMİ */}
              {!masa.acik ? (
                <div className="bilardo-sure-secim">
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      masaAc(masa, "30dk", index); 
                    }}
                  >
                    <span>30 DAKİKA</span>
                    <span>{ucretAyarlari?.bilardo30dk || 80}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      masaAc(masa, "1saat", index); 
                    }}
                  >
                    <span>1 SAAT</span>
                    <span>{ucretAyarlari?.bilardo1saat || 120}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      e.preventDefault();
                      masaAc(masa, "suresiz", index); 
                    }}
                  >
                    <span>SÜRESİZ</span>
                    <span>İlk 30dk: {ucretAyarlari?.bilardo30dk || 80}₺</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* AÇIK MASA BİLGİLERİ */}
                  <div className="bilardo-acik-masa-bilgi">
                    <div className="bilardo-bilgi-item">
                      <span>Açılış</span>
                      <strong>
                        {new Date(masa.acilisSaati).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </strong>
                    </div>
                    
                    <div className="bilardo-bilgi-item">
                      <span>Geçen Süre</span>
                      <strong>{masa.gecenDakika || 0} dakika</strong>
                    </div>
                    
                    <div className="bilardo-bilgi-item">
                      <span>Seçilen</span>
                      <strong>
                        {masa.sureTipi === "30dk" ? "30 Dakika" : 
                         masa.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}
                      </strong>
                    </div>
                  </div>
                  
                  {/* ÜCRET AÇIKLAMASI */}
                  <div className="bilardo-ucret-aciklama">
                    {uzatmaDurumunda ? (
                      `Dakika ücreti: ${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk`
                    ) : (
                      masa.sureTipi === "30dk" ? `30 dakika ücreti: ${ucretAyarlari?.bilardo30dk || 80}₺` :
                      masa.sureTipi === "1saat" ? `1 saat ücreti: ${ucretAyarlari?.bilardo1saat || 120}₺` :
                      `İlk 30dk: ${ucretAyarlari?.bilardo30dk || 80}₺ + Sonrası: ${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk`
                    )}
                  </div>
                  
                  {/* AKTARIM ve UZATMA BUTONLARI */}
                  <div className="bilardo-aktarim-buttons">
                    {/* SÜRELİ OYUNLARDA UZAT BUTONU (Uzatma durumunda değilse) */}
                    {(masa.sureTipi === "30dk" || masa.sureTipi === "1saat") && !uzatmaDurumunda && (
                      <button
                        className="bilardo-uzat-btn"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          uzatModalAc(masa, index);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
                          e.currentTarget.style.transform = 'translateY(-3px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #ffb74d, #ff9800)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ffb74d, #ff9800)',
                          color: 'white',
                          border: 'none',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '14px',
                          flex: '1',
                          marginRight: '5px'
                        }}
                      >
                        🔄 UZAT
                      </button>
                    )}
                    
                    {/* UZATMA DURUMUNDA "UZATMA AKTİF" BUTONU */}
                    {uzatmaDurumunda && (
                      <button
                        className="bilardo-uzat-btn"
                        style={{
                          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                          color: 'white',
                          border: 'none',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '14px',
                          flex: '1',
                          marginRight: '5px',
                          cursor: 'default',
                          opacity: 0.8
                        }}
                      >
                        🔄 UZATMA AKTİF
                      </button>
                    )}
                    
                    <button
                      className="bilardo-oyun-bitir-btn"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`); 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7f3131, #6a2828)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #9a3e3e, #7f3131)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      style={{
                        flex: (masa.sureTipi === "suresiz" || uzatmaDurumunda) ? '1' : '1',
                        marginRight: '5px'
                      }}
                    >
                      💳 ÖDEME
                    </button>
                    
                    <button
                      className="bilardo-masa-aktar-btn"
                      onClick={(e) => masaAktarModalAc(masa, index, e)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3a5a8c, #2b497a)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #4a6fa5, #3a5a8c)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      style={{
                        flex: '1'
                      }}
                    >
                      ↪️ AKTAR
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* AKTARIM MODAL */}
      {aktarimModal.acik && (
        <div className="bilardo-popup-overlay">
          <div className="bilardo-popup">
            <h3 className="bilardo-popup-title">Bilardo Adisyonunu Normal Masaya Aktar</h3>
            <p>Masalardan birini seçin (dolu masalara da eklenebilir):</p>
            
            <div className="bilardo-masa-listesi">
              {aktarimModal.normalMasalar && aktarimModal.normalMasalar.length > 0 ? (
                aktarimModal.normalMasalar.map(masa => {
                  const isDolu = masa.durum === "DOLU";
                  return (
                    <button
                      key={masa.id || masa.no}
                      className={`bilardo-masa-secim-btn ${isDolu ? 'dolu' : ''} ${aktarimModal.seciliMasa?.id === masa.id ? 'secili' : ''}`}
                      onClick={() => setAktarimModal({...aktarimModal, seciliMasa: masa})}
                      onMouseEnter={(e) => {
                        if (aktarimModal.seciliMasa?.id !== masa.id) {
                          e.currentTarget.style.background = isDolu ? '#ffebee' : '#f5e8d0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (aktarimModal.seciliMasa?.id !== masa.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      MASA {masa.no} {isDolu ? ' (DOLU)' : ''}
                    </button>
                  );
                })
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  color: '#c62828', 
                  gridColumn: '1 / -1',
                  fontSize: '16px'
                }}>
                  ⚠️ Masa bulunamadı!
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              💡 <strong>Not:</strong> Dolu masalar seçilebilir. Bilardo içeriği mevcut adisyona eklenecektir.
            </div>
            
            <div className="bilardo-modal-actions">
              <button 
                className="bilardo-modal-btn iptal"
                onClick={() => setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e0e0e0, #d0d0d0)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f0f0f0, #e0e0e0)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                İptal
              </button>
              <button 
                className="bilardo-modal-btn onay"
                onClick={masaAktar}
                disabled={!aktarimModal.seciliMasa}
                onMouseEnter={(e) => {
                  if (!aktarimModal.seciliMasa) return;
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3a5a8c, #2b497a)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!aktarimModal.seciliMasa) return;
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4a6fa5, #3a5a8c)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                MASAYA AKTAR
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* UZATMA MODAL */}
      {uzatModal.acik && (
        <div className="bilardo-popup-overlay">
          <div className="bilardo-popup" style={{ maxWidth: '500px' }}>
            <h3 className="bilardo-popup-title">⏱️ SÜRE UZAT</h3>
            <p style={{ textAlign: 'center', marginBottom: '20px' }}>
              <strong>Bilardo {uzatModal.masa?.no}</strong> için süre uzatma seçenekleri:
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '15px',
              marginBottom: '20px'
            }}>
              <button
                className="bilardo-sure-btn"
                onClick={() => sureUzat("30dk")}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                  border: '2px solid #90caf9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #bbdefb, #90caf9)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1565c0' }}>30 DAKİKA</span>
                <span style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
                  (Dakika ücreti başlat)
                </span>
              </button>
              
              <button
                className="bilardo-sure-btn"
                onClick={() => sureUzat("1saat")}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                  border: '2px solid #81c784',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c8e6c9, #81c784)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e8f5e9, #c8e6c9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#2e7d32' }}>1 SAAT</span>
                <span style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
                  (Dakika ücreti başlat)
                </span>
              </button>
            </div>
            
            <div style={{ 
              padding: '15px', 
              background: '#fff3e0', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ffcc80'
            }}>
              <div style={{ fontSize: '14px', color: '#ef6c00', fontWeight: '600' }}>
                💡 YENİ SÜRE UZATMA MANTIĞI:
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                1. İlk açılış ücreti: {ucretAyarlari?.bilardo30dk || 80}₺ (30dk) veya {ucretAyarlari?.bilardo1saat || 120}₺ (1saat)<br/>
                2. Uzatma sonrası: Dakika başı {ucretAyarlari?.bilardoDakikaUcreti || 2}₺ ücreti<br/>
                3. Ücret adisyon kapanırken otomatik hesaplanır<br/>
                4. Her uzatmada dakika sayacı sıfırlanmaz, eklenir
              </div>
            </div>
            
            <div style={{ 
              padding: '10px', 
              background: '#e3f2fd', 
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '13px', color: '#1565c0', textAlign: 'center' }}>
                Örnek: İlk 30dk = {ucretAyarlari?.bilardo30dk || 80}₺ + 15dk uzatma = +{((ucretAyarlari?.bilardoDakikaUcreti || 2) * 15).toFixed(2)}₺
              </div>
            </div>
            
            <div className="bilardo-modal-actions">
              <button 
                className="bilardo-modal-btn iptal"
                onClick={() => setUzatModal({ acik: false, masa: null, index: null })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e0e0e0, #d0d0d0)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f0f0f0, #e0e0e0)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}