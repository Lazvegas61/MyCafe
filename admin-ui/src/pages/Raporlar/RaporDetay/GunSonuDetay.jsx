import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GunSonuDetay.css';

const GunSonuDetay = () => {
  const { raporId } = useParams();
  const navigate = useNavigate();
  const [rapor, setRapor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [masaOdemeleri, setMasaOdemeleri] = useState([]);
  const [bilardoOdemeleri, setBilardoOdemeleri] = useState([]);
  const [indirimler, setIndirimler] = useState([]);
  const [giderler, setGiderler] = useState([]);
  const [tarihFiltresi, setTarihFiltresi] = useState('');
  const [filtrelenmisMasaOdemeleri, setFiltrelenmisMasaOdemeleri] = useState([]);
  const [filtrelenmisBilardoOdemeleri, setFiltrelenmisBilardoOdemeleri] = useState([]);
  const [canliSure, setCanliSure] = useState({ saat: 0, dakika: 0 });
  const [baslangicZamani, setBaslangicZamani] = useState(null);
  const [bitisZamani, setBitisZamani] = useState(null);

  // CANLI SÜRE HESAPLAMA - useCallback ile optimize edildi
  const calculateLiveDuration = useCallback((raporData) => {
    if (!raporData) return;
    
    const baslangic = raporData.baslangicZamani ? new Date(raporData.baslangicZamani) : new Date();
    const bitis = raporData.bitisZamani ? new Date(raporData.bitisZamani) : new Date();
    
    // Başlangıç ve bitiş zamanlarını state'e kaydet
    setBaslangicZamani(baslangic);
    setBitisZamani(bitis);
    
    const farkMs = bitis - baslangic;
    const saat = Math.floor(farkMs / 3600000);
    const dakika = Math.floor((farkMs % 3600000) / 60000);
    
    setCanliSure({ saat, dakika });
  }, []);

  // CANLI SÜRE GÜNCELLEME - Her 30 saniyede bir
  useEffect(() => {
    if (!rapor) return;
    
    const interval = setInterval(() => {
      calculateLiveDuration(rapor);
    }, 30000); // 30 saniyede bir güncelle
    
    return () => clearInterval(interval);
  }, [rapor, calculateLiveDuration]);

  // VERİ ANALİZİ - useCallback ile optimize edildi
  const analyzeData = useCallback((today) => {
    const masaOdemeDetaylari = [];
    const bilardoOdemeDetaylari = [];
    const indirimDetaylari = [];
    const giderDetaylari = [];
    
    try {
      // 1. Masa adisyonlarını analiz et
      const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
      const bugunkuAdisyonlar = adisyonlar.filter(a => {
        try {
          const tarih = new Date(a.tarih || a.acilisZamani || Date.now()).toISOString().split('T')[0];
          return tarih === today;
        } catch {
          return false;
        }
      });
      
      bugunkuAdisyonlar.forEach(adisyon => {
        const odemeDetayi = {
          id: adisyon.id || Date.now().toString(),
          masaNo: adisyon.masaNo || adisyon.masaId || 'Bilinmeyen',
          tutar: parseFloat(adisyon.toplamTutar || adisyon.toplam || 0),
          indirim: parseFloat(adisyon.indirimTutari || adisyon.indirim || 0),
          odemeTuru: adisyon.odemeTuru || 'nakit',
          odemeTipi: adisyon.odemeTipi || 'normal',
          hesabaYaz: adisyon.hesabaYaz || false,
          kapanisZamani: adisyon.kapanisZamani || adisyon.tarih || new Date().toISOString(),
          not: adisyon.not || '',
          durum: adisyon.durum || 'kapandi'
        };
        
        if (odemeDetayi.hesabaYaz) {
          masaOdemeDetaylari.push({
            ...odemeDetayi,
            kategori: 'hesaba_yaz'
          });
        } else if (odemeDetayi.durum === 'kapandi') {
          masaOdemeDetaylari.push(odemeDetayi);
        }
        
        // İndirimleri topla
        if (odemeDetayi.indirim > 0) {
          indirimDetaylari.push({
            id: `indirim_${adisyon.id}`,
            masaNo: odemeDetayi.masaNo,
            tutar: odemeDetayi.indirim,
            aciklama: `Masa ${odemeDetayi.masaNo} indirimi`,
            tarih: odemeDetayi.kapanisZamani
          });
        }
      });
      
      // 2. Bilardo adisyonlarını analiz et
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const bugunkuBilardoAdisyonlar = bilardoAdisyonlar.filter(b => {
        try {
          const tarih = new Date(b.acilisZamani || b.tarih || Date.now()).toISOString().split('T')[0];
          return tarih === today;
        } catch {
          return false;
        }
      });
      
      bugunkuBilardoAdisyonlar.forEach(bilardo => {
        if (bilardo.durum === 'kapandi') {
          const odemeDetayi = {
            id: bilardo.id || `bilardo_${Date.now()}`,
            masaNo: bilardo.masaNo || bilardo.masaId || 'Bilardo',
            tutar: parseFloat(bilardo.bilardoUcreti || bilardo.ucret || bilardo.toplam || 0),
            odemeTuru: bilardo.odemeTuru || 'nakit',
            odemeTipi: 'bilardo',
            sure: bilardo.sureDakika || bilardo.sure || 0,
            kapanisZamani: bilardo.kapanisZamani || bilardo.acilisZamani || new Date().toISOString(),
            not: bilardo.not || ''
          };
          
          bilardoOdemeDetaylari.push(odemeDetayi);
        }
      });
      
      // 3. Giderleri analiz et
      const giderData = JSON.parse(localStorage.getItem('mc_giderler') || '[]');
      const bugunkuGiderler = giderData.filter(g => {
        try {
          const tarih = new Date(g.tarih || g.giderTarihi || Date.now()).toISOString().split('T')[0];
          return tarih === today;
        } catch {
          return false;
        }
      });
      
      bugunkuGiderler.forEach(gider => {
        giderDetaylari.push({
          id: gider.id || `gider_${Date.now()}`,
          kategori: gider.kategori || gider.giderTuru || 'Diğer',
          aciklama: gider.aciklama || gider.not || gider.desc || '',
          tutar: parseFloat(gider.miktar || gider.tutar || gider.amount || 0),
          tarih: gider.tarih || gider.giderTarihi || today,
          odemeTuru: gider.odemeTuru || 'nakit',
          belgeNo: gider.belgeNo || giger.documentNo || ''
        });
      });
      
    } catch (error) {
      console.error('Veri analiz hatası:', error);
    }
    
    return { 
      masaOdemeDetaylari, 
      bilardoOdemeDetaylari, 
      indirimDetaylari,
      giderDetaylari 
    };
  }, []);

  useEffect(() => {
    const loadRapor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Gün sonu raporu yükleniyor - ID:', raporId);
        
        let foundRapor = null;
        
        // 1. DOĞRUDAN STORAGE'DAN ARA
        const storageKey = `mycafe_gun_sonu_${raporId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          try {
            foundRapor = JSON.parse(savedData);
            console.log('✅ Rapor bulundu:', foundRapor.id);
          } catch (e) {
            console.warn('❌ JSON parse hatası:', e);
          }
        }
        
        // 2. GÜN SONU LİSTESİNDE ARA
        if (!foundRapor) {
          const gunSonuListesi = JSON.parse(localStorage.getItem('mycafe_gun_sonu_listesi') || '[]');
          
          if (gunSonuListesi.length > 0) {
            foundRapor = gunSonuListesi.find(r => r.id === raporId) || gunSonuListesi[0];
          }
        }
        
        // 3. SON ÇARE: Bugünün tarihini kullan
        if (!foundRapor) {
          const today = new Date().toISOString().split('T')[0];
          foundRapor = {
            id: `rapor_${Date.now()}`,
            tarih: today,
            baslangicZamani: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(), // Sabah 08:00
            bitisZamani: new Date().toISOString(),
            olusturulmaTarihi: new Date().toISOString()
          };
          console.log('⚠️  Rapor bulunamadı, yeni rapor oluşturuldu:', foundRapor.id);
        }
        
        if (foundRapor) {
          // Tarih filtresini rapor tarihine ayarla
          const reportDate = foundRapor.tarih || new Date().toISOString().split('T')[0];
          setTarihFiltresi(reportDate);
          
          // Masa, Bilardo, Gider ve İndirimleri analiz et
          const { 
            masaOdemeDetaylari, 
            bilardoOdemeDetaylari, 
            indirimDetaylari,
            giderDetaylari 
          } = analyzeData(reportDate);
          
          setMasaOdemeleri(masaOdemeDetaylari);
          setBilardoOdemeleri(bilardoOdemeDetaylari);
          setIndirimler(indirimDetaylari);
          setGiderler(giderDetaylari);
          setFiltrelenmisMasaOdemeleri(masaOdemeDetaylari);
          setFiltrelenmisBilardoOdemeleri(bilardoOdemeDetaylari);
          
          // Canlı süreyi hesapla
          calculateLiveDuration(foundRapor);
          
          // Raporu formatla
          const enhancedRapor = {
            id: foundRapor.id || raporId || `rapor_${Date.now()}`,
            tarih: foundRapor.tarih || reportDate,
            baslangicZamani: foundRapor.baslangicZamani || new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            bitisZamani: foundRapor.bitisZamani || new Date().toISOString(),
            olusturulmaTarihi: foundRapor.olusturulmaTarihi || new Date().toISOString(),
            ...foundRapor
          };
          
          setRapor(enhancedRapor);
        } else {
          setError(`Rapor bulunamadı (ID: ${raporId})`);
        }
      } catch (err) {
        console.error('Rapor yükleme hatası:', err);
        setError('Rapor yüklenirken hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRapor();
  }, [raporId, analyzeData, calculateLiveDuration]);

  // Tarih filtresi değiştiğinde
  useEffect(() => {
    if (tarihFiltresi && masaOdemeleri.length > 0) {
      const filteredMasalar = masaOdemeleri.filter(odeme => {
        try {
          const odemeTarihi = new Date(odeme.kapanisZamani).toISOString().split('T')[0];
          return odemeTarihi === tarihFiltresi;
        } catch {
          return false;
        }
      });
      
      const filteredBilardo = bilardoOdemeleri.filter(odeme => {
        try {
          const odemeTarihi = new Date(odeme.kapanisZamani).toISOString().split('T')[0];
          return odemeTarihi === tarihFiltresi;
        } catch {
          return false;
        }
      });
      
      setFiltrelenmisMasaOdemeleri(filteredMasalar);
      setFiltrelenmisBilardoOdemeleri(filteredBilardo);
    } else {
      setFiltrelenmisMasaOdemeleri(masaOdemeleri);
      setFiltrelenmisBilardoOdemeleri(bilardoOdemeleri);
    }
  }, [tarihFiltresi, masaOdemeleri, bilardoOdemeleri]);

  // Ödeme türlerine göre toplam hesapla
  const calculatePaymentTotals = (odemeler) => {
    const totals = {
      nakit: 0,
      kredi_karti: 0,
      havale_eft: 0,
      hesaba_yaz: 0,
      diger: 0
    };
    
    odemeler.forEach(odeme => {
      if (odeme.hesabaYaz) {
        totals.hesaba_yaz += odeme.tutar;
      } else {
        switch (odeme.odemeTuru) {
          case 'nakit':
          case 'cash':
            totals.nakit += odeme.tutar;
            break;
          case 'kredi_karti':
          case 'kredi':
          case 'credit_card':
            totals.kredi_karti += odeme.tutar;
            break;
          case 'havale':
          case 'eft':
          case 'havale_eft':
            totals.havale_eft += odeme.tutar;
            break;
          default:
            totals.diger += odeme.tutar;
        }
      }
    });
    
    return totals;
  };

  const handleTarihFiltresiChange = (e) => {
    setTarihFiltresi(e.target.value);
  };

  const tumTarihleriGoster = () => {
    setTarihFiltresi('');
  };

  const handleBack = () => {
    navigate('/raporlar');
  };

  // Toplam hesaplamalar
  const masaPaymentTotals = calculatePaymentTotals(filtrelenmisMasaOdemeleri);
  const toplamMasaGeliri = filtrelenmisMasaOdemeleri.reduce((sum, o) => sum + o.tutar, 0);
  const toplamBilardoGeliri = filtrelenmisBilardoOdemeleri.reduce((sum, o) => sum + o.tutar, 0);
  const toplamIndirim = indirimler.reduce((sum, i) => sum + i.tutar, 0);
  const toplamGider = giderler.reduce((sum, g) => sum + g.tutar, 0);

  // Ödeme türleri toplamı
  const toplamNakit = masaPaymentTotals.nakit;
  const toplamKredi = masaPaymentTotals.kredi_karti;
  const toplamHavaleEft = masaPaymentTotals.havale_eft;
  const toplamHesabaYaz = masaPaymentTotals.hesaba_yaz;

  // Net kâr hesapla
  const brutKar = toplamMasaGeliri + toplamBilardoGeliri - toplamIndirim;
  const netKar = brutKar - toplamGider;
  const toplamCiro = toplamMasaGeliri + toplamBilardoGeliri;

  // Tarih formatı
  const formatDate = (dateString) => {
    if (!dateString) return 'BİLİNMİYOR';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'BİLİNMİYOR';
    }
  };

  // Saat formatı
  const formatTime = (dateString) => {
    if (!dateString) return 'BİLİNMİYOR';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'BİLİNMİYOR';
    }
  };

  if (loading) {
    return (
      <div className="gun-sonu-detay-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
            RAPOR YÜKLENİYOR...
          </p>
        </div>
      </div>
    );
  }

  if (error || !rapor) {
    return (
      <div className="gun-sonu-detay-container">
        <div className="error-container">
          <h2>⚠️ RAPOR BULUNAMADI</h2>
          <p>{error || `ID: ${raporId} ile rapor bulunamadı.`}</p>
          <button 
            onClick={handleBack} 
            style={{
              padding: '15px 30px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            ← RAPORLARA GERİ DÖN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gun-sonu-detay-container">
      {/* ÜST PANEL - Gün Sonu Raporu ve Tarih Filtresi */}
      <div className="top-panel">
        <div className="top-panel-content">
          <div className="panel-title">
            <h1>📊 GÜN SONU RAPORU</h1>
            <div className="report-date">
              <span>📅 TARİH: {formatDate(rapor.tarih)}</span>
              <span>🆔 RAPOR ID: {rapor.id.substring(0, 8)}...</span>
            </div>
          </div>
          
          <div className="date-filter-section">
            <div className="filter-header">
              <h2>🔍 TARİH FİLTRESİ</h2>
              <div className="filter-controls">
                <input
                  type="date"
                  value={tarihFiltresi}
                  onChange={handleTarihFiltresiChange}
                  className="date-filter-input"
                />
                <button onClick={tumTarihleriGoster} className="show-all-button">
                  📋 TÜM TARİHLERİ GÖSTER
                </button>
              </div>
              <div className="filter-info">
                {tarihFiltresi ? (
                  <span className="active-filter">
                    ✅ FİLTRE AKTİF: {formatDate(tarihFiltresi)}
                  </span>
                ) : (
                  <span className="all-dates">📅 TÜM TARİHLER GÖSTERİLİYOR</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANLI SÜRE BİLGİLERİ */}
      <div className="duration-info">
        <div className="duration-card">
          <span className="duration-label">⏰ BAŞLANGIÇ ZAMANI</span>
          <span className="duration-value">
            {baslangicZamani ? formatTime(baslangicZamani) : 'BİLİNMİYOR'}
          </span>
        </div>
        
        <div className="duration-card">
          <span className="duration-label">🏁 BİTİŞ ZAMANI</span>
          <span className="duration-value">
            {bitisZamani ? formatTime(bitisZamani) : 'BİLİNMİYOR'}
          </span>
        </div>
        
        <div className="duration-card live">
          <span className="duration-label">⏱️ CANLI ÇALIŞMA SÜRESİ</span>
          <span className="duration-value highlight">
            {canliSure.saat} SAAT {canliSure.dakika} DAKİKA
          </span>
        </div>
      </div>

      {/* GÜNLÜK ÖZET - Güncellenmiş */}
      <div className="section">
        <h2 className="section-title">📊 GÜNLÜK ÖZET</h2>
        <div className="summary-grid">
          <div className="summary-card primary">
            <div className="summary-label">TOPLAM CİRO</div>
            <div className="summary-value">{toplamCiro.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="summary-card success">
            <div className="summary-label">NET KÂR</div>
            <div className="summary-value">{netKar.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="summary-card warning">
            <div className="summary-label">TOPLAM GİDER</div>
            <div className="summary-value">{toplamGider.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="summary-card info">
            <div className="summary-label">BRÜT KÂR</div>
            <div className="summary-value">{brutKar.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
      </div>

      {/* Detaylı Dağılım */}
      <div className="section">
        <h2 className="section-title">📈 DETAYLI DAĞILIM</h2>
        <div className="distribution-grid">
          <div className="detail-card">
            <h3>💰 MASALAR</h3>
            <div className="detail-value">{toplamMasaGeliri.toLocaleString('tr-TR')} ₺</div>
            <div className="detail-count">{filtrelenmisMasaOdemeleri.length} ADİSYON</div>
          </div>
          
          <div className="detail-card">
            <h3>🎱 BİLARDO</h3>
            <div className="detail-value">{toplamBilardoGeliri.toLocaleString('tr-TR')} ₺</div>
            <div className="detail-count">{filtrelenmisBilardoOdemeleri.length} ADİSYON</div>
          </div>
          
          <div className="detail-card">
            <h3>🎁 İNDİRİMLER</h3>
            <div className="detail-value negative">{toplamIndirim.toLocaleString('tr-TR')} ₺</div>
            <div className="detail-count">{indirimler.length} İNDİRİM</div>
          </div>
          
          <div className="detail-card">
            <h3>💸 GİDERLER</h3>
            <div className="detail-value expense">{toplamGider.toLocaleString('tr-TR')} ₺</div>
            <div className="detail-count">{giderler.length} GİDER</div>
          </div>
        </div>
      </div>

      {/* Ödeme Türleri */}
      <div className="section">
        <h2 className="section-title">💳 ÖDEME TÜRLERİ</h2>
        <div className="payment-types-grid">
          <div className="payment-card cash">
            <div className="payment-label">💵 NAKİT</div>
            <div className="payment-value">{toplamNakit.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="payment-card credit">
            <div className="payment-label">💳 KREDİ KARTI</div>
            <div className="payment-value">{toplamKredi.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="payment-card transfer">
            <div className="payment-label">🏦 HAVALE/EFT</div>
            <div className="payment-value">{toplamHavaleEft.toLocaleString('tr-TR')} ₺</div>
          </div>
          <div className="payment-card account">
            <div className="payment-label">📝 HESABA YAZ</div>
            <div className="payment-value">{toplamHesabaYaz.toLocaleString('tr-TR')} ₺</div>
            <div className="payment-note">(CİRO'YA DAHİL DEĞİL)</div>
          </div>
        </div>
      </div>

      {/* Giderler Detay Tablosu */}
      {giderler.length > 0 && (
        <div className="section expense-section">
          <h2 className="section-title expense">💸 GİDER DETAYLARI</h2>
          <div className="table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>KATEGORİ</th>
                  <th>AÇIKLAMA</th>
                  <th>TUTAR</th>
                  <th>ÖDEME TÜRÜ</th>
                  <th>BELGE NO</th>
                  <th>TARİH</th>
                </tr>
              </thead>
              <tbody>
                {giderler.map((gider) => (
                  <tr key={gider.id}>
                    <td>
                      <span className="expense-category">{gider.kategori.toUpperCase()}</span>
                    </td>
                    <td className="expense-desc">{gider.aciklama}</td>
                    <td className="expense-amount">{gider.tutar.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <span className={`payment-badge ${gider.odemeTuru}`}>
                        {gider.odemeTuru === 'nakit' ? '💵 NAKİT' : 
                         gider.odemeTuru === 'kredi_karti' ? '💳 KREDİ KARTI' : 
                         gider.odemeTuru === 'havale_eft' ? '🏦 HAVALE/EFT' : 
                         gider.odemeTuru.toUpperCase()}
                      </span>
                    </td>
                    <td>{gider.belgeNo || '-'}</td>
                    <td>{formatDate(gider.tarih)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'right', fontWeight: '900', padding: '20px' }}>
                    🏁 TOPLAM GİDER: {toplamGider.toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Masa ve Bilardo Ödemeleri */}
      <div className="section">
        <h2 className="section-title">📋 MASA VE BİLARDO ÖDEMELERİ</h2>
        
        {/* Masa Ödemeleri Tablosu */}
        <div className="payment-table-section">
          <h4>🍽️ MASA ÖDEMELERİ</h4>
          <div className="table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>MASA NO</th>
                  <th>TUTAR</th>
                  <th>ÖDEME TÜRÜ</th>
                  <th>ÖDEME TİPİ</th>
                  <th>KAPANIŞ SAATİ</th>
                  <th>NOT</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisMasaOdemeleri.map((odeme) => (
                  <tr key={odeme.id} className={odeme.hesabaYaz ? 'account-payment' : ''}>
                    <td>{odeme.masaNo}</td>
                    <td>{odeme.tutar.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <span className={`payment-badge ${odeme.odemeTuru}`}>
                        {odeme.odemeTuru === 'nakit' ? '💵 NAKİT' : 
                         odeme.odemeTuru === 'kredi_karti' ? '💳 KREDİ KARTI' : 
                         odeme.odemeTuru === 'havale_eft' ? '🏦 HAVALE/EFT' : 
                         odeme.odemeTuru.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-type-badge ${odeme.odemeTipi}`}>
                        {odeme.odemeTipi.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatTime(odeme.kapanisZamani)}</td>
                    <td className="note-cell">{odeme.not || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'right', fontWeight: '900', padding: '20px' }}>
                    🏁 TOPLAM MASA GELİRİ: {toplamMasaGeliri.toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bilardo Ödemeleri Tablosu */}
        <div className="payment-table-section" style={{ marginTop: '30px' }}>
          <h4>🎱 BİLARDO ÖDEMELERİ</h4>
          <div className="table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>MASA NO</th>
                  <th>TUTAR</th>
                  <th>SÜRE (DK)</th>
                  <th>ÖDEME TÜRÜ</th>
                  <th>KAPANIŞ SAATİ</th>
                  <th>NOT</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisBilardoOdemeleri.map((odeme) => (
                  <tr key={odeme.id}>
                    <td>{odeme.masaNo}</td>
                    <td>{odeme.tutar.toLocaleString('tr-TR')} ₺</td>
                    <td>{odeme.sure}</td>
                    <td>
                      <span className={`payment-badge ${odeme.odemeTuru}`}>
                        {odeme.odemeTuru === 'nakit' ? '💵 NAKİT' : 
                         odeme.odemeTuru === 'kredi_karti' ? '💳 KREDİ KARTI' : 
                         odeme.odemeTuru === 'havale_eft' ? '🏦 HAVALE/EFT' : 
                         odeme.odemeTuru.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatTime(odeme.kapanisZamani)}</td>
                    <td className="note-cell">{odeme.not || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'right', fontWeight: '900', padding: '20px' }}>
                    🏁 TOPLAM BİLARDO GELİRİ: {toplamBilardoGeliri.toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* İndirimler */}
      {indirimler.length > 0 && (
        <div className="section discount-section">
          <h2 className="section-title discount">🎁 İNDİRİMLER</h2>
          <div className="discount-grid">
            {indirimler.map((indirim) => (
              <div key={indirim.id} className="discount-item">
                <div className="discount-masa">MASA {indirim.masaNo}</div>
                <div className="discount-amount">{indirim.tutar.toLocaleString('tr-TR')} ₺</div>
                <div className="discount-desc">{indirim.aciklama}</div>
              </div>
            ))}
          </div>
          <div className="discount-total">
            🏁 TOPLAM İNDİRİM: {toplamIndirim.toLocaleString('tr-TR')} ₺
          </div>
        </div>
      )}

      {/* Footer - Özet Bilgiler */}
      <div className="report-footer">
        <div className="footer-summary">
          <div className="summary-item">
            <span className="summary-label">TOPLAM CİRO:</span>
            <span className="summary-value">{toplamCiro.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">MASALAR:</span>
            <span className="summary-value">{toplamMasaGeliri.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">BİLARDO:</span>
            <span className="summary-value">{toplamBilardoGeliri.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">İNDİRİM:</span>
            <span className="summary-value">{toplamIndirim.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">GİDERLER:</span>
            <span className="summary-value expense">{toplamGider.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">NET KÂR:</span>
            <span className="summary-value success">{netKar.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      {/* Geri Dön Butonu (Alt kısımda) */}
      <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '20px' }}>
        <button 
          onClick={handleBack} 
          style={{
            padding: '15px 40px',
            background: '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#34495e'}
          onMouseLeave={(e) => e.target.style.background = '#2c3e50'}
        >
          ← RAPORLARA GERİ DÖN
        </button>
      </div>
    </div>
  );
};

export default GunSonuDetay;