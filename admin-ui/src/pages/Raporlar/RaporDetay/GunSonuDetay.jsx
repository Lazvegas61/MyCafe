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

  // TARİH FORMATI DÖNÜŞTÜRME FONKSİYONLARI
  const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Tarih formatlama hatası:', error, dateString);
      return '';
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return formatDateToYYYYMMDD(today);
  };

  // TARİHİ GÖRÜNTÜ FORMATINA ÇEVİR
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  // VERİ ANALİZİ - DÜZELTİLMİŞ VERSİYON
  const analyzeData = useCallback((searchDate) => {
    console.log('🔍 Veri analizi başlıyor, tarih:', searchDate);
    
    const masaOdemeDetaylari = [];
    const bilardoOdemeDetaylari = [];
    const indirimDetaylari = [];
    const giderDetaylari = [];
    
    try {
      // 1. Masa adisyonlarını analiz et - KAPALI OLANLARI AL
      const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
      console.log('📋 Toplam adisyon sayısı:', adisyonlar.length);
      
      // Tarihe göre filtrele ve KAPALI olanları al
      const tariheGoreAdisyonlar = adisyonlar.filter(a => {
        try {
          // Tarih kontrolü
          const acilisTarihi = a.acilisZamani || a.tarih || Date.now();
          const adisyonTarihi = formatDateToYYYYMMDD(acilisTarihi);
          const tarihEslesti = adisyonTarihi === searchDate;
          
          // Durum kontrolü - SADECE KAPALI OLANLARI AL
          const isKapali = a.kapali === true || 
                          a.durum?.toUpperCase() === "KAPALI" || 
                          a.durum?.toUpperCase() === "KAPATILDI" ||
                          a.durum?.toUpperCase() === "ÖDENDİ";
          
          // Tutar kontrolü - 0'dan büyük olmalı
          const tutar = parseFloat(a.toplamTutar || a.toplam || 0);
          const hasTutar = tutar > 0;
          
          return tarihEslesti && isKapali && hasTutar;
        } catch (error) {
          console.error('Adisyon filtreleme hatası:', error, a);
          return false;
        }
      });
      
      console.log('✅ Tarihe ve duruma göre filtrelenmiş adisyonlar:', tariheGoreAdisyonlar.length);
      
      tariheGoreAdisyonlar.forEach(adisyon => {
        const tutar = parseFloat(adisyon.toplamTutar || adisyon.toplam || 0);
        const indirim = parseFloat(adisyon.indirimTutari || adisyon.indirim || 0);
        
        const odemeDetayi = {
          id: adisyon.id || `adisyon_${Date.now()}_${Math.random()}`,
          masaNo: adisyon.masaNo || adisyon.masaId || 'Bilinmeyen',
          masaNum: adisyon.masaNum || '0',
          tutar: tutar,
          indirim: indirim,
          odemeTuru: adisyon.odemeTuru || 'nakit',
          odemeTipi: adisyon.odemeTipi || 'normal',
          hesabaYaz: adisyon.hesabaYaz || false,
          kapanisZamani: adisyon.kapanisZamani || adisyon.tarih || new Date().toISOString(),
          not: adisyon.not || '',
          durum: adisyon.durum || 'kapandi',
          acilisZamani: adisyon.acilisZamani
        };
        
        // Hesaba yazılanlar ayrı kategori, diğerleri normal ödeme
        if (odemeDetayi.hesabaYaz) {
          masaOdemeDetaylari.push({
            ...odemeDetayi,
            kategori: 'hesaba_yaz'
          });
        } else {
          masaOdemeDetaylari.push(odemeDetayi);
        }
        
        // İndirimleri topla
        if (indirim > 0) {
          indirimDetaylari.push({
            id: `indirim_${adisyon.id}`,
            masaNo: odemeDetayi.masaNo,
            tutar: indirim,
            aciklama: `Masa ${odemeDetayi.masaNo} indirimi`,
            tarih: odemeDetayi.kapanisZamani
          });
        }
      });
      
      console.log('💰 Masa ödeme detayları:', masaOdemeDetaylari.length);
      console.log('🎁 İndirimler:', indirimDetaylari.length);
      
      // 2. Bilardo adisyonlarını analiz et - KAPALI OLANLARI AL
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      console.log('🎱 Toplam bilardo adisyonu:', bilardoAdisyonlar.length);
      
      const tariheGoreBilardoAdisyonlar = bilardoAdisyonlar.filter(b => {
        try {
          const acilisTarihi = b.acilisZamani || b.tarih || Date.now();
          const bilardoTarihi = formatDateToYYYYMMDD(acilisTarihi);
          const tarihEslesti = bilardoTarihi === searchDate;
          
          // SADECE KAPALI BİLARDO ADISYONLARI
          const isKapali = b.kapali === true || 
                          b.durum?.toUpperCase() === "KAPALI" || 
                          b.durum?.toUpperCase() === "KAPATILDI";
          
          // Tutar kontrolü
          const tutar = parseFloat(b.bilardoUcreti || b.ucret || b.toplam || 0);
          const hasTutar = tutar > 0;
          
          return tarihEslesti && isKapali && hasTutar;
        } catch (error) {
          console.error('Bilardo filtreleme hatası:', error, b);
          return false;
        }
      });
      
      console.log('✅ Tarihe göre filtrelenmiş bilardo adisyonları:', tariheGoreBilardoAdisyonlar.length);
      
      tariheGoreBilardoAdisyonlar.forEach(bilardo => {
        const tutar = parseFloat(bilardo.bilardoUcreti || bilardo.ucret || bilardo.toplam || 0);
        
        const odemeDetayi = {
          id: bilardo.id || `bilardo_${Date.now()}_${Math.random()}`,
          masaNo: bilardo.masaNo || bilardo.masaId || 'Bilardo',
          tutar: tutar,
          odemeTuru: bilardo.odemeTuru || 'nakit',
          odemeTipi: 'bilardo',
          sure: bilardo.sureDakika || bilardo.sure || 0,
          kapanisZamani: bilardo.kapanisZamani || bilardo.acilisZamani || new Date().toISOString(),
          not: bilardo.not || '',
          acilisZamani: bilardo.acilisZamani
        };
        
        bilardoOdemeDetaylari.push(odemeDetayi);
      });
      
      console.log('🎱 Bilardo ödeme detayları:', bilardoOdemeDetaylari.length);
      
      // 3. Giderleri analiz et
      const giderData = JSON.parse(localStorage.getItem('mc_giderler') || '[]');
      console.log('💸 Toplam gider kaydı:', giderData.length);
      
      const tariheGoreGiderler = giderData.filter(g => {
        try {
          const giderTarihi = formatDateToYYYYMMDD(g.tarih || g.giderTarihi || Date.now());
          return giderTarihi === searchDate;
        } catch (error) {
          console.error('Gider filtreleme hatası:', error, g);
          return false;
        }
      });
      
      console.log('✅ Tarihe göre filtrelenmiş giderler:', tariheGoreGiderler.length);
      
      tariheGoreGiderler.forEach(gider => {
        const tutar = parseFloat(gider.miktar || gider.tutar || gider.amount || 0);
        
        giderDetaylari.push({
          id: gider.id || `gider_${Date.now()}_${Math.random()}`,
          kategori: gider.kategori || gider.giderTuru || 'Diğer',
          aciklama: gider.aciklama || gider.not || gider.desc || '',
          tutar: tutar,
          tarih: gider.tarih || gider.giderTarihi || searchDate,
          odemeTuru: gider.odemeTuru || 'nakit',
          belgeNo: gider.belgeNo || gider.documentNo || ''
        });
      });
      
      console.log('💸 Gider detayları:', giderDetaylari.length);
      
      // DEBUG: Tüm verileri konsola yaz
      console.log('📊 ANALİZ SONUÇLARI:', {
        searchDate: searchDate,
        masaOdemeleri: masaOdemeDetaylari.length,
        bilardoOdemeleri: bilardoOdemeDetaylari.length,
        indirimler: indirimDetaylari.length,
        giderler: giderDetaylari.length,
        masaOdemeleriDetay: masaOdemeDetaylari.map(o => ({
          masaNo: o.masaNo,
          tutar: o.tutar,
          odemeTuru: o.odemeTuru
        })),
        bilardoOdemeleriDetay: bilardoOdemeDetaylari.map(o => ({
          masaNo: o.masaNo,
          tutar: o.tutar
        }))
      });
      
    } catch (error) {
      console.error('❌ Veri analiz hatası:', error);
    }
    
    return { 
      masaOdemeDetaylari, 
      bilardoOdemeDetaylari, 
      indirimDetaylari,
      giderDetaylari 
    };
  }, []);

  // CANLI SÜRE HESAPLAMA
  const calculateLiveDuration = useCallback((raporData) => {
    if (!raporData) return;
    
    const baslangic = raporData.baslangicZamani ? new Date(raporData.baslangicZamani) : new Date();
    const bitis = raporData.bitisZamani ? new Date(raporData.bitisZamani) : new Date();
    
    setBaslangicZamani(baslangic);
    setBitisZamani(bitis);
    
    const farkMs = bitis - baslangic;
    const saat = Math.floor(farkMs / 3600000);
    const dakika = Math.floor((farkMs % 3600000) / 60000);
    
    setCanliSure({ saat, dakika });
  }, []);

  // CANLI SÜRE GÜNCELLEME
  useEffect(() => {
    if (!rapor) return;
    
    const interval = setInterval(() => {
      calculateLiveDuration(rapor);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [rapor, calculateLiveDuration]);

  // RAPOR YÜKLEME
  useEffect(() => {
    const loadRapor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Gün sonu raporu yükleniyor - Parametre:', raporId);
        
        let searchDate = '';
        
        // PARAMETRE KONTROLÜ
        if (raporId === 'today' || !raporId) {
          // BUGÜNÜN RAPORU
          searchDate = getTodayDate();
          console.log('📅 Bugünün raporu aranıyor:', searchDate);
        } else if (raporId.includes('-') || raporId.includes('.')) {
          // TARİH FORMATINDA PARAMETRE
          searchDate = formatDateToYYYYMMDD(raporId);
          console.log('📅 Tarih parametresine göre aranıyor:', searchDate);
        } else {
          // DİĞER ID'LER (eski format)
          searchDate = getTodayDate();
          console.log('📅 Eski ID formatı, bugünün raporu aranıyor:', searchDate);
        }
        
        // Tarih filtresini ayarla
        setTarihFiltresi(searchDate);
        
        // Verileri analiz et
        const { 
          masaOdemeDetaylari, 
          bilardoOdemeDetaylari, 
          indirimDetaylari,
          giderDetaylari 
        } = analyzeData(searchDate);
        
        setMasaOdemeleri(masaOdemeDetaylari);
        setBilardoOdemeleri(bilardoOdemeDetaylari);
        setIndirimler(indirimDetaylari);
        setGiderler(giderDetaylari);
        setFiltrelenmisMasaOdemeleri(masaOdemeDetaylari);
        setFiltrelenmisBilardoOdemeleri(bilardoOdemeDetaylari);
        
        // Gün sonu raporu oluştur
        const enhancedRapor = {
          id: raporId || `rapor_${Date.now()}`,
          tarih: searchDate,
          baslangicZamani: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
          bitisZamani: new Date().toISOString(),
          olusturulmaTarihi: new Date().toISOString(),
        };
        
        setRapor(enhancedRapor);
        calculateLiveDuration(enhancedRapor);
        
        console.log('✅ Rapor yüklendi:', {
          tarih: searchDate,
          masaOdemeleri: masaOdemeDetaylari.length,
          bilardoOdemeleri: bilardoOdemeDetaylari.length,
          giderler: giderDetaylari.length,
          indirimler: indirimDetaylari.length
        });
        
      } catch (err) {
        console.error('❌ Rapor yükleme hatası:', err);
        setError('Rapor yüklenirken hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRapor();
  }, [raporId, analyzeData, calculateLiveDuration]);

  // Tarih filtresi değiştiğinde
  useEffect(() => {
    if (tarihFiltresi) {
      console.log('🔄 Tarih filtresi değişti:', tarihFiltresi);
      
      const { 
        masaOdemeDetaylari, 
        bilardoOdemeDetaylari 
      } = analyzeData(tarihFiltresi);
      
      setFiltrelenmisMasaOdemeleri(masaOdemeDetaylari);
      setFiltrelenmisBilardoOdemeleri(bilardoOdemeDetaylari);
    }
  }, [tarihFiltresi, analyzeData]);

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
    setFiltrelenmisMasaOdemeleri(masaOdemeleri);
    setFiltrelenmisBilardoOdemeleri(bilardoOdemeleri);
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

  // DEBUG: Verileri kontrol et
  useEffect(() => {
    console.log('📊 PANEL VERİLERİ:', {
      masaOdemeleri: masaOdemeleri.length,
      bilardoOdemeleri: bilardoOdemeleri.length,
      giderler: giderler.length,
      indirimler: indirimler.length,
      tarihFiltresi: tarihFiltresi,
      toplamMasaGeliri: toplamMasaGeliri,
      toplamBilardoGeliri: toplamBilardoGeliri,
      toplamGider: toplamGider,
      toplamIndirim: toplamIndirim
    });
  }, [masaOdemeleri, bilardoOdemeleri, giderler, indirimler, tarihFiltresi]);

  if (loading) {
    return (
      <div className="gun-sonu-detay-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
            RAPOR YÜKLENİYOR...
          </p>
          <p style={{ color: '#666', marginTop: '10px' }}>
            Tarih: {tarihFiltresi ? formatDisplayDate(tarihFiltresi) : 'Bugün'}
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
          <p>{error || `Parametre: ${raporId} ile rapor bulunamadı.`}</p>
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8d7da', borderRadius: '8px' }}>
            <h4>🔍 DEBUG Bilgileri:</h4>
            <p>Tarih Filtresi: {tarihFiltresi}</p>
            <p>Masa Ödemeleri: {masaOdemeleri.length}</p>
            <p>Bilardo Ödemeleri: {bilardoOdemeleri.length}</p>
            <p>Giderler: {giderler.length}</p>
            <p>İndirimler: {indirimler.length}</p>
          </div>
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
      {/* ÜST PANEL */}
      <div className="top-panel">
        <div className="top-panel-content">
          <div className="panel-title">
            <h1>📊 GÜN SONU RAPORU</h1>
            <div className="report-date">
              <span>📅 TARİH: {formatDisplayDate(rapor.tarih)}</span>
              <span>🕒 SAAT: {new Date().toLocaleTimeString('tr-TR')}</span>
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
                    ✅ FİLTRE AKTİF: {formatDisplayDate(tarihFiltresi)}
                  </span>
                ) : (
                  <span className="all-dates">📅 TÜM TARİHLER GÖSTERİLİYOR</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEBUG PANEL (Geliştirme için) */}
      <div style={{
        margin: '10px 0',
        padding: '10px',
        background: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '12px',
        border: '1px solid #90caf9'
      }}>
        <strong>🔍 DEBUG:</strong> Masa: {masaOdemeleri.length} | Bilardo: {bilardoOdemeleri.length} | 
        Gider: {giderler.length} | İndirim: {indirimler.length} | 
        Toplam: {(toplamMasaGeliri + toplamBilardoGeliri).toFixed(2)} ₺
      </div>

      {/* CANLI SÜRE BİLGİLERİ */}
      <div className="duration-info">
        <div className="duration-card">
          <span className="duration-label">⏰ BAŞLANGIÇ ZAMANI</span>
          <span className="duration-value">
            {baslangicZamani ? formatTime(baslangicZamani) : '08:00:00'}
          </span>
        </div>
        
        <div className="duration-card">
          <span className="duration-label">🏁 BİTİŞ ZAMANI</span>
          <span className="duration-value">
            {bitisZamani ? formatTime(bitisZamani) : formatTime(new Date())}
          </span>
        </div>
        
        <div className="duration-card live">
          <span className="duration-label">⏱️ ÇALIŞMA SÜRESİ</span>
          <span className="duration-value highlight">
            {canliSure.saat} SAAT {canliSure.dakika} DAKİKA
          </span>
        </div>
      </div>

      {/* GÜNLÜK ÖZET */}
      <div className="section">
        <h2 className="section-title">📊 GÜNLÜK ÖZET</h2>
        <div className="summary-grid">
          <div className="summary-card primary">
            <div className="summary-label">TOPLAM CİRO</div>
            <div className="summary-value">{toplamCiro.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="summary-subtitle">
              {masaOdemeleri.length + bilardoOdemeleri.length} Adisyon
            </div>
          </div>
          <div className="summary-card success">
            <div className="summary-label">NET KÂR</div>
            <div className="summary-value">{netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="summary-subtitle" style={{ color: netKar >= 0 ? '#10b981' : '#ef4444' }}>
              {netKar >= 0 ? '🔼 Kârlı' : '🔻 Zarar'}
            </div>
          </div>
          <div className="summary-card warning">
            <div className="summary-label">TOPLAM GİDER</div>
            <div className="summary-value">{toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="summary-subtitle">{giderler.length} Kayıt</div>
          </div>
          <div className="summary-card info">
            <div className="summary-label">BRÜT KÂR</div>
            <div className="summary-value">{brutKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="summary-subtitle">Ciro - İndirim</div>
          </div>
        </div>
      </div>

      {/* Detaylı Dağılım */}
      <div className="section">
        <h2 className="section-title">📈 DETAYLI DAĞILIM</h2>
        <div className="distribution-grid">
          <div className="detail-card">
            <h3>💰 MASALAR</h3>
            <div className="detail-value">{toplamMasaGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="detail-count">{filtrelenmisMasaOdemeleri.length} ADISYON</div>
            <div className="detail-sub">Nakit: {(toplamNakit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          </div>
          
          <div className="detail-card">
            <h3>🎱 BİLARDO</h3>
            <div className="detail-value">{toplamBilardoGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="detail-count">{filtrelenmisBilardoOdemeleri.length} ADISYON</div>
            <div className="detail-sub">Toplam Süre: {filtrelenmisBilardoOdemeleri.reduce((sum, o) => sum + (o.sure || 0), 0)} dk</div>
          </div>
          
          <div className="detail-card">
            <h3>🎁 İNDİRİMLER</h3>
            <div className="detail-value negative">{toplamIndirim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="detail-count">{indirimler.length} İNDİRİM</div>
            <div className="detail-sub">Ortalama: {(toplamIndirim / (indirimler.length || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          </div>
          
          <div className="detail-card">
            <h3>💸 GİDERLER</h3>
            <div className="detail-value expense">{toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="detail-count">{giderler.length} GİDER</div>
            <div className="detail-sub">Ortalama: {(toplamGider / (giderler.length || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          </div>
        </div>
      </div>

      {/* Ödeme Türleri */}
      <div className="section">
        <h2 className="section-title">💳 ÖDEME TÜRLERİ</h2>
        <div className="payment-types-grid">
          <div className="payment-card cash">
            <div className="payment-label">💵 NAKİT</div>
            <div className="payment-value">{toplamNakit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="payment-percentage">
              {toplamCiro > 0 ? ((toplamNakit / toplamCiro) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="payment-card credit">
            <div className="payment-label">💳 KREDİ KARTI</div>
            <div className="payment-value">{toplamKredi.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="payment-percentage">
              {toplamCiro > 0 ? ((toplamKredi / toplamCiro) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="payment-card transfer">
            <div className="payment-label">🏦 HAVALE/EFT</div>
            <div className="payment-value">{toplamHavaleEft.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            <div className="payment-percentage">
              {toplamCiro > 0 ? ((toplamHavaleEft / toplamCiro) * 100).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="payment-card account">
            <div className="payment-label">📝 HESABA YAZ</div>
            <div className="payment-value">{toplamHesabaYaz.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
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
                    <td className="expense-amount">{gider.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
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
                    🏁 TOPLAM GİDER: {toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
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
        {filtrelenmisMasaOdemeleri.length > 0 ? (
          <div className="payment-table-section">
            <h4>🍽️ MASA ÖDEMELERİ ({filtrelenmisMasaOdemeleri.length} Adisyon)</h4>
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
                      <td>{odeme.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
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
                          {odeme.hesabaYaz ? '📝 HESABA YAZ' : odeme.odemeTipi.toUpperCase()}
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
                      🏁 TOPLAM MASA GELİRİ: {toplamMasaGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <h4>Masa Ödemesi Bulunamadı</h4>
            <p>Bu tarihte kapatılmış masa adisyonu bulunmuyor.</p>
          </div>
        )}

        {/* Bilardo Ödemeleri Tablosu */}
        {filtrelenmisBilardoOdemeleri.length > 0 ? (
          <div className="payment-table-section" style={{ marginTop: '30px' }}>
            <h4>🎱 BİLARDO ÖDEMELERİ ({filtrelenmisBilardoOdemeleri.length} Adisyon)</h4>
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
                      <td>{odeme.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
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
                      🏁 TOPLAM BİLARDO GELİRİ: {toplamBilardoGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎱</div>
            <h4>Bilardo Ödemesi Bulunamadı</h4>
            <p>Bu tarihte kapatılmış bilardo adisyonu bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* İndirimler */}
      {indirimler.length > 0 && (
        <div className="section discount-section">
          <h2 className="section-title discount">🎁 İNDİRİMLER</h2>
          <div className="discount-grid">
            {indirimler.map((indirim) => (
              <div key={indirim.id} className="discount-item">
                <div className="discount-masa">MASA {indirim.masaNo}</div>
                <div className="discount-amount">{indirim.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                <div className="discount-desc">{indirim.aciklama}</div>
              </div>
            ))}
          </div>
          <div className="discount-total">
            🏁 TOPLAM İNDİRİM: {toplamIndirim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
        </div>
      )}

      {/* Footer - Özet Bilgiler */}
      <div className="report-footer">
        <div className="footer-summary">
          <div className="summary-item">
            <span className="summary-label">TOPLAM CİRO:</span>
            <span className="summary-value">{toplamCiro.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">MASALAR:</span>
            <span className="summary-value">{toplamMasaGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">BİLARDO:</span>
            <span className="summary-value">{toplamBilardoGeliri.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">İNDİRİM:</span>
            <span className="summary-value">{toplamIndirim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">GİDERLER:</span>
            <span className="summary-value expense">{toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">NET KÂR:</span>
            <span className="summary-value success">{netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
        </div>
      </div>

      {/* Geri Dön Butonu */}
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