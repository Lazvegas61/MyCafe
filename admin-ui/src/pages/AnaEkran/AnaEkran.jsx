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
  
  // GÜN DURUMU STATE'LERİ
  const [gunDurumu, setGunDurumu] = useState(() => {
    return localStorage.getItem('mycafe_gun_durumu') || 'kapali';
  });

  const [gunBaslangicZamani, setGunBaslangicZamani] = useState(() => {
    const saved = localStorage.getItem('mycafe_gun_baslangic');
    return saved ? new Date(saved) : null;
  });

  const [gunBilgileri, setGunBilgileri] = useState(() => {
    const saved = localStorage.getItem('mycafe_gun_bilgileri');
    return saved ? JSON.parse(saved) : {
      baslangicKasa: 0,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: null
    };
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

  // Gün başlatma fonksiyonu - BASİTLEŞTİRİLDİ
  const handleGunBaslat = useCallback(() => {
    const baslangicZamani = new Date();
    const baslangicKasa = 0; // Kasa başlangıç bakiyesi sıfır
    
    // LocalStorage'a kaydet
    localStorage.setItem('mycafe_gun_durumu', 'aktif');
    localStorage.setItem('mycafe_gun_baslangic', baslangicZamani.toISOString());
    localStorage.setItem('mycafe_gun_baslangic_kasa', baslangicKasa.toString());
    
    const yeniGunBilgileri = {
      baslangicKasa: baslangicKasa,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: baslangicZamani.toISOString(),
      sonGuncelleme: new Date().toISOString()
    };
    
    localStorage.setItem('mycafe_gun_bilgileri', JSON.stringify(yeniGunBilgileri));
    
    // State'leri güncelle
    setGunDurumu('aktif');
    setGunBaslangicZamani(baslangicZamani);
    setGunBilgileri(yeniGunBilgileri);
    
    // Global event gönder
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunBaslatildi', { 
        zaman: baslangicZamani,
        kasa: baslangicKasa 
      });
    }
    
    // Başarı mesajı
    alert(`✅ Gün başlatıldı!\n\n📅 Tarih: ${baslangicZamani.toLocaleDateString('tr-TR')}\n⏰ Saat: ${baslangicZamani.toLocaleTimeString('tr-TR')}`);
    
  }, []);

  // Gün sonlandırma fonksiyonu - BASİTLEŞTİRİLDİ
  const handleGunSonu = useCallback(() => {
    // Gün başlatılmamışsa uyarı ver
    if (gunDurumu === 'kapali') {
      alert('❌ Gün başlatılmamış! Önce "GÜN BAŞLAT" butonuna tıklayın.');
      return;
    }
    
    // Açık adisyon kontrolü
    const acikAdisyonlar = JSON.parse(localStorage.getItem('mc_acik_adisyonlar') || '[]');
    
    if (acikAdisyonlar.length > 0) {
      const confirmMessage = `${acikAdisyonlar.length} açık adisyon bulunuyor. Yine de günü sonlandırmak istiyor musunuz?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    // Gün sonu raporu oluştur
    const gunSonuRaporId = `GUN_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}`;
    const baslangicZamani = new Date(localStorage.getItem('mycafe_gun_baslangic') || new Date());
    const bitisZamani = new Date();
    
    // Gün verilerini topla
    const gunVerileri = JSON.parse(localStorage.getItem('mycafe_gun_bilgileri') || '{}');
    
    // Bugünkü satış verilerini hesapla
    const today = new Date().toISOString().split('T')[0];
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    
    const bugunkuNormalSatis = adisyonlar
      .filter(a => {
        const tarih = new Date(a.tarih || a.acilisZamani).toISOString().split('T')[0];
        return tarih === today;
      })
      .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
    
    const bugunkuBilardoSatis = bilardoAdisyonlar
      .filter(b => {
        const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
        return tarih === today && b.tur === "BİLARDO";
      })
      .reduce((sum, b) => sum + (parseFloat(b.toplamTutar || 0) || 0), 0);
    
    // Raporu oluştur
    const gunSonuRaporu = {
      id: gunSonuRaporId,
      baslangic: baslangicZamani.toISOString(),
      bitis: bitisZamani.toISOString(),
      sureDakika: Math.floor((bitisZamani - baslangicZamani) / 60000),
      sureSaat: Math.floor((bitisZamani - baslangicZamani) / 3600000),
      baslangicKasa: gunVerileri.baslangicKasa || 0,
      toplamCiro: bugunkuNormalSatis + bugunkuBilardoSatis,
      nakit: bugunkuNormalSatis * 0.6,
      krediKarti: bugunkuNormalSatis * 0.4,
      bilardoCiro: bugunkuBilardoSatis,
      toplamAdisyon: gunVerileri.toplamAdisyon || 0,
      acikAdisyon: acikAdisyonlar.length,
      kritikStok: dashboardData.criticalProducts.length,
      tarih: today,
      olusturulmaZamani: new Date().toISOString()
    };
    
    // Raporu localStorage'a kaydet
    localStorage.setItem(`mycafe_gun_sonu_${gunSonuRaporId}`, JSON.stringify(gunSonuRaporu));
    
    // Eski gün listesini güncelle
    const eskiGunler = JSON.parse(localStorage.getItem('mycafe_gun_sonu_listesi') || '[]');
    eskiGunler.unshift(gunSonuRaporu);
    localStorage.setItem('mycafe_gun_sonu_listesi', JSON.stringify(eskiGunler.slice(0, 30)));
    
    // Günü kapat
    localStorage.setItem('mycafe_gun_durumu', 'kapali');
    setGunDurumu('kapali');
    
    // Başarı mesajı
    alert(`✅ Gün sonlandırıldı!\n\n📊 Gün Sonu Raporu oluşturuldu:\n• Toplam Ciro: ${gunSonuRaporu.toplamCiro.toLocaleString('tr-TR')} ₺\n• Süre: ${gunSonuRaporu.sureSaat} saat ${gunSonuRaporu.sureDakika % 60} dakika`);
    
    // Rapor sayfasına yönlendir
    navigate(`/gun-sonu-rapor/${gunSonuRaporId}`);
    
  }, [gunDurumu, dashboardData.criticalProducts.length, navigate]);

  // Dashboard verilerini güncelle
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
        
        // AÇIK ADİSYONLAR
        const openTables = [];
        
        const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
        
        acikAdisyonlar.forEach(ad => {
          if (ad.durum === "ACIK" || ad.durum === "AÇIK") {
            const isBilardo = ad.tur === "BİLARDO";
            
            if (!isBilardo) {
              const masaNo = ad.masaNo || `MASA ${ad.masaNum}`;
              
              let toplamTutar = 0;
              
              if (ad.kalemler && ad.kalemler.length > 0) {
                toplamTutar = ad.kalemler.reduce((sum, kalem) => {
                  const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
                  const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
                  return sum + (birimFiyat * miktar);
                }, 0);
              }
              
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
                adisyonData: ad
              });
            } else {
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
        
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        
        masalar.forEach(masa => {
          if (masa.durum?.toUpperCase() === "DOLU") {
            const masaAlreadyExists = openTables.some(t => {
              const tableNo = t.no.replace('MASA ', '').replace('BİLARDO ', '');
              const masaNo = String(masa.no);
              return tableNo === masaNo;
            });
            
            if (!masaAlreadyExists) {
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
    // Gün başlatılmamışsa uyarı ver
    if (gunDurumu === 'kapali') {
      alert('❌ Gün başlatılmamış! Önce "GÜN BAŞLAT" butonuna tıklayın.');
      return;
    }
    
    if (masa.tur === "BİLARDO") {
      const masaNumarasi = masa.no.replace('BİLARDO ', '').replace('B', '');
      navigate(`/bilardo-adisyon/${masaNumarasi}`);
    } else {
      const masaNumarasi = masa.no.replace('MASA ', '');
      navigate(`/adisyondetay/${masaNumarasi}`);
    }
  }, [navigate, gunDurumu]);

  // Raporlar sayfasına git
  const goToReports = useCallback(() => {
    navigate('/raporlar');
  }, [navigate]);

  return (
    <div className="ana-wrapper">
      <div className="top-bar">
        <div className="title-3d">GÜNLÜK ÖZET</div>
        <div className="clock-box">{currentTime}</div>
      </div>

      {/* GÜN KONTROL BUTONLARI */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* SOL TARAFA - GÜN BAŞLANGICI BUTONU */}
        <div>
          {gunDurumu === 'kapali' ? (
            <button 
              onClick={handleGunBaslat}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                color: 'white',
                border: '2px solid #27ae60',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                minWidth: '250px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(46, 204, 113, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
              }}
            >
              🟢 GÜN BAŞLAT
              <span style={{ fontSize: '14px', opacity: 0.9 }}>
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            </button>
          ) : (
            <div style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.1) 100%)',
              border: '2px solid #27ae60',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#27ae60',
              minWidth: '250px'
            }}>
              🟢 GÜN AKTİF
              <span style={{ fontSize: '14px', opacity: 0.8, marginLeft: '10px' }}>
                {gunBaslangicZamani ? gunBaslangicZamani.toLocaleTimeString('tr-TR') : ''}
              </span>
            </div>
          )}
        </div>

        {/* SAĞ TARAFA - GÜN SONU BUTONU */}
        <div>
          <button 
            onClick={handleGunSonu}
            style={{
              padding: '12px 24px',
              background: gunDurumu === 'kapali' 
                ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' 
                : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              color: 'white',
              border: gunDurumu === 'kapali' ? '2px solid #95a5a6' : '2px solid #c0392b',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: gunDurumu === 'kapali' ? 'not-allowed' : 'pointer',
              boxShadow: gunDurumu === 'kapali' 
                ? '0 4px 12px rgba(149, 165, 166, 0.2)' 
                : '0 4px 12px rgba(231, 76, 60, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              minWidth: '250px',
              opacity: gunDurumu === 'kapali' ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (gunDurumu !== 'kapali') {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(231, 76, 60, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (gunDurumu !== 'kapali') {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
              }
            }}
            disabled={gunDurumu === 'kapali'}
          >
            🔴 GÜN SONU RAPORU
            {gunDurumu === 'kapali' && (
              <span style={{ fontSize: '12px', marginLeft: '5px', opacity: 0.8 }}>
                (Gün başlatılmamış)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* GÜN DURUMU BİLGİ KARTI */}
      {gunDurumu === 'aktif' && gunBaslangicZamani && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.08) 100%)',
          border: '2px solid rgba(46, 204, 113, 0.4)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: '#2ecc71',
              color: 'white',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '22px',
              boxShadow: '0 4px 8px rgba(46, 204, 113, 0.3)'
            }}>
              ⏰
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '18px' }}>
                Gün Süresi: {Math.floor((new Date() - gunBaslangicZamani) / 3600000)} saat
              </div>
              <div style={{ fontSize: '14px', color: '#555' }}>
                Başlangıç: {gunBaslangicZamani.toLocaleDateString('tr-TR')} {gunBaslangicZamani.toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Bugünkü Satış</div>
              <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '20px' }}>
                {formatPara(dashboardData.dailySales.total)} ₺
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Açık Adisyon</div>
              <div style={{ fontWeight: 'bold', color: '#3498db', fontSize: '20px' }}>
                {dashboardData.openTables.length}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Kritik Stok</div>
              <div style={{ fontWeight: 'bold', color: '#f39c12', fontSize: '20px' }}>
                {dashboardData.criticalProducts.length}
              </div>
            </div>
          </div>
        </div>
      )}

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
            {gunDurumu === 'kapali' && (
              <span style={{ color: '#e74c3c', marginLeft: '10px', fontWeight: 'bold' }}>
                ⚠️ Gün başlatılmamış
              </span>
            )}
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
                        style={{
                          opacity: gunDurumu === 'kapali' ? 0.6 : 1
                        }}
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
                            style={{
                              opacity: gunDurumu === 'kapali' ? 0.5 : 1,
                              cursor: gunDurumu === 'kapali' ? 'not-allowed' : 'pointer'
                            }}
                            disabled={gunDurumu === 'kapali'}
                          >
                            📋 Detay
                            {gunDurumu === 'kapali' && ' (Kilitli)'}
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
                {gunDurumu === 'kapali' 
                  ? 'Yeni adisyon açmak için önce "GÜN BAŞLAT" butonuna tıklayın'
                  : 'Yeni adisyon açmak için "+ Adisyon" butonuna tıklayın'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}