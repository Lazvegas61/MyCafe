// admin-ui/src/pages/Bilardo/BilardoAdisyon.jsx - HATA DÜZELTİLMİŞ
/* ------------------------------------------------------------
   📌 BilardoAdisyon.jsx — HATALAR DÜZELTİLDİ
   - :hover pseudo-selector hataları düzeltildi
   - JSX sözdizimi hataları temizlendi
   - Ödemeler paneli Adisyon.jsx ile aynı
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bilardo.css";

export default function BilardoAdisyon() {
  const navigate = useNavigate();
  const [adisyon, setAdisyon] = useState(null);
  const [bilardoMasa, setBilardoMasa] = useState(null);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [gecenSure, setGecenSure] = useState(0);
  const [hesaplananUcret, setHesaplananUcret] = useState(0);
  
  // MyCafe Ürün Yönetimi
  const [ekUrunler, setEkUrunler] = useState([]);
  const [odemeler, setOdemeler] = useState([]);
  const [kalanTutar, setKalanTutar] = useState(0);
  
  // MyCafe Verileri
  const [mcUrunler, setMcUrunler] = useState([]);
  const [mcKategoriler, setMcKategoriler] = useState([]);
  
  // Ürün Ekleme Modalı
  const [urunEkleModal, setUrunEkleModal] = useState({
    acik: false,
    kategoriId: null,
    urunler: []
  });
  
  // Ödeme Modalı
  const [odemeModal, setOdemeModal] = useState({
    acik: false,
    tip: "NAKIT",
    tutar: 0,
    aciklama: ""
  });
  
  // Ürün Arama
  const [urunArama, setUrunArama] = useState("");
  
  const adisyonId = window.location.pathname.split("/").pop();

  /* ============================================================
     📌 1. ÜCRET HESAPLAMA
  ============================================================ */
  
  const ucretHesapla = (sureTipi, dakika) => {
    if (!ucretAyarlari) return 0;
    
    const bilardo30dk = ucretAyarlari.bilardo30dk || 80;
    const bilardo1saat = ucretAyarlari.bilardo1saat || 120;
    const bilardoDakikaUcreti = ucretAyarlari.bilardoDakikaUcreti || 2;
    
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

  /* ============================================================
     📌 2. DATA LOADING
  ============================================================ */
  
  useEffect(() => {
    const loadData = () => {
      // 1. MyCafe verilerini yükle
      const mcUrunData = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
      const mcKategoriData = JSON.parse(localStorage.getItem("mc_kategoriler") || "[]");
      setMcUrunler(mcUrunData);
      setMcKategoriler(mcKategoriData);
      
      // 2. Bilardo adisyonunu yükle
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const bulunanAdisyon = bilardoAdisyonlar.find(a => a.id === adisyonId);
      
      if (bulunanAdisyon) {
        setAdisyon(bulunanAdisyon);
        
        // 3. Bilardo masasını bul
        const bilardoMasalar = JSON.parse(localStorage.getItem("bilardo") || "[]");
        const masa = bilardoMasalar.find(m => m.id === bulunanAdisyon.bilardoMasaId);
        setBilardoMasa(masa);
        
        // 4. Ücret ayarlarını yükle
        const ayarlar = JSON.parse(localStorage.getItem("bilardo_ucretleri")) || 
                       { bilardo30dk: 80, bilardo1saat: 120, bilardoDakikaUcreti: 2 };
        setUcretAyarlari(ayarlar);
        
        // 5. Geçen süreyi hesapla
        const dakikaHesapla = () => {
          if (!bulunanAdisyon.acilisZamani) return 0;
          const now = Date.now();
          const dakika = Math.floor((now - bulunanAdisyon.acilisZamani) / 60000);
          setGecenSure(dakika);
          return dakika;
        };
        
        const dakika = dakikaHesapla();
        
        // 6. Ücret hesapla
        const ucret = ucretHesapla(bulunanAdisyon.sureTipi, dakika);
        setHesaplananUcret(ucret);
        
        // 7. Ek ürünleri ve ödemeleri yükle
        setEkUrunler(bulunanAdisyon.ekUrunler || []);
        setOdemeler(bulunanAdisyon.odemeler || []);
        
        // 8. Kalan tutarı hesapla
        updateKalanTutar(ucret, bulunanAdisyon.ekUrunler || [], bulunanAdisyon.odemeler || []);
        
        // 9. Adisyonu güncelle
        const adisyonIndex = bilardoAdisyonlar.findIndex(a => a.id === adisyonId);
        if (adisyonIndex !== -1) {
          bilardoAdisyonlar[adisyonIndex].gecenDakika = dakika;
          bilardoAdisyonlar[adisyonIndex].hesaplananUcret = ucret;
          localStorage.setItem("bilardo_adisyonlar", JSON.stringify(bilardoAdisyonlar));
        }
      } else {
        alert("Bilardo adisyonu bulunamadı!");
        setTimeout(() => navigate("/bilardo"), 1500);
      }
    };

    loadData();
    
    // Süre güncelleme interval'i
    const interval = setInterval(loadData, 15000);
    
    return () => clearInterval(interval);
  }, [adisyonId, navigate]);

  /* ============================================================
     📌 3. KALAN TUTAR HESAPLAMA
  ============================================================ */
  
  const updateKalanTutar = (ucret, ekUrunlerData, odemelerData) => {
    const ekUrunToplam = ekUrunlerData.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    const odenenToplam = odemelerData.reduce((sum, o) => sum + o.tutar, 0);
    const toplam = ucret + ekUrunToplam;
    setKalanTutar(Math.max(0, toplam - odenenToplam));
  };

  /* ============================================================
     📌 4. MYCAFE ÜRÜN EKLEME
  ============================================================ */
  
  const myCafeUrunEkle = (urun) => {
    if (!urun) return;
    
    const yeniEkUrun = {
      id: Date.now(),
      ad: urun.name || urun.productName || "Ürün",
      mcUrunId: urun.id,
      fiyat: parseFloat(urun.salePrice || 0),
      adet: 1,
      birimFiyat: parseFloat(urun.salePrice || 0),
      toplam: parseFloat(urun.salePrice || 0),
      kdv: urun.kdv || 8,
      tarih: new Date().toISOString(),
      not: ""
    };
    
    const yeniEkUrunler = [...ekUrunler, yeniEkUrun];
    setEkUrunler(yeniEkUrunler);
    
    // Adisyonu güncelle
    updateAdisyonWithEkUrunler(yeniEkUrunler);
    
    // Stok güncelle
    stokGuncelle(urun.id, -1);
    
    // Modalı kapat
    setUrunEkleModal({ acik: false, kategoriId: null, urunler: [] });
  };
  
  const updateAdisyonWithEkUrunler = (yeniEkUrunler) => {
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const index = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (index !== -1) {
      adisyonlar[index].ekUrunler = yeniEkUrunler;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
      
      // Kalan tutarı güncelle
      const ekUrunToplam = yeniEkUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
      const odenenToplam = odemeler.reduce((sum, o) => sum + o.tutar, 0);
      const toplam = hesaplananUcret + ekUrunToplam;
      setKalanTutar(Math.max(0, toplam - odenenToplam));
    }
  };
  
  const stokGuncelle = (urunId, degisim) => {
    const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
    const urunIndex = urunler.findIndex(u => u.id === urunId);
    
    if (urunIndex !== -1) {
      urunler[urunIndex].stock = Math.max(0, (urunler[urunIndex].stock || 0) + degisim);
      localStorage.setItem("mc_urunler", JSON.stringify(urunler));
    }
  };

  /* ============================================================
     📌 5. ÜRÜN YÖNETİMİ
  ============================================================ */
  
  const urunMiktarGuncelle = (urunId, yeniAdet) => {
    if (yeniAdet < 1) return;
    
    const eskiUrun = ekUrunler.find(u => u.id === urunId);
    if (!eskiUrun) return;
    
    const adetDegisimi = yeniAdet - eskiUrun.adet;
    
    const yeniEkUrunler = ekUrunler.map(urun => 
      urun.id === urunId 
        ? { 
            ...urun, 
            adet: yeniAdet,
            toplam: urun.fiyat * yeniAdet
          }
        : urun
    );
    
    setEkUrunler(yeniEkUrunler);
    updateAdisyonWithEkUrunler(yeniEkUrunler);
    
    // Stok güncelle
    if (eskiUrun.mcUrunId) {
      stokGuncelle(eskiUrun.mcUrunId, -adetDegisimi);
    }
  };
  
  const urunSil = (urunId) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    
    const silinecekUrun = ekUrunler.find(u => u.id === urunId);
    if (!silinecekUrun) return;
    
    const yeniEkUrunler = ekUrunler.filter(u => u.id !== urunId);
    setEkUrunler(yeniEkUrunler);
    updateAdisyonWithEkUrunler(yeniEkUrunler);
    
    // Stok geri al
    if (silinecekUrun.mcUrunId) {
      stokGuncelle(silinecekUrun.mcUrunId, silinecekUrun.adet);
    }
  };

  /* ============================================================
     📌 6. ÖDEME YÖNETİMİ - GÜNCELLENMİŞ
  ============================================================ */
  
  const odemeModalAc = (tip) => {
    setOdemeModal({
      acik: true,
      tip: tip,
      tutar: kalanTutar,
      aciklama: ""
    });
  };
  
  const odemeEkle = () => {
    if (!odemeModal.tutar || parseFloat(odemeModal.tutar) <= 0) {
      alert("Geçerli bir tutar girin!");
      return;
    }

    const yeniOdeme = {
      id: Date.now(),
      tip: odemeModal.tip,
      tutar: parseFloat(odemeModal.tutar),
      aciklama: odemeModal.aciklama || "",
      tarih: new Date().toISOString(),
      personel: JSON.parse(localStorage.getItem("mc_user") || "{}").adSoyad || "Bilinmiyor"
    };
    
    const yeniOdemeler = [...odemeler, yeniOdeme];
    setOdemeler(yeniOdemeler);
    
    // Adisyonu güncelle
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
    
    // Kasa hareketi kaydet
    const kasalar = JSON.parse(localStorage.getItem("mc_kasalar") || "[]");
    const kasaHareketi = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      masaNo: adisyon?.bilardoMasaNo || "BİLARDO",
      adisyonId: adisyonId,
      aciklama: `Bilardo Ödeme - ${odemeModal.tip}`,
      giren: parseFloat(odemeModal.tutar),
      cikan: 0,
      bakiye: 0,
      tip: "BİLARDO_ODEME",
      personel: JSON.parse(localStorage.getItem("mc_user") || "{}").adSoyad || "Bilinmiyor"
    };
    kasalar.push(kasaHareketi);
    localStorage.setItem("mc_kasalar", JSON.stringify(kasalar));
    
    setOdemeModal({ acik: false, tip: "NAKIT", tutar: 0, aciklama: "" });
  };
  
  const odemeSil = (odemeId) => {
    if (!window.confirm("Bu ödemeyi silmek istediğinize emin misiniz?")) return;
    
    const yeniOdemeler = odemeler.filter(o => o.id !== odemeId);
    setOdemeler(yeniOdemeler);
    
    // Adisyonu güncelle
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

  /* ============================================================
     📌 7. ADİSYON KAPATMA
  ============================================================ */
  
  const adisyonuKapat = () => {
    if (kalanTutar > 0.01) {
      alert(`Ödenmemiş tutar var! Kalan: ${kalanTutar.toFixed(2)}₺`);
      return;
    }
    
    if (!window.confirm("Adisyonu kapatmak istediğinize emin misiniz?")) return;
    
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
      bilardoMasalar[masaIndex].sureTipi = null;
      bilardoMasalar[masaIndex].acilisSaati = null;
      bilardoMasalar[masaIndex].aktifAdisyonId = null;
      bilardoMasalar[masaIndex].ucret = 0;
      localStorage.setItem("bilardo", JSON.stringify(bilardoMasalar));
    }
    
    // 3. Açık adisyonlardan kaldır
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    const filteredAcikAdisyonlar = acikAdisyonlar.filter(a => a.id !== adisyonId);
    localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(filteredAcikAdisyonlar));
    
    // 4. Kasa hareketi kaydet
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
    setTimeout(() => navigate("/bilardo"), 1500);
  };

  /* ============================================================
     📌 8. ÜRÜN FİLTRELEME
  ============================================================ */
  
  const kategoriyeGoreUrunler = (kategoriId) => {
    let urunListesi = mcUrunler;
    
    // Kategori filtresi
    if (kategoriId) {
      const altKategoriIds = mcKategoriler
        .filter(k => k.parentId === kategoriId)
        .map(k => k.id);
      
      const tumKategoriIds = [kategoriId, ...altKategoriIds];
      urunListesi = urunListesi.filter(urun => 
        tumKategoriIds.includes(urun.categoryId)
      );
    }
    
    // Arama filtresi
    if (urunArama.trim()) {
      const arama = urunArama.toLowerCase();
      urunListesi = urunListesi.filter(urun => 
        (urun.name || "").toLowerCase().includes(arama) ||
        (urun.productName || "").toLowerCase().includes(arama) ||
        (urun.barcode || "").toLowerCase().includes(arama)
      );
    }
    
    return urunListesi;
  };

  /* ============================================================
     📌 9. RENDER FONKSİYONLARI
  ============================================================ */
  
  const renderUrunTablosu = () => {
    return (
      <div style={{
        marginTop: '20px',
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          background: '#f5e8d0',
          padding: '12px 15px',
          fontWeight: '800',
          color: '#5a3921',
          borderBottom: '2px solid #d2b295'
        }}>
          <div>Ürün Adı</div>
          <div>Miktar</div>
          <div>Birim Fiyat</div>
          <div>Toplam</div>
        </div>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {ekUrunler.map((urun) => (
            <div key={urun.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '10px 15px',
              borderBottom: '1px solid #eee',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#5a3921' }}>{urun.ad}</span>
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
              
              <div>
                <input
                  type="number"
                  min="1"
                  value={urun.adet}
                  onChange={(e) => urunMiktarGuncelle(urun.id, parseInt(e.target.value) || 1)}
                  style={{
                    width: '60px',
                    padding: '5px',
                    border: '1px solid #d2b295',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}
                />
              </div>
              
              <div style={{ fontWeight: '600', color: '#704a25' }}>
                {urun.fiyat.toFixed(2)}₺
              </div>
              
              <div style={{ fontWeight: '800', color: '#704a25' }}>
                {(urun.fiyat * urun.adet).toFixed(2)}₺
              </div>
            </div>
          ))}
          
          {ekUrunler.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#999',
              fontStyle: 'italic'
            }}>
              Henüz ek ürün eklenmedi
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderMyCafeUrunModal = () => {
    const anaKategoriler = mcKategoriler.filter(k => k.parentId === null);
    const filtrelenmisUrunler = kategoriyeGoreUrunler(urunEkleModal.kategoriId);
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #8B4513, #5a3921)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: '0', fontSize: '24px' }}>📦 MyCafe Ürünleri</h2>
            <button
              onClick={() => setUrunEkleModal({ acik: false, kategoriId: null, urunler: [] })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Arama */}
          <div style={{ padding: '15px', background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
            <input
              type="text"
              placeholder="🔍 Ürün ara..."
              value={urunArama}
              onChange={(e) => setUrunArama(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #d2b295',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            height: '60vh'
          }}>
            {/* Kategori listesi */}
            <div style={{
              borderRight: '1px solid #eee',
              overflowY: 'auto',
              padding: '15px'
            }}>
              {anaKategoriler.map(kategori => (
                <div
                  key={kategori.id}
                  onClick={() => {
                    setUrunEkleModal({...urunEkleModal, kategoriId: kategori.id});
                    setUrunArama("");
                  }}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: urunEkleModal.kategoriId === kategori.id ? '#f5e8d0' : '#f9f9f9',
                    border: urunEkleModal.kategoriId === kategori.id ? '2px solid #d2b295' : '1px solid #eee',
                    fontWeight: urunEkleModal.kategoriId === kategori.id ? '700' : '400',
                    color: urunEkleModal.kategoriId === kategori.id ? '#5a3921' : '#666'
                  }}
                >
                  {kategori.name}
                </div>
              ))}
            </div>
            
            {/* Ürün listesi */}
            <div style={{
              padding: '20px',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '15px'
              }}>
                {filtrelenmisUrunler.map((urun, idx) => (
                  <div
                    key={urun.id || idx}
                    onClick={() => myCafeUrunEkle(urun)}
                    style={{
                      padding: '15px',
                      background: '#f9f9f9',
                      borderRadius: '10px',
                      border: '1px solid #eee',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f5e8d0';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f9f9f9';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '5px',
                      color: '#5a3921',
                      fontSize: '14px',
                      height: '40px',
                      overflow: 'hidden'
                    }}>
                      {urun.name || urun.productName}
                    </div>
                    <div style={{ 
                      fontWeight: '800', 
                      color: '#704a25',
                      fontSize: '18px',
                      marginBottom: '5px'
                    }}>
                      {parseFloat(urun.salePrice || 0).toFixed(2)}₺
                    </div>
                    {urun.stock !== undefined && (
                      <div style={{
                        fontSize: '12px',
                        color: urun.stock > 5 ? '#2e7d32' : urun.stock > 0 ? '#f39c12' : '#c62828',
                        marginTop: '5px',
                        fontWeight: '600'
                      }}>
                        {urun.stock > 0 ? `Stok: ${urun.stock}` : 'Stok yok!'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {filtrelenmisUrunler.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  {urunArama ? 'Arama sonucu bulunamadı' : 'Bu kategoride ürün bulunamadı'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     📌 10. ANA RENDER
  ============================================================ */
  
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
            onClick={() => navigate("/bilardo")}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e8d8c3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0e6d6';
            }}
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              <button
                onClick={() => setUrunEkleModal({
                  acik: true,
                  kategoriId: null,
                  urunler: mcUrunler
                })}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #c79a63, #b18452)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #b18452, #9e713f)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c79a63, #b18452)';
                }}
              >
                + MyCafe Ürünü
              </button>
            </div>
          </div>
          
          {/* 4 sütunlu ürün tablosu */}
          {renderUrunTablosu()}
          
          {/* Toplam ek ürün tutarı */}
          {ekUrunler.length > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: '#f8f3e9',
              borderRadius: '8px',
              textAlign: 'right',
              fontWeight: '700',
              color: '#704a25',
              border: '1px solid #e8d8c3'
            }}>
              Ek Ürünler Toplamı: {ekUrunToplam.toFixed(2)}₺
            </div>
          )}
        </div>
        
        {/* SÜTUN 3: ÖDEMELER - ADİSYON.JSX STİLİNDE */}
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
            }}>💳 Ödemeler</h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => odemeModalAc("NAKIT")}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                }}
              >
                💵 Nakit
              </button>
              
              <button
                onClick={() => odemeModalAc("KART")}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2980b9, #2471a3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                }}
              >
                💳 Kart
              </button>
            </div>
          </div>
          
          {/* ÖDEME LİSTESİ */}
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
                        background: odeme.tip === "NAKIT" ? '#e8f5e9' : 
                                   odeme.tip === "KART" ? '#e3f2fd' : '#f3e5f5',
                        color: odeme.tip === "NAKIT" ? '#2e7d32' : 
                               odeme.tip === "KART" ? '#1565c0' : '#7b1fa2',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}>
                        {odeme.tip === "NAKIT" ? "💵 Nakit" : 
                         odeme.tip === "KART" ? "💳 Kart" : odeme.tip}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', color: '#8B7355' }}>
                          {new Date(odeme.tarih).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        {odeme.aciklama && (
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                            {odeme.aciklama}
                          </div>
                        )}
                      </div>
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
          
          {/* ÖDENEN TOPLAM */}
          <div style={{
            padding: '12px',
            background: '#e8f5e9',
            borderRadius: '10px',
            textAlign: 'right',
            fontWeight: '700',
            color: '#2e7d32',
            marginTop: '10px',
            border: '1px solid #c8e6c9'
          }}>
            ÖDENEN TOPLAM: {odenenToplam.toFixed(2)}₺
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
              onMouseEnter={(e) => {
                if (kalanTutar <= 0.01) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #229954, #1e8449)';
                }
              }}
              onMouseLeave={(e) => {
                if (kalanTutar <= 0.01) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
                }
              }}
            >
              ✅ ADİSYONU KAPAT
            </button>
            
            <button
              onClick={() => navigate("/bilardo")}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3a5a8c, #2b497a)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4a6fa5, #3a5a8c)';
              }}
            >
              ↪️ BİLARDO'YA DÖN
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
      
      {/* MYCAFE ÜRÜN EKLEME MODALI */}
      {urunEkleModal.acik && renderMyCafeUrunModal()}
      
      {/* ÖDEME MODALI */}
      {odemeModal.acik && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              color: '#5a3921',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '22px'
            }}>
              Ödeme Ekle
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px', fontWeight: '600', color: '#666' }}>
                Ödeme Tipi
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setOdemeModal({...odemeModal, tip: "NAKIT"})}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: odemeModal.tip === "NAKIT" ? 
                      'linear-gradient(135deg, #2ecc71, #27ae60)' : '#f0f0f0',
                    color: odemeModal.tip === "NAKIT" ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  💵 Nakit
                </button>
                <button
                  onClick={() => setOdemeModal({...odemeModal, tip: "KART"})}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: odemeModal.tip === "KART" ? 
                      'linear-gradient(135deg, #3498db, #2980b9)' : '#f0f0f0',
                    color: odemeModal.tip === "KART" ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  💳 Kart
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontWeight: '600', color: '#666' }}>
                  Tutar (Kalan: {kalanTutar.toFixed(2)}₺)
                </div>
                <input
                  type="number"
                  value={odemeModal.tutar}
                  onChange={(e) => setOdemeModal({...odemeModal, tutar: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d2b295',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontWeight: '600', color: '#666' }}>
                  Açıklama (Opsiyonel)
                </div>
                <input
                  type="text"
                  value={odemeModal.aciklama}
                  onChange={(e) => setOdemeModal({...odemeModal, aciklama: e.target.value})}
                  placeholder="Ödeme açıklaması"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d2b295',
                    borderRadius: '10px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setOdemeModal({ acik: false, tip: "NAKIT", tutar: 0, aciklama: "" })}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
              <button
                onClick={odemeEkle}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #c79a63, #b18452)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ÖDEME YAP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}