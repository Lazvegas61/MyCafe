/* ============================================================
   📄 DOSYA: MusteriIslemleri.jsx
   📌 AMAÇ:
   MyCafe — Müşteri İşlemleri (Hesaba Yaz & Tahsilat) sayfası.
   - Müşteri birden fazla masada hesap açabilir (farklı günler)
   - Tahsilat toplam borç üzerinden yapılır
   - Borcu 0 olan müşteriler en altta
   - İndirim uygulama özelliği
   - İsim/telefon filtreleme
   - Adisyon içeriği görüntüleme
============================================================ */

import React, { useState, useEffect } from "react";
import "./MusteriIslemleri.css";

// LocalStorage key'leri
const MUSTERI_KEY = "mc_musteriler";
const ADISYON_KEY = "mc_adisyonlar";
const TAHBILAT_KEY = "mc_tahbilat";
const USER_KEY = "mc_user";
const MASALAR_KEY = "mc_masalar";
const BORC_KEY = "mc_borclar"; // ADISYONDAN GELEN BORÇLAR İÇİN

export default function MusteriIslemleri() {
  // --------------------------------------------------
  // STATE TANIMLARI
  // --------------------------------------------------
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [role, setRole] = useState("ADMIN"); // ADMIN | GARSON
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAdisyon, setSelectedAdisyon] = useState(null); // Seçili adisyon detayı
  const [adisyonDetayModal, setAdisyonDetayModal] = useState(false); // Adisyon detay modalı
  
  // Filtreleme
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, has-debt, no-debt
  
  // Yeni Müşteri
  const [yeniMusteriAdSoyad, setYeniMusteriAdSoyad] = useState("");
  const [yeniMusteriTelefon, setYeniMusteriTelefon] = useState("");
  const [yeniMusteriNot, setYeniMusteriNot] = useState("");
  
  // İndirim
  const [indirimTutari, setIndirimTutari] = useState("");
  
  // Tahsilat
  const [tahsilatTutar, setTahsilatTutar] = useState("");
  const [tahsilatTipi, setTahsilatTipi] = useState("NAKIT");
  const [tahsilatNot, setTahsilatNot] = useState("");
  
  // Müşteri Notu
  const [musteriNotu, setMusteriNotu] = useState("");

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
  // İNİTİAL LOAD - GÜNCELLENDİ: ADISYON ve BORC_KEY BİRLİKTE OKU
  // --------------------------------------------------
  useEffect(() => {
    const user = okuJSON(USER_KEY, {});
    setRole(user.role || "ADMIN");
    
    const musteriler = okuJSON(MUSTERI_KEY, []);
    
    // Borçları hesapla ve sırala
    const musterilerBorclu = musteriler.map(musteri => {
      // 1. ADİSYON_KEY'den borçları hesapla (eski sistem)
      const adisyonlar = okuJSON(ADISYON_KEY, []).filter(a => a.musteriId === musteri.id);
      
      // 2. BORC_KEY'den borçları hesapla (Adisyon.jsx'ten gelen yeni sistem)
      const borclar = okuJSON(BORC_KEY, []).filter(b => b.musteriId === musteri.id);
      
      let toplamBorcAdisyon = 0;
      let toplamBorcYeni = 0;
      let toplamOdemeYeni = 0;
      
      // Adisyonlardan borç hesapla - HESABA YAZ yapılmış kısımlar
      adisyonlar.forEach(adisyon => {
        if (adisyon.hesabaYazilanTutar) {
          toplamBorcAdisyon += adisyon.hesabaYazilanTutar;
        }
      });
      
      // Yeni borç sisteminden hesapla
      borclar.forEach(borc => {
        // Toplam borç
        toplamBorcYeni += Number(borc.tutar || 0);
        
        // Ödenen kısım
        if (borc.hareketler) {
          borc.hareketler.forEach(h => {
            if (h.tip === "ÖDEME ALINDI") {
              toplamOdemeYeni += Number(h.tutar || 0);
            }
          });
        }
      });
      
      // Eski tahsilatları düş (ADISYON sistemi için)
      const tahsilatlar = okuJSON(TAHBILAT_KEY, []).filter(t => t.musteriId === musteri.id);
      const toplamTahsilat = tahsilatlar.reduce((sum, t) => sum + (t.tutar || 0), 0);
      
      // TOPLAM BORÇ = İki sistemden gelen borçlar
      const toplamBorc = toplamBorcAdisyon + toplamBorcYeni;
      
      // TOPLAM ÖDEME = İki sistemden gelen ödemeler
      const toplamOdeme = toplamTahsilat + toplamOdemeYeni;
      
      // İndirimleri kontrol et
      let toplamIndirim = 0;
      if (musteri.indirimler) {
        toplamIndirim = musteri.indirimler.reduce((sum, i) => sum + (i.tutar || 0), 0);
      }
      
      const netBorc = Math.max(0, toplamBorc - toplamIndirim - toplamOdeme);
      
      // Tüm adisyonları birleştir
      const tumAdisyonlar = [
        ...adisyonlar,
        ...borclar.map(borc => ({
          ...borc,
          id: borc.id,
          masaNo: borc.masaNo || "-",
          tarih: borc.acilisZamani,
          toplamTutar: borc.tutar,
          hesabaYazilanTutar: borc.tutar,
          urunler: borc.urunler || [],
          not: borc.hareketler?.[0]?.aciklama || "",
          isBorcKey: true // İşaretleyici
        }))
      ];
      
      return {
        ...musteri,
        toplamBorc: toplamBorc,
        indirim: toplamIndirim,
        netBorc: netBorc,
        adisyonSayisi: tumAdisyonlar.length,
        sonIslemTarihi: musteri.sonIslemTarihi || musteri.created_at,
        aktifAdisyonlar: tumAdisyonlar.filter(a => 
          (a.hesabaYazilanTutar > 0 || a.tutar > 0) && 
          (!a.kapali && a.kapali !== true)
        ),
        tumAdisyonlar: tumAdisyonlar // Tüm adisyonları sakla
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
  }, []);

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
    
    // Borç durumu filtresi
    if (filterType === "has-debt") {
      filtered = filtered.filter(customer => customer.netBorc > 0);
    } else if (filterType === "no-debt") {
      filtered = filtered.filter(customer => customer.netBorc === 0);
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, filterType, customers]);

  // --------------------------------------------------
  // ADİSYON İÇERİĞİ GÖRÜNTÜLE - GÜNCELLENDİ
  // --------------------------------------------------
  const handleShowAdisyonDetay = (adisyon) => {
    // Eğer bu BORC_KEY'den gelen bir adisyonsa
    if (adisyon.isBorcKey) {
      setSelectedAdisyon({
        ...adisyon,
        masaNo: adisyon.masaNo || "-",
        tarih: adisyon.tarih || adisyon.acilisZamani,
        toplamTutar: adisyon.tutar || adisyon.hesabaYazilanTutar || 0,
        hesabaYazilanTutar: adisyon.tutar || adisyon.hesabaYazilanTutar || 0,
        urunler: adisyon.urunler || [],
        not: adisyon.not || adisyon.hareketler?.[0]?.aciklama || ""
      });
    } else {
      // Normal ADISYON_KEY'den gelen adisyon
      setSelectedAdisyon(adisyon);
    }
    setAdisyonDetayModal(true);
  };

  // --------------------------------------------------
  // MÜŞTERİ SEÇİMİ - GÜNCELLENDİ
  // --------------------------------------------------
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setMusteriNotu(customer.not || "");
    
    // Müşterinin tüm işlem geçmişini yükle
    const adisyonlar = okuJSON(ADISYON_KEY, [])
      .filter(a => a.musteriId === customer.id)
      .sort((a, b) => new Date(b.tarih || b.acilisZamani) - new Date(a.tarih || a.acilisZamani));
    
    const tahsilatlar = okuJSON(TAHBILAT_KEY, [])
      .filter(t => t.musteriId === customer.id)
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    // BORC_KEY'den işlemleri al
    const borclar = okuJSON(BORC_KEY, [])
      .filter(b => b.musteriId === customer.id)
      .sort((a, b) => new Date(b.acilisZamani) - new Date(a.acilisZamani));
    
    const tumIslemler = [];
    
    // 1. ADİSYON_KEY'den gelen adisyonları ekle
    adisyonlar.forEach(adisyon => {
      if (adisyon.hesabaYazilanTutar > 0) {
        tumIslemler.push({
          id: `adisyon_${adisyon.id}`,
          tarih: new Date(adisyon.tarih || adisyon.acilisZamani).toLocaleDateString('tr-TR'),
          masaNo: adisyon.masaNo || "-",
          aciklama: adisyon.urunler?.map(u => u.ad || u.urunAd).slice(0, 3).join(", ") + (adisyon.urunler?.length > 3 ? "..." : ""),
          tutar: `+${adisyon.hesabaYazilanTutar.toFixed(2)} ₺`,
          odemeYontemi: "Adisyon",
          tahsilatTutari: "-",
          kalanBorc: calculateRemainingDebtUpTo(adisyon.tarih || adisyon.acilisZamani, customer.id),
          type: "ADISYON",
          adisyonId: adisyon.id,
          adisyonData: adisyon
        });
      }
    });
    
    // 2. BORC_KEY'den gelen borç kayıtlarını ekle
    borclar.forEach(borc => {
      if (borc.tutar > 0) {
        tumIslemler.push({
          id: `borc_${borc.id}`,
          tarih: new Date(borc.acilisZamani).toLocaleDateString('tr-TR'),
          masaNo: borc.masaNo || "-",
          aciklama: borc.hareketler?.[0]?.aciklama || "Hesaba Yazılan Borç",
          tutar: `+${borc.tutar.toFixed(2)} ₺`,
          odemeYontemi: "Hesaba Yaz",
          tahsilatTutari: "-",
          kalanBorc: calculateRemainingDebtUpTo(borc.acilisZamani, customer.id),
          type: "BORC",
          adisyonId: borc.id,
          adisyonData: {
            ...borc,
            masaNo: borc.masaNo || "-",
            toplamTutar: borc.tutar,
            hesabaYazilanTutar: borc.tutar,
            urunler: borc.urunler || [],
            not: borc.hareketler?.[0]?.aciklama || ""
          }
        });
        
        // Borçtan yapılan ödemeleri ekle
        if (borc.hareketler) {
          borc.hareketler.forEach((hareket, index) => {
            if (hareket.tip === "ÖDEME ALINDI") {
              tumIslemler.push({
                id: `borc_odeme_${borc.id}_${index}`,
                tarih: new Date(hareket.tarih).toLocaleDateString('tr-TR'),
                masaNo: "-",
                aciklama: "BORÇ ÖDEMESİ",
                tutar: `-${hareket.tutar.toFixed(2)} ₺`,
                odemeYontemi: hareket.odemeTipi || "Nakit",
                tahsilatTutari: `${hareket.tutar.toFixed(2)} ₺`,
                kalanBorc: calculateRemainingDebtUpTo(hareket.tarih, customer.id),
                type: "TAHSILAT"
              });
            }
          });
        }
      }
    });
    
    // 3. Eski TAHSİLAT_KEY'den gelen tahsilatları ekle
    tahsilatlar.forEach(tahsilat => {
      tumIslemler.push({
        id: `tahsilat_${tahsilat.id}`,
        tarih: new Date(tahsilat.tarih).toLocaleDateString('tr-TR'),
        masaNo: "-",
        aciklama: "TAHSİLAT",
        tutar: `-${tahsilat.tutar.toFixed(2)} ₺`,
        odemeYontemi: tahsilat.tip,
        tahsilatTutari: `${tahsilat.tutar.toFixed(2)} ₺`,
        kalanBorc: calculateRemainingDebtUpTo(tahsilat.tarih, customer.id),
        type: "TAHSILAT"
      });
    });
    
    // 4. İndirimleri ekle
    if (customer.indirimler) {
      customer.indirimler.forEach((indirim, index) => {
        tumIslemler.push({
          id: `indirim_${customer.id}_${index}`,
          tarih: new Date(indirim.tarih).toLocaleDateString('tr-TR'),
          masaNo: "-",
          aciklama: "İNDİRİM",
          tutar: `-${indirim.tutar.toFixed(2)} ₺`,
          odemeYontemi: "-",
          tahsilatTutari: "-",
          kalanBorc: calculateRemainingDebtUpTo(indirim.tarih, customer.id),
          type: "INDIRIM"
        });
      });
    }
    
    // Tarihe göre sırala
    tumIslemler.sort((a, b) => new Date(b.tarih.split('.').reverse().join('-')) - 
                             new Date(a.tarih.split('.').reverse().join('-')));
    
    setTransactions(tumIslemler);
    
    // Tahsilat tutarını net borç olarak ayarla
    setTahsilatTutar(customer.netBorc.toFixed(2));
  };

  // --------------------------------------------------
  // KALAN BORÇ HESAPLAMA (belirli tarihe kadar) - GÜNCELLENDİ
  // --------------------------------------------------
  const calculateRemainingDebtUpTo = (tarih, musteriId) => {
    const customer = customers.find(c => c.id === musteriId);
    if (!customer) return 0;
    
    // Tarih formatını düzelt
    const targetDate = new Date(tarih);
    
    // ADİSYON_KEY'den borçlar
    const adisyonlar = okuJSON(ADISYON_KEY, [])
      .filter(a => a.musteriId === musteriId && 
              new Date(a.tarih || a.acilisZamani) <= targetDate &&
              (a.hesabaYazilanTutar > 0));
    
    // BORC_KEY'den borçlar
    const borclar = okuJSON(BORC_KEY, [])
      .filter(b => b.musteriId === musteriId && 
              new Date(b.acilisZamani) <= targetDate);
    
    // TAHSİLAT_KEY'den ödemeler
    const tahsilatlar = okuJSON(TAHBILAT_KEY, [])
      .filter(t => t.musteriId === musteriId && new Date(t.tarih) <= targetDate);
    
    let toplamBorc = 0;
    
    // Adisyon borçlarını ekle
    toplamBorc += adisyonlar.reduce((sum, a) => sum + (a.hesabaYazilanTutar || 0), 0);
    
    // Yeni borç sistemini ekle
    toplamBorc += borclar.reduce((sum, b) => sum + (b.tutar || 0), 0);
    
    // Toplam tahsilatı hesapla
    let toplamTahsilat = tahsilatlar.reduce((sum, t) => sum + (t.tutar || 0), 0);
    
    // BORC_KEY'den gelen ödemeleri de ekle
    borclar.forEach(borc => {
      if (borc.hareketler) {
        const borcOdemeleri = borc.hareketler
          .filter(h => h.tip === "ÖDEME ALINDI" && new Date(h.tarih) <= targetDate)
          .reduce((sum, h) => sum + (h.tutar || 0), 0);
        toplamTahsilat += borcOdemeleri;
      }
    });
    
    // İndirimleri düş
    const customerData = customers.find(c => c.id === musteriId);
    if (customerData && customerData.indirimler) {
      const indirimlerBuTariheKadar = customerData.indirimler.filter(
        i => new Date(i.tarih) <= targetDate
      );
      const toplamIndirim = indirimlerBuTariheKadar.reduce((sum, i) => sum + (i.tutar || 0), 0);
      toplamBorc -= toplamIndirim;
    }
    
    return Math.max(0, toplamBorc - toplamTahsilat);
  };

  // --------------------------------------------------
  // YENİ MÜŞTERİ EKLE
  // --------------------------------------------------
  const handleNewCustomer = () => {
    if (!yeniMusteriAdSoyad.trim()) {
      alert("Ad Soyad zorunludur!");
      return;
    }
    
    if (!yeniMusteriTelefon.trim()) {
      alert("Telefon numarası zorunludur!");
      return;
    }
    
    // Telefon benzersiz olmalı
    const existingCustomer = customers.find(c => 
      c.telefon === yeniMusteriTelefon.trim()
    );
    
    if (existingCustomer) {
      alert("Bu telefon numarası zaten kayıtlı!");
      return;
    }
    
    const newCustomer = {
      id: `cust_${Date.now()}`,
      adSoyad: yeniMusteriAdSoyad.trim(),
      telefon: yeniMusteriTelefon.trim(),
      not: yeniMusteriNot.trim(),
      created_at: new Date().toISOString(),
      sonIslemTarihi: new Date().toISOString(),
      toplamBorc: 0,
      indirim: 0,
      netBorc: 0,
      indirimler: [],
      adisyonSayisi: 0,
      aktifAdisyonlar: [],
      tumAdisyonlar: []
    };
    
    const updatedCustomers = [...customers, newCustomer];
    
    // Yeniden sırala
    updatedCustomers.sort((a, b) => {
      if (a.netBorc > 0 && b.netBorc === 0) return -1;
      if (a.netBorc === 0 && b.netBorc > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    // Otomatik seç
    handleCustomerSelect(newCustomer);
    
    // Formu temizle
    setYeniMusteriAdSoyad("");
    setYeniMusteriTelefon("");
    setYeniMusteriNot("");
    
    alert("Yeni müşteri başarıyla eklendi!");
  };

  // --------------------------------------------------
  // İNDİRİM UYGULA
  // --------------------------------------------------
  const handleApplyDiscount = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    const tutar = Number(indirimTutari);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir indirim tutarı giriniz!");
      return;
    }
    
    if (tutar > selectedCustomer.netBorc) {
      alert("İndirim tutarı borç tutarından fazla olamaz!");
      return;
    }
    
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const yeniIndirimler = [...(c.indirimler || []), {
          tutar: tutar,
          tarih: new Date().toISOString(),
          aciklama: "Manuel indirim"
        }];
        
        const yeniIndirimToplam = yeniIndirimler.reduce((sum, i) => sum + i.tutar, 0);
        const yeniNetBorc = Math.max(0, c.toplamBorc - yeniIndirimToplam);
        
        return {
          ...c,
          indirimler: yeniIndirimler,
          indirim: yeniIndirimToplam,
          netBorc: yeniNetBorc
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
    setIndirimTutari("");
    
    alert(`${tutar.toFixed(2)} ₺ indirim başarıyla uygulandı!`);
  };

  // --------------------------------------------------
  // TAHSİLAT AL - GÜNCELLENDİ: BORC_KEY'E DE ÖDEME KAYDET
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
    
    // 1. TAHSİLAT_KEY'e kaydet (eski sistem)
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
    
    // 2. BORC_KEY'e de ödeme kaydet (yeni sistem)
    const borclar = okuJSON(BORC_KEY, []);
    const musteriBorclari = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (musteriBorclari.length > 0) {
      // En son borcu bul
      const sonBorc = musteriBorclari[musteriBorclari.length - 1];
      const borcIndex = borclar.findIndex(b => b.id === sonBorc.id);
      
      if (borcIndex !== -1) {
        // Borca ödeme hareketi ekle
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
    
    // 3. Müşterinin net borcunu güncelle
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
    setTahsilatTutar(updatedCustomer.netBorc.toFixed(2));
    setTahsilatNot("");
    
    alert(`${tutar.toFixed(2)} ₺ tahsilat başarıyla alındı!`);
  };

  // --------------------------------------------------
  // MÜŞTERİ SİL
  // --------------------------------------------------
  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    
    if (selectedCustomer.netBorc > 0) {
      alert("Borcu olan müşteri silinemez! Önce borçlarını kapatın.");
      return;
    }
    
    if (!window.confirm(`${selectedCustomer.adSoyad} müşterisini silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    // Müşteriyi listeden kaldır
    const updatedCustomers = customers.filter(c => c.id !== selectedCustomer.id);
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    // Seçili müşteriyi temizle
    setSelectedCustomer(null);
    setTransactions([]);
    setMusteriNotu("");
    setTahsilatTutar("");
    
    alert("Müşteri başarıyla silindi!");
  };

  // --------------------------------------------------
  // MÜŞTERİ NOTU GÜNCELLE
  // --------------------------------------------------
  const handleUpdateNote = () => {
    if (!selectedCustomer) return;
    
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          not: musteriNotu.trim()
        };
      }
      return c;
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
  };

  // --------------------------------------------------
  // MÜŞTERİ ADİSYONLARINI GETİR - GÜNCELLENDİ
  // --------------------------------------------------
  const getCustomerAdisyonlar = (customerId) => {
    // ADİSYON_KEY'den al
    const adisyonlar = okuJSON(ADISYON_KEY, [])
      .filter(a => a.musteriId === customerId && a.hesabaYazilanTutar > 0)
      .sort((a, b) => new Date(b.tarih || b.acilisZamani) - new Date(a.tarih || a.acilisZamani));
    
    // BORC_KEY'den de al
    const borclar = okuJSON(BORC_KEY, [])
      .filter(b => b.musteriId === customerId)
      .map(borc => ({
        id: borc.id,
        masaNo: borc.masaNo || "-",
        tarih: borc.acilisZamani,
        toplamTutar: borc.tutar,
        hesabaYazilanTutar: borc.tutar,
        urunler: borc.urunler || [],
        not: borc.hareketler?.[0]?.aciklama || "",
        isBorcKey: true // İşaretleyici
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    return [...adisyonlar, ...borclar];
  };

  // --------------------------------------------------
  // ADİSYON DETAY MODALI - GÜNCELLENDİ
  // --------------------------------------------------
  const renderAdisyonDetayModal = () => {
    if (!adisyonDetayModal || !selectedAdisyon) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Adisyon Detayı</h3>
            <button 
              className="modal-close"
              onClick={() => setAdisyonDetayModal(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="modal-body">
            <div className="adisyon-info">
              <p><strong>Masa No:</strong> {selectedAdisyon.masaNo || "-"}</p>
              <p><strong>Tarih:</strong> {new Date(selectedAdisyon.tarih || selectedAdisyon.acilisZamani).toLocaleDateString('tr-TR')}</p>
              <p><strong>Toplam Tutar:</strong> {(selectedAdisyon.toplamTutar || selectedAdisyon.tutar || 0).toFixed(2)} ₺</p>
              <p><strong>Hesaba Yazılan:</strong> {(selectedAdisyon.hesabaYazilanTutar || selectedAdisyon.tutar || 0).toFixed(2)} ₺</p>
              {selectedAdisyon.toplamTutar && (
                <p><strong>Kalan:</strong> {(selectedAdisyon.toplamTutar - (selectedAdisyon.hesabaYazilanTutar || 0)).toFixed(2)} ₺</p>
              )}
            </div>
            
            {selectedAdisyon.urunler && selectedAdisyon.urunler.length > 0 && (
              <div className="urunler-listesi">
                <h4>Ürünler</h4>
                <table className="urunler-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>Birim Fiyat</th>
                      <th>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAdisyon.urunler.map((urun, index) => (
                      <tr key={index}>
                        <td>{urun.ad || urun.urunAd}</td>
                        <td>{urun.adet || urun.miktar || 1}</td>
                        <td>{(urun.birimFiyat || urun.fiyat || 0).toFixed(2)} ₺</td>
                        <td>{((urun.birimFiyat || urun.fiyat || 0) * (urun.adet || urun.miktar || 1)).toFixed(2)} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Toplam:</strong></td>
                      <td><strong>{(selectedAdisyon.toplamTutar || selectedAdisyon.tutar || 0).toFixed(2)} ₺</strong></td>
                    </tr>
                    {selectedAdisyon.hesabaYazilanTutar > 0 && (
                      <tr>
                        <td colSpan="3"><strong>Hesaba Yazılan:</strong></td>
                        <td><strong style={{color: "#8b4513"}}>{(selectedAdisyon.hesabaYazilanTutar || selectedAdisyon.tutar || 0).toFixed(2)} ₺</strong></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}
            
            {(selectedAdisyon.not || selectedAdisyon.hareketler?.[0]?.aciklama) && (
              <div className="adisyon-not">
                <h4>Not</h4>
                <p>{selectedAdisyon.not || selectedAdisyon.hareketler?.[0]?.aciklama}</p>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn-primary"
              onClick={() => setAdisyonDetayModal(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="musteri-islemleri-container">
      {/* BAŞLIK */}
      <h1 className="page-title">MÜŞTERİ İŞLEMLERİ</h1>
      
      {/* ROL GÖSTERİMİ */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "24px",
        background: role === "ADMIN" ? "#4caf50" : "#ff9800",
        color: "white",
        padding: "6px 16px",
        borderRadius: "20px",
        fontWeight: "bold",
        fontSize: "14px"
      }}>
        {role === "ADMIN" ? "ADMIN" : "GARSON"}
      </div>

      {/* ÜST PANEL */}
      <div className="panel-top">
        {/* MÜŞTERİ LİSTESİ */}
        <div className="panel customers">
          <h2>MÜŞTERİ LİSTESİ</h2>
          
          {/* FİLTRE BUTONLARI */}
          <div className="filter-buttons">
            <button 
              className={filterType === "all" ? "active" : ""}
              onClick={() => setFilterType("all")}
            >
              Tümü
            </button>
            <button 
              className={filterType === "has-debt" ? "active" : ""}
              onClick={() => setFilterType("has-debt")}
            >
              Borçlu
            </button>
            <button 
              className={filterType === "no-debt" ? "active" : ""}
              onClick={() => setFilterType("no-debt")}
            >
              Borçsuz
            </button>
          </div>
          
          {/* ARAMA */}
          <div className="search-container">
            <input 
              type="text" 
              placeholder="İsim veya telefon ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                Temizle
              </button>
            )}
          </div>
          
          {/* MÜŞTERİ LİSTESİ */}
          <div className="customer-list-container">
            {filteredCustomers.length > 0 ? (
              <ul>
                {filteredCustomers.map(customer => (
                  <li 
                    key={customer.id}
                    className={selectedCustomer?.id === customer.id ? "active" : ""}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="customer-info">
                      <div className="name">{customer.adSoyad}</div>
                      <div className="phone">{customer.telefon}</div>
                      {customer.adisyonSayisi > 0 && (
                        <div className="adisyon-count">
                          {customer.adisyonSayisi} adisyon
                        </div>
                      )}
                    </div>
                    <div className={`debt-amount ${customer.netBorc > 0 ? "has-debt" : "no-debt"}`}>
                      {customer.netBorc > 0 ? `${customer.netBorc.toFixed(2)} ₺` : "Borç Yok"}
                    </div>
                    {customer.netBorc === 0 && (
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const tempSelected = customer;
                          setSelectedCustomer(tempSelected);
                          setTimeout(() => handleDeleteCustomer(), 100);
                        }}
                        title="Müşteriyi Sil"
                      >
                        🗑️
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                {searchTerm ? "Aranan kriterlere uygun müşteri bulunamadı." : "Henüz müşteri kaydı yok."}
              </div>
            )}
          </div>
          
          {/* YENİ MÜŞTERİ EKLE FORMU */}
          <div style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f8f3e9",
            borderRadius: "12px",
            border: "1px dashed #d2b295"
          }}>
            <h3 style={{marginBottom: "10px", fontSize: "16px"}}>YENİ MÜŞTERİ</h3>
            <input 
              type="text" 
              placeholder="Ad Soyad *" 
              value={yeniMusteriAdSoyad}
              onChange={(e) => setYeniMusteriAdSoyad(e.target.value)}
              style={{marginBottom: "8px", width: "100%"}}
            />
            <input 
              type="tel" 
              placeholder="Telefon *" 
              value={yeniMusteriTelefon}
              onChange={(e) => setYeniMusteriTelefon(e.target.value)}
              style={{marginBottom: "8px", width: "100%"}}
            />
            <input 
              type="text" 
              placeholder="Not (opsiyonel)" 
              value={yeniMusteriNot}
              onChange={(e) => setYeniMusteriNot(e.target.value)}
              style={{marginBottom: "8px", width: "100%"}}
            />
            <button 
              className="btn-add"
              onClick={handleNewCustomer}
            >
              + YENİ MÜŞTERİ EKLE
            </button>
          </div>
        </div>

        {/* MÜŞTERİ DETAY */}
        <div className="panel detail">
          {selectedCustomer ? (
            <>
              <h2>MÜŞTERİ DETAYI</h2>
              <p><strong>Ad Soyad:</strong> {selectedCustomer.adSoyad}</p>
              <p><strong>Telefon:</strong> {selectedCustomer.telefon}</p>
              
              {/* BORÇ BİLGİSİ */}
              <div className="debt-container">
                <div className="current-debt">
                  Mevcut Toplam Borç: {selectedCustomer.netBorc.toFixed(2)} ₺
                </div>
                
                {/* İNDİRİM */}
                <div className="discount-section">
                  <input 
                    type="number"
                    placeholder="İndirim Tutarı ₺"
                    value={indirimTutari}
                    onChange={(e) => setIndirimTutari(e.target.value)}
                    min="0.01"
                    step="0.01"
                    disabled={selectedCustomer.netBorc <= 0}
                  />
                  <button 
                    onClick={handleApplyDiscount}
                    disabled={!indirimTutari || selectedCustomer.netBorc <= 0}
                  >
                    İNDİRİM UYGULA
                  </button>
                </div>
                
                {selectedCustomer.indirim > 0 && (
                  <div className="after-discount">
                    Toplam İndirim: {selectedCustomer.indirim.toFixed(2)} ₺
                  </div>
                )}
              </div>
              
              {/* ADİSYON LİSTESİ */}
              {getCustomerAdisyonlar(selectedCustomer.id).length > 0 && (
                <div className="accounts-list">
                  <h4 style={{marginBottom: "10px", color: "#5a3921"}}>HESABA YAZILAN ADİSYONLAR</h4>
                  {getCustomerAdisyonlar(selectedCustomer.id)
                    .filter(a => a.hesabaYazilanTutar > 0 || a.tutar > 0)
                    .map(adisyon => (
                      <div key={adisyon.id} className="account-item" 
                        onClick={() => handleShowAdisyonDetay(adisyon)}
                        style={{cursor: 'pointer'}}>
                        <div className="account-info">
                          <div style={{fontWeight: 'bold'}}>
                            {adisyon.isBorcKey ? '📋 ' : ''}Masa {adisyon.masaNo || "-"}
                          </div>
                          <div style={{fontSize: '12px', color: '#666'}}>
                            {new Date(adisyon.tarih || adisyon.acilisZamani).toLocaleDateString('tr-TR')}
                          </div>
                          <div style={{fontSize: '12px', color: '#888'}}>
                            {adisyon.urunler?.slice(0, 2).map(u => u.ad || u.urunAd).join(", ")}
                            {adisyon.urunler?.length > 2 ? "..." : ""}
                            {!adisyon.urunler && adisyon.not && (
                              <div>{adisyon.not.substring(0, 30)}...</div>
                            )}
                          </div>
                        </div>
                        <div className="account-amount">
                          <div style={{fontWeight: 'bold'}}>
                            {(adisyon.hesabaYazilanTutar || adisyon.tutar || 0).toFixed(2)} ₺
                          </div>
                          {adisyon.toplamTutar && (
                            <div style={{fontSize: '11px', color: '#666'}}>
                              Adisyon: {adisyon.toplamTutar.toFixed(2)} ₺
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                  {getCustomerAdisyonlar(selectedCustomer.id).filter(a => a.hesabaYazilanTutar > 0 || a.tutar > 0).length === 0 && (
                    <div style={{textAlign: "center", color: "#888", padding: "10px"}}>
                      Hesaba yazılan adisyon bulunmuyor
                    </div>
                  )}
                  <div className="total-accounts">
                    Toplam Adisyon: {selectedCustomer.adisyonSayisi} adet
                  </div>
                </div>
              )}
              
              {/* BİLGİ KUTUSU */}
              <div className="info-box">
                <p><strong>Kayıt Tarihi:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString('tr-TR')}</p>
                <p><strong>Son İşlem:</strong> {selectedCustomer.sonIslemTarihi ? 
                  new Date(selectedCustomer.sonIslemTarihi).toLocaleDateString('tr-TR') : "Henüz işlem yok"}</p>
              </div>
              
              {/* MÜŞTERİ NOTU */}
              <textarea 
                placeholder="Müşteri için not ekle (opsiyonel)" 
                value={musteriNotu}
                onChange={(e) => setMusteriNotu(e.target.value)}
                onBlur={handleUpdateNote}
                rows="3"
              />
              
              {/* SİLME BUTONU */}
              <button 
                className="delete-customer-btn"
                onClick={handleDeleteCustomer}
                disabled={selectedCustomer.netBorc > 0}
              >
                {selectedCustomer.netBorc > 0 ? "BORÇLU MÜŞTERİ SİLİNEMEZ" : "MÜŞTERİYİ SİL"}
              </button>
            </>
          ) : (
            <div className="empty">Müşteri seçiniz</div>
          )}
        </div>
      </div>

      {/* TAHSİLAT PANELİ */}
      <div className="panel-bottom">
        <div className="panel">
          <h2>TAHSİLAT AL</h2>
          
          {!selectedCustomer ? (
            <div className="warning">⚠️ Önce bir müşteri seçiniz</div>
          ) : selectedCustomer.netBorc <= 0 ? (
            <div className="warning">✅ Bu müşterinin borcu kalmamış</div>
          ) : (
            <>
              <div style={{marginBottom: "16px", padding: "12px", background: "#f8f3e9", borderRadius: "10px"}}>
                <strong>Kalan Borç:</strong> {selectedCustomer.netBorc.toFixed(2)} ₺
              </div>
              
              <input 
                type="number" 
                placeholder="Ödeme Tutarı ₺" 
                value={tahsilatTutar}
                onChange={(e) => setTahsilatTutar(e.target.value)}
                min="0.01"
                step="0.01"
                max={selectedCustomer.netBorc}
              />
              
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="pay" 
                    checked={tahsilatTipi === "NAKIT"}
                    onChange={() => setTahsilatTipi("NAKIT")}
                  /> Nakit
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="pay" 
                    checked={tahsilatTipi === "KART"}
                    onChange={() => setTahsilatTipi("KART")}
                  /> Kart
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="pay" 
                    checked={tahsilatTipi === "HAVALE"}
                    onChange={() => setTahsilatTipi("HAVALE")}
                  /> Havale / EFT
                </label>
              </div>
              
              <textarea 
                placeholder="Tahsilat notu (opsiyonel)" 
                value={tahsilatNot}
                onChange={(e) => setTahsilatNot(e.target.value)}
                rows="2"
              />
              
              <button 
                className="btn-success"
                onClick={handleCollectPayment}
                disabled={!tahsilatTutar || Number(tahsilatTutar) <= 0}
              >
                TAHSİLAT AL ({selectedCustomer.netBorc.toFixed(2)} ₺)
              </button>
            </>
          )}
        </div>
      </div>

      {/* İŞLEM GEÇMİŞİ */}
      <div className="panel history">
        <h2>ADİSYON VE TAHBİLAT GEÇMİŞİ {selectedCustomer ? `(${selectedCustomer.adSoyad})` : ""}</h2>
        
        {transactions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Masa No</th>
                <th>Açıklama / Adisyon İçeriği</th>
                <th>Tutar</th>
                <th>Ödeme Yöntemi</th>
                <th>Tahsilat Tutarı</th>
                <th>Kalan Borç</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr 
                  key={t.id} 
                  className={`${t.type === "TAHSILAT" ? "payment-row" : 
                             t.type === "INDIRIM" ? "discount-row" : 
                             t.type === "BORC" ? "debt-row" : "debt-row"}`}
                  onClick={() => t.adisyonData && handleShowAdisyonDetay(t.adisyonData)}
                  style={t.adisyonData ? {cursor: 'pointer'} : {}}
                >
                  <td>{t.tarih}</td>
                  <td>{t.masaNo}</td>
                  <td>
                    {t.aciklama}
                    {t.adisyonData && (
                      <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>
                        📋 Detay için tıklayın
                      </div>
                    )}
                  </td>
                  <td className={t.type === "ADISYON" || t.type === "BORC" ? "positive-amount" : "negative-amount"}>
                    {t.tutar}
                  </td>
                  <td>{t.odemeYontemi}</td>
                  <td>{t.tahsilatTutari}</td>
                  <td style={{fontWeight: "bold", color: t.kalanBorc > 0 ? "#8b4513" : "#2e7d32"}}>
                    {t.kalanBorc.toFixed(2)} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            {selectedCustomer ? "Bu müşteriye ait işlem geçmişi bulunmuyor." : "Müşteri seçiniz"}
          </div>
        )}
      </div>

      {/* ADİSYON DETAY MODALI */}
      {renderAdisyonDetayModal()}
    </div>
  );
}