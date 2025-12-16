import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AnaEkran.css";

export default function AnaEkran() {
  const [currentTime, setCurrentTime] = useState("");
  const [dashboardData, setDashboardData] = useState({
    dailySales: "0,00",
    totalDebt: "0,00",
    dailyExpenses: "0,00",
    criticalCount: 0,
    openTables: [],
    criticalProducts: []
  });
  
  const [openTablesSummary, setOpenTablesSummary] = useState({
    totalAmount: 0,
    normalCount: 0,
    bilardoCount: 0,
    normalTotal: 0,
    bilardoTotal: 0,
    avgDuration: 0,
    tableCount: 0
  });
  
  const navigate = useNavigate();

  // Canlı saat güncellemesi
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Süre hesaplama fonksiyonu
  const calculateDuration = (acilisZamani) => {
    if (!acilisZamani) return { minutes: 0, formatted: "0 dk" };
    
    const start = new Date(acilisZamani);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return { minutes: diffMins, formatted: `${diffMins} dk` };
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return { 
        minutes: diffMins, 
        formatted: `${hours} sa ${mins} dk`,
        hours: hours
      };
    }
  };

  // Açık Adisyonlar Toplamını Hesapla
  const calculateOpenTablesSummary = useMemo(() => {
    return (openTables) => {
      if (!openTables || openTables.length === 0) {
        return {
          totalAmount: 0,
          normalCount: 0,
          bilardoCount: 0,
          normalTotal: 0,
          bilardoTotal: 0,
          avgDuration: 0,
          tableCount: 0
        };
      }
      
      let totalAmount = 0;
      let normalCount = 0;
      let bilardoCount = 0;
      let normalTotal = 0;
      let bilardoTotal = 0;
      let totalDuration = 0;
      
      openTables.forEach(masa => {
        const amount = parseFloat(masa.toplamTutar) || 0;
        totalAmount += amount;
        
        // Masa türünü belirle (bilardo veya normal)
        const isBilardo = masa.no > 20; // 20'den büyükse bilardo
        if (isBilardo) {
          bilardoCount++;
          bilardoTotal += amount;
        } else {
          normalCount++;
          normalTotal += amount;
        }
        
        // Süreyi hesapla
        const duration = calculateDuration(masa.acilisZamani);
        totalDuration += duration.minutes;
      });
      
      const avgDuration = openTables.length > 0 
        ? Math.round(totalDuration / openTables.length) 
        : 0;
      
      return {
        totalAmount,
        normalCount,
        bilardoCount,
        normalTotal,
        bilardoTotal,
        avgDuration,
        tableCount: openTables.length
      };
    };
  }, []);

  // Dashboard verilerini güncelle
  useEffect(() => {
    const updateDashboardData = () => {
      try {
        // Günlük satış hesapla
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const today = new Date().toLocaleDateString('tr-TR').split('.')[0];
        
        const todaySales = adisyonlar
          .filter(a => String(a.odendi).toLowerCase() === 'true' && 
                      a.kapatmaZamani && 
                      a.kapatmaZamani.includes(today))
          .reduce((sum, a) => sum + (Math.abs(parseFloat(a.toplamTutar)) || 0), 0);

        // Hesaba Yaz (Borçlar)
        const borclar = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
        const totalDebt = borclar
          .filter(b => String(b.odendi).toLowerCase() === 'false')
          .reduce((sum, b) => sum + (Math.abs(parseFloat(b.tutar)) || 0), 0);

        // Giderler
        const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
        const todayExpenses = giderler
          .filter(g => g.tarih && g.tarih.includes(today))
          .reduce((sum, g) => sum + (Math.abs(parseFloat(g.tutar)) || 0), 0);

        // Kritik stok
        const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
        const criticalProducts = urunler.filter(u => 
          (parseInt(u.stock) || 0) <= (parseInt(u.critical) || 10)
        );

        // Açık adisyonlar
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        const openTables = masalar.filter(m => String(m.durum).toUpperCase() === "DOLU");
        
        // Açık adisyon özetini hesapla
        const summary = calculateOpenTablesSummary(openTables);
        setOpenTablesSummary(summary);

        setDashboardData({
          dailySales: todaySales.toFixed(2),
          totalDebt: totalDebt.toFixed(2),
          dailyExpenses: todayExpenses.toFixed(2),
          criticalCount: criticalProducts.length,
          openTables: openTables,
          criticalProducts: criticalProducts.slice(0, 5)
        });
      } catch (error) {
        console.error("Dashboard veri yükleme hatası:", error);
        setDashboardData({
          dailySales: "0,00",
          totalDebt: "0,00",
          dailyExpenses: "0,00",
          criticalCount: 0,
          openTables: [],
          criticalProducts: []
        });
        setOpenTablesSummary({
          totalAmount: 0,
          normalCount: 0,
          bilardoCount: 0,
          normalTotal: 0,
          bilardoTotal: 0,
          avgDuration: 0,
          tableCount: 0
        });
      }
    };

    updateDashboardData();
    
    // Storage değişikliklerini dinle
    const handleStorageChange = () => {
      updateDashboardData();
    };
    
    // Her 30 saniyede bir verileri güncelle
    const interval = setInterval(updateDashboardData, 30000);
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [calculateOpenTablesSummary]);

  // Rapor kartlarına tıklama
  const handleReportClick = (type) => {
    switch(type) {
      case 'kasa':
        navigate('/raporlar/kasa');
        break;
      case 'gider':
        navigate('/raporlar/gider-raporu');
        break;
      case 'masa':
        navigate('/raporlar/masa-detay');
        break;
      default:
        navigate('/raporlar');
    }
  };

  // Format para
  const formatPara = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return (numValue || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Masa detayına git
  const goToTableDetail = (masaId) => {
    navigate(`/adisyondetay/${masaId}`);
  };

  return (
    <div className="ana-wrapper">
      <div className="top-bar">
        <div className="title-3d">GÜNLÜK ÖZET</div>
        <div className="clock-box">{currentTime}</div>
      </div>

      <div className="summary-cards">
        <div className="sum-card">
          <div className="sum-icon">💰</div>
          <div className="sum-title">Günlük Satış</div>
          <div className="sum-value">{formatPara(dashboardData.dailySales)} ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🧾</div>
          <div className="sum-title">Hesaba Yaz</div>
          <div className="sum-value">{formatPara(dashboardData.totalDebt)} ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">💸</div>
          <div className="sum-title">Günlük Gider</div>
          <div className="sum-value">{formatPara(dashboardData.dailyExpenses)} ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🏦</div>
          <div className="sum-title">Kritik Stok</div>
          <div className="sum-value">{dashboardData.criticalCount} Ürün</div>
        </div>
      </div>

      <div className="middle-panels">
        {/* SOL: ÇİFT KOLONLU AÇIK ADİSYONLAR PANELİ */}
        <div className="split-panel">
          <div className="panel-left">
            <div className="panel-header-split">
              <span>📋 Açık Adisyonlar</span>
              <span className="panel-small">
                {dashboardData.openTables.length} Masa
              </span>
            </div>
            
            <div className="panel-list-scroll">
              {dashboardData.openTables.length > 0 ? (
                dashboardData.openTables.map((masa) => {
                  const duration = calculateDuration(masa.acilisZamani);
                  const isBilardo = masa.no > 20;
                  const amount = parseFloat(masa.toplamTutar) || 0;
                  
                  return (
                    <div 
                      className={`masa-karti ${isBilardo ? 'bilardo' : 'normal'}`} 
                      key={masa.id}
                      onClick={() => goToTableDetail(masa.id)}
                      title="Detaylar için tıkla"
                    >
                      <div className="masa-karti-header">
                        <div className="masa-no">
                          {isBilardo ? '🎱' : '🍽'} Masa {masa.no}
                          <span className="masa-tur">
                            {isBilardo ? 'BİLARDO' : 'YEMEK'}
                          </span>
                        </div>
                        <div className="masa-sure">
                          ⏱️ {duration.formatted}
                        </div>
                      </div>
                      
                      <div className="masa-detay">
                        <div className="masa-musteri">
                          {masa.musteriAdi || 'Müşteri Yok'} | 
                          Ürün: {masa.urunSayisi || 0}
                        </div>
                        <div className="masa-tutar">
                          {formatPara(amount)} ₺
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">Açık Adisyon Bulunmuyor</div>
                  <div className="empty-subtext">
                    Yeni adisyon açmak için "+ Adisyon" butonuna tıklayın
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* SAĞ: TOPLAM TUTAR PANELİ */}
          <div className="panel-right">
            <div className="total-display">
              <div className="total-label">TOPLAM AÇIK ADİSYON</div>
              <div className="total-amount">
                {formatPara(openTablesSummary.totalAmount)} ₺
              </div>
              <div className="total-count">
                {openTablesSummary.tableCount} Adet
              </div>
              
              <div className="total-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">🍽 Normal Masalar</span>
                  <span className="breakdown-value">
                    {openTablesSummary.normalCount} adet
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">🎱 Bilardo Masalar</span>
                  <span className="breakdown-value">
                    {openTablesSummary.bilardoCount} adet
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">💰 Normal Toplam</span>
                  <span className="breakdown-value">
                    {formatPara(openTablesSummary.normalTotal)} ₺
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">💰 Bilardo Toplam</span>
                  <span className="breakdown-value">
                    {formatPara(openTablesSummary.bilardoTotal)} ₺
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">⏱️ Ortalama Süre</span>
                  <span className="breakdown-value">
                    {openTablesSummary.avgDuration} dk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* SAĞ: KRİTİK STOK PANELİ */}
        <div className="panel-box">
          <div className="panel-header">
            <span>⚠️ Kritik Stok</span>
            <span className="panel-small">{dashboardData.criticalCount} Ürün</span>
          </div>
          <div className="panel-list">
            {dashboardData.criticalProducts.length > 0 ? (
              dashboardData.criticalProducts.map((urun, index) => (
                <div className="stock-item" key={index}>
                  <span className="stock-left">{urun.name || "Ürün"}</span>
                  <span className="stock-right">
                    Mevcut: {urun.stock || 0} — Kritik: {urun.critical || 10}
                  </span>
                </div>
              ))
            ) : (
              <div className="stock-item">
                <span className="stock-left">✅ Kritik Stok Yok</span>
                <span className="stock-right">Tüm stoklar yeterli</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="report-row">
        <div className="report-card" onClick={() => handleReportClick('kasa')}>
          <div className="report-icon">💼</div>
          <div className="report-label">Kasa Raporu</div>
        </div>

        <div className="report-card" onClick={() => handleReportClick('gider')}>
          <div className="report-icon">📄</div>
          <div className="report-label">Giderler Raporu</div>
        </div>

        <div className="report-card" onClick={() => handleReportClick('masa')}>
          <div className="report-icon">🪑</div>
          <div className="report-label">Masa Detay Raporu</div>
        </div>
      </div>
    </div>
  );
}