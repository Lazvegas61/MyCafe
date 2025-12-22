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

  // Açık Adisyonlar Toplamını Hesapla (BİLARDO DAHİL)
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
        
        // Bilardo kontrolü (masa no > 20 ise bilardo)
        const isBilardo = parseInt(masa.no) > 20;
        
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

  // Dashboard verilerini güncelle - BİLARDO DAHİL
  useEffect(() => {
    const updateDashboardData = () => {
      try {
        // Günlük satış hesapla
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const today = new Date().toLocaleDateString('tr-TR');
        const todayStr = today.split('.')[0]; // Sadece gün
        
        const todaySales = adisyonlar
          .filter(a => {
            const odendi = String(a.odendi || "").toLowerCase() === 'true';
            const kapatmaVar = a.kapatmaZamani;
            const bugunKapandi = kapatmaVar && a.kapatmaZamani.includes(todayStr);
            return odendi && bugunKapandi;
          })
          .reduce((sum, a) => sum + (Math.abs(parseFloat(a.toplamTutar || 0)) || 0), 0);

        // Hesaba Yaz (Borçlar)
        const borclar = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
        const totalDebt = borclar
          .filter(b => String(b.odendi || "").toLowerCase() === 'false')
          .reduce((sum, b) => sum + (Math.abs(parseFloat(b.tutar || 0)) || 0), 0);

        // Giderler
        const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
        const todayExpenses = giderler
          .filter(g => g.tarih && g.tarih.includes(todayStr))
          .reduce((sum, g) => sum + (Math.abs(parseFloat(g.tutar || 0)) || 0), 0);

        // Kritik stok
        const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
        const criticalProducts = urunler.filter(u => 
          (parseInt(u.stock || 0) || 0) <= (parseInt(u.critical || 10) || 10)
        );

        // AÇIK ADİSYONLARI HESAPLA - BİLARDO DAHİL
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        const allAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        
        // BİLARDO ADİSYONLARINI AYRI HESAPLA
        const bilardoAdisyonlar = JSON.parse(localStorage.getItem("mc_bilardo_adisyonlar") || "[]");
        
        // 1. TÜM MASALARI İŞLE (NORMAL + BİLARDO)
        const allOpenTables = [];

        // Normal ve bilardo masalarını işle
        masalar.forEach(masa => {
          // DOLU olmayan masaları atla
          if (masa.durum?.toUpperCase() !== "DOLU") return;
          
          // Bu masa için adisyon ara
          const masaAdisyonlari = allAdisyonlar.filter(ad => {
            // Masa eşleşmesi
            const masaEslesti = 
              ad.masaNo === `MASA ${masa.no}` || 
              ad.masaNum === masa.no ||
              ad.masaNo === masa.masaNo ||
              ad.id === masa.adisyonId ||
              ad.masaId === masa.id;
            
            // Açık mı kontrol et
            const durum = (ad.durum || ad.status || "").toUpperCase();
            const kapali = ad.kapali || 
                          durum === "CLOSED" || 
                          durum === "KAPALI" ||
                          durum === "KİLİTLİ";
            
            return masaEslesti && !kapali;
          });
          
          if (masaAdisyonlari.length === 0) return;
          
          // Toplam tutarı hesapla
          let toplamTutar = 0;
          
          // Önce localStorage'dan masa toplamını al
          const storedTotal = localStorage.getItem(`mc_masa_toplam_${masa.no}`);
          if (storedTotal) {
            toplamTutar = parseFloat(storedTotal) || 0;
          } else {
            // Manuel hesapla
            masaAdisyonlari.forEach(ad => {
              // Adisyon toplamı
              let adToplam = 0;
              
              // Kalemlerden toplam
              if (ad.kalemler && ad.kalemler.length > 0) {
                adToplam = ad.kalemler.reduce((sum, k) => {
                  return sum + (Number(k.toplam) || 0);
                }, 0);
              }
              
              // Bilardo ücreti varsa ekle
              if (ad.bilardoUcreti) {
                adToplam += (Number(ad.bilardoUcreti) || 0);
              }
              
              // Özel ücret varsa ekle
              if (ad.ozelUcret) {
                adToplam += (Number(ad.ozelUcret) || 0);
              }
              
              toplamTutar += adToplam;
            });
            
            // Kaydet
            localStorage.setItem(`mc_masa_toplam_${masa.no}`, toplamTutar.toFixed(2));
          }
          
          // Masa bilgilerini hazırla
          const anaAdisyon = masaAdisyonlari.find(ad => !ad.isSplit) || masaAdisyonlari[0];
          
          allOpenTables.push({
            ...masa,
            id: masa.id || `masa_${masa.no}`,
            no: String(masa.no),
            toplamTutar: toplamTutar,
            urunSayisi: masaAdisyonlari.reduce((sum, ad) => {
              return sum + (ad.kalemler?.length || 0);
            }, 0),
            musteriAdi: anaAdisyon?.musteriAdi || null,
            acilisZamani: anaAdisyon?.acilisZamani || masa.acilisZamani,
            isBilardo: parseInt(masa.no) > 20
          });
        });

        // BİLARDO MASALARI İÇİN AYRI HESAPLAMA
        const bilardoMasalari = JSON.parse(localStorage.getItem("mc_bilardo_masalar") || "[]");
        
        // Açık bilardo adisyonlarını bul
        const openBilardoAdisyonlar = bilardoAdisyonlar.filter(ad => {
          // Bilardo adisyonu açık mı kontrol et
          const durum = (ad.durum || ad.status || "").toUpperCase();
          const kapali = ad.kapali || 
                        durum === "CLOSED" || 
                        durum === "KAPALI" ||
                        durum === "KİLİTLİ" ||
                        ad.kapatildi === true;
          
          return !kapali;
        });
        
        // Açık bilardo masalarını işle
        bilardoMasalari.forEach(bilardoMasa => {
          // DOLU olmayan bilardo masalarını atla
          if (bilardoMasa.durum?.toUpperCase() !== "DOLU") return;
          
          // Bu bilardo masası için adisyon ara
          const masaBilardoAdisyonlari = openBilardoAdisyonlar.filter(ad => {
            // Bilardo masa eşleşmesi
            const masaEslesti = 
              ad.masaNo === `BİLARDO ${bilardoMasa.no}` || 
              ad.masaNum === bilardoMasa.no ||
              ad.masaId === bilardoMasa.id ||
              ad.bilardoMasaId === bilardoMasa.id;
            
            return masaEslesti;
          });
          
          if (masaBilardoAdisyonlari.length === 0) return;
          
          // Bilardo adisyon toplamını hesapla
          let bilardoToplam = 0;
          masaBilardoAdisyonlari.forEach(ad => {
            // Bilardo ücretini ekle
            if (ad.bilardoUcreti) {
              bilardoToplam += (Number(ad.bilardoUcreti) || 0);
            }
            
            // Adisyon kalemlerini ekle (eğer varsa)
            if (ad.kalemler && ad.kalemler.length > 0) {
              ad.kalemler.forEach(kalem => {
                bilardoToplam += (Number(kalem.toplam) || 0);
              });
            }
          });
          
          // Bilardo masasını açık masalara ekle
          const anaBilardoAdisyon = masaBilardoAdisyonlari[0];
          allOpenTables.push({
            ...bilardoMasa,
            id: bilardoMasa.id || `bilardo_${bilardoMasa.no}`,
            no: String(bilardoMasa.no),
            toplamTutar: bilardoToplam,
            urunSayisi: masaBilardoAdisyonlari.reduce((sum, ad) => {
              return sum + (ad.kalemler?.length || 0);
            }, 0),
            musteriAdi: anaBilardoAdisyon?.musteriAdi || null,
            acilisZamani: anaBilardoAdisyon?.acilisZamani || bilardoMasa.acilisZamani,
            isBilardo: true
          });
        });

        // 2. TEKİL MASALAR (HESAP AYIRMA SORUNU ÇÖZÜMÜ)
        const uniqueTables = [];
        const seenMasaNos = new Set();

        allOpenTables.forEach(masa => {
          if (!seenMasaNos.has(masa.no)) {
            seenMasaNos.add(masa.no);
            uniqueTables.push(masa);
          } else {
            // Aynı masa numarası varsa, daha yüksek toplamlı olanı al
            const existingIndex = uniqueTables.findIndex(m => m.no === masa.no);
            if (existingIndex !== -1 && masa.toplamTutar > uniqueTables[existingIndex].toplamTutar) {
              uniqueTables[existingIndex] = masa;
            }
          }
        });

        // 3. Açık adisyon özetini hesapla (BİLARDO DAHİL)
        const summary = calculateOpenTablesSummary(uniqueTables);
        setOpenTablesSummary(summary);

        // 4. Dashboard verilerini güncelle
        setDashboardData({
          dailySales: todaySales.toFixed(2),
          totalDebt: totalDebt.toFixed(2),
          dailyExpenses: todayExpenses.toFixed(2),
          criticalCount: criticalProducts.length,
          openTables: uniqueTables.sort((a, b) => parseInt(a.no) - parseInt(b.no)),
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
    
    // Her 10 saniyede bir verileri güncelle
    const interval = setInterval(updateDashboardData, 10000);
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adisyonGuncellendi', handleStorageChange);
    window.addEventListener('masaGuncellendi', handleStorageChange);
    window.addEventListener('bilardoAdisyonGuncellendi', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonGuncellendi', handleStorageChange);
      window.removeEventListener('masaGuncellendi', handleStorageChange);
      window.removeEventListener('bilardoAdisyonGuncellendi', handleStorageChange);
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
                  const isBilardo = parseInt(masa.no) > 20;
                  const amount = parseFloat(masa.toplamTutar) || 0;
                  
                  return (
                    <div 
                      className={`masa-karti ${isBilardo ? 'bilardo' : 'normal'}`} 
                      key={masa.id}
                      onClick={() => goToTableDetail(masa.no)}
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