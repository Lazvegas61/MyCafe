// /src/pages/Bilardo/BilardoAdisyonDetay.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BilardoAdisyonDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [masa, setMasa] = useState(null);
  const [adisyon, setAdisyon] = useState(null);
  const [bilardoSaat, setBilardoSaat] = useState(1);
  const [ekUrunler, setEkUrunler] = useState([]);
  const [seciliUrun, setSeciliUrun] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [toplamTutar, setToplamTutar] = useState(0);

  // Bilardo saat ücreti
  const BILARDO_SAAT_UCRETI = 50;

  // Masa ve adisyon bilgilerini yükle
  useEffect(() => {
    const masalar = JSON.parse(localStorage.getItem('mc_masalar') || '[]');
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem('mc_bilardo_adisyonlar') || '[]');
    const urunlerData = JSON.parse(localStorage.getItem('mc_urunler') || '[]');
    
    // Masa bilgisini bul (bilardo masaları 101-110 arası)
    const masaBul = masalar.find(m => 
      m.id === parseInt(id) || m.no === id.toString()
    );
    
    // Eğer masa bulunamazsa, bilardo masası oluştur
    if (!masaBul) {
      const yeniMasa = {
        id: parseInt(id) || 101,
        no: id.toString().startsWith('B') ? id : `B${id}`,
        adisyonId: null,
        toplamTutar: "0.00",
        acilisZamani: new Date().toISOString(),
        durum: "DOLU",
        renk: "kirmizi",
        musteriAdi: null,
        kisiSayisi: null,
        guncellemeZamani: new Date().toISOString(),
        tur: "BİLARDO"
      };
      
      // Masayı kaydet
      const guncelMasalar = [...masalar.filter(m => m.id !== yeniMasa.id), yeniMasa];
      localStorage.setItem('mc_masalar', JSON.stringify(guncelMasalar));
      setMasa(yeniMasa);
    } else {
      setMasa(masaBul);
      
      // Bu masa için aktif adisyon var mı kontrol et
      const aktifAdisyon = bilardoAdisyonlar.find(a => 
        a.masaId === masaBul.id && a.durum === 'AKTİF'
      );
      
      if (aktifAdisyon) {
        setAdisyon(aktifAdisyon);
        setBilardoSaat(aktifAdisyon.bilardoSaat || 1);
        setEkUrunler(aktifAdisyon.ekUrunler || []);
        setToplamTutar(aktifAdisyon.toplamTutar || 0);
      }
    }
    
    setUrunler(urunlerData);
  }, [id]);

  // Toplam tutarı hesapla
  useEffect(() => {
    const bilardoTutari = bilardoSaat * BILARDO_SAAT_UCRETI;
    const ekUrunlerTutari = ekUrunler.reduce((toplam, urun) => {
      return toplam + (urun.miktar * urun.salePrice);
    }, 0);
    
    const toplam = bilardoTutari + ekUrunlerTutari;
    setToplamTutar(toplam);
  }, [bilardoSaat, ekUrunler]);

  // Ek ürün ekle
  const handleUrunEkle = () => {
    if (!seciliUrun) return;
    
    const urunBul = urunler.find(u => u.id === parseInt(seciliUrun));
    if (!urunBul) return;
    
    const yeniUrun = {
      id: urunBul.id,
      name: urunBul.name,
      salePrice: urunBul.salePrice,
      miktar: 1
    };
    
    // Aynı ürün varsa miktarını arttır
    const urunIndex = ekUrunler.findIndex(u => u.id === yeniUrun.id);
    if (urunIndex > -1) {
      const guncelUrunler = [...ekUrunler];
      guncelUrunler[urunIndex].miktar += 1;
      setEkUrunler(guncelUrunler);
    } else {
      setEkUrunler([...ekUrunler, yeniUrun]);
    }
    
    setSeciliUrun(null);
  };

  // Ürün miktarını güncelle
  const handleMiktarGuncelle = (urunId, yeniMiktar) => {
    if (yeniMiktar < 1) {
      // Ürünü kaldır
      setEkUrunler(ekUrunler.filter(u => u.id !== urunId));
    } else {
      const guncelUrunler = ekUrunler.map(u => {
        if (u.id === urunId) {
          return { ...u, miktar: yeniMiktar };
        }
        return u;
      });
      setEkUrunler(guncelUrunler);
    }
  };

  // Adisyonu kaydet
  const handleKaydet = () => {
    if (!masa) return;
    
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem('mc_bilardo_adisyonlar') || '[]');
    const masalar = JSON.parse(localStorage.getItem('mc_masalar') || '[]');
    
    const yeniAdisyon = {
      id: Date.now(),
      masaId: masa.id,
      masaNo: masa.no,
      bilardoSaat: bilardoSaat,
      ekUrunler: ekUrunler,
      toplamTutar: toplamTutar,
      acilisZamani: new Date().toISOString(),
      durum: 'AKTİF',
      guncellemeZamani: new Date().toISOString()
    };
    
    // Masa durumunu güncelle
    const guncelMasalar = masalar.map(m => {
      if (m.id === masa.id) {
        return {
          ...m,
          adisyonId: yeniAdisyon.id,
          toplamTutar: toplamTutar.toFixed(2),
          durum: 'DOLU',
          renk: 'kirmizi',
          guncellemeZamani: new Date().toISOString()
        };
      }
      return m;
    });
    
    // Eski aktif adisyonu kapat
    const guncelAdisyonlar = bilardoAdisyonlar.map(a => {
      if (a.masaId === masa.id && a.durum === 'AKTİF') {
        return { ...a, durum: 'KAPALI' };
      }
      return a;
    });
    
    // Yeni adisyonu ekle
    guncelAdisyonlar.push(yeniAdisyon);
    
    localStorage.setItem('mc_bilardo_adisyonlar', JSON.stringify(guncelAdisyonlar));
    localStorage.setItem('mc_masalar', JSON.stringify(guncelMasalar));
    
    setAdisyon(yeniAdisyon);
    alert('Bilardo adisyonu kaydedildi!');
  };

  // Adisyonu kapat (ödeme yap)
  const handleOdemeYap = () => {
    if (!adisyon) return;
    
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem('mc_bilardo_adisyonlar') || '[]');
    const masalar = JSON.parse(localStorage.getItem('mc_masalar') || '[]');
    
    // Adisyonu kapat
    const guncelAdisyonlar = bilardoAdisyonlar.map(a => {
      if (a.id === adisyon.id) {
        return {
          ...a,
          durum: 'KAPALI',
          kapanisZamani: new Date().toISOString(),
          odemeDurumu: 'ODENDI'
        };
      }
      return a;
    });
    
    // Masayı boşalt
    const guncelMasalar = masalar.map(m => {
      if (m.id === masa.id) {
        return {
          ...m,
          adisyonId: null,
          toplamTutar: "0.00",
          durum: "BOŞ",
          renk: "gri",
          guncellemeZamani: new Date().toISOString()
        };
      }
      return m;
    });
    
    localStorage.setItem('mc_bilardo_adisyonlar', JSON.stringify(guncelAdisyonlar));
    localStorage.setItem('mc_masalar', JSON.stringify(guncelMasalar));
    
    alert('Ödeme alındı, masa boşaltıldı!');
    navigate('/bilardo');
  };

  // Stiller
  const styles = {
    container: {
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '2px solid #333',
      paddingBottom: '10px'
    },
    backButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    masaBilgisi: {
      backgroundColor: '#2d2d2d',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    bilardoKontrol: {
      backgroundColor: '#2d2d2d',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    saatKontrol: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '15px'
    },
    saatButon: {
      backgroundColor: '#444',
      color: 'white',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '18px'
    },
    saatGosterge: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#4CAF50'
    },
    urunEkleme: {
      backgroundColor: '#2d2d2d',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    urunSelect: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#444',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      marginBottom: '10px'
    },
    ekleButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      width: '100%'
    },
    urunListesi: {
      marginTop: '20px'
    },
    urunItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      backgroundColor: '#444',
      marginBottom: '8px',
      borderRadius: '5px'
    },
    miktarKontrol: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    miktarButon: {
      backgroundColor: '#666',
      color: 'white',
      border: 'none',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      cursor: 'pointer'
    },
    toplamTutar: {
      backgroundColor: '#2d2d2d',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    toplamText: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#4CAF50'
    },
    butonlar: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px'
    },
    kaydetButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '18px',
      flex: 1
    },
    odemeButton: {
      backgroundColor: '#FF9800',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '18px',
      flex: 1
    }
  };

  if (!masa) {
    return <div style={styles.container}>Masa yükleniyor...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Bilardo Adisyonu - {masa.no}</h1>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/bilardo')}
        >
          ← Bilardo Masalarına Dön
        </button>
      </div>

      <div style={styles.masaBilgisi}>
        <h3>Masa Bilgileri</h3>
        <p>Masa No: {masa.no}</p>
        <p>Durum: {masa.durum}</p>
        <p>Açılış Zamanı: {new Date(masa.acilisZamani || Date.now()).toLocaleString()}</p>
      </div>

      <div style={styles.bilardoKontrol}>
        <h3>Bilardo Süresi (Saat: {BILARDO_SAAT_UCRETI} TL)</h3>
        <div style={styles.saatKontrol}>
          <button 
            style={styles.saatButon}
            onClick={() => setBilardoSaat(Math.max(1, bilardoSaat - 1))}
          >
            -
          </button>
          <div style={styles.saatGosterge}>{bilardoSaat} Saat</div>
          <button 
            style={styles.saatButon}
            onClick={() => setBilardoSaat(bilardoSaat + 1)}
          >
            +
          </button>
        </div>
        <p>Bilardo Tutarı: {bilardoSaat * BILARDO_SAAT_UCRETI} TL</p>
      </div>

      <div style={styles.urunEkleme}>
        <h3>Ek Ürünler Ekle</h3>
        <select 
          style={styles.urunSelect}
          value={seciliUrun || ''}
          onChange={(e) => setSeciliUrun(e.target.value)}
        >
          <option value="">Ürün seçin...</option>
          {urunler.map(urun => (
            <option key={urun.id} value={urun.id}>
              {urun.name} - {urun.salePrice} TL
            </option>
          ))}
        </select>
        <button 
          style={styles.ekleButton}
          onClick={handleUrunEkle}
          disabled={!seciliUrun}
        >
          Ürün Ekle
        </button>

        {ekUrunler.length > 0 && (
          <div style={styles.urunListesi}>
            <h4>Eklenen Ürünler:</h4>
            {ekUrunler.map(urun => (
              <div key={urun.id} style={styles.urunItem}>
                <div>
                  <strong>{urun.name}</strong>
                  <br />
                  {urun.salePrice} TL × {urun.miktar} = {urun.salePrice * urun.miktar} TL
                </div>
                <div style={styles.miktarKontrol}>
                  <button 
                    style={styles.miktarButon}
                    onClick={() => handleMiktarGuncelle(urun.id, urun.miktar - 1)}
                  >
                    -
                  </button>
                  <span>{urun.miktar}</span>
                  <button 
                    style={styles.miktarButon}
                    onClick={() => handleMiktarGuncelle(urun.id, urun.miktar + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.toplamTutar}>
        <h3>Toplam Tutar</h3>
        <div style={styles.toplamText}>{toplamTutar.toFixed(2)} TL</div>
        <p>Bilardo: {bilardoSaat * BILARDO_SAAT_UCRETI} TL</p>
        <p>Ek Ürünler: {(toplamTutar - (bilardoSaat * BILARDO_SAAT_UCRETI)).toFixed(2)} TL</p>
      </div>

      <div style={styles.butonlar}>
        <button 
          style={styles.kaydetButton}
          onClick={handleKaydet}
        >
          {adisyon ? 'Adisyonu Güncelle' : 'Adisyonu Kaydet'}
        </button>
        
        <button 
          style={styles.odemeButton}
          onClick={handleOdemeYap}
          disabled={!adisyon}
        >
          Ödeme Al ve Kapat
        </button>
      </div>
    </div>
  );
};

export default BilardoAdisyonDetay;