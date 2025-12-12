// MasaKarti.jsx - EVENT LISTENER EKLENDİ
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Masalar.css";
import syncService, { SYNC_EVENTS } from "../../services/syncService";

export default function MasaKarti({ masa, onClick }) {
  const [toplamTutar, setToplamTutar] = useState("0.00");
  const [acilisZamani, setAcilisZamani] = useState(masa.acilisZamani || null);
  const [gecenSure, setGecenSure] = useState("00:00");
  const [musteriAdi, setMusteriAdi] = useState(masa.musteriAdi || "");
  const [masaDurumu, setMasaDurumu] = useState(masa.durum || "BOŞ");
  
  // Masa toplamını ve açılış zamanını hesapla
  const hesaplaMasaBilgileri = () => {
    try {
      const adisyonlar = syncService.oku('mc_adisyonlar');
      
      // Ana adisyonu bul
      const anaAdisyon = adisyonlar.find(a => a.id === masa.adisyonId && !a.kapali);
      
      // Split adisyonu bul
      const splitAdisyon = masa.ayirId 
        ? adisyonlar.find(a => a.id === masa.ayirId && !a.kapali)
        : null;
      
      let toplam = 0;
      let yeniAcilisZamani = masa.acilisZamani;
      
      if (anaAdisyon) {
        if (anaAdisyon.kalemler) {
          toplam += anaAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        }
        // AÇILIŞ ZAMANI: Ana adisyondan al
        if (anaAdisyon.acilisZamani && !yeniAcilisZamani) {
          yeniAcilisZamani = anaAdisyon.acilisZamani;
        }
      }
      
      if (splitAdisyon && splitAdisyon.kalemler) {
        toplam += splitAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
      }
      
      return {
        toplam: toplam.toFixed(2),
        acilisZamani: yeniAcilisZamani,
        durum: toplam > 0 ? "DOLU" : "BOŞ"
      };
    } catch (error) {
      console.error("Masa bilgileri hesaplanırken hata:", error);
      return {
        toplam: "0.00",
        acilisZamani: masa.acilisZamani,
        durum: masa.durum
      };
    }
  };
  
  // Geçen süreyi hesapla
  const hesaplaGecenSure = () => {
    if (!acilisZamani) return "00:00";
    
    try {
      const acilis = new Date(acilisZamani);
      const simdi = new Date();
      const diffMs = simdi - acilis;
      const dakika = Math.floor(diffMs / 60000);
      const saat = Math.floor(dakika / 60);
      const kalanDakika = dakika % 60;
      const sSaat = String(saat).padStart(2, "0");
      const sDakika = String(kalanDakika).padStart(2, "0");
      
      return `${sSaat}:${sDakika}`;
    } catch {
      return "00:00";
    }
  };
  
  // Masa bilgilerini güncelle
  const guncelleMasaBilgileri = () => {
    const bilgiler = hesaplaMasaBilgileri();
    setToplamTutar(bilgiler.toplam);
    setAcilisZamani(bilgiler.acilisZamani);
    setMasaDurumu(bilgiler.durum);
    
    const sure = hesaplaGecenSure();
    setGecenSure(sure);
    
    // Müşteri adını güncelle
    setMusteriAdi(masa.musteriAdi || "");
  };
  
  // İlk yükleme
  useEffect(() => {
    guncelleMasaBilgileri();
    
    // Her dakika geçen süreyi güncelle (sadece dolu masalar için)
    const interval = setInterval(() => {
      if (acilisZamani && masaDurumu === "DOLU") {
        const sure = hesaplaGecenSure();
        setGecenSure(sure);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [masa.no, masa.adisyonId, masa.ayirId, masa.musteriAdi, acilisZamani, masaDurumu]);
  
  // 🔴 SYNC SERVICE EVENT DİNLEYİCİSİ - YENİ EKLENDİ
  useEffect(() => {
    const handleMasaGuncellendi = (eventData) => {
      if (eventData.masaNo === Number(masa.no)) {
        console.log('🔄 MasaKarti: Masa güncellendi, yenileniyor...', eventData);
        
        // Masayı yeniden yükle
        const guncelMasalar = syncService.oku('mc_masalar');
        const guncelMasa = guncelMasalar.find(m => Number(m.no) === Number(masa.no));
        
        if (guncelMasa) {
          // Güncel verileri ayarla
          setMusteriAdi(guncelMasa.musteriAdi || "");
          setMasaDurumu(guncelMasa.durum || "BOŞ");
          setAcilisZamani(guncelMasa.acilisZamani || null);
          setToplamTutar(guncelMasa.toplamTutar || "0.00");
          
          // Geçen süreyi yeniden hesapla
          if (guncelMasa.acilisZamani && guncelMasa.durum === "DOLU") {
            const sure = hesaplaGecenSure();
            setGecenSure(sure);
          } else {
            setGecenSure("00:00");
          }
        }
      }
    };
    
    // Event listener'ları ekle
    if (syncService) {
      syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
    }
    
    window.addEventListener('storage', handleMasaGuncellendi);
    
    return () => {
      // Event listener'ları temizle
      if (syncService) {
        syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      }
      window.removeEventListener('storage', handleMasaGuncellendi);
    };
  }, [masa.no]);
  
  // Masa durumuna göre renk
  const masaRenk = () => {
    if (masaDurumu === "DOLU") return "kırmızı";
    return "gri";
  };
  
  return (
    <div 
      className={`masa-kart ${masaDurumu === 'DOLU' ? 'dolu' : 'bos'} ${masaRenk()}`}
      onClick={() => onClick(masa)}
    >
      <div className="masa-no">MASA {masa.no}</div>
      <div className="masa-durum">{masaDurumu}</div>
      <div className="masa-tutar">{toplamTutar} TL</div>
      
      {/* AÇILIŞ ZAMANI ve GEÇEN SÜRE */}
      {acilisZamani && masaDurumu === 'DOLU' && (
        <div className="masa-sure">
          <div className="masa-acilis">
            {new Date(acilisZamani).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="masa-gecen-sure">
            ⏱️ {gecenSure}
          </div>
        </div>
      )}
      
      <div className="masa-musteri">{musteriAdi}</div>
      <div className="masa-kisi">{masa.kisiSayisi ? `${masa.kisiSayisi} kişi` : ''}</div>
    </div>
  );
}