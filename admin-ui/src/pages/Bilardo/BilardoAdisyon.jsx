// admin-ui/src/pages/Bilardo/BilardoAdisyon.jsx
/* ------------------------------------------------------------
   📌 BilardoAdisyon.jsx — Bilardo Adisyon Sayfası
   4 sütunlu MyCafe standardında
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import "./Bilardo.css";

export default function BilardoAdisyon() {
  const [adisyon, setAdisyon] = useState(null);
  const [bilardoMasa, setBilardoMasa] = useState(null);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [gecenSure, setGecenSure] = useState(0);
  const [hesaplananUcret, setHesaplananUcret] = useState(0);
  const [ekUrunler, setEkUrunler] = useState([]);
  const [odemeler, setOdemeler] = useState([]);
  const [kalanTutar, setKalanTutar] = useState(0);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", adet: 1 });

  // URL'den adisyon ID'sini al
  const adisyonId = window.location.pathname.split("/").pop();

  // Ücret hesaplama fonksiyonu
  const ucretHesapla = (sureTipi, dakika) => {
    if (!ucretAyarlari) return 0;
    
    const bilardo30dk = ucretAyarlari.bilardo30dk || ucretAyarlari.ilk40 || 80;
    const bilardo1saat = ucretAyarlari.bilardo1saat || ucretAyarlari.u60 || 120;
    const bilardoDakikaUcreti = ucretAyarlari.bilardoDakikaUcreti || ucretAyarlari.dk2 || 2;
    
    switch(sureTipi) {
      case "30dk":
        return bilardo30dk;
      case "1saat":
        return bilardo1saat;
      case "suresiz":
        if (dakika <= 30) {
          return bilardo30dk;
        } else {
          const ekDakika = dakika - 30;
          return bilardo30dk + (Math.ceil(ekDakika) * bilardoDakikaUcreti);
        }
      default:
        return 0;
    }
  };

  useEffect(() => {
    const loadData = () => {
      // 1. Bilardo adisyonunu yükle
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const bulunanAdisyon = bilardoAdisyonlar.find(a => a.id === adisyonId);
      
      if (bulunanAdisyon) {
        setAdisyon(bulunanAdisyon);
        
        // 2. Bilardo masasını bul
        const bilardoMasalar = JSON.parse(localStorage.getItem("bilardo") || "[]");
        const masa = bilardoMasalar.find(m => m.id === bulunanAdisyon.bilardoMasaId);
        setBilardoMasa(masa);
        
        // 3. Ücret ayarlarını yükle
        const ayarlar = JSON.parse(localStorage.getItem("bilardo_ucretleri")) || 
                       JSON.parse(localStorage.getItem("bilardo_ucretleri_eski")) || 
                       { bilardo30dk: 80, bilardo1saat: 120, bilardoDakikaUcreti: 2 };
        setUcretAyarlari(ayarlar);
        
        // 4. Geçen süreyi hesapla
        const dakikaHesapla = () => {
          if (!bulunanAdisyon.acilisZamani) return 0;
          const now = Date.now();
          const dakika = Math.floor((now - bulunanAdisyon.acilisZamani) / 60000);
          setGecenSure(dakika);
          return dakika;
        };
        
        const dakika = dakikaHesapla();
        
        // 5. Ücret hesapla
        const ucret = ucretHesapla(bulunanAdisyon.sureTipi, dakika);
        setHesaplananUcret(ucret);
        
        // 6. Ek ürünleri ve ödemeleri yükle
        setEkUrunler(bulunanAdisyon.ekUrunler || []);
        setOdemeler(bulunanAdisyon.odemeler || []);
        
        // 7. Kalan tutarı hesapla
        const ekUrunToplam = (bulunanAdisyon.ekUrunler || []).reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
        const odenenToplam = (bulunanAdisyon.odemeler || []).reduce((sum, o) => sum + o.tutar, 0);
        const toplam = ucret + ekUrunToplam;
        setKalanTutar(Math.max(0, toplam - odenenToplam));
        
        // 8. Adisyonu güncelle (gecen dakika ve hesaplanan ücret)
        const adisyonIndex = bilardoAdisyonlar.findIndex(a => a.id === adisyonId);
        if (adisyonIndex !== -1) {
          bilardoAdisyonlar[adisyonIndex].gecenDakika = dakika;
          bilardoAdisyonlar[adisyonIndex].hesaplananUcret = ucret;
          localStorage.setItem("bilardo_adisyonlar", JSON.stringify(bilardoAdisyonlar));
        }
      } else {
        alert("Bilardo adisyonu bulunamadı!");
        window.location.href = "/bilardo";
      }
    };

    loadData();
    
    // Süre güncelleme interval'i
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, [adisyonId]);

  // Ek ürün ekle
  const ekUrunEkle = () => {
    if (!yeniUrun.ad.trim() || !yeniUrun.fiyat || parseFloat(yeniUrun.fiyat) <= 0) {
      alert("Geçerli ürün adı ve fiyat girin!");
      return;
    }

    const yeniUrunObj = {
      id: Date.now(),
      ad: yeniUrun.ad,
      fiyat: parseFloat(yeniUrun.fiyat),
      adet: parseInt(yeniUrun.adet) || 1,
      tarih: new Date().toISOString()
    };
    
    const yeniEkUrunler = [...ekUrunler, yeniUrunObj];
    setEkUrunler(yeniEkUrunler);
    
    // LocalStorage'ı güncelle
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    if (index !== -1) {
      adisyonlar[index].ekUrunler = yeniEkUrunler;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // Kalan tutarı güncelle
    const ekUrunToplam = yeniEkUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    const odenenToplam = odemeler.reduce((sum, o) => sum + o.tutar, 0);
    const toplam = hesaplananUcret + ekUrunToplam;
    setKalanTutar(Math.max(0, toplam - odenenToplam));
    
    setYeniUrun({ ad: "", fiyat: "", adet: 1 });
  };

  // Ürün sil
  const urunSil = (urunId) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    
    const yeniEkUrunler = ekUrunler.filter(u => u.id !== urunId);
    setEkUrunler(yeniEkUrunler);
    
    // LocalStorage'ı güncelle
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    if (index !== -1) {
      adisyonlar[index].ekUrunler = yeniEkUrunler;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // Kalan tutarı güncelle
    const ekUrunToplam = yeniEkUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    const odenenToplam = odemeler.reduce((sum, o) => sum + o.tutar, 0);
    const toplam = hesaplananUcret + ekUrunToplam;
    setKalanTutar(Math.max(0, toplam - odenenToplam));
  };

  // Ödeme ekle
  const odemeEkle = (tip, tutar) => {
    if (!tutar || parseFloat(tutar) <= 0) {
      alert("Geçerli bir tutar girin!");
      return;
    }

    const yeniOdeme = {
      id: Date.now(),
      tip: tip,
      tutar: parseFloat(tutar),
      tarih: new Date().toISOString()
    };
    
    const yeniOdemeler = [...odemeler, yeniOdeme];
    setOdemeler(yeniOdemeler);
    
    // LocalStorage'ı güncelle
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    if (index !== -1) {
      adisyonlar[index].odemeler = yeniOdemeler;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // Kalan tutarı güncelle
    const ekUrunToplam = ekUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    const odenenToplam = yeniOdemeler.reduce((sum, o) => sum + o.tutar, 0);
    const toplam = hesaplananUcret + ekUrunToplam;
    setKalanTutar(Math.max(0, toplam - odenenToplam));
  };

  // Ödeme sil
  const odemeSil = (odemeId) => {
    if (!window.confirm("Bu ödemeyi silmek istediğinize emin misiniz?")) return;
    
    const yeniOdemeler = odemeler.filter(o => o.id !== odemeId);
    setOdemeler(yeniOdemeler);
    
    // LocalStorage'ı güncelle
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    if (index !== -1) {
      adisyonlar[index].odemeler = yeniOdemeler;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // Kalan tutarı güncelle
    const ekUrunToplam = ekUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    const odenenToplam = yeniOdemeler.reduce((sum, o) => sum + o.tutar, 0);
    const toplam = hesaplananUcret + ekUrunToplam;
    setKalanTutar(Math.max(0, toplam - odenenToplam));
  };

  // Adisyonu kapat
  const adisyonuKapat = () => {
    if (kalanTutar > 0.01) {
      alert("Ödenmemiş tutar var! Önce ödeme yapın.");
      return;
    }
    
    // 1. Bilardo adisyonunu kapat
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    if (index !== -1) {
      adisyonlar[index].durum = "KAPANDI";
      adisyonlar[index].kapanisZamani = Date.now();
      adisyonlar[index].hesaplananUcret = hesaplananUcret;
      adisyonlar[index].gecenDakika = gecenSure;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    }
    
    // 2. Bilardo masasını kapat
    const bilardoMasalar = JSON.parse(localStorage.getItem("bilardo") || "[]");
    const masaIndex = bilardoMasalar.findIndex(m => m.id === bilardoMasa?.id);
    if (masaIndex !== -1) {
      bilardoMasalar[masaIndex].acik = false;
      bilardoMasalar[masaIndex].durum = "KAPALI";
      bilardoMasalar[masaIndex].ucret = hesaplananUcret + ekUrunler.reduce((s, u) => s + (u.fiyat * u.adet), 0);
      localStorage.setItem("bilardo", JSON.stringify(bilardoMasalar));
    }
    
    // 3. Kasa hareketi kaydet
    const kasalar = JSON.parse(localStorage.getItem("mc_kasalar") || "[]");
    const toplamTutar = hesaplananUcret + ekUrunler.reduce((s, u) => s + (u.fiyat * u.adet), 0);
    const kasaHareketi = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      masaNo: adisyon?.bilardoMasaNo || "BİLARDO",
      adisyonId: adisyonId,
      aciklama: `Bilardo - ${adisyon?.sureTipi || ""} (${gecenSure}dk)`,
      giren: toplamTutar,
      cikan: 0,
      bakiye: 0,
      tip: "BİLARDO_GELIRI",
      personel: JSON.parse(localStorage.getItem("mc_user") || "{}").adSoyad || "Bilinmiyor"
    };
    kasalar.push(kasaHareketi);
    localStorage.setItem("mc_kasalar", JSON.stringify(kasalar));
    
    alert(`Bilardo adisyonu kapatıldı!\nToplam: ${toplamTutar.toFixed(2)}₺`);
    
    // Bilardo sayfasına dön
    setTimeout(() => {
      window.location.href = "/bilardo";
    }, 1500);
  };

  if (!adisyon) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f3e4d6',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #c79a63',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6a4b33', fontSize: '18px' }}>Bilardo adisyonu yükleniyor...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const toplamTutar = hesaplananUcret + ekUrunler.reduce((s, u) => s + (u.fiyat * u.adet), 0);
  const odenenToplam = odemeler.reduce((s, o) => s + o.tutar, 0);
  const ekUrunToplam = ekUrunler.reduce((s, u) => s + (u.fiyat * u.adet), 0);

  return (
    <div className="bilardo-adisyon-container" style={{
      padding: '20px',
      background: '#f3e4d6',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      
      {/* BAŞLIK */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '3px solid #d2b295'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #4A3722, #8B4513)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #D4AF37'
          }}>
            <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="12" width="40" height="24" rx="8" fill="#4A3722" stroke="#D4AF37" strokeWidth="3"/>
              <rect x="8" y="16" width="32" height="16" rx="4" fill="#2E7D32"/>
              <circle cx="15" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
              <circle cx="24" cy="16" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
              <circle cx="33" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
              <circle cx="18" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
              <circle cx="30" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
              <circle cx="24" cy="24" r="3" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1"/>
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#5a3921',
              margin: '0',
              background: 'linear-gradient(135deg, #8B4513 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              BİLARDO ADİSYONU
            </h1>
            <p style={{ margin: '5px 0 0', color: '#8B7355', fontSize: '16px' }}>
              {adisyon.bilardoMasaNo} • {adisyon.sureTipi === "30dk" ? "30 Dakika" : 
               adisyon.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            padding: '8px 16px',
            background: adisyon.durum === "ACIK" ? '#e8f5e9' : '#ffebee',
            color: adisyon.durum === "ACIK" ? '#2e7d32' : '#c62828',
            borderRadius: '20px',
            fontWeight: '800',
            fontSize: '14px',
            border: `2px solid ${adisyon.durum === "ACIK" ? '#4caf50' : '#ef5350'}`
          }}>
            {adisyon.durum === "ACIK" ? "AÇIK" : "KAPANDI"}
          </div>
          <button
            onClick={() => window.location.href = "/bilardo"}
            style={{
              padding: '10px 20px',
              background: '#f0e6d6',
              border: '2px solid #d2b295',
              borderRadius: '10px',
              color: '#5d4037',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e8d8c3'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f0e6d6'}
          >
            ← Bilardo'ya Dön
          </button>
        </div>
      </div>
      
      {/* 4 SÜTUNLU ANA ALAN */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        
        {/* SÜTUN 1: BİLARDO BİLGİLERİ */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          border: '2px solid #e8d8c3'
        }}>
          <h2 style={{
            color: '#6a4b33',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0e6d6',
            fontSize: '22px',
            fontWeight: '800'
          }}>🎱 Bilardo Bilgileri</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Süre Tipi:</span>
              <span style={{ fontWeight: '700', color: '#5a3921' }}>
                {adisyon.sureTipi === "30dk" ? "30 Dakika" : 
                 adisyon.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Açılış:</span>
              <span style={{ fontWeight: '700', color: '#5a3921' }}>
                {new Date(adisyon.acilisZamani).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Geçen Süre:</span>
              <span style={{ fontWeight: '700', color: '#5a3921', fontSize: '18px' }}>
                {gecenSure} dakika
              </span>
            </div>
            
            <div style={{
              marginTop: '10px',
              padding: '15px',
              background: '#f5e8d0',
              borderRadius: '12px',
              border: '2px dashed #c89d72'
            }}>
              <div style={{ fontSize: '14px', color: '#8B7355', marginBottom: '5px' }}>BİLARDO ÜCRETİ</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#704a25' }}>
                {hesaplananUcret.toFixed(2)}₺
              </div>
            </div>
            
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: '#f0f0f0',
              borderRadius: '10px',
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Ücret Açıklaması:</div>
              {adisyon.sureTipi === "30dk" && `30 dakika ücreti: ${ucretAyarlari?.bilardo30dk || 80}₺`}
              {adisyon.sureTipi === "1saat" && `1 saat ücreti: ${ucretAyarlari?.bilardo1saat || 120}₺`}
              {adisyon.sureTipi === "suresiz" && 
                `İlk 30dk: ${ucretAyarlari?.bilardo30dk || 80}₺ + Sonrası: ${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk`}
            </div>
          </div>
        </div>
        
        {/* SÜTUN 2: EK ÜRÜNLER */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          border: '2px solid #e8d8c3',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0e6d6'
          }}>
            <h2 style={{
              color: '#6a4b33',
              fontSize: '22px',
              fontWeight: '800',
              margin: '0'
            }}>📦 Ek Ürünler</h2>
            <span style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {ekUrunler.length} ürün
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {ekUrunler.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
                fontSize: '16px'
              }}>
                Henüz ek ürün yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ekUrunler.map((urun) => (
                  <div key={urun.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '10px',
                    border: '1px solid #eee'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#5a3921' }}>{urun.ad}</div>
                      <div style={{ fontSize: '13px', color: '#8B7355' }}>Adet: {urun.adet}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontWeight: '700', color: '#704a25' }}>
                        {(urun.fiyat * urun.adet).toFixed(2)}₺
                      </span>
                      <button
                        onClick={() => urunSil(urun.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#e74c3c',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '5px'
                        }}
                        title="Ürünü sil"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{
            padding: '15px',
            background: '#f8f3e9',
            borderRadius: '12px',
            border: '1px solid #e8d8c3'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#6a4b33', fontSize: '16px' }}>Yeni Ürün Ekle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ürün adı"
                value={yeniUrun.ad}
                onChange={(e) => setYeniUrun({...yeniUrun, ad: e.target.value})}
                style={{
                  padding: '10px',
                  border: '2px solid #d2b295',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Fiyat"
                  value={yeniUrun.fiyat}
                  onChange={(e) => setYeniUrun({...yeniUrun, fiyat: e.target.value})}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #d2b295',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Adet"
                  value={yeniUrun.adet}
                  onChange={(e) => setYeniUrun({...yeniUrun, adet: e.target.value})}
                  min="1"
                  style={{
                    width: '80px',
                    padding: '10px',
                    border: '2px solid #d2b295',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={ekUrunEkle}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #c79a63, #b18452)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #b18452, #9e713f)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #c79a63, #b18452)'}
              >
                + Ürün Ekle
              </button>
            </div>
          </div>
        </div>
        
        {/* SÜTUN 3: ÖDEMELER */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          border: '2px solid #e8d8c3',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            color: '#6a4b33',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0e6d6',
            fontSize: '22px',
            fontWeight: '800'
          }}>💳 Ödemeler</h2>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {odemeler.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
                fontSize: '16px'
              }}>
                Henüz ödeme yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {odemeler.map((odeme) => (
                  <div key={odeme.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '10px',
                    border: '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: odeme.tip === "NAKIT" ? '#e8f5e9' : '#e3f2fd',
                        color: odeme.tip === "NAKIT" ? '#2e7d32' : '#1565c0',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        {odeme.tip === "NAKIT" ? "💵 Nakit" : "💳 Kart"}
                      </span>
                      <span style={{ fontSize: '13px', color: '#8B7355' }}>
                        {new Date(odeme.tarih).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontWeight: '700', color: '#704a25' }}>
                        {odeme.tutar.toFixed(2)}₺
                      </span>
                      <button
                        onClick={() => odemeSil(odeme.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#e74c3c',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '5px'
                        }}
                        title="Ödemeyi sil"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{
            padding: '15px',
            background: '#f0f8ff',
            borderRadius: '12px',
            border: '1px solid #bbdefb'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#6a4b33', fontSize: '16px' }}>Ödeme Ekle</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  const tutar = prompt("Nakit ödeme tutarı:", kalanTutar);
                  if (tutar && !isNaN(tutar)) odemeEkle("NAKIT", parseFloat(tutar));
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💵 Nakit
              </button>
              <button
                onClick={() => {
                  const tutar = prompt("Kart ödeme tutarı:", kalanTutar);
                  if (tutar && !isNaN(tutar)) odemeEkle("KART", parseFloat(tutar));
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💳 Kart
              </button>
            </div>
          </div>
        </div>
        
        {/* SÜTUN 4: ÖZET ve AKSİYONLAR */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          border: '2px solid #e8d8c3',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            color: '#6a4b33',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0e6d6',
            fontSize: '22px',
            fontWeight: '800'
          }}>📊 Özet</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Bilardo Ücreti:</span>
              <span style={{ fontWeight: '700', color: '#5a3921' }}>{hesaplananUcret.toFixed(2)}₺</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Ek Ürünler:</span>
              <span style={{ fontWeight: '700', color: '#5a3921' }}>{ekUrunToplam.toFixed(2)}₺</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px 0',
              borderTop: '2px solid #f0e6d6',
              borderBottom: '2px solid #f0e6d6',
              fontSize: '18px',
              fontWeight: '800'
            }}>
              <span style={{ color: '#5a3921' }}>GENEL TOPLAM:</span>
              <span style={{ color: '#704a25', fontSize: '22px' }}>{toplamTutar.toFixed(2)}₺</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B7355', fontWeight: '600' }}>Ödenen:</span>
              <span style={{ fontWeight: '700', color: '#27ae60' }}>{odenenToplam.toFixed(2)}₺</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px',
              background: kalanTutar > 0 ? '#ffebee' : '#e8f5e9',
              borderRadius: '12px',
              border: `2px solid ${kalanTutar > 0 ? '#ef5350' : '#4caf50'}`,
              fontSize: '18px',
              fontWeight: '800',
              marginTop: '10px'
            }}>
              <span style={{ color: kalanTutar > 0 ? '#c62828' : '#2e7d32' }}>KALAN TUTAR:</span>
              <span style={{ color: kalanTutar > 0 ? '#c62828' : '#2e7d32', fontSize: '22px' }}>
                {kalanTutar.toFixed(2)}₺
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={adisyonuKapat}
              disabled={kalanTutar > 0.01}
              style={{
                padding: '16px',
                background: kalanTutar > 0.01 ? '#95a5a6' : 'linear-gradient(135deg, #27ae60, #229954)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: kalanTutar > 0.01 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                if (kalanTutar <= 0.01) e.currentTarget.style.background = 'linear-gradient(135deg, #229954, #1e8449)';
              }}
              onMouseOut={(e) => {
                if (kalanTutar <= 0.01) e.currentTarget.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
              }}
            >
              ✅ ADİSYONU KAPAT
            </button>
            
            <button
              onClick={() => {
                const data = {
                  adisyonId: adisyonId,
                  bilardoMasaId: bilardoMasa?.id,
                  bilardoMasaNo: adisyon?.bilardoMasaNo
                };
                localStorage.setItem("bilardo_aktarim_verisi", JSON.stringify(data));
                window.location.href = "/bilardo";
              }}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #4a6fa5, #3a5a8c)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #3a5a8c, #2b497a)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #4a6fa5, #3a5a8c)'}
            >
              ↪️ MASAYA AKTAR
            </button>
          </div>
        </div>
      </div>
      
      {/* ALT BİLGİ */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: '#8B7355',
        fontSize: '14px',
        borderTop: '1px solid #e8d8c3',
        marginTop: '20px'
      }}>
        <p>Adisyon ID: <strong>{adisyonId}</strong></p>
        <p>Son güncelleme: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>
    </div>
  );
}