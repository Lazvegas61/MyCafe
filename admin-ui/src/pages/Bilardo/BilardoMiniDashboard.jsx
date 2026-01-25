
// admin-ui/src/pages/Bilardo/BilardoMiniDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./BilardoMiniDashboard.css"; // CSS dosyasını import et

export default function BilardoMiniDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    gunlukCiro: 0,
    acikMasaSayisi: 0,
    toplamOyunSuresi: 0, // dakika olarak
    ortalamaMasaGeliri: 0,
    tamamlananMasaSayisi: 0
  });
  const [loading, setLoading] = useState(true);

  // Yetki kontrolü: Mutfak rolü için gösterme
  if (user?.role === "MUTFAK") {
    return null;
  }

  // Dashboard verilerini hesapla
  useEffect(() => {
    const calculateDashboardData = () => {
      try {
        setLoading(true);
        
        // 1. Bilardo adisyonlarını yükle
        const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
        
        // Bugünün tarihi (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
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
      } finally {
        setLoading(false);
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

  // Format para birimi
  const formatPara = (miktar) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(miktar);
  };

  return (
    <div className="bilardo-mini-dashboard">
      {/* Günlük Toplam Bilardo Cirosu */}
      <div className={`dashboard-card ciro-card ${loading ? 'loading' : ''}`}>
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#10b981"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#10b981"/>
            <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {loading ? "..." : `${formatPara(dashboardData.gunlukCiro)}₺`}
          </div>
          <div className="dashboard-card-label">
            Günlük Ciro
          </div>
          <div className="dashboard-card-subtext">
            📅 Bugün
          </div>
        </div>
      </div>

      {/* Açık Masa Sayısı */}
      <div className={`dashboard-card masa-card ${loading ? 'loading' : ''}`}>
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" rx="2" fill="#3b82f6"/>
            <circle cx="9" cy="10" r="2" fill="white"/>
            <circle cx="15" cy="10" r="2" fill="white"/>
            <path d="M9 16H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {loading ? "..." : dashboardData.acikMasaSayisi}
          </div>
          <div className="dashboard-card-label">
            Aktif Masalar
          </div>
          <div className="dashboard-card-subtext">
            ⚡ Anlık
          </div>
        </div>
      </div>

      {/* Toplam Oynanan Süre */}
      <div className={`dashboard-card sure-card ${loading ? 'loading' : ''}`}>
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value digital-clock">
            {loading ? "--:--" : formatSure(dashboardData.toplamOyunSuresi)}
          </div>
          <div className="dashboard-card-label">
            Toplam Oyun Süresi
          </div>
          <div className="dashboard-card-subtext">
            ⏱️ Saat:Dakika
          </div>
        </div>
      </div>

      {/* Ortalama Masa Geliri */}
      <div className={`dashboard-card ortalama-card ${loading ? 'loading' : ''}`}>
        <div className="dashboard-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="#8b5cf6"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="white"/>
            <path d="M12 9.5V14.5" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 12H14.5" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="dashboard-card-content">
          <div className="dashboard-card-value">
            {loading ? "..." : `${formatPara(dashboardData.ortalamaMasaGeliri)}₺`}
          </div>
          <div className="dashboard-card-label">
            Ortalama Masa
          </div>
          <div className="dashboard-card-subtext">
            ✅ {dashboardData.tamamlananMasaSayisi} masa tamamlandı
          </div>
        </div>
      </div>
    </div>
  );
}
