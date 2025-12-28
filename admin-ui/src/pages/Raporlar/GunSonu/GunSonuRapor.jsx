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
      
      // İndirim hesaplama
      const toplamIndirim = bugunkuAdisyonlar.reduce((sum, adisyon) => {
        return sum + (parseFloat(adisyon.indirim) || 0);
      }, 0);
      
      console.log(`Toplam İndirim: ${toplamIndirim.toFixed(2)} TL`);
      
      // İndirimli adisyonları göster
      const indirimliAdisyonlar = bugunkuAdisyonlar.filter(a => (parseFloat(a.indirim) || 0) > 0);
      if (indirimliAdisyonlar.length > 0) {
        console.log(`İndirim uygulanan adisyon: ${indirimliAdisyonlar.length}`);
        indirimliAdisyonlar.slice(-3).forEach((adisyon, index) => {
          console.log(`İndirimli Adisyon ${index + 1}:`, {
            id: adisyon.id,
            masaNo: adisyon.masaNo,
            indirim: adisyon.indirim || 0,
            toplam: adisyon.toplam || 0
          });
        });
      }
      
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
            indirim: adisyon.indirim || 0,
            odemeler: adisyon.odemeler || []
          });
        });
      }
      
      return {
        toplamAdisyon: adisyonlar.length,
        kapaliAdisyon: kapaliAdisyonlar.length,
        bugunkuAdisyon: bugunkuAdisyonlar.length,
        masalar: masalar.length,
        giderler: giderler.length,
        toplamIndirim: toplamIndirim
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
      
      // TOPLAM İNDİRİM HESAPLAMA
      const toplamIndirim = bugunkuAdisyonlar.reduce((sum, adisyon) => {
        const adisyonIndirim = parseFloat(adisyon.indirim) || 0;
        return sum + adisyonIndirim;
      }, 0);
      console.log(`Toplam İndirim: ${toplamIndirim} TL`);
      
      // ADİSYON BAŞI İNDİRİMLERİ DE KAYDET
      const adisyonIndirimleri = bugunkuAdisyonlar.map(adisyon => ({
        adisyonId: adisyon.id,
        masaNo: adisyon.masaNo || `Masa ${adisyon.masaNum}`,
        indirim: parseFloat(adisyon.indirim) || 0,
        toplamTutar: adisyon.toplamTutar || 0
      })).filter(item => item.indirim > 0);
      
      // Bugünkü giderleri filtrele
      const bugunkuGiderler = giderler.filter(gider => {
        if (!gider.tarih) return false;
        const giderTarihi = new Date(gider.tarih);
        return giderTarihi >= bugunBaslangic && giderTarihi <= bugunBitis;
      });
      
      // DEĞİŞİKLİK: Her adisyonu ayrı satır olarak işle - KAPANIŞ ZAMANINA GÖRE SIRALA
      const masaHareketleri = bugunkuAdisyonlar
        .map(adisyon => {
          // Masa bilgisini al
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
          
          // Ödeme türlerini hesapla
          let nakit = 0;
          let kart = 0;
          let hesabaYaz = 0;
          let diger = 0;
          const odemeDetaylari = [];
          
          // ÖDEME DETAYLARINI KAYDET
          if (adisyon.odemeler && Array.isArray(adisyon.odemeler)) {
            adisyon.odemeler.forEach(odeme => {
              const odemeTuru = odeme.tip || odeme.tur || odeme.odemeTuru || '';
              const odemeTutar = parseFloat(odeme.tutar) || 0;
              
              // Ödeme detayını kaydet
              odemeDetaylari.push({
                tur: odemeTuru,
                tutar: odemeTutar,
                tarih: odeme.tarih || adisyon.kapanisZamani
              });
              
              // Toplamları güncelle
              const tur = odemeTuru.toLowerCase();
              if (tur.includes('nakit')) {
                nakit += odemeTutar;
              } else if (tur.includes('kart') || tur.includes('kredi')) {
                kart += odemeTutar;
              } else if (tur.includes('hesap') || tur.includes('yaz')) {
                hesabaYaz += odemeTutar;
              } else {
                diger += odemeTutar;
              }
            });
          } else if (adisyon.toplam) {
            // Ödeme detayı yoksa toplam tutarı nakit olarak kaydet
            const toplamTutar = parseFloat(adisyon.toplam) || 0;
            odemeDetaylari.push({
              tur: 'NAKIT',
              tutar: toplamTutar,
              tarih: adisyon.kapanisZamani
            });
            nakit = toplamTutar;
          }
          
          // İNDİRİMİ KAYDET
          const indirim = parseFloat(adisyon.indirim) || 0;
          if (indirim > 0) {
            odemeDetaylari.push({
              tur: 'İNDİRİM',
              tutar: -indirim,
              tarih: adisyon.kapanisZamani
            });
          }
          
          // SÜRE BİLGİSİNİ HESAPLA
          let sure = "--:--";
          if (adisyon.kapanisZamani && (adisyon.olusturulmaTarihi || adisyon.acilisZamani)) {
            const kapanisZamani = new Date(adisyon.kapanisZamani);
            const acilisZamani = new Date(adisyon.olusturulmaTarihi || adisyon.acilisZamani);
            const sureMs = kapanisZamani - acilisZamani;
            
            if (sureMs > 0) {
              const sureDakika = Math.floor(sureMs / (1000 * 60));
              const saat = Math.floor(sureDakika / 60);
              const dakika = sureDakika % 60;
              sure = `${saat}:${dakika.toString().padStart(2, '0')}`;
            }
          }
          
          // KAPANIŞ ZAMANINI FORMATLA
          let kapanisSaat = "--:--";
          if (adisyon.kapanisZamani) {
            kapanisSaat = new Date(adisyon.kapanisZamani).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
          
          const toplam = nakit + kart + hesabaYaz + diger;
          
          return {
            id: adisyon.id,
            masa: masaAdi,
            masaId: adisyon.masaId,
            bilardoMasaId: adisyon.bilardoMasaId,
            kapanis: kapanisSaat,
            kapanisZamani: adisyon.kapanisZamani,
            sure: sure,
            nakit: nakit,
            kart: kart,
            hesabaYaz: hesabaYaz,
            diger: diger,
            indirim: indirim,
            toplam: toplam,
            musteriAdi: adisyon.musteriAdi || null,
            odemeDetaylari: odemeDetaylari,
            acilisZamani: adisyon.acilisZamani || adisyon.olusturulmaTarihi
          };
        })
        // Kapanış zamanına göre sırala (en yeni en üstte)
        .sort((a, b) => new Date(b.kapanisZamani) - new Date(a.kapanisZamani));
      
      console.log(`Oluşturulan masa hareketleri: ${masaHareketleri.length} satır`);
      
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
      const toplamDiger = masaHareketleri.reduce((sum, masa) => sum + (masa.diger || 0), 0);
      const toplamIndirimMasa = masaHareketleri.reduce((sum, masa) => sum + (masa.indirim || 0), 0);
      const toplamGider = bugunkuGiderler.reduce((sum, gider) => sum + (gider.tutar || 0), 0);
      const toplamCiro = toplamNakit + toplamKart + toplamHesap + toplamDiger;
      const netKar = toplamCiro - toplamGider - toplamIndirimMasa;
      
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
        indirimDetaylari: adisyonIndirimleri,
        giderler: bugunkuGiderler.map(gider => ({
          ad: gider.aciklama || gider.ad || 'Gider',
          tutar: gider.tutar || 0,
          kategori: gider.kategori || 'genel'
        })),
        ozet: {
          toplamNakit: toplamNakit,
          toplamKart: toplamKart,
          toplamHesap: toplamHesap,
          toplamDiger: toplamDiger,
          toplamGider: toplamGider,
          toplamIndirim: toplamIndirimMasa,
          netKar: netKar,
          toplamCiro: toplamCiro,
          brutKar: toplamCiro - toplamIndirimMasa,
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
            indirimDetaylari: [],
            giderler: [],
            ozet: {
              toplamNakit: 0,
              toplamKart: 0,
              toplamHesap: 0,
              toplamDiger: 0,
              toplamGider: 0,
              toplamIndirim: 0,
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

  // Kullanılacak raporu belirle
  const aktifRapor = gunDetay;

  const toplamMasaNakit = aktifRapor?.masaHareketleri?.reduce((sum, m) => sum + (m.nakit || 0), 0) || 0;
  const toplamMasaKart = aktifRapor?.masaHareketleri?.reduce((sum, m) => sum + (m.kart || 0), 0) || 0;
  const toplamMasaHesap = aktifRapor?.masaHareketleri?.reduce((sum, m) => sum + (m.hesabaYaz || 0), 0) || 0;
  const toplamMasaDiger = aktifRapor?.masaHareketleri?.reduce((sum, m) => sum + (m.diger || 0), 0) || 0;
  const toplamMasaIndirim = aktifRapor?.masaHareketleri?.reduce((sum, m) => sum + (m.indirim || 0), 0) || 0;
  const toplamUrunSatis = aktifRapor?.urunSatislari?.reduce((sum, u) => sum + (u.tutar || 0), 0) || 0;
  const toplamGider = aktifRapor?.ozet?.toplamGider || 0;
  const toplamIndirim = aktifRapor?.ozet?.toplamIndirim || 0;
  const netKar = aktifRapor?.ozet?.netKar || 0;
  const toplamCiro = aktifRapor?.ozet?.toplamCiro || 0;

  // Özet istatistikleri hesapla
  const ortalamaMasaBasiCiro = aktifRapor?.masaHareketleri?.length > 0 
    ? (toplamCiro / aktifRapor.masaHareketleri.length).toFixed(2) 
    : 0;
  
  const enYuksekMasa = aktifRapor?.masaHareketleri?.reduce((max, masa) => {
    const masaToplam = (masa.nakit || 0) + (masa.kart || 0) + (masa.hesabaYaz || 0) + (masa.diger || 0);
    return masaToplam > max.toplam ? { masa: masa.masa, toplam: masaToplam } : max;
  }, { masa: '', toplam: 0 });
  
  const enCokSatanUrun = aktifRapor?.urunSatislari?.reduce((max, urun) => {
    return urun.tutar > max.tutar ? { urun: urun.urun, tutar: urun.tutar } : max;
  }, { urun: '', tutar: 0 });
  
  const toplamMasaSayisi = aktifRapor?.masaHareketleri?.length || 0;
  const toplamUrunCesidi = aktifRapor?.urunSatislari?.length || 0;
  const toplamGiderCesidi = aktifRapor?.giderler?.length || 0;
  const karMarji = toplamCiro > 0 ? ((netKar / toplamCiro) * 100).toFixed(1) : 0;
  
  // YENİ: Ödeme türlerine göre toplam
  const nakitOrani = toplamCiro > 0 ? ((toplamMasaNakit / toplamCiro) * 100).toFixed(1) : 0;
  const kartOrani = toplamCiro > 0 ? ((toplamMasaKart / toplamCiro) * 100).toFixed(1) : 0;
  const hesapOrani = toplamCiro > 0 ? ((toplamMasaHesap / toplamCiro) * 100).toFixed(1) : 0;
  const digerOrani = toplamCiro > 0 ? ((toplamMasaDiger / toplamCiro) * 100).toFixed(1) : 0;

  // Ödeme türü etiketleri
  const odemeTuruEtiketi = (tur) => {
    const t = tur?.toLowerCase() || '';
    if (t.includes('nakit')) return { etiket: 'Nakit', renk: '#4caf50', icon: 'fa-money-bill-wave' };
    if (t.includes('kart') || t.includes('kredi')) return { etiket: 'Kart', renk: '#2196f3', icon: 'fa-credit-card' };
    if (t.includes('hesap') || t.includes('yaz')) return { etiket: 'Hesaba Yaz', renk: '#ff9800', icon: 'fa-file-invoice-dollar' };
    if (t.includes('indirim')) return { etiket: 'İndirim', renk: '#ff5722', icon: 'fa-tag' };
    return { etiket: tur || 'Diğer', renk: '#9c27b0', icon: 'fa-money-check-alt' };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF raporu oluşturuluyor...');
  };

  const handleExportExcel = () => {
    const data = {
      gunDetay: aktifRapor,
      hesaplamalar: {
        toplamMasaNakit,
        toplamMasaKart,
        toplamMasaHesap,
        toplamMasaDiger,
        toplamMasaIndirim,
        toplamUrunSatis
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gun-sonu-raporu-${aktifRapor?.id || 'rapor'}.json`;
    a.click();
    
    alert('Excel dosyası indiriliyor...');
  };

  const handleBack = () => {
    navigate('/raporlar');
  };

  const handleGunSonlandir = () => {
    if (window.confirm('Günü sonlandırmak istediğinize emin misiniz?')) {
      const kayitliRaporlar = JSON.parse(localStorage.getItem('mc_gunsonu_raporlar')) || [];
      const mevcutRaporIndex = kayitliRaporlar.findIndex(r => r.id === aktifRapor.id);
      
      if (mevcutRaporIndex === -1) {
        kayitliRaporlar.unshift(aktifRapor);
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

  if (!aktifRapor) {
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
                <p>Toplam indirim: {debugInfo.toplamIndirim?.toFixed(2) || 0} TL</p>
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
            <i className="fas fa-calendar-day"></i> {aktifRapor.gunNo || `Gün #${new Date().getTime().toString().slice(-6)}`}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-user-clock"></i> Vardiya: {aktifRapor.vardiya || 'Sabah'}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-clock"></i> {aktifRapor.acilis || '09:00'} - {aktifRapor.kapanis || '23:00'}
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

      <div className="rapor-ana-grid">
        {/* SOL PANEL: GENİŞ MASA HAREKETLERİ */}
        <div className="rapor-sol-panel genis-masa-hareketleri">
          <div className="rapor-header">
            <div className="rapor-title-area">
              <h1>
                <i className="fas fa-file-invoice-dollar"></i>
                Gün Sonu Raporu - {bugunTarih}
              </h1>
              <div className="rapor-meta">
                <div className="rapor-id">
                  <i className="fas fa-hashtag"></i> Rapor ID: <strong>{aktifRapor.id}</strong>
                </div>
                <div className="rapor-tarih">
                  <i className="fas fa-calendar-alt"></i> {new Date(aktifRapor.tarih).toLocaleDateString('tr-TR')}
                </div>
                <div className="rapor-kapanis">
                  <i className="fas fa-user-check"></i> Oluşturan: {aktifRapor.kapanisYapan || 'Sistem'}
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

          {/* MASA HAREKETLERİ - GENİŞ PANEL */}
          <div className="masa-hareketleri-genis-panel">
            <div className="panel-baslik">
              <h2><i className="fas fa-chair"></i> Masa Hareketleri ({toplamMasaSayisi} Adisyon)</h2>
              <div className="panel-ozet">
                <div className="ozet-item">
                  <span className="ozet-label">Toplam Ciro:</span>
                  <span className="ozet-deger ciro">{toplamCiro.toFixed(2)} TL</span>
                </div>
                <div className="ozet-item">
                  <span className="ozet-label">Net Kâr:</span>
                  <span className="ozet-deger kar">{netKar.toFixed(2)} TL</span>
                </div>
              </div>
            </div>

            <div className="masa-hareketleri-tablosu">
              <table className="masa-detay-tablo">
                <thead>
                  <tr>
                    <th className="masa-bilgi">Masa Bilgisi</th>
                    <th className="zaman-bilgi">Zaman</th>
                    <th className="odeme-ozet">Ödeme Özeti</th>
                    <th className="odeme-detay">Ödeme Detayları</th>
                    <th className="toplam-sutun">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {aktifRapor.masaHareketleri && aktifRapor.masaHareketleri.length > 0 ? (
                    aktifRapor.masaHareketleri.map((masa, index) => (
                      <tr key={index} className="masa-satiri">
                        <td className="masa-bilgi">
                          <div className="masa-ana-bilgi">
                            <div className="masa-no-detay">
                              <i className={`fas ${masa.masa?.includes('Bilardo') ? 'fa-bowling-ball' : 'fa-utensils'}`}></i>
                              <span className="masa-ad">{masa.masa}</span>
                              {masa.musteriAdi && (
                                <span className="musteri-bilgi">
                                  <i className="fas fa-user"></i> {masa.musteriAdi}
                                </span>
                              )}
                            </div>
                            {masa.masa?.includes('Bilardo') && (
                              <span className="masa-tip bilardo">🎱 Bilardo</span>
                            )}
                            {!masa.masa?.includes('Bilardo') && (
                              <span className="masa-tip normal">🍽️ Normal</span>
                            )}
                          </div>
                        </td>
                        <td className="zaman-bilgi">
                          <div className="zaman-detay">
                            <div className="kapanis-saat">
                              <i className="fas fa-clock"></i> {masa.kapanis}
                            </div>
                            <div className="masa-sure">
                              <i className="fas fa-hourglass-half"></i> {masa.sure}
                            </div>
                          </div>
                        </td>
                        <td className="odeme-ozet">
                          <div className="odeme-ozet-detay">
                            {masa.nakit > 0 && (
                              <div className="odeme-item nakit">
                                <i className="fas fa-money-bill-wave"></i>
                                <span className="odeme-tutar">{masa.nakit.toFixed(2)} TL</span>
                              </div>
                            )}
                            {masa.kart > 0 && (
                              <div className="odeme-item kart">
                                <i className="fas fa-credit-card"></i>
                                <span className="odeme-tutar">{masa.kart.toFixed(2)} TL</span>
                              </div>
                            )}
                            {masa.hesabaYaz > 0 && (
                              <div className="odeme-item hesap">
                                <i className="fas fa-file-invoice-dollar"></i>
                                <span className="odeme-tutar">{masa.hesabaYaz.toFixed(2)} TL</span>
                              </div>
                            )}
                            {masa.diger > 0 && (
                              <div className="odeme-item diger">
                                <i className="fas fa-money-check-alt"></i>
                                <span className="odeme-tutar">{masa.diger.toFixed(2)} TL</span>
                              </div>
                            )}
                            {masa.indirim > 0 && (
                              <div className="odeme-item indirim">
                                <i className="fas fa-tag"></i>
                                <span className="odeme-tutar">-{masa.indirim.toFixed(2)} TL</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="odeme-detay">
                          <div className="odeme-detay-listesi">
                            {masa.odemeDetaylari && masa.odemeDetaylari.length > 0 ? (
                              masa.odemeDetaylari.map((odeme, odemeIndex) => {
                                const odemeInfo = odemeTuruEtiketi(odeme.tur);
                                const tutar = parseFloat(odeme.tutar) || 0;
                                return (
                                  <div key={odemeIndex} className="detay-item">
                                    <span className="detay-icon" style={{ color: odemeInfo.renk }}>
                                      <i className={`fas ${odemeInfo.icon}`}></i>
                                    </span>
                                    <span className="detay-tur">{odemeInfo.etiket}</span>
                                    <span className={`detay-tutar ${tutar < 0 ? 'negatif' : ''}`}>
                                      {tutar.toFixed(2)} TL
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="detay-yok">Ödeme detayı yok</div>
                            )}
                          </div>
                        </td>
                        <td className="toplam-sutun">
                          <div className="masa-toplam">
                            <div className="toplam-tutar">{masa.toplam.toFixed(2)} TL</div>
                            <div className="toplam-odeme-sayi">
                              {masa.odemeDetaylari?.length || 0} ödeme
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bos-masa">
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                        <i className="fas fa-chair" style={{ fontSize: '48px', color: '#d4a657', marginBottom: '15px' }}></i>
                        <div style={{ fontSize: '18px', color: '#8b4513', marginBottom: '10px' }}>
                          Bugün masa hareketi bulunmuyor.
                        </div>
                        <div style={{ fontSize: '14px', color: '#795548' }}>
                          Masaları kapatmak için adisyonları tamamlayın.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="toplam-satir">
                    <td colSpan="2" className="toplam-etiket">
                      <i className="fas fa-calculator"></i> BUGÜN TOPLAM
                    </td>
                    <td className="toplam-odeme-ozet">
                      <div className="toplam-odeme-detay">
                        <span className="toplam-nakit">{toplamMasaNakit.toFixed(2)} TL</span>
                        <span className="toplam-kart">{toplamMasaKart.toFixed(2)} TL</span>
                        <span className="toplam-hesap">{toplamMasaHesap.toFixed(2)} TL</span>
                        {toplamMasaDiger > 0 && (
                          <span className="toplam-diger">{toplamMasaDiger.toFixed(2)} TL</span>
                        )}
                        {toplamMasaIndirim > 0 && (
                          <span className="toplam-indirim">-{toplamMasaIndirim.toFixed(2)} TL</span>
                        )}
                      </div>
                    </td>
                    <td className="toplam-detay-bilgi">
                      <div className="detay-istatistik">
                        <span className="detay-item">
                          <i className="fas fa-cash-register"></i> {nakitOrani}% Nakit
                        </span>
                        <span className="detay-item">
                          <i className="fas fa-credit-card"></i> {kartOrani}% Kart
                        </span>
                        {hesapOrani > 0 && (
                          <span className="detay-item">
                            <i className="fas fa-file-invoice"></i> {hesapOrani}% Hesap
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="toplam-genel">
                      <div className="genel-toplam">
                        <div className="genel-tutar">{toplamCiro.toFixed(2)} TL</div>
                        <div className="genel-masa-sayi">{toplamMasaSayisi} adisyon</div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: HIZLI ÖZET (STICKY) */}
        <div className="rapor-sag-panel">
          <div className="ozet-panel">
            <div className="ozet-panel-header">
              <h3><i className="fas fa-chart-pie"></i> Hızlı Özet</h3>
              <span className="ozet-tarih">
                Bugün
              </span>
            </div>
            
            <div className="ozet-istatistikler">
              <div className="ozet-istatistik-item ana">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Net Kâr</div>
                  <div className="ozet-istatistik-deger">{netKar.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="kar-marji">%{karMarji}</span>
                    <span className="kar-trend">
                      {netKar > 0 ? <i className="fas fa-arrow-up trend-yukari"></i> : 
                       netKar < 0 ? <i className="fas fa-arrow-down trend-asagi"></i> : 
                       <i className="fas fa-minus trend-sabit"></i>}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-cash-register"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Toplam Ciro</div>
                  <div className="ozet-istatistik-deger">{toplamCiro.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="ciro-detay">{toplamMasaSayisi} adisyon</span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-chair"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Toplam Adisyon</div>
                  <div className="ozet-istatistik-deger">{toplamMasaSayisi}</div>
                  <div className="ozet-istatistik-detay">
                    <span className="masa-ortalama">~{ortalamaMasaBasiCiro} TL/adisyon</span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-money-bills"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Nakit Ciro</div>
                  <div className="ozet-istatistik-deger">{toplamMasaNakit.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="nakit-oran">%{nakitOrani}</span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-credit-card"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Kart Ciro</div>
                  <div className="ozet-istatistik-deger">{toplamMasaKart.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="kart-oran">%{kartOrani}</span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-receipt"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">Giderler</div>
                  <div className="ozet-istatistik-deger">{toplamGider.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="gider-sayi">{toplamGiderCesidi} kalem</span>
                  </div>
                </div>
              </div>
              
              <div className="ozet-istatistik-item">
                <div className="ozet-istatistik-icon">
                  <i className="fas fa-tag"></i>
                </div>
                <div className="ozet-istatistik-content">
                  <div className="ozet-istatistik-label">İndirimler</div>
                  <div className="ozet-istatistik-deger">{toplamIndirim.toFixed(2)} TL</div>
                  <div className="ozet-istatistik-detay">
                    <span className="indirim-sayi">{aktifRapor.indirimDetaylari?.length || 0} adisyon</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ozet-performans">
              <h4><i className="fas fa-trophy"></i> Performans Özeti</h4>
              
              {enYuksekMasa.toplam > 0 && (
                <div className="performans-item">
                  <div className="performans-label">
                    <i className="fas fa-crown"></i> En Yüksek Adisyon
                  </div>
                  <div className="performans-deger">
                    <span className="performans-masa">{enYuksekMasa.masa}</span>
                    <span className="performans-tutar">{enYuksekMasa.toplam.toFixed(2)} TL</span>
                  </div>
                </div>
              )}
              
              {enCokSatanUrun.tutar > 0 && (
                <div className="performans-item">
                  <div className="performans-label">
                    <i className="fas fa-star"></i> En Çok Satan
                  </div>
                  <div className="performans-deger">
                    <span className="performans-urun">{enCokSatanUrun.urun}</span>
                    <span className="performans-tutar">{enCokSatanUrun.tutar.toFixed(2)} TL</span>
                  </div>
                </div>
              )}
              
              <div className="performans-item">
                <div className="performans-label">
                  <i className="fas fa-percentage"></i> Kar Marjı
                </div>
                <div className="performans-deger">
                  <span className={`performans-yuzde ${netKar > 0 ? 'pozitif' : netKar < 0 ? 'negatif' : 'notr'}`}>
                    %{karMarji}
                  </span>
                  <span className="performans-durum">
                    {netKar > 0 ? 'Kârlı' : netKar < 0 ? 'Zarar' : 'Denge'}
                  </span>
                </div>
              </div>
              
              <div className="performans-item">
                <div className="performans-label">
                  <i className="fas fa-chart-line"></i> Nakit Oranı
                </div>
                <div className="performans-deger">
                  <span className="performans-yuzde">
                    {nakitOrani}%
                  </span>
                  <span className="performans-durum">Nakit/Ciro</span>
                </div>
              </div>
            </div>
            
            <div className="ozet-notlar">
              <h4><i className="fas fa-lightbulb"></i> Notlar</h4>
              <ul>
                <li><i className="fas fa-check-circle"></i> Toplam {toplamMasaSayisi} adisyon kapandı</li>
                <li><i className="fas fa-check-circle"></i> Adisyon başı ortalama ciro: {ortalamaMasaBasiCiro} TL</li>
                {toplamIndirim > 0 && (
                  <li><i className="fas fa-tag"></i> {toplamIndirim.toFixed(2)} TL indirim uygulandı</li>
                )}
                {toplamGider > 0 && (
                  <li><i className="fas fa-receipt"></i> {toplamGider.toFixed(2)} TL gider kaydedildi</li>
                )}
                {toplamMasaHesap > 0 && (
                  <li><i className="fas fa-file-invoice"></i> {toplamMasaHesap.toFixed(2)} TL hesaba yazıldı</li>
                )}
              </ul>
            </div>
            
            <div className="ozet-aksiyonlar">
              <button className="btn btn-sm btn-outline" onClick={handleManualRefresh}>
                <i className="fas fa-sync-alt"></i> Yenile
              </button>
              <button className="btn btn-sm btn-outline" onClick={handlePrint}>
                <i className="fas fa-print"></i> Yazdır
              </button>
              <button className="btn btn-sm btn-outline" onClick={handleExportExcel}>
                <i className="fas fa-file-excel"></i> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALT BÖLÜM: DİĞER DETAYLAR */}
      <div className="rapor-alt-detaylar">
        <div className="detay-grid">
          {/* ÜRÜN SATIŞLARI */}
          <div className="detay-kolon urun-satis">
            <div className="detay-baslik">
              <h3><i className="fas fa-shopping-cart"></i> Ürün Satışları ({toplamUrunCesidi})</h3>
              <span className="detay-toplam">{toplamUrunSatis.toFixed(2)} TL</span>
            </div>
            <div className="detay-icerik">
              {aktifRapor.urunSatislari && aktifRapor.urunSatislari.length > 0 ? (
                <div className="urun-detay-listesi">
                  {aktifRapor.urunSatislari.slice(0, 10).map((urun, index) => (
                    <div key={index} className="urun-detay-item">
                      <div className="urun-detay-bilgi">
                        <div className="urun-detay-ad">
                          {urun.urun}
                          {urun.maliyetsiz && (
                            <span className="maliyetsiz-badge">M</span>
                          )}
                        </div>
                        <div className="urun-detay-kategori">{urun.kategori}</div>
                      </div>
                      <div className="urun-detay-sag">
                        <div className="urun-detay-adet">{urun.adet} adet</div>
                        <div className="urun-detay-tutar">{urun.tutar.toFixed(2)} TL</div>
                      </div>
                    </div>
                  ))}
                  {aktifRapor.urunSatislari.length > 10 && (
                    <div className="daha-fazla-detay">
                      + {aktifRapor.urunSatislari.length - 10} daha fazla ürün...
                    </div>
                  )}
                </div>
              ) : (
                <div className="detay-bos">
                  <i className="fas fa-shopping-cart"></i>
                  <span>Ürün satışı yok</span>
                </div>
              )}
            </div>
          </div>

          {/* GİDERLER */}
          <div className="detay-kolon giderler">
            <div className="detay-baslik">
              <h3><i className="fas fa-receipt"></i> Giderler ({toplamGiderCesidi})</h3>
              <span className="detay-toplam">-{toplamGider.toFixed(2)} TL</span>
            </div>
            <div className="detay-icerik">
              {aktifRapor.giderler && aktifRapor.giderler.length > 0 ? (
                <div className="gider-detay-listesi">
                  {aktifRapor.giderler.slice(0, 8).map((gider, index) => (
                    <div key={index} className="gider-detay-item">
                      <div className="gider-detay-bilgi">
                        <div className="gider-detay-ad">
                          <i className="fas fa-minus-circle"></i>
                          {gider.ad}
                        </div>
                        <div className="gider-detay-kategori">{gider.kategori}</div>
                      </div>
                      <div className="gider-detay-tutar">-{gider.tutar} TL</div>
                    </div>
                  ))}
                  {aktifRapor.giderler.length > 8 && (
                    <div className="daha-fazla-detay">
                      + {aktifRapor.giderler.length - 8} daha fazla gider...
                    </div>
                  )}
                </div>
              ) : (
                <div className="detay-bos">
                  <i className="fas fa-receipt"></i>
                  <span>Gider kaydı yok</span>
                </div>
              )}
            </div>
          </div>

          {/* İNDİRİM DETAYLARI */}
          <div className="detay-kolon indirimler">
            <div className="detay-baslik">
              <h3><i className="fas fa-tag"></i> İndirimler ({aktifRapor.indirimDetaylari?.length || 0})</h3>
              <span className="detay-toplam">-{toplamIndirim.toFixed(2)} TL</span>
            </div>
            <div className="detay-icerik">
              {aktifRapor.indirimDetaylari && aktifRapor.indirimDetaylari.length > 0 ? (
                <div className="indirim-detay-listesi">
                  {aktifRapor.indirimDetaylari.slice(0, 6).map((indirim, index) => (
                    <div key={index} className="indirim-detay-item">
                      <div className="indirim-detay-bilgi">
                        <div className="indirim-detay-masa">
                          <i className="fas fa-receipt"></i>
                          {indirim.masaNo}
                        </div>
                        <div className="indirim-detay-yuzde">
                          {indirim.toplamTutar > 0 
                            ? ((indirim.indirim / indirim.toplamTutar) * 100).toFixed(1) + '%'
                            : '0%'}
                        </div>
                      </div>
                      <div className="indirim-detay-tutar">-{indirim.indirim.toFixed(2)} TL</div>
                    </div>
                  ))}
                  {aktifRapor.indirimDetaylari.length > 6 && (
                    <div className="daha-fazla-detay">
                      + {aktifRapor.indirimDetaylari.length - 6} daha fazla indirim...
                    </div>
                  )}
                </div>
              ) : (
                <div className="detay-bos">
                  <i className="fas fa-tag"></i>
                  <span>İndirim uygulanmadı</span>
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
            <span>Rapor ID: {aktifRapor.id} • Hesaplama: {aktifRapor.debug?.hesaplamaZamani || new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
          {debugInfo && (
            <div className="not-item-full debug">
              <i className="fas fa-bug"></i>
              <span>Veri: {aktifRapor.debug?.toplamAdisyon || 0} adisyon, {toplamGiderCesidi} gider, {aktifRapor.indirimDetaylari?.length || 0} indirim</span>
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