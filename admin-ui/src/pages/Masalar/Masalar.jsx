import React, { useState, useEffect } from "react";
import "./Masalar.css";

// LocalStorage key'leri
const MASA_KEY = "mc_masalar";
const ADISYON_KEY = "mc_adisyonlar";

export default function Masalar() {
  const [masalar, setMasalar] = useState([]);
  const [loading, setLoading] = useState(true);

  // GEÇEN SÜRE HESAPLA
  const hesaplaGecenSure = (acilisZamani) => {
    if (!acilisZamani) return "--:--";
    
    try {
      const acilis = new Date(acilisZamani);
      const simdi = new Date();
      const diffMs = simdi - acilis;
      const dakika = Math.floor(diffMs / 60000);
      const saat = Math.floor(dakika / 60);
      const kalanDakika = dakika % 60;
      
      return `${saat.toString().padStart(2, '0')}:${kalanDakika.toString().padStart(2, '0')}`;
    } catch (error) {
      return "--:--";
    }
  };

  // MASALARI YÜKLE VE HESAPLA
  const masalariYukle = () => {
    console.log("🔄 Masalar yükleniyor...");
    
    try {
      // 1. Masaları LocalStorage'dan al
      const masalarData = JSON.parse(localStorage.getItem(MASA_KEY)) || [];
      
      // 2. Adisyonları LocalStorage'dan al
      const adisyonlarData = JSON.parse(localStorage.getItem(ADISYON_KEY)) || [];
      
      console.log("📊 Veri durumu:", {
        masaSayisi: masalarData.length,
        adisyonSayisi: adisyonlarData.length
      });
      
      // 3. Her masa için toplam tutarı hesapla
      const guncelMasalar = masalarData.map(masa => {
        // Ana adisyonu bul
        const anaAdisyon = adisyonlarData.find(
          a => a.id === masa.adisyonId && !a.kapali
        );
        
        // Split adisyonu bul
        const splitAdisyon = adisyonlarData.find(
          a => a.id === masa.ayirId && !a.kapali
        );
        
        let toplamTutar = 0;
        
        // Ana adisyon toplamı
        if (anaAdisyon && anaAdisyon.kalemler) {
          toplamTutar += anaAdisyon.kalemler.reduce(
            (sum, k) => sum + (Number(k.toplam) || 0), 0
          );
        }
        
        // Split adisyon toplamı
        if (splitAdisyon && splitAdisyon.kalemler) {
          toplamTutar += splitAdisyon.kalemler.reduce(
            (sum, k) => sum + (Number(k.toplam) || 0), 0
          );
        }
        
        // Geçen süreyi hesapla
        const gecenSure = toplamTutar > 0 ? 
          hesaplaGecenSure(anaAdisyon?.acilisZamani) : "--:--";
        
        return {
          ...masa,
          toplamTutar: toplamTutar.toFixed(2),
          durum: toplamTutar > 0 ? "DOLU" : "BOŞ",
          renk: toplamTutar > 0 ? "kırmızı" : "gri",
          gecenSure: gecenSure,
          acilisZamani: anaAdisyon?.acilisZamani || null
        };
      });
      
      setMasalar(guncelMasalar);
      setLoading(false);
      
      console.log("✅ Masalar güncellendi:", guncelMasalar);
      
    } catch (error) {
      console.error("❌ Masalar yüklenirken hata:", error);
      setLoading(false);
    }
  };

  // İLK YÜKLEME
  useEffect(() => {
    masalariYukle();
    
    // LOCALSTORAGE DEĞİŞİKLİKLERİNİ DİNLE
    const handleStorageChange = (e) => {
      if (e.key === MASA_KEY || e.key === ADISYON_KEY || !e.key) {
        console.log("🔔 Storage değişti, masalar yenileniyor:", e.key);
        masalariYukle();
      }
    };
    
    // 1. Storage event'i dinle
    window.addEventListener('storage', handleStorageChange);
    
    // 2. Custom event'leri dinle (Adisyon.jsx'ten gelen)
    window.addEventListener('masaUpdated', handleStorageChange);
    window.addEventListener('adisyonUpdated', handleStorageChange);
    window.addEventListener('masaKapatildi', handleStorageChange);
    
    // 3. BroadcastChannel ile diğer tab'lerden gelen mesajları dinle
    let channel;
    try {
      channel = new BroadcastChannel('mycafe_sync');
      channel.onmessage = (event) => {
        if (event.data.type === 'MASA_GUNCELLENDI' || 
            event.data.type === 'ADİSYON_KAPATILDI') {
          console.log("📡 BroadcastChannel mesajı:", event.data);
          masalariYukle();
        }
      };
    } catch (e) {
      console.log('BroadcastChannel desteklenmiyor');
    }
    
    // 4. Sayfa görünür olduğunda yenile
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Sayfa görünür oldu, masalar yenileniyor...");
        masalariYukle();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('masaUpdated', handleStorageChange);
      window.removeEventListener('adisyonUpdated', handleStorageChange);
      window.removeEventListener('masaKapatildi', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) channel.close();
    };
  }, []);

  // MASAYA TIKLANDIĞINDA
  const masaTiklandi = (masa) => {
    if (masa.durum === "DOLU" || window.confirm(`Masa ${masa.no} boş. Yeni adisyon açılsın mı?`)) {
      // Bilardo masası kontrolü
      const isBilardo = masa.no.toString().includes("BİLARDO") || 
                       masa.no.toString().includes("BILARDO");
      
      if (isBilardo) {
        window.location.href = `/bilardo/${masa.no}`;
      } else {
        window.location.href = `/adisyon/${masa.no}`;
      }
    }
  };

  // YENİ MASA EKLE
  const yeniMasaEkle = () => {
    const yeniMasaNo = masalar.length + 1;
    const yeniMasa = {
      id: Date.now(),
      no: yeniMasaNo,
      adisyonId: null,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00",
      durum: "BOŞ",
      renk: "gri",
      acilisZamani: null,
      musteriAdi: null,
      kisiSayisi: null,
    };
    
    const guncelMasalar = [...masalar, yeniMasa];
    localStorage.setItem(MASA_KEY, JSON.stringify(guncelMasalar));
    setMasalar(guncelMasalar);
    
    // Event tetikle
    window.dispatchEvent(new Event('storage'));
  };

  // LOADING DURUMU
  if (loading) {
    return (
      <div className="masalar-container">
        <div className="loading">
          🍽️ Masalar yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="masalar-container">
      {/* HEADER - ESKİ TASARIM */}
      <div className="masalar-header">
        <h1>🍽️ MASALAR</h1>
        <button 
          onClick={masalariYukle}
          className="yenile-btn"
          title="Masaları Yenile"
        >
          🔄 Yenile
        </button>
      </div>
      
      {/* MASALAR GRID - ESKİ TASARIM */}
      <div className="masalar-grid">
        {masalar.map((masa) => (
          <div 
            key={masa.id || masa.no}
            className={`masa-kart ${masa.durum === 'DOLU' ? 'dolu' : 'bos'}`}
            onClick={() => masaTiklandi(masa)}
          >
            {/* SPLIT BADGE */}
            {masa.ayirId && (
              <div className="masa-split-badge">SPLIT</div>
            )}
            
            {/* MASA NUMARASI */}
            <div className="masa-no">MASA {masa.no}</div>
            
            {/* MASA DURUMU */}
            <div className="masa-durum">{masa.durum}</div>
            
            {/* MASA TUTARI */}
            <div className="masa-tutar">{masa.toplamTutar || "0.00"} TL</div>
            
            {/* MÜŞTERİ ADI */}
            {masa.musteriAdi && (
              <div className="masa-musteri">{masa.musteriAdi}</div>
            )}
            
            {/* SÜRE BİLGİSİ */}
            {masa.acilisZamani && (
              <div className="masa-sure">
                <span className="masa-acilis">
                  {new Date(masa.acilisZamani).toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className="masa-gecen-sure">
                  {masa.gecenSure || "--:--"}
                </span>
              </div>
            )}
            
            {/* KİŞİ SAYISI */}
            {masa.kisiSayisi && (
              <div className="masa-kisi">{masa.kisiSayisi} kişi</div>
            )}
          </div>
        ))}
        
        {/* YENİ MASA EKLE BUTONU */}
        <div className="yeni-masa-kart" onClick={yeniMasaEkle}>
          <div className="yeni-masa-icon">+</div>
          <div className="yeni-masa-label">YENİ MASA EKLE</div>
        </div>
      </div>
      
      {/* FOOTER - İSTATİSTİKLER */}
      <div className="masalar-footer">
        <div className="masa-istatistik">
          <span>Toplam: {masalar.length} masa</span>
          <span>Dolu: {masalar.filter(m => m.durum === "DOLU").length} masa</span>
          <span>Boş: {masalar.filter(m => m.durum === "BOŞ").length} masa</span>
        </div>
      </div>
    </div>
  );
}