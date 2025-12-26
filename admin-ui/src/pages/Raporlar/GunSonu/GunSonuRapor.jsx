import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GunSonuRapor.css";

const GunSonuRapor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunDetay, setGunDetay] = useState(null);
  const [gunDurum, setGunDurum] = useState("tamamlandı");
  const [debugInfo, setDebugInfo] = useState(null);

  // Bugünün tarihini formatla
  const bugunTarih = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // LocalStorage verilerini kontrol et
  const kontrolLocalStorageVerileri = () => {
    try {
      const adisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar')) || [];
      const masalar = JSON.parse(localStorage.getItem('mc_masalar')) || [];
      const giderler = JSON.parse(localStorage.getItem('mc_giderler')) || [];
      
      console.log("=== DEBUG: LOCALSTORAGE VERİ KONTROLÜ ===");
      console.log(`Toplam adisyon: ${adisyonlar.length}`);
      console.log(`Toplam masa: ${masalar.length}`);
      console.log(`Toplam gider: ${giderler.length}`);
      
      const kapaliAdisyonlar = adisyonlar.filter(a => a.kapali === true);
      console.log(`Kapalı adisyon: ${kapaliAdisyonlar.length}`);
      
      const bugun = new Date();
      const bugunBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate(), 0, 0, 0);
      const bugunBitis = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate(), 23, 59, 59);
      
      const bugunkuAdisyonlar = kapaliAdisyonlar.filter(adisyon => {
        if (!adisyon.kapanisZamani) return false;
        const kapanisTarihi = new Date(adisyon.kapanisZamani);
        return kapanisTarihi >= bugunBaslangic && kapanisTarihi <= bugunBitis;
      });
      
      console.log(`Bugünkü kapalı adisyon: ${bugunkuAdisyonlar.length}`);
      
      if (bugunkuAdisyonlar.length > 0) {
        console.log("Bugünkü son 3 adisyon:");
        bugunkuAdisyonlar.slice(-3).forEach((adisyon, index) => {
          console.log(`Adisyon ${index + 1}:`, {
            id: adisyon.id,
            masaId: adisyon.masaId,
            masaNo: adisyon.masaNo,
            kapali: adisyon.kapali,
            kapanisZamani: new Date(adisyon.kapanisZamani).toLocaleString('tr-TR'),
            toplam: adisyon.toplam,
            odemeler: adisyon.odemeler || []
          });
        });
      }
      
      return {
        toplamAdisyon: adisyonlar.length,
        kapaliAdisyon: kapaliAdisyonlar.length,
        bugunkuAdisyon: bugunkuAdisyonlar.length,
        masalar: masalar.length,
        giderler: giderler.length
      };
      
    } catch (error) {
      console.error("DEBUG hatası:", error);
      return null;
    }
  };

  // Anlık rapor verilerini hesapla
  const hesaplaGunSonuRaporu = () => {
    try {
      const adisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar')) || [];
      const masalar = JSON.parse(localStorage.getItem('mc_masalar')) || [];
      const urunler = JSON.parse(localStorage.getItem('mc_urunler')) || [];
      const giderler = JSON.parse(localStorage.getItem('mc_giderler')) || [];
      const borclar = JSON.parse(localStorage.getItem('mc_borclar')) || [];
      
      const bugun = new Date();
      const bugunBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate(), 0, 0, 0);
      const bugunBitis = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate(), 23, 59, 59);
      
      // Bugünkü kapalı adisyonları filtrele
      const bugunkuAdisyonlar = adisyonlar.filter(adisyon => {
        if (adisyon.kapali !== true) return false;
        if (!adisyon.kapanisZamani) return false;
        
        const kapanisTarihi = new Date(adisyon.kapanisZamani);
        const bugunGunu = bugun.getDate();
        const kapanisGunu = kapanisTarihi.getDate();
        const bugunAy = bugun.getMonth();
        const kapanisAy = kapanisTarihi.getMonth();
        const bugunYil = bugun.getFullYear();
        const kapanisYil = kapanisTarihi.getFullYear();
        
        return kapanisGunu === bugunGunu && 
               kapanisAy === bugunAy && 
               kapanisYil === bugunYil;
      });
      
      console.log(`Hesaplama: ${bugunkuAdisyonlar.length} adet bugünkü kapalı adisyon bulundu`);
      
      // Bugünkü giderleri filtrele
      const bugunkuGiderler = giderler.filter(gider => {
        if (!gider.tarih) return false;
        const giderTarihi = new Date(gider.tarih);
        return giderTarihi >= bugunBaslangic && giderTarihi <= bugunBitis;
      });
      
      // Masa hareketlerini oluştur (gruplandırılmış)
      const masaGruplari = {};
      
      bugunkuAdisyonlar.forEach(adisyon => {
        const masaKey = adisyon.masaId || adisyon.masaNo || 'bilinmeyen';
        
        if (!masaGruplari[masaKey]) {
          let masaAdi = "Bilinmeyen Masa";
          if (adisyon.masaId) {
            const masa = masalar.find(m => m.id === adisyon.masaId);
            masaAdi = masa ? `Masa ${masa.masaNo}` : `Masa ${adisyon.masaId}`;
          } else if (adisyon.masaNo) {
            masaAdi = `Masa ${adisyon.masaNo}`;
          }
          
          if (adisyon.bilardoMasaId) {
            const bilardoMasalari = JSON.parse(localStorage.getItem('mc_bilardo')) || [];
            const bilardoMasa = bilardoMasalari.find(m => m.id === adisyon.bilardoMasaId);
            masaAdi = bilardoMasa ? `Bilardo ${bilardoMasa.masaNo}` : `Bilardo ${adisyon.bilardoMasaId}`;
          }
          
          masaGruplari[masaKey] = {
            masa: masaAdi,
            adisyonSayisi: 0,
            nakit: 0,
            kart: 0,
            hesabaYaz: 0,
            toplam: 0,
            sonKapanis: null,
            sureler: []
          };
        }
        
        if (adisyon.odemeler && Array.isArray(adisyon.odemeler)) {
          adisyon.odemeler.forEach(odeme => {
            const odemeTuru = odeme.tur || odeme.odemeTuru || '';
            const odemeTutar = parseFloat(odeme.tutar) || 0;
            
            if (odemeTuru.toLowerCase().includes('nakit')) {
              masaGruplari[masaKey].nakit += odemeTutar;
            } else if (odemeTuru.toLowerCase().includes('kart') || odemeTuru.toLowerCase().includes('kredi')) {
              masaGruplari[masaKey].kart += odemeTutar;
            } else if (odemeTuru.toLowerCase().includes('hesap') || odemeTuru.toLowerCase().includes('yaz')) {
              masaGruplari[masaKey].hesabaYaz += odemeTutar;
            }
          });
        } else if (adisyon.toplam) {
          masaGruplari[masaKey].nakit += parseFloat(adisyon.toplam) || 0;
        }
        
        if (adisyon.kapanisZamani) {
          const kapanisZamani = new Date(adisyon.kapanisZamani);
          masaGruplari[masaKey].sonKapanis = kapanisZamani;
          
          if (adisyon.olusturulmaTarihi) {
            const acilisZamani = new Date(adisyon.olusturulmaTarihi);
            const sureMs = kapanisZamani - acilisZamani;
            
            if (sureMs > 0) {
              const sureDakika = Math.floor(sureMs / (1000 * 60));
              masaGruplari[masaKey].sureler.push(sureDakika);
            }
          }
        }
        
        masaGruplari[masaKey].adisyonSayisi++;
        masaGruplari[masaKey].toplam = masaGruplari[masaKey].nakit + 
                                        masaGruplari[masaKey].kart + 
                                        masaGruplari[masaKey].hesabaYaz;
      });
      
      const masaHareketleri = Object.values(masaGruplari).map(grup => {
        let ortalamaSure = "--:--";
        if (grup.sureler.length > 0) {
          const toplamDakika = grup.sureler.reduce((a, b) => a + b, 0);
          const ortalamaDakika = Math.floor(toplamDakika / grup.sureler.length);
          const saat = Math.floor(ortalamaDakika / 60);
          const dakika = ortalamaDakika % 60;
          ortalamaSure = `${saat}:${dakika.toString().padStart(2, '0')}`;
        }
        
        let kapanisSaat = "--:--";
        if (grup.sonKapanis) {
          kapanisSaat = grup.sonKapanis.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
        
        return {
          masa: grup.masa + (grup.adisyonSayisi > 1 ? ` (${grup.adisyonSayisi})` : ''),
          kapanis: kapanisSaat,
          sure: ortalamaSure,
          nakit: grup.nakit,
          kart: grup.kart,
          hesabaYaz: grup.hesabaYaz,
          toplam: grup.toplam
        };
      });
      
      const urunSatisMap = {};
      bugunkuAdisyonlar.forEach(adisyon => {
        if (adisyon.urunler && Array.isArray(adisyon.urunler)) {
          adisyon.urunler.forEach(urunItem => {
            const urunId = urunItem.urunId || urunItem.id;
            if (!urunId) return;
            
            const urun = urunler.find(u => u.id === urunId);
            const urunAdi = urun ? (urun.urunAdi || urun.ad || 'Bilinmeyen Ürün') : 'Bilinmeyen Ürün';
            const kategoriAdi = urun ? (urun.kategoriAdi || urun.kategori || 'Diğer') : 'Diğer';
            const satisFiyati = urun ? (urun.satisFiyati || urun.fiyat || 0) : 0;
            const adet = urunItem.adet || 1;
            
            if (!urunSatisMap[urunAdi]) {
              urunSatisMap[urunAdi] = {
                urun: urunAdi,
                adet: 0,
                birim: satisFiyati,
                tutar: 0,
                kategori: kategoriAdi,
                maliyetsiz: kategoriAdi === 'ÇAY' || kategoriAdi === 'ORALET'
              };
            }
            
            urunSatisMap[urunAdi].adet += adet;
            urunSatisMap[urunAdi].tutar += adet * satisFiyati;
          });
        }
      });
      
      const urunSatislari = Object.values(urunSatisMap);
      
      const toplamNakit = masaHareketleri.reduce((sum, masa) => sum + (masa.nakit || 0), 0);
      const toplamKart = masaHareketleri.reduce((sum, masa) => sum + (masa.kart || 0), 0);
      const toplamHesap = masaHareketleri.reduce((sum, masa) => sum + (masa.hesabaYaz || 0), 0);
      const toplamGider = bugunkuGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);
      const toplamCiro = toplamNakit + toplamKart + toplamHesap;
      const netKar = toplamCiro - toplamGider;
      
      const bugunkuBorclar = borclar.filter(borc => {
        if (!borc.tarih) return false;
        const borcTarihi = new Date(borc.tarih);
        return borcTarihi >= bugunBaslangic && borcTarihi <= bugunBitis;
      });
      const toplamHesabaYazilan = bugunkuBorclar.reduce((sum, borc) => sum + (borc.tutar || 0), 0);
      
      const raporId = `GS${bugun.getFullYear()}${(bugun.getMonth() + 1).toString().padStart(2, '0')}${bugun.getDate().toString().padStart(2, '0')}${bugun.getHours().toString().padStart(2, '0')}${bugun.getMinutes().toString().padStart(2, '0')}`;
      
      const rapor = {
        id: raporId,
        tarih: bugun.toISOString(),
        gunNo: `Gün #${new Date().getTime().toString().slice(-6)}`,
        acilis: "09:00",
        kapanis: bugun.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        kapanisYapan: "Sistem (Anlık)",
        durum: "tamamlandı",
        vardiya: bugun.getHours() < 18 ? "Sabah" : "Akşam",
        masaHareketleri: masaHareketleri,
        urunSatislari: urunSatislari,
        giderler: bugunkuGiderler.map(gider => ({
          ad: gider.aciklama || gider.ad || 'Gider',
          tutar: gider.tutar || 0,
          kategori: gider.kategori || 'genel'
        })),
        ozet: {
          toplamNakit: toplamNakit,
          toplamKart: toplamKart,
          toplamHesap: toplamHesap,
          toplamGider: toplamGider,
          netKar: netKar,
          toplamCiro: toplamCiro,
          brutKar: toplamCiro,
          tahsilEdilmeyen: toplamHesabaYazilan
        },
        debug: {
          toplamAdisyon: bugunkuAdisyonlar.length,
          hesaplamaZamani: new Date().toLocaleString('tr-TR')
        }
      };
      
      return rapor;
      
    } catch (error) {
      console.error('Gün sonu raporu hesaplama hatası:', error);
      return null;
    }
  };

  // Veriyi yükle
  useEffect(() => {
    const fetchGunSonuDetay = async () => {
      setYukleniyor(true);
      try {
        const debugData = kontrolLocalStorageVerileri();
        setDebugInfo(debugData);
        
        const anlikRapor = hesaplaGunSonuRaporu();
        
        if (anlikRapor) {
          setGunDetay(anlikRapor);
          setGunDurum(anlikRapor.durum);
          
          const kayitliRaporlar = JSON.parse(localStorage.getItem('mc_gunsonu_raporlar')) || [];
          const mevcutRaporIndex = kayitliRaporlar.findIndex(r => r.id === anlikRapor.id);
          
          if (mevcutRaporIndex === -1) {
            kayitliRaporlar.unshift(anlikRapor);
            localStorage.setItem('mc_gunsonu_raporlar', JSON.stringify(kayitliRaporlar));
          }
        } else {
          const demoRapor = {
            id: "GS" + new Date().getTime().toString().slice(-9),
            tarih: new Date().toISOString(),
            gunNo: `Gün #${new Date().getTime().toString().slice(-6)}`,
            acilis: "09:00",
            kapanis: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            kapanisYapan: "Sistem",
            durum: "tamamlandı",
            vardiya: "Sabah",
            masaHareketleri: [],
            urunSatislari: [],
            giderler: [],
            ozet: {
              toplamNakit: 0,
              toplamKart: 0,
              toplamHesap: 0,
              toplamGider: 0,
              netKar: 0,
              toplamCiro: 0,
              brutKar: 0,
              tahsilEdilmeyen: 0
            }
          };
          setGunDetay(demoRapor);
        }
        
        setYukleniyor(false);
      } catch (error) {
        console.error('Gün sonu detayı yüklenemedi:', error);
        setYukleniyor(false);
      }
    };

    fetchGunSonuDetay();
  }, [id]);

  const toplamMasaNakit = gunDetay?.masaHareketleri?.reduce((sum, m) => sum + (m.nakit || 0), 0) || 0;
  const toplamMasaKart = gunDetay?.masaHareketleri?.reduce((sum, m) => sum + (m.kart || 0), 0) || 0;
  const toplamMasaHesap = gunDetay?.masaHareketleri?.reduce((sum, m) => sum + (m.hesabaYaz || 0), 0) || 0;
  const toplamUrunSatis = gunDetay?.urunSatislari?.reduce((sum, u) => sum + (u.tutar || 0), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF raporu oluşturuluyor...');
  };

  const handleExportExcel = () => {
    const data = {
      gunDetay,
      hesaplamalar: {
        toplamMasaNakit,
        toplamMasaKart,
        toplamMasaHesap,
        toplamUrunSatis
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gun-sonu-raporu-${gunDetay?.id || 'rapor'}.json`;
    a.click();
    
    alert('Excel dosyası indiriliyor...');
  };

  const handleBack = () => {
    navigate('/raporlar');
  };

  const handleGunSonlandir = () => {
    if (window.confirm('Günü sonlandırmak istediğinize emin misiniz?')) {
      const kayitliRaporlar = JSON.parse(localStorage.getItem('mc_gunsonu_raporlar')) || [];
      const mevcutRaporIndex = kayitliRaporlar.findIndex(r => r.id === gunDetay.id);
      
      if (mevcutRaporIndex === -1) {
        kayitliRaporlar.unshift(gunDetay);
        localStorage.setItem('mc_gunsonu_raporlar', JSON.stringify(kayitliRaporlar));
      }
      
      alert('Gün sonlandırıldı! Rapor kaydedildi.');
      window.location.reload();
    }
  };

  const handleManualRefresh = () => {
    const yeniRapor = hesaplaGunSonuRaporu();
    if (yeniRapor) {
      setGunDetay(yeniRapor);
      alert('Rapor güncellendi!');
    }
  };

  if (yukleniyor) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Gün sonu raporu hesaplanıyor...</div>
          {debugInfo && (
            <div className="debug-info">
              <p>Debug: {debugInfo.bugunkuAdisyon} adet bugünkü adisyon bulundu</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!gunDetay) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="error-state">
          <div className="error-icon">📊</div>
          <div className="error-text">Gün sonu raporu oluşturulamadı</div>
          <div className="debug-info">
            {debugInfo && (
              <>
                <p>Toplam adisyon: {debugInfo.toplamAdisyon}</p>
                <p>Kapalı adisyon: {debugInfo.kapaliAdisyon}</p>
                <p>Bugünkü adisyon: {debugInfo.bugunkuAdisyon}</p>
              </>
            )}
          </div>
          <button 
            onClick={handleBack}
            className="btn btn-primary"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gun-sonu-rapor-container">
      <div className="gun-durum-banner">
        <div className="durum-bilgisi">
          <span className={`durum-badge ${gunDurum}`}>
            <i className={`fas fa-${gunDurum === 'tamamlandı' ? 'check-circle' : 'play-circle'}`}></i>
            {gunDurum === 'tamamlandı' ? 'Gün Tamamlandı' : 'Gün Devam Ediyor'}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-calendar-day"></i> {gunDetay.gunNo || `Gün #${new Date().getTime().toString().slice(-6)}`}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-user-clock"></i> Vardiya: {gunDetay.vardiya || 'Sabah'}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-clock"></i> {gunDetay.acilis || '09:00'} - {gunDetay.kapanis || '23:00'}
          </span>
        </div>
        
        <div className="gun-aksiyonlar">
          <button className="btn btn-success" onClick={handleManualRefresh}>
            <i className="fas fa-sync-alt"></i> Raporu Yenile
          </button>
          
          {gunDurum !== 'tamamlandı' && (
            <button className="btn btn-warning" onClick={handleGunSonlandir}>
              <i className="fas fa-stop-circle"></i> Günü Sonlandır
            </button>
          )}
        </div>
      </div>

      {debugInfo && debugInfo.bugunkuAdisyon === 0 && (
        <div className="debug-alert">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Uyarı: Bugüne ait kapalı adisyon bulunamadı. Masaların kapatıldığından emin olun.</span>
          <button className="btn btn-sm btn-outline" onClick={() => {
            console.log("Debug detayı:", debugInfo);
            alert(`Debug bilgisi konsolda görüntülendi.\nBugünkü adisyon: ${debugInfo.bugunkuAdisyon}`);
          }}>
            Detay
          </button>
        </div>
      )}

      <div className="rapor-header">
        <div className="rapor-title-area">
          <h1>
            <i className="fas fa-file-invoice-dollar"></i>
            Gün Sonu Raporu - {bugunTarih}
          </h1>
          <div className="rapor-meta">
            <div className="rapor-id">
              <i className="fas fa-hashtag"></i> Rapor ID: <strong>{gunDetay.id}</strong>
            </div>
            <div className="rapor-tarih">
              <i className="fas fa-calendar-alt"></i> {new Date(gunDetay.tarih).toLocaleDateString('tr-TR')}
            </div>
            <div className="rapor-kapanis">
              <i className="fas fa-user-check"></i> Oluşturan: {gunDetay.kapanisYapan || 'Sistem'}
            </div>
          </div>
        </div>

        <div className="rapor-aksiyonlar">
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Geri
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="fas fa-print"></i> Yazdır
            </button>
            <button className="btn btn-danger" onClick={handleExportPDF}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button className="btn btn-success" onClick={handleExportExcel}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="finansal-ozet-full">
        <h2><i className="fas fa-chart-bar"></i> Finansal Özet (Bugün)</h2>
        <div className="finansal-grid-full">
          <div className="finansal-item-full gelir">
            <div className="finansal-icon">
              <i className="fas fa-cash-register"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Toplam Ciro</div>
              <div className="finansal-deger">{gunDetay.ozet?.toplamCiro || 0} TL</div>
              <div className="finansal-detay">Bugünkü Brüt Gelir</div>
            </div>
          </div>
          
          <div className="finansal-item-full nakit">
            <div className="finansal-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Nakit</div>
              <div className="finansal-deger">{gunDetay.ozet?.toplamNakit || 0} TL</div>
              <div className="finansal-detay">
                {gunDetay.ozet?.toplamCiro && gunDetay.ozet.toplamCiro > 0
                  ? ((gunDetay.ozet.toplamNakit / gunDetay.ozet.toplamCiro) * 100).toFixed(1) + '%'
                  : '0%'}
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full kart">
            <div className="finansal-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Kart</div>
              <div className="finansal-deger">{gunDetay.ozet?.toplamKart || 0} TL</div>
              <div className="finansal-detay">
                {gunDetay.ozet?.toplamCiro && gunDetay.ozet.toplamCiro > 0
                  ? ((gunDetay.ozet.toplamKart / gunDetay.ozet.toplamCiro) * 100).toFixed(1) + '%'
                  : '0%'}
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full gider">
            <div className="finansal-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Giderler</div>
              <div className="finansal-deger">-{gunDetay.ozet?.toplamGider || 0} TL</div>
              <div className="finansal-detay">Bugünkü Masraf</div>
            </div>
          </div>
          
          <div className="finansal-item-full net">
            <div className="finansal-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Net Kâr</div>
              <div className="finansal-deger">{gunDetay.ozet?.netKar || 0} TL</div>
              <div className="finansal-detay">
                {gunDetay.ozet?.toplamCiro && gunDetay.ozet.toplamCiro > 0
                  ? 'Kar Marjı: ' + ((gunDetay.ozet.netKar / gunDetay.ozet.toplamCiro) * 100).toFixed(1) + '%'
                  : 'Kar Marjı: 0%'}
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full tahsilat">
            <div className="finansal-icon">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Hesaba Yaz</div>
              <div className="finansal-deger">{gunDetay.ozet?.toplamHesap || 0} TL</div>
              <div className="finansal-detay">Tahsil Edilmeyen</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rapor-ana-icerik-full" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        
        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full" style={{ height: '100%' }}>
            <h3><i className="fas fa-chair"></i> Masa Hareketleri ({gunDetay.masaHareketleri?.length || 0})</h3>
            <div className="table-responsive-full" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="rapor-tablosu-full">
                <thead>
                  <tr>
                    <th>Masa</th>
                    <th>Kapanış</th>
                    <th>Süre</th>
                    <th>Nakit</th>
                    <th>Kart</th>
                    <th>Hesaba Yaz</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {gunDetay.masaHareketleri && gunDetay.masaHareketleri.length > 0 ? (
                    gunDetay.masaHareketleri.map((masa, index) => (
                      <tr key={index}>
                        <td>
                          <div className="masa-bilgi-full">
                            <div className="masa-no-full">{masa.masa}</div>
                            <div className="masa-tip-full">
                              {masa.masa?.includes('Bilardo') ? 'Bilardo' : 'Normal'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="masa-saat-full">
                            {masa.kapanis}
                          </div>
                        </td>
                        <td>{masa.sure}</td>
                        <td>{masa.nakit || 0} TL</td>
                        <td>{masa.kart || 0} TL</td>
                        <td>{masa.hesabaYaz || 0} TL</td>
                        <td><strong>{(masa.nakit || 0) + (masa.kart || 0) + (masa.hesabaYaz || 0)} TL</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#6b4e2e' }}>
                        <i className="fas fa-chair" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                        Bugün henüz masa hareketi bulunmuyor.
                        <div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
                          Masaları kapatmak için adisyonları tamamlayın.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="toplam-satir-full">
                    <td colSpan="3">BUGÜN TOPLAM</td>
                    <td><strong>{toplamMasaNakit} TL</strong></td>
                    <td><strong>{toplamMasaKart} TL</strong></td>
                    <td><strong>{toplamMasaHesap} TL</strong></td>
                    <td><strong>{toplamMasaNakit + toplamMasaKart + toplamMasaHesap} TL</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full" style={{ height: '100%' }}>
            <h3><i className="fas fa-shopping-cart"></i> Ürün Satışları ({gunDetay.urunSatislari?.length || 0})</h3>
            <div className="urun-listesi-full" style={{ maxHeight: '460px', overflowY: 'auto' }}>
              {gunDetay.urunSatislari && gunDetay.urunSatislari.length > 0 ? (
                <>
                  {gunDetay.urunSatislari.map((urun, index) => (
                    <div key={index} className="urun-item-full">
                      <div className="urun-bilgi-full">
                        <div className="urun-ad-full">
                          {urun.urun}
                          {urun.maliyetsiz && (
                            <span className="maliyetsiz-badge-full">M</span>
                          )}
                        </div>
                        <div className="urun-detay-full">
                          {urun.adet} adet × {urun.birim} TL
                          <span className="urun-kategori-full">{urun.kategori}</span>
                        </div>
                      </div>
                      <div className="urun-tutar-full">{urun.tutar} TL</div>
                    </div>
                  ))}
                  <div className="urun-toplam-full">
                    <div className="urun-ad-full">Bugün Toplam Satış</div>
                    <div className="urun-tutar-full">{toplamUrunSatis} TL</div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b4e2e', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <i className="fas fa-shopping-cart" style={{ fontSize: '48px', marginBottom: '20px', display: 'block', opacity: 0.5 }}></i>
                  Bugün henüz ürün satışı bulunmuyor.
                  <div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
                    Masa hareketleri olmalı
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full" style={{ height: '100%' }}>
            <h3><i className="fas fa-receipt"></i> Günlük Giderler ({gunDetay.giderler?.length || 0})</h3>
            <div className="gider-listesi-full" style={{ maxHeight: '460px', overflowY: 'auto' }}>
              {gunDetay.giderler && gunDetay.giderler.length > 0 ? (
                <>
                  {gunDetay.giderler.map((gider, index) => (
                    <div key={index} className="gider-item-full">
                      <div className="gider-ad-full">
                        <i className="fas fa-minus-circle"></i>
                        {gider.ad}
                        <span className="gider-kategori-full">{gider.kategori}</span>
                      </div>
                      <div className="gider-tutar-full">-{gider.tutar} TL</div>
                    </div>
                  ))}
                  <div className="gider-toplam-full">
                    <div className="gider-ad-full">Bugün Toplam Gider</div>
                    <div className="gider-tutar-full">-{gunDetay.ozet?.toplamGider || 0} TL</div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b4e2e', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <i className="fas fa-receipt" style={{ fontSize: '48px', marginBottom: '20px', display: 'block', opacity: 0.5 }}></i>
                  Bugün henüz gider kaydı bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rapor-alt-bilgi-full">
        <div className="rapor-notlar-full">
          <div className="not-item-full">
            <i className="fas fa-info-circle"></i>
            <span>Bu rapor ANLIK olarak hesaplanmıştır. Sadece bugünkü verileri içerir.</span>
          </div>
          <div className="not-item-full">
            <i className="fas fa-shield-alt"></i>
            <span>Rapor ID: {gunDetay.id} • Hesaplama: {gunDetay.debug?.hesaplamaZamani || new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
          {debugInfo && (
            <div className="not-item-full debug">
              <i className="fas fa-bug"></i>
              <span>Veri: {debugInfo.bugunkuAdisyon} adisyon, {debugInfo.giderler} gider</span>
            </div>
          )}
        </div>
        
        <div className="rapor-tarih-full">
          <div>
            <i className="fas fa-calendar"></i>
            Bugün: {bugunTarih}
          </div>
        </div>
      </div>

      <div className="alt-aksiyonlar-full">
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="fas fa-list"></i> Rapor Listesi
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <i className="fas fa-print"></i> Raporu Yazdır
        </button>
        <button className="btn btn-success" onClick={handleManualRefresh}>
          <i className="fas fa-sync-alt"></i> Yenile
        </button>
        <button className="btn btn-warning" onClick={handleGunSonlandir}>
          <i className="fas fa-save"></i> Raporu Kaydet
        </button>
      </div>
    </div>
  );
};

export default GunSonuRapor;