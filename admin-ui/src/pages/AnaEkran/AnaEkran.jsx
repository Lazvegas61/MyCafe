import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    tableCount: 0,
    transferCount: 0,
    transferTotal: 0
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
  const calculateDuration = useCallback((acilisZamani) => {
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
  }, []);

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
          tableCount: 0,
          transferCount: 0,
          transferTotal: 0
        };
      }
      
      let totalAmount = 0;
      let normalCount = 0;
      let bilardoCount = 0;
      let normalTotal = 0;
      let bilardoTotal = 0;
      let totalDuration = 0;
      let transferCount = 0;
      let transferTotal = 0;
      
      openTables.forEach(masa => {
        const amount = parseFloat(masa.toplamTutar) || 0;
        totalAmount += amount;
        
        const isBilardo = masa.tur === "BİLARDO" || masa.isBilardo || parseInt(masa.no) > 20;
        const isTransfer = masa.transferredFrom || masa.transferDurum;
        
        if (isTransfer) {
          transferCount++;
          transferTotal += amount;
        }
        
        if (isBilardo) {
          bilardoCount++;
          bilardoTotal += amount;
        } else {
          normalCount++;
          normalTotal += amount;
        }
        
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
        tableCount: openTables.length,
        transferCount,
        transferTotal
      };
    };
  }, [calculateDuration]);

  // Aktarılmış adisyonları kontrol et
  const checkTransferredTables = useCallback((openTables) => {
    const transferredTables = [];
    
    // Bilardo'dan transfer edilen masaları bul
    const allAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    
    openTables.forEach(masa => {
      if (masa.transferredFrom || masa.transferDurum) {
        transferredTables.push(masa);
      } else {
        // Adisyon notlarında "BİLARDO TRANSFER" kontrolü
        const masaAdisyonlari = allAdisyonlar.filter(ad => {
          const masaEslesti = 
            ad.masaNo === `MASA ${masa.no}` || 
            ad.masaNum === masa.no ||
            ad.masaNo === masa.masaNo ||
            ad.id === masa.adisyonId ||
            ad.masaId === masa.id;
          
          const durum = (ad.durum || ad.status || "").toUpperCase();
          const kapali = ad.kapali || 
                        durum === "CLOSED" || 
                        durum === "KAPALI" ||
                        durum === "KİLİTLİ";
          
          return masaEslesti && !kapali;
        });
        
        masaAdisyonlari.forEach(ad => {
          if (ad.notlar && ad.notlar.includes("BİLARDO TRANSFER")) {
            masa.transferDurum = true;
            masa.transferredFrom = ad.transferredFrom || "Bilardo";
            masa.bilardoUcret = ad.bilardoUcret || 0;
            masa.ekUrunSayisi = ad.ekUrunSayisi || 0;
            transferredTables.push(masa);
          }
        });
      }
    });
    
    return transferredTables;
  }, []);

  // Dashboard verilerini güncelle
  useEffect(() => {
    const updateDashboardData = () => {
      try {
        // Günlük satış hesapla
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const today = new Date().toLocaleDateString('tr-TR');
        const todayStr = today.split('.')[0];
        
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

        // AÇIK ADİSYONLARI HESAPLA
        const allOpenTables = [];

        // 1. NORMAL MASALARI YÜKLE
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        const allAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        
        masalar.forEach(masa => {
          if (masa.durum?.toUpperCase() !== "DOLU") return;
          
          const masaAdisyonlari = allAdisyonlar.filter(ad => {
            const masaEslesti = 
              ad.masaNo === `MASA ${masa.no}` || 
              ad.masaNum === masa.no ||
              ad.masaNo === masa.masaNo ||
              ad.id === masa.adisyonId ||
              ad.masaId === masa.id;
            
            const durum = (ad.durum || ad.status || "").toUpperCase();
            const kapali = ad.kapali || 
                          durum === "CLOSED" || 
                          durum === "KAPALI" ||
                          durum === "KİLİTLİ";
            
            return masaEslesti && !kapali;
          });
          
          if (masaAdisyonlari.length === 0) return;
          
          let toplamTutar = 0;
          const storedTotal = localStorage.getItem(`mc_masa_toplam_${masa.no}`);
          
          if (storedTotal) {
            toplamTutar = parseFloat(storedTotal) || 0;
          } else {
            masaAdisyonlari.forEach(ad => {
              let adToplam = 0;
              
              if (ad.kalemler && ad.kalemler.length > 0) {
                adToplam = ad.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
              }
              
              if (ad.bilardoUcreti) adToplam += (Number(ad.bilardoUcreti) || 0);
              if (ad.ozelUcret) adToplam += (Number(ad.ozelUcret) || 0);
              
              toplamTutar += adToplam;
            });
            
            localStorage.setItem(`mc_masa_toplam_${masa.no}`, toplamTutar.toFixed(2));
          }
          
          const anaAdisyon = masaAdisyonlari.find(ad => !ad.isSplit) || masaAdisyonlari[0];
          
          // Transfer bilgilerini kontrol et
          const transferDurum = anaAdisyon?.notlar?.includes("BİLARDO TRANSFER");
          const transferredFrom = anaAdisyon?.transferredFrom;
          
          // Bilardo ücretini ve ek ürün bilgilerini bul
          let bilardoUcret = 0;
          let ekUrunSayisi = 0;
          let ekUrunToplam = 0;
          
          if (transferDurum && anaAdisyon?.kalemler) {
            anaAdisyon.kalemler.forEach(kalem => {
              if (kalem.urunAdi === "BİLARDO_UCRETI") {
                bilardoUcret = parseFloat(kalem.toplam) || 0;
              } else if (kalem.urunAdi !== "BİLARDO_UCRETI") {
                ekUrunSayisi++;
                ekUrunToplam += parseFloat(kalem.toplam) || 0;
              }
            });
          }
          
          allOpenTables.push({
            ...masa,
            id: masa.id || `masa_${masa.no}`,
            no: String(masa.no),
            toplamTutar,
            urunSayisi: masaAdisyonlari.reduce((sum, ad) => sum + (ad.kalemler?.length || 0), 0),
            musteriAdi: anaAdisyon?.musteriAdi || null,
            acilisZamani: anaAdisyon?.acilisZamani || masa.acilisZamani,
            isBilardo: false,
            tur: transferDurum ? "TRANSFER" : "NORMAL",
            transferDurum,
            transferredFrom,
            bilardoUcret,
            ekUrunSayisi,
            ekUrunToplam,
            originalBilardoNo: anaAdisyon?.originalBilardoNo,
            kalemler: anaAdisyon?.kalemler || []
          });
        });

        // 2. BİLARDO ADİSYONLARINI YÜKLE
        const bilardoMasalar = JSON.parse(localStorage.getItem("bilardo") || "[]");
        const acikAdisyonlarStorage = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
        
        acikAdisyonlarStorage.forEach(bilardoAdisyon => {
          if (bilardoAdisyon.tur === "BİLARDO" && bilardoAdisyon.durum === "ACIK") {
            const bilardoMasa = bilardoMasalar.find(m => 
              m.no === bilardoAdisyon.masaNo || 
              `B${m.no}` === bilardoAdisyon.masaNo
            );
            
            if (bilardoMasa) {
              allOpenTables.push({
                ...bilardoAdisyon,
                id: bilardoAdisyon.id || `bilardo_${bilardoAdisyon.masaNo}`,
                no: bilardoAdisyon.masaNo,
                toplamTutar: parseFloat(bilardoAdisyon.toplamTutar) || 0,
                urunSayisi: bilardoAdisyon.ekUrunler?.length || 0,
                musteriAdi: "Bilardo Müşterisi",
                acilisZamani: bilardoAdisyon.acilisZamani,
                isBilardo: true,
                tur: "BİLARDO",
                bilardoUcret: parseFloat(bilardoAdisyon.bilardoUcret) || 0,
                ekUrunToplam: parseFloat(bilardoAdisyon.ekUrunToplam) || 0,
                ekUrunler: bilardoAdisyon.ekUrunler || []
              });
            }
          }
        });

        // 3. TEKİL MASALAR
        const uniqueTables = [];
        const seenMasaNos = new Set();

        allOpenTables.forEach(masa => {
          if (!seenMasaNos.has(masa.no)) {
            seenMasaNos.add(masa.no);
            uniqueTables.push(masa);
          } else {
            const existingIndex = uniqueTables.findIndex(m => m.no === masa.no);
            if (existingIndex !== -1 && masa.toplamTutar > uniqueTables[existingIndex].toplamTutar) {
              uniqueTables[existingIndex] = masa;
            }
          }
        });

        // 4. Aktarılmış masaları kontrol et
        const transferredTables = checkTransferredTables(uniqueTables);

        // 5. Açık adisyon özetini hesapla
        const summary = calculateOpenTablesSummary(uniqueTables);
        setOpenTablesSummary(summary);

        // 6. Dashboard verilerini güncelle
        setDashboardData({
          dailySales: todaySales.toFixed(2),
          totalDebt: totalDebt.toFixed(2),
          dailyExpenses: todayExpenses.toFixed(2),
          criticalCount: criticalProducts.length,
          openTables: uniqueTables.sort((a, b) => {
            const aIsBilardo = a.tur === "BİLARDO" || a.isBilardo;
            const bIsBilardo = b.tur === "BİLARDO" || b.isBilardo;
            const aIsTransfer = a.transferDurum || a.tur === "TRANSFER";
            const bIsTransfer = b.transferDurum || b.tur === "TRANSFER";
            
            // Önce transfer edilenler, sonra normal, sonra bilardo
            if (aIsTransfer && !bIsTransfer) return -1;
            if (!aIsTransfer && bIsTransfer) return 1;
            
            if (!aIsBilardo && bIsBilardo) return -1;
            if (aIsBilardo && !bIsBilardo) return 1;
            
            return parseInt(a.no.replace('B', '')) - parseInt(b.no.replace('B', ''));
          }),
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
          tableCount: 0,
          transferCount: 0,
          transferTotal: 0
        });
      }
    };

    updateDashboardData();
    
    const handleStorageChange = () => {
      updateDashboardData();
    };
    
    const interval = setInterval(updateDashboardData, 10000);
    
    const events = [
      'storage', 
      'adisyonGuncellendi', 
      'masaGuncellendi', 
      'bilardoAdisyonGuncellendi',
      'bilardoTransferEdildi'
    ];
    
    events.forEach(event => {
      window.addEventListener(event, handleStorageChange);
    });
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, handleStorageChange);
      });
    };
  }, [calculateOpenTablesSummary, checkTransferredTables]);

  // Rapor kartlarına tıklama
  const handleReportClick = useCallback((type) => {
    const routes = {
      'kasa': '/raporlar/kasa',
      'gider': '/raporlar/gider-raporu',
      'masa': '/raporlar/masa-detay'
    };
    
    navigate(routes[type] || '/raporlar');
  }, [navigate]);

  // Format para
  const formatPara = useCallback((value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return (numValue || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Masa detayına git
  const goToTableDetail = useCallback((masa) => {
    if (masa.tur === "BİLARDO" || masa.isBilardo) {
      navigate(`/bilardo-adisyon/${masa.id}`);
    } else {
      navigate(`/adisyondetay/${masa.no}`);
    }
  }, [navigate]);

  // İlk birkaç kalemi göster
  const showFirstItems = useCallback((kalemler, count = 2) => {
    if (!kalemler || kalemler.length === 0) return "";
    
    const firstItems = kalemler.slice(0, count);
    return firstItems.map(k => k.urunAdi || "Ürün").join(", ");
  }, []);

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
        <div className="split-panel">
          <div className="panel-left">
            <div className="panel-header-split">
              <span>📋 Açık Adisyonlar</span>
              <span className="panel-small">
                {dashboardData.openTables.length} Masa
                {openTablesSummary.transferCount > 0 && (
                  <span style={{ marginLeft: '10px', color: '#4CAF50' }}>
                    ↪️ {openTablesSummary.transferCount} Aktarılmış
                  </span>
                )}
              </span>
            </div>
            
            <div className="panel-list-scroll">
              {dashboardData.openTables.length > 0 ? (
                dashboardData.openTables.map((masa) => {
                  const duration = calculateDuration(masa.acilisZamani);
                  const isBilardo = masa.tur === "BİLARDO" || masa.isBilardo;
                  const isTransfer = masa.transferDurum || masa.tur === "TRANSFER";
                  const amount = parseFloat(masa.toplamTutar) || 0;
                  const bilardoUcret = parseFloat(masa.bilardoUcret) || 0;
                  const ekUrunToplam = parseFloat(masa.ekUrunToplam) || 0;
                  const ekUrunSayisi = masa.ekUrunSayisi || 0;
                  
                  return (
                    <div 
                      className={`masa-karti ${isTransfer ? 'transfer' : isBilardo ? 'bilardo' : 'normal'}`} 
                      key={masa.id}
                      onClick={() => goToTableDetail(masa)}
                      title="Detaylar için tıkla"
                    >
                      <div className="masa-karti-header">
                        <div className="masa-no">
                          {isTransfer ? '🔄' : isBilardo ? '🎱' : '🍽'} Masa {masa.no}
                          <span className="masa-tur">
                            {isTransfer ? 'AKTARILMIŞ' : isBilardo ? 'BİLARDO' : 'YEMEK'}
                          </span>
                        </div>
                        <div className="masa-sure">
                          ⏱️ {duration.formatted}
                        </div>
                      </div>
                      
                      <div className="masa-detay">
                        <div className="masa-musteri">
                          {isTransfer ? `↪️ ${masa.transferredFrom || "Bilardo"}` : masa.musteriAdi || 'Müşteri Yok'} | 
                          Ürün: {masa.urunSayisi || 0}
                        </div>
                        <div className="masa-tutar">
                          {formatPara(amount)} ₺
                        </div>
                      </div>
                      
                      {/* TRANSFER EDİLMİŞ MASA DETAYLARI */}
                      {isTransfer && (
                        <div className="transfer-detay">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>🎱 Ücret: {formatPara(bilardoUcret)}₺</span>
                            {ekUrunSayisi > 0 && (
                              <span>📦 Ek Ürün: {ekUrunSayisi} adet (+{formatPara(ekUrunToplam)}₺)</span>
                            )}
                          </div>
                          {masa.kalemler && masa.kalemler.length > 0 && (
                            <div style={{ 
                              marginTop: '6px', 
                              fontSize: '11px', 
                              color: 'rgba(255,255,255,0.8)',
                              fontStyle: 'italic'
                            }}>
                              📝 {showFirstItems(masa.kalemler, 2)}
                              {masa.kalemler.length > 2 && ` ...(+${masa.kalemler.length - 2})`}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* BİLARDO MASA DETAYLARI */}
                      {isBilardo && !isTransfer && (
                        <div className="bilardo-detay">
                          <span>🎱: {formatPara(bilardoUcret)}₺</span>
                          {ekUrunToplam > 0 && (
                            <span>📦: +{formatPara(ekUrunToplam)}₺</span>
                          )}
                        </div>
                      )}
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
                  <span className="breakdown-label">🔄 Aktarılmış</span>
                  <span className="breakdown-value">
                    {openTablesSummary.transferCount} adet
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
                  <span className="breakdown-label">💰 Aktarılmış Toplam</span>
                  <span className="breakdown-value">
                    {formatPara(openTablesSummary.transferTotal)} ₺
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