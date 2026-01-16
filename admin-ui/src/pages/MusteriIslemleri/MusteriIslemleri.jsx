/* ============================================================
   📄 DOSYA: MusteriIslemleri.jsx (SON GÜNCELLEME - KDV ÇIKARILDI)
   📌 AMAÇ:
   MyCafe — Müşteri İşlemleri (4 Kolonlu Tasarım)
   - KDV hesaplamaları tamamen çıkarıldı
============================================================ */

import React, { useState, useEffect } from "react";
import "./MusteriIslemleri.css";

// LocalStorage key'leri
const MUSTERI_KEY = "mc_musteriler";
const ADISYON_KEY = "mc_adisyonlar";
const TAHBILAT_KEY = "mc_tahbilat";
const USER_KEY = "mc_user";
const BORC_KEY = "mc_borclar";

export default function MusteriIslemleri() {
  // --------------------------------------------------
  // STATE TANIMLARI
  // --------------------------------------------------
  const [role, setRole] = useState("ADMIN");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDebtRecord, setSelectedDebtRecord] = useState(null);
  const [debtRecords, setDebtRecords] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [adisyonDetails, setAdisyonDetails] = useState(null);
  
  // Filtreleme
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tahsilat
  const [tahsilatTutar, setTahsilatTutar] = useState("");
  const [tahsilatTipi, setTahsilatTipi] = useState("NAKIT");
  const [tahsilatNot, setTahsilatNot] = useState("");
  
  // İndirim
  const [indirimTutar, setIndirimTutar] = useState("");
  const [indirimNot, setIndirimNot] = useState("");
  
  // Borç Transferi
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTutar, setTransferTutar] = useState("");
  const [transferMusteriId, setTransferMusteriId] = useState("");
  const [transferMusteriAdi, setTransferMusteriAdi] = useState("");
  const [transferNot, setTransferNot] = useState("");

  // --------------------------------------------------
  // LOCALSTORAGE YARDIMCI FONKSİYONLARI
  // --------------------------------------------------
  const okuJSON = (key, defaultValue) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  };

  const yazJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // --------------------------------------------------
  // İNİTİAL LOAD
  // --------------------------------------------------
  useEffect(() => {
    const user = okuJSON(USER_KEY, {});
    setRole(user.role || "ADMIN");
    
    const musteriler = okuJSON(MUSTERI_KEY, []);
    yukleMusteriler(musteriler);
  }, []);

  // Müşterileri yükleme fonksiyonu
  const yukleMusteriler = (musteriListesi) => {
    const musterilerBorclu = musteriListesi.map(musteri => {
      // ADISYON_KEY'den borçları hesapla
      const adisyonlar = okuJSON(ADISYON_KEY, []).filter(a => a.musteriId === musteri.id);
      
      // BORC_KEY'den borçları hesapla
      const borclar = okuJSON(BORC_KEY, []).filter(b => b.musteriId === musteri.id);
      
      let toplamBorcAdisyon = 0;
      let toplamBorcYeni = 0;
      let toplamOdemeYeni = 0;
      let toplamIndirim = 0;
      
      // Adisyonlardan borç hesapla
      adisyonlar.forEach(adisyon => {
        if (adisyon.hesabaYazilanTutar) {
          toplamBorcAdisyon += adisyon.hesabaYazilanTutar;
        }
      });
      
      // Yeni borç sisteminden hesapla
      borclar.forEach(borc => {
        toplamBorcYeni += Number(borc.tutar || 0);
        
        // Ödenen kısım
        if (borc.hareketler) {
          borc.hareketler.forEach(h => {
            if (h.tip === "ÖDEME ALINDI") {
              toplamOdemeYeni += Number(h.tutar || 0);
            }
            if (h.tip === "İNDİRİM") {
              toplamIndirim += Number(h.tutar || 0);
            }
          });
        }
      });
      
      // Eski tahsilatları düş
      const tahsilatlar = okuJSON(TAHBILAT_KEY, []).filter(t => t.musteriId === musteri.id);
      const toplamTahsilat = tahsilatlar.reduce((sum, t) => sum + (t.tutar || 0), 0);
      
      // Müşteri indirimleri
      if (musteri.indirimler) {
        toplamIndirim += musteri.indirimler.reduce((sum, i) => sum + (i.tutar || 0), 0);
      }
      
      // TOPLAM BORÇ
      const toplamBorc = toplamBorcAdisyon + toplamBorcYeni;
      
      // TOPLAM ÖDEME
      const toplamOdeme = toplamTahsilat + toplamOdemeYeni;
      
      const netBorc = Math.max(0, toplamBorc - toplamIndirim - toplamOdeme);
      
      return {
        ...musteri,
        toplamBorc: toplamBorc,
        indirim: toplamIndirim,
        netBorc: netBorc,
        adisyonSayisi: adisyonlar.length + borclar.length,
        sonIslemTarihi: musteri.sonIslemTarihi || musteri.created_at
      };
    });
    
    // Borçlu olanları üstte, borcu olmayanları altta sırala
    musterilerBorclu.sort((a, b) => {
      if (a.netBorc > 0 && b.netBorc === 0) return -1;
      if (a.netBorc === 0 && b.netBorc > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(musterilerBorclu);
    setFilteredCustomers(musterilerBorclu);
  };

  // --------------------------------------------------
  // FİLTRELEME
  // --------------------------------------------------
  useEffect(() => {
    let filtered = [...customers];
    
    // Arama filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.adSoyad.toLowerCase().includes(term) ||
        customer.telefon.includes(searchTerm)
      );
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // --------------------------------------------------
  // MÜŞTERİ SEÇİMİ
  // --------------------------------------------------
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedDebtRecord(null);
    setAdisyonDetails(null);
    
    // Müşterinin tüm borç kayıtlarını getir
    const adisyonlar = okuJSON(ADISYON_KEY, [])
      .filter(a => a.musteriId === customer.id && a.hesabaYazilanTutar > 0)
      .map(adisyon => ({
        ...adisyon,
        tip: "ADISYON",
        borcTutari: adisyon.hesabaYazilanTutar,
        tarih: adisyon.tarih || adisyon.acilisZamani,
        masaNo: adisyon.masaNo || "-",
        id: `adisyon_${adisyon.id}`,
        urunler: adisyon.urunler || [],
        toplamTutar: adisyon.toplamTutar || adisyon.hesabaYazilanTutar
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    const borclar = okuJSON(BORC_KEY, [])
      .filter(b => b.musteriId === customer.id && b.tutar > 0)
      .map(borc => ({
        ...borc,
        tip: "BORC",
        borcTutari: borc.tutar,
        tarih: borc.acilisZamani,
        masaNo: borc.masaNo || "-",
        id: `borc_${borc.id}`,
        urunler: borc.urunler || [],
        hareketler: borc.hareketler || [],
        toplamTutar: borc.tutar || 0
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    const tumBorclar = [...adisyonlar, ...borclar]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    setDebtRecords(tumBorclar);
    
    // İşlem geçmişini hazırla
    const tahsilatlar = okuJSON(TAHBILAT_KEY, [])
      .filter(t => t.musteriId === customer.id)
      .map(t => ({
        tip: "TAHSILAT",
        tutar: t.tutar,
        tarih: t.tarih,
        odemeTipi: t.tip,
        aciklama: t.not
      }));
    
    const tumHareketler = [];
    
    // Borç kayıtlarını ekle
    tumBorclar.forEach(borc => {
      tumHareketler.push({
        tip: "BORÇ EKLENDİ",
        tutar: borc.borcTutari,
        tarih: borc.tarih,
        masaNo: borc.masaNo,
        borcId: borc.id
      });
      
      // Borç hareketlerini ekle (ödeme ve indirim varsa)
      if (borc.hareketler) {
        borc.hareketler.forEach(hareket => {
          if (hareket.tip === "ÖDEME ALINDI") {
            tumHareketler.push({
              tip: "TAHSILAT YAPILDI",
              tutar: hareket.tutar,
              tarih: hareket.tarih,
              odemeTipi: hareket.odemeTipi,
              borcId: borc.id
            });
          }
          if (hareket.tip === "İNDİRİM") {
            tumHareketler.push({
              tip: "İNDİRİM YAPILDI",
              tutar: hareket.tutar,
              tarih: hareket.tarih,
              aciklama: hareket.aciklama,
              borcId: borc.id
            });
          }
        });
      }
    });
    
    // Eski tahsilatları ekle
    tahsilatlar.forEach(t => {
      tumHareketler.push({
        tip: "TAHSILAT YAPILDI",
        tutar: t.tutar,
        tarih: t.tarih,
        odemeTipi: t.odemeTipi,
        aciklama: t.aciklama
      });
    });
    
    // Tarihe göre sırala
    tumHareketler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    setTransactionHistory(tumHareketler);
    
    // Tahsilat tutarını net borç olarak ayarla
    setTahsilatTutar(customer.netBorc > 0 ? customer.netBorc.toFixed(2) : "");
    
    // İndirim tutarını sıfırla
    setIndirimTutar("");
    setIndirimNot("");
  };

  // --------------------------------------------------
  // BORÇ KAYDI SEÇİMİ
  // --------------------------------------------------
  const handleDebtRecordSelect = (record) => {
    setSelectedDebtRecord(record);
    setAdisyonDetails(record);
    
    // Eğer kayıt adisyon kaynağından geliyorsa
    if (record.tip === "ADISYON") {
      // Adisyon verilerini düzenle
      const adisyonData = {
        id: record.id,
        masaNo: record.masaNo,
        tutar: record.borcTutari,
        toplamTutar: record.toplamTutar || record.borcTutari,
        tarih: record.tarih,
        urunler: record.urunler || [],
        odemeDurumu: record.odemeDurumu || "ÖDENMEDİ",
        aciklama: record.aciklama || "",
        tip: record.tip
      };
      setAdisyonDetails(adisyonData);
    } else if (record.tip === "BORC") {
      // Borç kaynağından geliyorsa
      const borcData = {
        id: record.id,
        masaNo: record.masaNo,
        tutar: record.borcTutari,
        toplamTutar: record.toplamTutar || record.borcTutari,
        tarih: record.tarih,
        urunler: record.urunler || [],
        hareketler: record.hareketler || [],
        aciklama: record.aciklama || "",
        tip: record.tip
      };
      setAdisyonDetails(borcData);
    }
  };

  // --------------------------------------------------
  // ADISYON ÜRÜNLERİNİ HAZIRLA
  // --------------------------------------------------
  const prepareAdisyonProducts = (record) => {
    if (!record || !record.urunler || record.urunler.length === 0) {
      return [];
    }
    
    return record.urunler.map((urun, index) => {
      const birimFiyat = urun.birimFiyat || urun.fiyat || 0;
      const adet = urun.adet || urun.miktar || 1;
      const toplam = birimFiyat * adet;
      
      return {
        id: index,
        ad: urun.ad || urun.urunAd || "Ürün",
        birimFiyat: birimFiyat,
        adet: adet,
        toplam: toplam
      };
    });
  };

  // --------------------------------------------------
  // ADISYON TOPLAMLARINI HESAPLA (KDV ÇIKARILDI)
  // --------------------------------------------------
  const calculateAdisyonTotals = (products) => {
    const toplamTutar = products.reduce((sum, product) => sum + product.toplam, 0);
    
    return {
      toplamTutar: toplamTutar.toFixed(2),
      genelToplam: toplamTutar.toFixed(2)
    };
  };

  // --------------------------------------------------
  // TAHSILAT AL
  // --------------------------------------------------
  const handleCollectPayment = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    const tutar = Number(tahsilatTutar);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir tahsilat tutarı giriniz!");
      return;
    }
    
    if (tutar > selectedCustomer.netBorc) {
      alert("Tahsilat tutarı kalan borçtan fazla olamaz!");
      return;
    }
    
    // 1. TAHSILAT_KEY'e kaydet
    const yeniTahsilat = {
      id: `tah_${Date.now()}`,
      musteriId: selectedCustomer.id,
      musteriAdi: selectedCustomer.adSoyad,
      tutar: tutar,
      tip: tahsilatTipi,
      not: tahsilatNot.trim(),
      tarih: new Date().toISOString(),
      tarihStr: new Date().toLocaleDateString('tr-TR')
    };
    
    const mevcutTahsilatlar = okuJSON(TAHBILAT_KEY, []);
    mevcutTahsilatlar.push(yeniTahsilat);
    yazJSON(TAHBILAT_KEY, mevcutTahsilatlar);
    
    // 2. BORC_KEY'e ödeme kaydet
    const borclar = okuJSON(BORC_KEY, []);
    const musteriBorclari = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (musteriBorclari.length > 0) {
      const sonBorc = musteriBorclari[musteriBorclari.length - 1];
      const borcIndex = borclar.findIndex(b => b.id === sonBorc.id);
      
      if (borcIndex !== -1) {
        borclar[borcIndex] = {
          ...borclar[borcIndex],
          hareketler: [
            ...(borclar[borcIndex].hareketler || []),
            {
              tip: "ÖDEME ALINDI",
              tutar: tutar,
              tarih: new Date().toISOString(),
              aciklama: "Müşteri İşlemleri sayfasından tahsilat",
              odemeTipi: tahsilatTipi
            }
          ]
        };
        
        yazJSON(BORC_KEY, borclar);
      }
    }
    
    // 3. Müşteriyi güncelle
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const yeniNetBorc = Math.max(0, c.netBorc - tutar);
        
        return {
          ...c,
          netBorc: yeniNetBorc,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      return c;
    });
    
    // Sıralamayı güncelle
    updatedCustomers.sort((a, b) => {
      if (a.netBorc > 0 && b.netBorc === 0) return -1;
      if (a.netBorc === 0 && b.netBorc > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    // Seçili müşteriyi güncelle
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
    
    // İşlem geçmişini güncelle
    handleCustomerSelect(updatedCustomer);
    
    // Formu temizle
    setTahsilatTutar(updatedCustomer.netBorc > 0 ? updatedCustomer.netBorc.toFixed(2) : "");
    setTahsilatNot("");
    
    alert(`${tutar.toFixed(2)} ₺ tahsilat başarıyla alındı!`);
  };

  // --------------------------------------------------
  // İNDİRİM UYGULA
  // --------------------------------------------------
  const handleApplyDiscount = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    const tutar = Number(indirimTutar);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir indirim tutarı giriniz!");
      return;
    }
    
    if (tutar > selectedCustomer.netBorc) {
      alert("İndirim tutarı kalan borçtan fazla olamaz!");
      return;
    }
    
    // BORC_KEY'e indirim kaydet
    const borclar = okuJSON(BORC_KEY, []);
    const musteriBorclari = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (musteriBorclari.length > 0) {
      const sonBorc = musteriBorclari[musteriBorclari.length - 1];
      const borcIndex = borclar.findIndex(b => b.id === sonBorc.id);
      
      if (borcIndex !== -1) {
        borclar[borcIndex] = {
          ...borclar[borcIndex],
          hareketler: [
            ...(borclar[borcIndex].hareketler || []),
            {
              tip: "İNDİRİM",
              tutar: tutar,
              tarih: new Date().toISOString(),
              aciklama: indirimNot.trim() || "Müşteri İşlemleri sayfasından indirim",
              indirimTipi: "MANUEL"
            }
          ]
        };
        
        yazJSON(BORC_KEY, borclar);
      }
    }
    
    // Müşteriyi güncelle
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const yeniNetBorc = Math.max(0, c.netBorc - tutar);
        const yeniIndirim = (c.indirim || 0) + tutar;
        
        return {
          ...c,
          netBorc: yeniNetBorc,
          indirim: yeniIndirim,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      return c;
    });
    
    // Sıralamayı güncelle
    updatedCustomers.sort((a, b) => {
      if (a.netBorc > 0 && b.netBorc === 0) return -1;
      if (a.netBorc === 0 && b.netBorc > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    // Seçili müşteriyi güncelle
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
    
    // İşlem geçmişini güncelle
    handleCustomerSelect(updatedCustomer);
    
    // Formu temizle
    setIndirimTutar("");
    setIndirimNot("");
    
    alert(`${tutar.toFixed(2)} ₺ indirim başarıyla uygulandı!`);
  };

  // --------------------------------------------------
  // BORÇ TRANSFERİ MODALI AÇ
  // --------------------------------------------------
  const openTransferModal = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    setTransferModalOpen(true);
    setTransferTutar("");
    setTransferMusteriId("");
    setTransferMusteriAdi("");
    setTransferNot("");
  };

  // --------------------------------------------------
  // BORÇ TRANSFERİ YAP
  // --------------------------------------------------
  const handleTransferDebt = () => {
    if (!transferMusteriId) {
      alert("Lütfen bir müşteri seçiniz!");
      return;
    }
    
    const tutar = Number(transferTutar);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir transfer tutarı giriniz!");
      return;
    }
    
    if (tutar > selectedCustomer.netBorc) {
      alert("Transfer tutarı kalan borçtan fazla olamaz!");
      return;
    }
    
    // 1. Kaynak müşteriden borç düş
    const borclar = okuJSON(BORC_KEY, []);
    const kaynakBorclar = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (kaynakBorclar.length > 0) {
      const sonBorc = kaynakBorclar[kaynakBorclari.length - 1];
      const borcIndex = borclar.findIndex(b => b.id === sonBorc.id);
      
      if (borcIndex !== -1) {
        borclar[borcIndex] = {
          ...borclar[borcIndex],
          hareketler: [
            ...(borclar[borcIndex].hareketler || []),
            {
              tip: "BORÇ TRANSFERİ",
              tutar: -tutar, // Negatif çünkü borç azalıyor
              tarih: new Date().toISOString(),
              aciklama: `Transfer: ${transferMusteriAdi} müşterisine aktarıldı`,
              transferNot: transferNot.trim()
            }
          ]
        };
      }
    }
    
    // 2. Hedef müşteriye borç ekle
    const yeniBorcId = `transfer_${Date.now()}`;
    const yeniBorc = {
      id: yeniBorcId,
      musteriId: transferMusteriId,
      masaNo: "TRANSFER",
      urunler: [],
      tutar: tutar,
      acilisZamani: new Date().toISOString(),
      hareketler: [
        {
          tip: "BORÇ TRANSFERİ",
          tutar: tutar,
          tarih: new Date().toISOString(),
          aciklama: `${selectedCustomer.adSoyad} müşterisinden transfer`,
          transferNot: transferNot.trim()
        }
      ]
    };
    
    borclar.push(yeniBorc);
    yazJSON(BORC_KEY, borclar);
    
    // 3. Müşterileri güncelle
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        // Kaynak müşteri
        const yeniNetBorc = Math.max(0, c.netBorc - tutar);
        return {
          ...c,
          netBorc: yeniNetBorc,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      if (c.id === transferMusteriId) {
        // Hedef müşteri
        const yeniNetBorc = c.netBorc + tutar;
        return {
          ...c,
          netBorc: yeniNetBorc,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      return c;
    });
    
    // Sıralamayı güncelle
    updatedCustomers.sort((a, b) => {
      if (a.netBorc > 0 && b.netBorc === 0) return -1;
      if (a.netBorc === 0 && b.netBorc > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    // Seçili müşteriyi güncelle
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
    
    // Modalı kapat
    setTransferModalOpen(false);
    
    // İşlem geçmişini güncelle
    handleCustomerSelect(updatedCustomer);
    
    alert(`${tutar.toFixed(2)} ₺ borç ${transferMusteriAdi} müşterisine transfer edildi!`);
  };

  // --------------------------------------------------
  // TARİH FORMATLAMA
  // --------------------------------------------------
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --------------------------------------------------
  // TASARIM RENDER
  // --------------------------------------------------
  return (
    <div className="musteri-islemleri-v2">
      {/* BAŞLIK */}
      <div className="page-header">
        <h1>MÜŞTERİ İŞLEMLERİ</h1>
        <div className="role-badge">
          {role === "ADMIN" ? "ADMIN" : "GARSON"}
        </div>
      </div>
      
      {/* 3 KOLONLU ANA YAPI */}
      <div className="three-column-layout">
        {/* SOL KOLON - MÜŞTERİLER */}
        <div className="column customers-column">
          <div className="column-header">
            <h2>MÜŞTERİLER</h2>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="İsim veya telefon ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}>✕</button>
              )}
            </div>
          </div>
          
          <div className="customer-list">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <div 
                  key={customer.id}
                  className={`customer-card ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-info">
                    <div className="customer-name">{customer.adSoyad}</div>
                    <div className="customer-phone">{customer.telefon || "Telefon yok"}</div>
                  </div>
                  <div className="customer-balance">
                    {customer.netBorc > 0 ? (
                      <div className="balance-negative">-{customer.netBorc.toFixed(2)} ₺</div>
                    ) : (
                      <div className="balance-zero">0,00 ₺</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-list">
                {searchTerm ? "Aranan müşteri bulunamadı." : "Henüz müşteri kaydı yok."}
              </div>
            )}
          </div>
        </div>
        
        {/* ORTA KOLON - BORÇ KAYITLARI */}
        <div className="column debts-column">
          <div className="column-header">
            <h2>BORÇ KAYITLARI</h2>
            {selectedCustomer && (
              <div className="customer-summary">
                <span className="customer-name">{selectedCustomer.adSoyad}</span>
                <span className="total-debt">Toplam: {selectedCustomer.netBorc.toFixed(2)} ₺</span>
              </div>
            )}
          </div>
          
          {/* TRANSFER BUTTONU */}
          {selectedCustomer && selectedCustomer.netBorc > 0 && (
            <div className="transfer-button-container">
              <button 
                className="btn-transfer-open"
                onClick={openTransferModal}
                title="Bu müşterinin borcunu başka bir müşteriye aktar"
              >
                🔄 Borç Transferi
              </button>
            </div>
          )}
          
          <div className="debt-records">
            {selectedCustomer ? (
              debtRecords.length > 0 ? (
                debtRecords.map(record => (
                  <div 
                    key={record.id}
                    className={`debt-record ${selectedDebtRecord?.id === record.id ? 'selected' : ''}`}
                    onClick={() => handleDebtRecordSelect(record)}
                  >
                    <div className="debt-header">
                      <div className="table-info">
                        {record.masaNo === "BİLARDO" ? "🎱" : "🪑"} 
                        {record.masaNo === "TRANSFER" ? "🔄 Transfer" : ` Masa ${record.masaNo}`}
                      </div>
                      <div className="debt-amount">{record.borcTutari.toFixed(2)} ₺</div>
                    </div>
                    <div className="debt-date">
                      {formatDate(record.tarih)}
                    </div>
                    <div className="debt-status">
                      {record.hareketler?.some(h => h.tip === "İNDİRİM") && "🎁 İndirimli • "}
                      {record.hareketler?.some(h => h.tip === "ÖDEME ALINDI") ? "💰 Kısmen Ödendi" : "⏳ Ödenmedi"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-list">
                  Bu müşteriye ait borç kaydı bulunmuyor.
                </div>
              )
            ) : (
              <div className="empty-list">
                Müşteri seçiniz.
              </div>
            )}
          </div>
        </div>
        
        {/* SAĞ KOLON - DİKEY 2 BÖLMELİ */}
        <div className="details-column">
          
          {/* SOL BÖLÜM - ADISYON DETAYLARI */}
          <div className="adisyon-details-section">
            <div className="column-header">
              <h2>ADISYON DETAYLARI</h2>
            </div>
            
            <div className="adisyon-content">
              {adisyonDetails ? (
                <>
                  {/* ADISYON ÖZETİ */}
                  <div className="adisyon-summary">
                    <div className="adisyon-summary-header">
                      <div className="adisyon-table-info">
                        <div className="table-number">
                          {adisyonDetails.masaNo === "BİLARDO" ? "🎱" : "🪑"}
                          {adisyonDetails.masaNo === "TRANSFER" ? "🔄" : ` ${adisyonDetails.masaNo}`}
                        </div>
                        <div className="table-type">
                          {adisyonDetails.masaNo === "BİLARDO" ? "Bilardo" : 
                           adisyonDetails.masaNo === "TRANSFER" ? "Borç Transferi" : "Restaurant"}
                        </div>
                      </div>
                      <div className="adisyon-amount">
                        {adisyonDetails.toplamTutar.toFixed(2)} ₺
                      </div>
                    </div>
                    
                    <div className="adisyon-info-grid">
                      <div className="info-item">
                        <div className="info-label">Adisyon Tarihi</div>
                        <div className="info-value">{formatDate(adisyonDetails.tarih)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Adisyon Türü</div>
                        <div className="info-value">
                          {adisyonDetails.tip === "ADISYON" ? "🍽️ Restaurant" : "📝 Borç Kaydı"}
                        </div>
                      </div>
                      {adisyonDetails.aciklama && (
                        <div className="info-item" style={{ gridColumn: "span 2" }}>
                          <div className="info-label">Açıklama</div>
                          <div className="info-value">{adisyonDetails.aciklama}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* ÜRÜN LİSTESİ */}
                  <div className="products-list-section">
                    <h3>ÜRÜN LİSTESİ</h3>
                    
                    {adisyonDetails.urunler && adisyonDetails.urunler.length > 0 ? (
                      <>
                        <div className="products-list-container">
                          {/* ÜRÜN BAŞLIKLARI */}
                          <div className="product-row" style={{ 
                            background: "#e8f5e9", 
                            fontWeight: "bold",
                            position: "sticky",
                            top: 0,
                            zIndex: 1
                          }}>
                            <div className="product-name">Ürün Adı</div>
                            <div className="product-quantity">Adet</div>
                            <div className="product-price">Birim Fiyat</div>
                            <div className="product-total">Toplam</div>
                          </div>
                          
                          {/* ÜRÜNLER */}
                          {prepareAdisyonProducts(adisyonDetails).map(product => (
                            <div key={product.id} className="product-row">
                              <div className="product-name">{product.ad}</div>
                              <div className="product-quantity">{product.adet}</div>
                              <div className="product-price">{product.birimFiyat.toFixed(2)} ₺</div>
                              <div className="product-total">{product.toplam.toFixed(2)} ₺</div>
                            </div>
                          ))}
                        </div>
                        
                        {/* TOPLAMLAR - KDV ÇIKARILDI */}
                        <div className="adisyon-total">
                          <div className="total-item">
                            <div className="total-label">TOPLAM TUTAR</div>
                            <div className="total-value" style={{ color: "#d32f2f", fontSize: "24px" }}>
                              {calculateAdisyonTotals(prepareAdisyonProducts(adisyonDetails)).genelToplam} ₺
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="empty-adisyon">
                        <div>📄</div>
                        <div>Bu kayıtta ürün listesi bulunmuyor.</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-adisyon">
                  <div>📋</div>
                  <div>Borç kaydı seçiniz.</div>
                  <div style={{ fontSize: "12px", color: "#a1887f" }}>
                    Masa veya bilardo kaydı seçtiğinizde burada detaylar görünecektir.
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* SAĞ BÖLÜM - İŞLEM DETAYLARI */}
          <div className="islem-details-section">
            <div className="column-header">
              <h2>İŞLEM DETAYLARI</h2>
            </div>
            
            <div className="islem-content">
              {/* TAHSILAT ALANI */}
              <div className="payment-section">
                <h3>TAHSILAT</h3>
                <div className="payment-form">
                  <div className="form-group">
                    <label>Tutar (₺)</label>
                    <input 
                      type="number" 
                      placeholder="0,00" 
                      value={tahsilatTutar}
                      onChange={(e) => setTahsilatTutar(e.target.value)}
                      min="0.01"
                      step="0.01"
                      max={selectedCustomer?.netBorc || 0}
                      disabled={!selectedCustomer || selectedCustomer.netBorc <= 0}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ödeme Türü</label>
                    <div className="radio-options">
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="paymentType" 
                          value="NAKIT" 
                          checked={tahsilatTipi === "NAKIT"}
                          onChange={(e) => setTahsilatTipi(e.target.value)}
                        />
                        <span className="radio-custom"></span>
                        Nakit
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="paymentType" 
                          value="KART" 
                          checked={tahsilatTipi === "KART"}
                          onChange={(e) => setTahsilatTipi(e.target.value)}
                        />
                        <span className="radio-custom"></span>
                        Kart
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="paymentType" 
                          value="HAVALE" 
                          checked={tahsilatTipi === "HAVALE"}
                          onChange={(e) => setTahsilatTipi(e.target.value)}
                        />
                        <span className="radio-custom"></span>
                        Havale/EFT
                      </label>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Açıklama (Opsiyonel)</label>
                    <input 
                      type="text" 
                      placeholder="Tahsilat açıklaması..."
                      value={tahsilatNot}
                      onChange={(e) => setTahsilatNot(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className="btn-tahsilat"
                    onClick={handleCollectPayment}
                    disabled={!selectedCustomer || selectedCustomer.netBorc <= 0 || !tahsilatTutar}
                  >
                    💰 TAHSİL ET
                  </button>
                </div>
              </div>
              
              {/* İNDİRİM ALANI */}
              <div className="discount-section">
                <h3>İNDİRİM</h3>
                <div className="discount-form">
                  <div className="form-group">
                    <label>İndirim Tutarı (₺)</label>
                    <input 
                      type="number" 
                      placeholder="0,00" 
                      value={indirimTutar}
                      onChange={(e) => setIndirimTutar(e.target.value)}
                      min="0.01"
                      step="0.01"
                      max={selectedCustomer?.netBorc || 0}
                      disabled={!selectedCustomer || selectedCustomer.netBorc <= 0}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>İndirim Nedeni (Opsiyonel)</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Sadakat indirimi, hata düzeltme..."
                      value={indirimNot}
                      onChange={(e) => setIndirimNot(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className="btn-indirim"
                    onClick={handleApplyDiscount}
                    disabled={!selectedCustomer || selectedCustomer.netBorc <= 0 || !indirimTutar}
                  >
                    🎁 İNDİRİM UYGULA
                  </button>
                </div>
              </div>
              
              {/* BORÇ HAREKETLERİ */}
              {selectedCustomer && transactionHistory.length > 0 && (
                <div className="transactions-section">
                  <h3>BORÇ HAREKETLERİ</h3>
                  <div className="transactions-list">
                    {transactionHistory.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="transaction-item">
                        <div className={`transaction-type ${
                          transaction.tip.includes('İNDİRİM') ? 'type-discount' :
                          transaction.tip.includes('TAHSILAT') ? 'type-payment' :
                          transaction.tip.includes('BORÇ') ? 'type-debt' : ''
                        }`}>
                          {transaction.tip}
                        </div>
                        <div className={`transaction-amount ${
                          transaction.tip.includes('İNDİRİM') || transaction.tip.includes('TAHSILAT') ? 'amount-negative' : 'amount-positive'
                        }`}>
                          {transaction.tip.includes('İNDİRİM') || transaction.tip.includes('TAHSILAT') ? '-' : '+'}
                          {transaction.tutar.toFixed(2)} ₺
                        </div>
                        <div className="transaction-date">
                          {formatDate(transaction.tarih)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* BORÇ TRANSFER MODAL */}
      {transferModalOpen && (
        <div className="modal-overlay">
          <div className="transfer-modal">
            <div className="modal-header">
              <h3>BORÇ TRANSFERİ</h3>
              <button className="modal-close" onClick={() => setTransferModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transfer-info">
                <p>
                  <strong>Kaynak Müşteri:</strong> 
                  <span>{selectedCustomer?.adSoyad}</span>
                </p>
                <p>
                  <strong>Kalan Borç:</strong> 
                  <span>{selectedCustomer?.netBorc.toFixed(2)} ₺</span>
                </p>
              </div>
              
              <div className="form-group">
                <label>Transfer Tutarı (₺)</label>
                <input
                  type="number"
                  value={transferTutar}
                  onChange={(e) => setTransferTutar(e.target.value)}
                  placeholder="0,00"
                  min="0.01"
                  step="0.01"
                  max={selectedCustomer?.netBorc || 0}
                />
              </div>
              
              <div className="form-group">
                <label>Hedef Müşteri</label>
                {!transferMusteriId ? (
                  <div className="customer-select-box">
                    <div 
                      className="customer-select-btn"
                      onClick={() => {
                        const availableCustomers = customers.filter(c => c.id !== selectedCustomer?.id);
                        if (availableCustomers.length === 0) {
                          alert("Transfer edilebilecek başka müşteri bulunmuyor!");
                        }
                      }}
                    >
                      <span className="placeholder-text">Müşteri seçin...</span>
                      <span className="dropdown-icon">▼</span>
                    </div>
                    
                    <div className="customer-dropdown">
                      {customers
                        .filter(c => c.id !== selectedCustomer?.id)
                        .map(customer => (
                          <div 
                            key={customer.id}
                            className="dropdown-item"
                            onClick={() => {
                              setTransferMusteriId(customer.id);
                              setTransferMusteriAdi(customer.adSoyad);
                            }}
                          >
                            <div className="customer-name">{customer.adSoyad}</div>
                            <div className="customer-balance">
                              Borç: {customer.netBorc.toFixed(2)} ₺
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="selected-customer-display">
                    <span>{transferMusteriAdi}</span>
                    <button 
                      className="btn-change-customer"
                      onClick={() => {
                        setTransferMusteriId("");
                        setTransferMusteriAdi("");
                      }}
                    >
                      Değiştir
                    </button>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Açıklama (Opsiyonel)</label>
                <textarea
                  value={transferNot}
                  onChange={(e) => setTransferNot(e.target.value)}
                  placeholder="Transfer açıklaması..."
                  rows="2"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setTransferModalOpen(false)}
                >
                  İptal
                </button>
                <button 
                  className="btn-transfer"
                  onClick={handleTransferDebt}
                  disabled={!transferTutar || !transferMusteriId}
                >
                  TRANSFER ET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}