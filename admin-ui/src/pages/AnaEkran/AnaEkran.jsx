import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AnaEkran.css";

export default function AnaEkran() {
  const [currentTime, setCurrentTime] = useState("");
  const [dashboardData, setDashboardData] = useState({
    dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
    criticalProducts: [],
    openTables: []
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

  // Dashboard verilerini güncelle - MASALAR İÇİN DÜZELTİLDİ
  useEffect(() => {
    const updateDashboardData = () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // GÜNLÜK SATIŞ HESAPLAMALARI
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const borclar = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
        const bilardoAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
        
        // Bugünkü normal satışlar
        const todayNormalSales = adisyonlar
          .filter(a => {
            const tarih = new Date(a.tarih || a.acilisZamani).toISOString().split('T')[0];
            return tarih === todayStr;
          })
          .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
        
        // Bugünkü hesaba yazılan borçlar
        const todayDebts = borclar
          .filter(b => {
            const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
            return tarih === todayStr;
          })
          .reduce((sum, b) => sum + (parseFloat(b.tutar || 0) || 0), 0);
        
        // Bugünkü bilardo satışları
        const todayBilardoSales = bilardoAdisyonlar
          .filter(b => {
            const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
            return tarih === todayStr && b.tur === "BİLARDO";
          })
          .reduce((sum, b) => sum + (parseFloat(b.toplamTutar || 0) || 0), 0);
        
        // KRİTİK STOK
        const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
        const criticalProducts = urunler
          .filter(u => {
            const stockTakip = u.stockTakip === true || u.stockTakip === "true";
            const stock = parseInt(u.stock || 0);
            const critical = parseInt(u.critical || 10);
            return stockTakip && stock <= critical;
          })
          .slice(0, 5);
        
        // AÇIK ADİSYONLAR - MASALAR İÇİN DÜZELTİLDİ
        const openTables = [];
        
        // 1. ÖNCE AÇIK ADİSYONLARI BUL (mc_acik_adisyonlar)
        const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
        
        // Normal masaları kontrol et (tur: "NORMAL" veya tur belirtilmemiş)
        acikAdisyonlar.forEach(ad => {
          // Sadece açık olanları al
          if (ad.durum === "ACIK" || ad.durum === "AÇIK") {
            const isBilardo = ad.tur === "BİLARDO";
            
            if (!isBilardo) {
              // NORMAL MASA
              const masaNo = ad.masaNo || `MASA ${ad.masaNum}`;
              
              // Toplam tutarı hesapla
              let toplamTutar = 0;
              
              // 1. Kalemlerden topla
              if (ad.kalemler && ad.kalemler.length > 0) {
                toplamTutar = ad.kalemler.reduce((sum, kalem) => {
                  const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
                  const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
                  return sum + (birimFiyat * miktar);
                }, 0);
              }
              
              // 2. Direkt toplamTutar değerini kontrol et
              if (ad.toplamTutar && parseFloat(ad.toplamTutar) > 0) {
                toplamTutar = parseFloat(ad.toplamTutar);
              }
              
              openTables.push({
                id: ad.id || `normal_${ad.masaNo || ad.masaNum}`,
                no: ad.masaNum || ad.masaNo || "1",
                masaNo: masaNo,
                toplamTutar: toplamTutar,
                tur: "NORMAL",
                urunSayisi: ad.kalemler?.length || 0,
                adisyonData: ad // Tüm adisyon verisini sakla
              });
            } else {
              // BİLARDO MASA
              const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
              const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
              const toplamTutar = (isNaN(bilardoUcret) ? 0 : bilardoUcret) + 
                                 (isNaN(ekUrunToplam) ? 0 : ekUrunToplam);
              
              openTables.push({
                id: ad.id || `bilardo_${ad.masaNo}`,
                no: ad.masaNo,
                masaNo: `BİLARDO ${ad.masaNo}`,
                toplamTutar: toplamTutar,
                tur: "BİLARDO",
                urunSayisi: ad.ekUrunler?.length || 0,
                bilardoUcret: bilardoUcret,
                ekUrunToplam: ekUrunToplam,
                adisyonData: ad
              });
            }
          }
        });
        
        // 2. MASALAR TABLOSUNU DA KONTROL ET (mc_masalar)
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        
        masalar.forEach(masa => {
          if (masa.durum?.toUpperCase() === "DOLU") {
            // Bu masa zaten açık adisyonlarda var mı kontrol et
            const masaAlreadyExists = openTables.some(t => {
              const tableNo = t.no.replace('MASA ', '').replace('BİLARDO ', '');
              const masaNo = String(masa.no);
              return tableNo === masaNo;
            });
            
            // Eğer yoksa ve açık adisyonlarda da yoksa, masayı ekle
            if (!masaAlreadyExists) {
              // Bu masa için mc_adisyonlar'da açık adisyon ara
              const masaAdisyonlari = adisyonlar.filter(ad => {
                const masaEslesti = 
                  ad.masaNo === `MASA ${masa.no}` || 
                  ad.masaNum === masa.no ||
                  ad.masaNo === masa.masaNo ||
                  ad.masaNo === masa.no;
                
                const kapali = ad.kapali || (ad.durum || "").toUpperCase() === "KAPALI";
                return masaEslesti && !kapali;
              });
              
              if (masaAdisyonlari.length > 0) {
                const toplamTutar = masaAdisyonlari.reduce((sum, ad) => {
                  const tutar = parseFloat(ad.toplamTutar || ad.toplam || 0);
                  return sum + (isNaN(tutar) ? 0 : tutar);
                }, 0);
                
                openTables.push({
                  id: masa.id || `masa_${masa.no}`,
                  no: String(masa.no),
                  masaNo: `MASA ${masa.no}`,
                  toplamTutar: toplamTutar,
                  tur: "NORMAL",
                  urunSayisi: masaAdisyonlari.reduce((sum, ad) => sum + (ad.kalemler?.length || 0), 0)
                });
              }
            }
          }
        });
        
        setDashboardData({
          dailySales: {
            total: todayNormalSales + todayDebts + todayBilardoSales,
            normal: todayNormalSales,
            bilardo: todayBilardoSales,
            debt: todayDebts
          },
          criticalProducts: criticalProducts,
          openTables: openTables.sort((a, b) => {
            if (a.tur === "NORMAL" && b.tur === "BİLARDO") return -1;
            if (a.tur === "BİLARDO" && b.tur === "NORMAL") return 1;
            return parseInt(a.no.replace('B', '')) - parseInt(b.no.replace('B', ''));
          })
        });

      } catch (error) {
        console.error("Dashboard veri yükleme hatası:", error);
        setDashboardData({
          dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
          criticalProducts: [],
          openTables: []
        });
      }
    };

    updateDashboardData();
    
    const handleStorageChange = () => {
      updateDashboardData();
    };
    
    const interval = setInterval(updateDashboardData, 10000);
    
    const events = ['storage', 'adisyonGuncellendi', 'masaGuncellendi', 'bilardoAdisyonGuncellendi'];
    events.forEach(event => {
      window.addEventListener(event, handleStorageChange);
    });
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, handleStorageChange);
      });
    };
  }, []);

  // Format para
  const formatPara = useCallback((value) => {
    try {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return "0,00";
      
      return numValue.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.error("Para formatlama hatası:", error, value);
      return "0,00";
    }
  }, []);

  // Masa veya bilardo detayına git
  const goToTableDetail = useCallback((masa) => {
    console.log("Detaya gidiliyor:", masa);
    
    if (masa.tur === "BİLARDO") {
      // Bilardo için
      const masaNumarasi = masa.no.replace('BİLARDO ', '').replace('B', '');
      navigate(`/bilardo-adisyon/${masaNumarasi}`);
    } else {
      // Normal masa için
      const masaNumarasi = masa.no.replace('MASA ', '');
      navigate(`/adisyondetay/${masaNumarasi}`);
    }
  }, [navigate]);

  // Gün sonu butonu
  const handleDayEnd = useCallback(() => {
    navigate('/raporlar/gun-sonu');
  }, [navigate]);

  // Raporlar sayfasına git
  const goToReports = useCallback(() => {
    navigate('/raporlar');
  }, [navigate]);

  // Debug için
  useEffect(() => {
    console.log("=== DASHBOARD DEBUG ===");
    console.log("Toplam açık adisyon:", dashboardData.openTables.length);
    console.log("Açık adisyonlar:", dashboardData.openTables);
    
    // LocalStorage'daki verileri kontrol et
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    
    console.log("mc_acik_adisyonlar:", acikAdisyonlar);
    console.log("mc_masalar:", masalar);
    console.log("mc_adisyonlar (ilk 3):", adisyonlar.slice(0, 3));
  }, [dashboardData]);

  return (
    <div className="ana-wrapper">
      <div className="top-bar">
        <div className="title-3d">GÜNLÜK ÖZET</div>
        <div className="clock-box">{currentTime}</div>
      </div>

      {/* GÜN SONU BUTONU */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px'
      }}>
        <button 
          onClick={handleDayEnd}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            color: 'white',
            border: '1px solid #8B4513',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(139, 69, 19, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 3px 8px rgba(139, 69, 19, 0.25)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #A0522D 0%, #8B4513 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 69, 19, 0.15)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)';
          }}
        >
          📊 GÜN SONU RAPORU
        </button>
      </div>

      {/* SATIŞ İSTATİSTİKLERİ */}
      <div className="summary-cards">
        <div className="sum-card">
          <div className="sum-icon">💰</div>
          <div className="sum-title">GÜNLÜK TOPLAM SATIŞ</div>
          <div className="sum-value">
            {formatPara(dashboardData.dailySales.total)} ₺
          </div>
          <div style={{
            fontSize: '13px',
            marginTop: '10px',
            color: '#000000',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>🍽 Normal</div>
              <div style={{fontWeight: '600'}}>{formatPara(dashboardData.dailySales.normal)} ₺</div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>🎱 Bilardo</div>
              <div style={{fontWeight: '600'}}>{formatPara(dashboardData.dailySales.bilardo)} ₺</div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>📝 Hesaba Yaz</div>
              <div style={{fontWeight: '600'}}>{formatPara(dashboardData.dailySales.debt)} ₺</div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>📊 Net</div>
              <div style={{fontWeight: '600'}}>
                {formatPara(dashboardData.dailySales.total - dashboardData.dailySales.debt)} ₺
              </div>
            </div>
          </div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🪑</div>
          <div className="sum-title">AÇIK ADİSYONLAR</div>
          <div className="sum-value">
            {dashboardData.openTables.length} Masa
          </div>
          <div style={{
            fontSize: '13px',
            marginTop: '10px',
            color: '#000000',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>🍽 Normal</div>
              <div style={{fontWeight: '600'}}>
                {dashboardData.openTables.filter(t => t.tur === "NORMAL").length}
              </div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>🎱 Bilardo</div>
              <div style={{fontWeight: '600'}}>
                {dashboardData.openTables.filter(t => t.tur === "BİLARDO").length}
              </div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>💵 Toplam Tutar</div>
              <div style={{fontWeight: '600'}}>
                {formatPara(dashboardData.openTables.reduce((sum, t) => {
                  const tutar = parseFloat(t.toplamTutar) || 0;
                  return sum + tutar;
                }, 0))} ₺
              </div>
            </div>
            <div>
              <div style={{fontSize: '11px', opacity: 0.7}}>📦 Toplam Ürün</div>
              <div style={{fontWeight: '600'}}>
                {dashboardData.openTables.reduce((sum, t) => sum + (t.urunSayisi || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🏦</div>
          <div className="sum-title">KRİTİK STOK</div>
          <div className="sum-value">
            {dashboardData.criticalProducts.length} Ürün
          </div>
          <div style={{
            fontSize: '13px',
            marginTop: '10px',
            color: '#000000'
          }}>
            {dashboardData.criticalProducts.slice(0, 3).map((urun, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: idx < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none'
              }}>
                <span style={{fontSize: '12px'}}>
                  {urun.name ? (urun.name.length > 15 ? urun.name.substring(0, 12) + "..." : urun.name) : "İsimsiz"}
                </span>
                <span style={{
                  background: 'rgba(255,0,0,0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: '1px solid rgba(255,0,0,0.2)',
                  color: '#000000'
                }}>
                  {urun.stock || 0}/{urun.critical || 10}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">📊</div>
          <div className="sum-title">RAPORLAR</div>
          <div style={{
            fontSize: '13px',
            marginTop: '10px',
            color: '#000000',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            height: '100%',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'rgba(139, 69, 19, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              border: '1px solid rgba(139, 69, 19, 0.2)'
            }}
            onClick={goToReports}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 69, 19, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 69, 19, 0.1)'}
            >
              📈 Detaylı Raporlar
            </div>
            <div style={{
              background: 'rgba(139, 69, 19, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              border: '1px solid rgba(139, 69, 19, 0.2)'
            }}
            onClick={() => navigate('/raporlar/gunluk-satis')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 69, 19, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 69, 19, 0.1)'}
            >
              💰 Satış Raporları
            </div>
          </div>
        </div>
      </div>

      {/* AÇIK ADİSYONLAR PANELİ */}
      <div className="panel-box-wide">
        <div className="panel-header-wide">
          <span>📋 AÇIK ADİSYONLAR - CANLI DURUM</span>
          <span className="panel-small-wide">
            {dashboardData.openTables.length} Masa • 
            Toplam: {formatPara(dashboardData.openTables.reduce((sum, t) => {
              const tutar = parseFloat(t.toplamTutar) || 0;
              return sum + tutar;
            }, 0))} ₺
          </span>
        </div>
        
        <div className="panel-list-wide">
          {dashboardData.openTables.length > 0 ? (
            <div className="table-container-wide">
              <table className="open-tables-table">
                <thead>
                  <tr>
                    <th>MASALAR</th>
                    <th>MASA TÜRÜ</th>
                    <th>MASA NO</th>
                    <th>TOPLAM TUTAR</th>
                    <th>İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.openTables.map((masa) => {
                    const isBilardo = masa.tur === "BİLARDO";
                    
                    return (
                      <tr 
                        key={masa.id}
                        className={`table-row ${isBilardo ? 'bilardo-row' : 'normal-row'}`}
                      >
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div className="table-icon">
                              {isBilardo ? '🎱' : '🍽'}
                            </div>
                          </div>
                        </td>
                        <td className="table-type-cell">
                          <div className="table-type-badge">
                            {isBilardo ? 'BİLARDO' : 'YEMEK/İÇECEK'}
                          </div>
                        </td>
                        <td className="table-number">
                          <strong>{masa.masaNo}</strong>
                        </td>
                        <td className="table-amount">
                          <div className="amount-main">
                            {formatPara(masa.toplamTutar)} ₺
                          </div>
                          <div style={{fontSize: '11px', opacity: 0.7, marginTop: '2px'}}>
                            {masa.urunSayisi || 0} ürün
                          </div>
                        </td>
                        <td className="table-actions">
                          <button 
                            className="action-button"
                            onClick={() => goToTableDetail(masa)}
                          >
                            📋 Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-wide">
              <div className="empty-icon-wide">✅</div>
              <div className="empty-text-wide">Açık Adisyon Bulunmuyor</div>
              <div className="empty-subtext-wide">
                Yeni adisyon açmak için "+ Adisyon" butonuna tıklayın
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}