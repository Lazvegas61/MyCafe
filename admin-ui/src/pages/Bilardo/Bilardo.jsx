// admin-ui/src/pages/Bilardo/Bilardo.jsx
/* ------------------------------------------------------------
   📌 Bilardo.jsx — GÜNCELLENMİŞ ve TAM ÇALIŞAN
   - Bilardo ücreti adisyona otomatik kaydediliyor
   - Ana ekran senkronizasyonu düzeltildi
   - Açık adisyonlarda bilardo ücreti gösterimi
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bilardo.css";

export default function Bilardo() {
  const navigate = useNavigate();
  
  // ANA STATE'LER
  const [masalar, setMasalar] = useState([]);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  const [sureBittiPopup, setSureBittiPopup] = useState(null);
  
  // MODAL STATE'LERİ
  const [aktarimModal, setAktarimModal] = useState({
    acik: false,
    bilardoMasa: null,
    seciliMasa: null
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
     📌 1. LOCALSTORAGE İŞLEMLERİ ve ANLIK HESAPLAMA
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
            aktifAdisyonId: null
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
          const gecenDakika = masaAdisyonu.acilisZamani ? 
            Math.floor((now - masaAdisyonu.acilisZamani) / 60000) : 0;
          
          // ANLIK ÜCRET HESAPLA
          let anlikUcret = 0;
          const bilardo30dk = ayarlar.bilardo30dk || 80;
          const bilardo1saat = ayarlar.bilardo1saat || 120;
          const bilardoDakikaUcreti = ayarlar.bilardoDakikaUcreti || 2;
          
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
          
          // Ek ürünlerin toplamını hesapla
          const ekUrunler = masaAdisyonu.ekUrunler || [];
          const ekUrunToplam = ekUrunler.reduce((sum, u) => 
            sum + (u.fiyat * u.adet), 0);
          
          const toplamTutar = anlikUcret + ekUrunToplam;
          
          // BİLARDO ÜCRETİNİ ADİSYONA KAYDET - DÜZELTİLDİ
          const adisyonIndex = adisyonlar.findIndex(a => a.id === masa.aktifAdisyonId);
          if (adisyonIndex !== -1) {
            adisyonlar[adisyonIndex].bilardoUcret = anlikUcret;
            adisyonlar[adisyonIndex].toplamTutar = toplamTutar;
            localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
          }
          
          // AÇIK ADİSYONLARA EKLE (Ana Sayfa için) - GÜNCELLENDİ
          updateAcikAdisyonlar(masaAdisyonu, anlikUcret, ekUrunToplam, gecenDakika, masa.no);
          
          return {
            ...masa,
            acik: true,
            durum: "ACIK",
            sureTipi: masaAdisyonu.sureTipi,
            acilisSaati: masaAdisyonu.acilisZamani,
            aktifAdisyonId: masaAdisyonu.id,
            ucret: anlikUcret,
            ekUrunToplam: ekUrunToplam,
            toplamTutar: toplamTutar,
            gecenDakika: gecenDakika,
            ekUrunSayisi: ekUrunler.length
          };
        }
        
        return {
          ...masa,
          ekUrunToplam: 0,
          toplamTutar: 0,
          gecenDakika: 0,
          ekUrunSayisi: 0
        };
      });
      
      setMasalar(updatedMasalar);
      kontrolSureBitti(updatedMasalar);
    };
    
    loadAndCalculate();
    
    const interval = setInterval(loadAndCalculate, 5000); // 5 saniyede bir güncelle
    
    return () => clearInterval(interval);
  }, []);
  
  // AÇIK ADİSYONLARI GÜNCELLE (Ana Sayfa için) - GÜNCELLENDİ
  const updateAcikAdisyonlar = (adisyon, bilardoUcret, ekUrunToplam, gecenDakika, masaNo) => {
    try {
      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      
      const bilardoAdisyonu = {
        id: adisyon.id,
        masaNo: masaNo || adisyon.bilardoMasaNo,
        tur: "BİLARDO",
        sureTipi: adisyon.sureTipi,
        gecenDakika: gecenDakika,
        bilardoUcret: bilardoUcret, // BİLARDO ÜCRETİ EKLENDİ
        ekUrunToplam: ekUrunToplam,
        toplamTutar: bilardoUcret + ekUrunToplam, // TOPLAM TUTAR
        acilisZamani: adisyon.acilisZamani,
        durum: "ACIK",
        updatedAt: Date.now(),
        // Ana ekran için ek bilgiler
        no: masaNo || adisyon.bilardoMasaNo,
        musteriAdi: adisyon.musteriAdi || "Bilardo Müşterisi",
        urunSayisi: (adisyon.ekUrunler || []).length,
        isBilardo: true
      };
      
      // Var mı kontrol et
      const existingIndex = acikAdisyonlar.findIndex(a => a.id === adisyon.id);
      
      if (existingIndex !== -1) {
        acikAdisyonlar[existingIndex] = bilardoAdisyonu;
      } else {
        acikAdisyonlar.push(bilardoAdisyonu);
      }
      
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(acikAdisyonlar));
      
      // ANA EKRAN İÇİN EK BİR KAYIT DAHA
      syncToAnaEkran(bilardoAdisyonu);
    } catch (error) {
      console.error("Açık adisyon güncelleme hatası:", error);
    }
  };

  // YENİ FONKSİYON: Ana Ekran için senkronizasyon
  const syncToAnaEkran = (bilardoAdisyonu) => {
    try {
      // Ana ekran için özel bir storage alanı
      const anaEkranData = JSON.parse(localStorage.getItem("mc_ana_ekran_data") || "{}");
      
      if (!anaEkranData.acikAdisyonlar) {
        anaEkranData.acikAdisyonlar = [];
      }
      
      // Bilardo adisyonunu ekle/güncelle
      const index = anaEkranData.acikAdisyonlar.findIndex(a => a.id === bilardoAdisyonu.id);
      if (index !== -1) {
        anaEkranData.acikAdisyonlar[index] = bilardoAdisyonu;
      } else {
        anaEkranData.acikAdisyonlar.push(bilardoAdisyonu);
      }
      
      localStorage.setItem("mc_ana_ekran_data", JSON.stringify(anaEkranData));
      
      // Ayrıca global bir event tetikle (diğer sayfalar için)
      window.dispatchEvent(new CustomEvent('bilardoAdisyonGuncellendi', {
        detail: bilardoAdisyonu
      }));
      
    } catch (error) {
      console.error("Ana ekran senkronizasyon hatası:", error);
    }
  };

  /* ============================================================
     📌 2. ÜCRET HESAPLAMA FONKSİYONLARI
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
     📌 3. MASA İŞLEMLERİ
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
      aktifAdisyonId: null
    };
    
    const yeniMasalar = [...masalar, yeniMasa];
    setMasalar(yeniMasalar);
    localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
  };
  
  const masaNoIleSil = () => {
    const masaNo = parseInt(silMasaNo.trim());
    if (isNaN(masaNo) || masaNo < 1) {
      alert("Geçerli bir masa numarası girin!");
      return;
    }
    
    const masaIndex = masaNo - 1;
    if (masaIndex < 0 || masaIndex >= masalar.length) {
      alert("Bu numarada bir masa yok!");
      return;
    }
    
    const masa = masalar[masaIndex];
    
    if (masa.durum === "ACIK" || masa.acik) {
      alert("Açık masa silinemez! Önce oyunu bitirin.");
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
    
    alert(`Bilardo Masa ${masaNo} başarıyla silindi.`);
  };
  
  const masaAc = (masa, tip, index) => {
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
      bilardoUcret: ucretHesapla(tip, 0), // BİLARDO ÜCRETİ EKLENDİ
      ekUrunler: [],
      odemeler: [],
      toplamOdenen: 0,
      toplamTutar: ucretHesapla(tip, 0), // TOPLAM TUTAR EKLENDİ
      not: ""
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
            ucret: ucretHesapla(tip, 0),
            toplamTutar: ucretHesapla(tip, 0)
          }
        : m
    );
    
    setMasalar(updated);
    localStorage.setItem("bilardo", JSON.stringify(updated));
    
    // Açık adisyonlara ekle
    updateAcikAdisyonlar(yeniAdisyon, ucretHesapla(tip, 0), 0, 0, `B${index + 1}`);
    
    // Yönlendirme yap (istemci isterse)
    setTimeout(() => {
      if (window.confirm("Bilardo adisyonuna gitmek ister misiniz?")) {
        navigate(`/bilardo-adisyon/${yeniAdisyon.id}`);
      }
    }, 300);
  };
  
  // ÇİFT TIKLAMA: Bilardo adisyonuna git
  const handleCardDoubleClick = (masa) => {
    if (!masa.aktifAdisyonId) {
      alert("Bu masa için henüz adisyon oluşturulmamış!");
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
     📌 4. MASAYA AKTARIM
  ============================================================ */
  
  const masaAktarModalAc = (masa, index, e) => {
    e.stopPropagation(); // Kart tıklamasını engelle
    
    // Boş normal masaları yükle
    const normalMasaData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const bosMasalar = normalMasaData.filter(m => {
      const durum = m.durum || "";
      return (durum === "BOŞ" || durum === "TEMİZ") && !m.adisyonId;
    });
    
    setAktarimModal({
      acik: true,
      bilardoMasa: { ...masa, index },
      seciliMasa: null,
      normalMasalar: bosMasalar
    });
  };
  
  const masaAktar = () => {
    const { bilardoMasa, seciliMasa } = aktarimModal;
    
    if (!bilardoMasa || !seciliMasa) {
      alert("Lütfen aktarılacak masa seçin!");
      return;
    }
    
    // Bilardo adisyonunu normal masaya aktar
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const adisyon = adisyonlar.find(a => a.id === bilardoMasa.aktifAdisyonId);
    
    if (!adisyon) {
      alert("Bilardo adisyonu bulunamadı!");
      return;
    }
    
    // Toplam tutarı hesapla
    const bilardoUcret = bilardoMasa.ucret || 0;
    const ekUrunToplam = bilardoMasa.ekUrunToplam || 0;
    const toplamTutar = bilardoUcret + ekUrunToplam;
    
    // Normal masayı güncelle
    const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const updatedMasalar = masalarData.map(m => {
      if (m.id === seciliMasa.id) {
        return {
          ...m,
          durum: "DOLU",
          adisyonId: `bilardo_transfer_${Date.now()}`,
          toplamTutar: toplamTutar.toFixed(2),
          acilisZamani: new Date().toISOString(),
          musteriAdi: `Bilardo Masa ${bilardoMasa.no} Transfer`,
          guncellemeZamani: new Date().toISOString(),
          bilardoUcret: bilardoUcret, // BİLARDO ÜCRETİ KAYDEDİLDİ
          ekUrunToplam: ekUrunToplam
        };
      }
      return m;
    });
    
    localStorage.setItem("mc_masalar", JSON.stringify(updatedMasalar));
    
    // Bilardo masasını kapat
    const updatedBilardoMasalar = masalar.map((m, i) => 
      i === bilardoMasa.index 
        ? { 
            ...m, 
            acik: false, 
            durum: "KAPALI", 
            sureTipi: null, 
            acilisSaati: null,
            ucret: 0,
            aktifAdisyonId: null
          }
        : m
    );
    
    setMasalar(updatedBilardoMasalar);
    localStorage.setItem("bilardo", JSON.stringify(updatedBilardoMasalar));
    
    // Bilardo adisyonunu kapat
    const adisyonIndex = adisyonlar.findIndex(a => a.id === bilardoMasa.aktifAdisyonId);
    if (adisyonIndex !== -1) {
      adisyonlar[adisyonIndex].durum = "KAPANDI";
      adisyonlar[adisyonIndex].kapanisZamani = Date.now();
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // Açık adisyonlardan kaldır
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    const filteredAcikAdisyonlar = acikAdisyonlar.filter(a => a.id !== bilardoMasa.aktifAdisyonId);
    localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(filteredAcikAdisyonlar));
    
    alert(`Bilardo adisyonu MASA ${seciliMasa.no}'ya başarıyla aktarıldı!`);
    setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null });
  };

  /* ============================================================
     📌 5. SÜRE TAKİBİ ve POPUP
  ============================================================ */
  
  const kontrolSureBitti = (currentMasalar = masalar) => {
    const now = Date.now();
    let yeniPopup = null;
    
    currentMasalar.forEach(masa => {
      if (masa.acik && masa.acilisSaati) {
        const gecenDakika = Math.floor((now - masa.acilisSaati) / 60000);
        
        if (masa.sureTipi === "30dk" && gecenDakika >= 30) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masa.no,
            mesaj: "30 dakika süresi doldu!",
            timestamp: now
          };
        } else if (masa.sureTipi === "1saat" && gecenDakika >= 60) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masa.no,
            mesaj: "1 saat süresi doldu!",
            timestamp: now
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
      navigate(`/bilardo-adisyon/${masalar[masaIndex].aktifAdisyonId}`);
    }
  };

  /* ============================================================
     📌 6. EKRAN RENDER
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
            Tıklayarak adisyona gidin...
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
      
      {/* ÜCRET BİLGİSİ BANNER */}
      {ucretAyarlari && (
        <div className="bilardo-ucret-banner">
          <div className="bilardo-ucret-item">
            <span>30 Dakika</span>
            <strong>{ucretAyarlari.bilardo30dk || 80}₺</strong>
            <small>30dk'dan önce kapanırsa da aynı</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>1 Saat</span>
            <strong>{ucretAyarlari.bilardo1saat || 120}₺</strong>
            <small>Saatlik ücret</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>Süresiz</span>
            <strong>{ucretAyarlari.bilardo30dk || 80}₺</strong>
            <small>+ {ucretAyarlari.bilardoDakikaUcreti || 2}₺/dk (30dk sonrası)</small>
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
              </div>
              
              {/* TOPLAM TUTAR (Bilardo + Ek Ürünler) */}
              {masa.acik && (
                <div className="bilardo-toplam-tutar">
                  <span>TOPLAM TUTAR:</span>
                  <span>{toplamTutar.toFixed(2)}₺</span>
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
                  background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#1565c0",
                  textAlign: "center",
                  fontWeight: "600",
                  border: "1px solid #90caf9"
                }}>
                  ⏱️ {masa.gecenDakika} dakika geçti
                </div>
              )}
              
              {/* MASA AÇIK DEĞİLSE - SÜRE SEÇİMİ */}
              {!masa.acik ? (
                <div className="bilardo-sure-secim">
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "30dk", index); }}
                  >
                    <span>30 DAKİKA</span>
                    <span>{ucretAyarlari?.bilardo30dk || 80}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "1saat", index); }}
                  >
                    <span>1 SAAT</span>
                    <span>{ucretAyarlari?.bilardo1saat || 120}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "suresiz", index); }}
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
                    {masa.sureTipi === "30dk" && `30 dakika ücreti: ${ucretAyarlari?.bilardo30dk || 80}₺`}
                    {masa.sureTipi === "1saat" && `1 saat ücreti: ${ucretAyarlari?.bilardo1saat || 120}₺`}
                    {masa.sureTipi === "suresiz" && 
                      `İlk 30dk: ${ucretAyarlari?.bilardo30dk || 80}₺ + Sonrası: ${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk`}
                  </div>
                  
                  {/* AKTARIM BUTONLARI */}
                  <div className="bilardo-aktarim-buttons">
                    <button
                      className="bilardo-oyun-bitir-btn"
                      onClick={(e) => { e.stopPropagation(); handleCardClick(masa); }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7f3131, #6a2828)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #9a3e3e, #7f3131)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      💳 ÖDEME YAP
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
                    >
                      ↪️ MASAYA AKTAR
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
            <p>Boş masalardan birini seçin:</p>
            
            <div className="bilardo-masa-listesi">
              {aktarimModal.normalMasalar && aktarimModal.normalMasalar.length > 0 ? (
                aktarimModal.normalMasalar.map(masa => (
                  <button
                    key={masa.id || masa.no}
                    className={`bilardo-masa-secim-btn ${aktarimModal.seciliMasa?.id === masa.id ? 'secili' : ''}`}
                    onClick={() => setAktarimModal({...aktarimModal, seciliMasa: masa})}
                    onMouseEnter={(e) => {
                      if (aktarimModal.seciliMasa?.id !== masa.id) {
                        e.currentTarget.style.background = '#f5e8d0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (aktarimModal.seciliMasa?.id !== masa.id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    MASA {masa.no}
                  </button>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  color: '#c62828', 
                  gridColumn: '1 / -1',
                  fontSize: '16px'
                }}>
                  ⚠️ Boş masa bulunamadı!
                </div>
              )}
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
    </div>
  );
}