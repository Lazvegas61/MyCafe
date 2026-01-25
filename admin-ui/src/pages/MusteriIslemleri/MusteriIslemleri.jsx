/* ============================================================
   📄 DOSYA: MusteriIslemleri.jsx (GÜNCELLENDİ - Müşteri Yönetimi İyileştirildi)
   📌 DÜZELTMELER:
   - Müşteri düzenleme/silme özelliği eklendi
   - Müşteri istatistikleri geliştirildi
   - Detaylı müşteri görünümü eklendi
   - Müşteri arama/filtreleme iyileştirildi
============================================================ */

import React, { useState, useEffect } from "react";
import "./MusteriIslemleri.css";
import mcFinansHavuzu from "../../services/utils/mc_finans_havuzu";
import BorcTransferModal from "../../components/modals/BorcTransferModal";

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
  const [filterType, setFilterType] = useState("all"); // all, debt, paid, recent
  
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

  // Müşteri Yönetimi
  const [musteriDuzenleModalOpen, setMusteriDuzenleModalOpen] = useState(false);
  const [duzenlenenMusteri, setDuzenlenenMusteri] = useState(null);
  const [duzenleAdSoyad, setDuzenleAdSoyad] = useState("");
  const [duzenleTelefon, setDuzenleTelefon] = useState("");
  const [duzenleNot, setDuzenleNot] = useState("");

  // Manuel Kayıt (Borç Transfer Modalı Görünümünde)
  const [manuelKayitModalOpen, setManuelKayitModalOpen] = useState(false);
  const [yeniMusteriAdi, setYeniMusteriAdi] = useState("");
  const [yeniMusteriTelefon, setYeniMusteriTelefon] = useState("");
  const [borcTutari, setBorcTutari] = useState("");
  const [masaNo, setMasaNo] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [urunler, setUrunler] = useState([]);
  const [urunAdi, setUrunAdi] = useState("");
  const [urunAdet, setUrunAdet] = useState("1");
  const [urunFiyat, setUrunFiyat] = useState("");

  // Müşteri Silme Onayı
  const [silmeOnayModalOpen, setSilmeOnayModalOpen] = useState(false);
  const [silinecekMusteri, setSilinecekMusteri] = useState(null);

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
      const borclar = okuJSON(BORC_KEY, []).filter(b => b.musteriId === musteri.id);
      
      let toplamBorcYeni = 0;
      let toplamOdemeYeni = 0;
      let toplamIndirim = 0;
      let toplamTransfer = 0;
      let sonIslemTarihi = musteri.created_at;
      
      borclar.forEach(borc => {
        toplamBorcYeni += Number(borc.tutar || 0);
        
        if (borc.acilisZamani > sonIslemTarihi) {
          sonIslemTarihi = borc.acilisZamani;
        }
        
        if (borc.hareketler) {
          borc.hareketler.forEach(h => {
            if (h.tarih > sonIslemTarihi) {
              sonIslemTarihi = h.tarih;
            }
            
            if (h.tip === "ÖDEME ALINDI") {
              toplamOdemeYeni += Math.abs(Number(h.tutar || 0));
            }
            if (h.tip === "İNDİRİM") {
              toplamIndirim += Math.abs(Number(h.tutar || 0));
            }
            if (h.tip === "BORÇ TRANSFERİ" && Number(h.tutar) < 0) {
              toplamTransfer += Math.abs(Number(h.tutar || 0));
            }
          });
        }
      });
      
      if (musteri.indirimler) {
        toplamIndirim += musteri.indirimler.reduce((sum, i) => sum + (i.tutar || 0), 0);
      }
      
      const toplamAzaltma = toplamIndirim + toplamOdemeYeni + toplamTransfer;
      const netBorc = Math.max(0, toplamBorcYeni - toplamAzaltma);
      
      return {
        ...musteri,
        toplamBorc: toplamBorcYeni,
        indirim: toplamIndirim,
        odeme: toplamOdemeYeni,
        transfer: toplamTransfer,
        netBorc: netBorc,
        adisyonSayisi: borclar.length,
        sonIslemTarihi: sonIslemTarihi,
        borclar: borclar,
        aktif: musteri.aktif !== undefined ? musteri.aktif : true
      };
    });
    
    musterilerBorclu.sort((a, b) => {
      if ((a.netBorc || 0) > 0 && (b.netBorc || 0) === 0) return -1;
      if ((a.netBorc || 0) === 0 && (b.netBorc || 0) > 0) return 1;
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
    
    // Arama terimine göre filtreleme
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.adSoyad.toLowerCase().includes(term) ||
        (customer.telefon && customer.telefon.includes(searchTerm)) ||
        (customer.not && customer.not.toLowerCase().includes(term))
      );
    }
    
    // Filtre tipine göre filtreleme
    if (filterType !== "all") {
      switch (filterType) {
        case "debt":
          filtered = filtered.filter(c => (c.netBorc || 0) > 0);
          break;
        case "paid":
          filtered = filtered.filter(c => (c.netBorc || 0) === 0);
          break;
        case "recent":
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filtered = filtered.filter(c => new Date(c.sonIslemTarihi) >= oneWeekAgo);
          break;
        case "active":
          filtered = filtered.filter(c => c.aktif !== false);
          break;
        case "inactive":
          filtered = filtered.filter(c => c.aktif === false);
          break;
        default:
          break;
      }
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, filterType, customers]);

  // --------------------------------------------------
  // MÜŞTERİ SEÇİMİ
  // --------------------------------------------------
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedDebtRecord(null);
    setAdisyonDetails(null);
    
    const borclar = okuJSON(BORC_KEY, [])
      .filter(b => b.musteriId === customer.id && (b.tutar || 0) > 0)
      .map(borc => ({
        ...borc,
        tip: "BORC",
        borcTutari: Number(borc.tutar || 0),
        tarih: borc.acilisZamani,
        masaNo: borc.masaNo || "-",
        id: `borc_${borc.id}`,
        urunler: borc.urunler || [],
        hareketler: borc.hareketler || [],
        toplamTutar: Number(borc.tutar || 0),
        kalanBorc: hesaplaKalanBorc(borc)
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    setDebtRecords(borclar);
    
    const tumHareketler = [];
    
    borclar.forEach(borc => {
      tumHareketler.push({
        tip: "BORÇ EKLENDİ",
        tutar: Number(borc.borcTutari || 0),
        tarih: borc.tarih,
        masaNo: borc.masaNo,
        borcId: borc.id
      });
      
      if (borc.hareketler) {
        borc.hareketler.forEach(hareket => {
          if (hareket.tip === "ÖDEME ALINDI") {
            tumHareketler.push({
              tip: "TAHSİLAT YAPILDI",
              tutar: Number(hareket.tutar || 0),
              tarih: hareket.tarih,
              odemeTipi: hareket.odemeTipi,
              borcId: borc.id,
              aciklama: hareket.aciklama || ""
            });
          }
          if (hareket.tip === "İNDİRİM") {
            tumHareketler.push({
              tip: "İNDİRİM YAPILDI",
              tutar: Number(hareket.tutar || 0),
              tarih: hareket.tarih,
              aciklama: hareket.aciklama,
              borcId: borc.id
            });
          }
          if (hareket.tip === "BORÇ TRANSFERİ") {
            const transferTutar = Math.abs(Number(hareket.tutar || 0));
            const islemTipi = Number(hareket.tutar || 0) < 0 ? "BORÇ TRANSFER EDİLDİ" : "BORÇ TRANSFER ALINDI";
            
            tumHareketler.push({
              tip: islemTipi,
              tutar: transferTutar,
              tarih: hareket.tarih,
              aciklama: hareket.aciklama || hareket.transferNot,
              borcId: borc.id
            });
          }
        });
      }
    });
    
    tumHareketler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    setTransactionHistory(tumHareketler);
    
    setTahsilatTutar((customer.netBorc || 0) > 0 ? Number(customer.netBorc || 0).toFixed(2) : "");
    setIndirimTutar("");
    setIndirimNot("");
  };

  // --------------------------------------------------
  // KALAN BORÇ HESAPLA
  // --------------------------------------------------
  const hesaplaKalanBorc = (borc) => {
    if (!borc || !borc.tutar) return 0;
    
    let toplamBorc = Number(borc.tutar || 0);
    let toplamOdeme = 0;
    let toplamIndirim = 0;
    let toplamTransfer = 0;
    
    if (borc.hareketler) {
      borc.hareketler.forEach(h => {
        if (h.tip === "ÖDEME ALINDI") {
          toplamOdeme += Math.abs(Number(h.tutar || 0));
        }
        if (h.tip === "İNDİRİM") {
          toplamIndirim += Math.abs(Number(h.tutar || 0));
        }
        if (h.tip === "BORÇ TRANSFERİ" && Number(h.tutar || 0) < 0) {
          toplamTransfer += Math.abs(Number(h.tutar || 0));
        }
      });
    }
    
    return Math.max(0, toplamBorc - toplamOdeme - toplamIndirim - toplamTransfer);
  };

  // --------------------------------------------------
  // BORÇ KAYDI SEÇİMİ
  // --------------------------------------------------
  const handleDebtRecordSelect = (record) => {
    setSelectedDebtRecord(record);
    setAdisyonDetails(record);
    
    const borcData = {
      id: record.id,
      masaNo: record.masaNo,
      tutar: Number(record.borcTutari || 0),
      kalanBorc: Number(record.kalanBorc || record.borcTutari || 0),
      toplamTutar: Number(record.toplamTutar || record.borcTutari || 0),
      tarih: record.tarih,
      urunler: record.urunler || [],
      hareketler: record.hareketler || [],
      aciklama: record.aciklama || "",
      tip: record.tip || "BORC"
    };
    setAdisyonDetails(borcData);
  };

  // --------------------------------------------------
  // MÜŞTERİ İŞLEMLERİ
  // --------------------------------------------------
  const openMusteriDuzenleModal = (musteri) => {
    setDuzenlenenMusteri(musteri);
    setDuzenleAdSoyad(musteri.adSoyad);
    setDuzenleTelefon(musteri.telefon || "");
    setDuzenleNot(musteri.not || "");
    setMusteriDuzenleModalOpen(true);
  };

  const handleMusteriDuzenle = () => {
    if (!duzenlenenMusteri || !duzenleAdSoyad.trim()) {
      alert("Müşteri adı boş olamaz!");
      return;
    }
    
    const musteriler = okuJSON(MUSTERI_KEY, []);
    const updatedMusteriler = musteriler.map(m => {
      if (m.id === duzenlenenMusteri.id) {
        return {
          ...m,
          adSoyad: duzenleAdSoyad.trim(),
          telefon: duzenleTelefon.trim(),
          not: duzenleNot.trim(),
          updated_at: new Date().toISOString()
        };
      }
      return m;
    });
    
    yazJSON(MUSTERI_KEY, updatedMusteriler);
    yukleMusteriler(updatedMusteriler);
    
    // Seçili müşteriyi güncelle
    if (selectedCustomer?.id === duzenlenenMusteri.id) {
      const guncellenenMusteri = updatedMusteriler.find(m => m.id === duzenlenenMusteri.id);
      setSelectedCustomer({
        ...selectedCustomer,
        adSoyad: duzenleAdSoyad.trim(),
        telefon: duzenleTelefon.trim(),
        not: duzenleNot.trim()
      });
    }
    
    setMusteriDuzenleModalOpen(false);
    alert("Müşteri bilgileri güncellendi!");
  };

  const openMusteriSilmeOnay = (musteri) => {
    if (musteri.netBorc > 0) {
      alert("Borcu olan müşteri silinemez! Önce borçlarını temizleyin.");
      return;
    }
    
    setSilinecekMusteri(musteri);
    setSilmeOnayModalOpen(true);
  };

  const handleMusteriSil = () => {
    if (!silinecekMusteri) return;
    
    // Müşteriyi sil
    const musteriler = okuJSON(MUSTERI_KEY, []);
    const updatedMusteriler = musteriler.filter(m => m.id !== silinecekMusteri.id);
    yazJSON(MUSTERI_KEY, updatedMusteriler);
    
    // Müşterinin borç kayıtlarını sil
    const borclar = okuJSON(BORC_KEY, []);
    const updatedBorclar = borclar.filter(b => b.musteriId !== silinecekMusteri.id);
    yazJSON(BORC_KEY, updatedBorclar);
    
    // Listeyi güncelle
    yukleMusteriler(updatedMusteriler);
    
    // Seçili müşteri silindiyse temizle
    if (selectedCustomer?.id === silinecekMusteri.id) {
      setSelectedCustomer(null);
      setDebtRecords([]);
      setTransactionHistory([]);
      setAdisyonDetails(null);
    }
    
    setSilmeOnayModalOpen(false);
    alert("Müşteri başarıyla silindi!");
  };

  const handleMusteriDurumDegistir = (musteriId, aktif) => {
    const musteriler = okuJSON(MUSTERI_KEY, []);
    const updatedMusteriler = musteriler.map(m => {
      if (m.id === musteriId) {
        return {
          ...m,
          aktif: aktif,
          updated_at: new Date().toISOString()
        };
      }
      return m;
    });
    
    yazJSON(MUSTERI_KEY, updatedMusteriler);
    yukleMusteriler(updatedMusteriler);
    
    // Seçili müşteriyi güncelle
    if (selectedCustomer?.id === musteriId) {
      setSelectedCustomer({
        ...selectedCustomer,
        aktif: aktif
      });
    }
    
    alert(`Müşteri ${aktif ? 'aktif' : 'pasif'} duruma getirildi!`);
  };

  // --------------------------------------------------
  // ADISYON ÜRÜNLERİNİ HAZIRLA
  // --------------------------------------------------
  const prepareAdisyonProducts = (record) => {
    if (!record || !record.urunler || record.urunler.length === 0) {
      return [];
    }
    
    return record.urunler.map((urun, index) => {
      const birimFiyat = Number(urun.birimFiyat || urun.fiyat || 0);
      const adet = Number(urun.adet || urun.miktar || 1);
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
  // ADISYON TOPLAMLARINI HESAPLA
  // --------------------------------------------------
  const calculateAdisyonTotals = (products) => {
    const toplamTutar = products.reduce((sum, product) => sum + Number(product.toplam || 0), 0);
    
    return {
      toplamTutar: toplamTutar.toFixed(2),
      genelToplam: toplamTutar.toFixed(2)
    };
  };

// --------------------------------------------------
// TAHSİLAT AL - DÜZELTİLDİ
// --------------------------------------------------
const handleCollectPayment = () => {
  if (!selectedCustomer) {
    alert("Önce bir müşteri seçiniz!");
    return;
  }
  
  if (selectedCustomer.aktif === false) {
    alert("Pasif durumdaki müşteriye tahsilat yapılamaz!");
    return;
  }
  
  const tutar = parseFloat(tahsilatTutar);
  if (isNaN(tutar) || tutar <= 0) {
    alert("Geçerli bir tahsilat tutarı giriniz!");
    return;
  }
  
  if (tutar > (selectedCustomer.netBorc || 0)) {
    alert("Tahsilat tutarı kalan borçtan fazla olamaz!");
    return;
  }
  
  // 1. BORC_KEY'e ödeme kaydet
  const borclar = okuJSON(BORC_KEY, []);
  const musteriBorclari = borclar.filter(b => b.musteriId === selectedCustomer.id);
  
  if (musteriBorclari.length > 0) {
    const siraliBorclar = musteriBorclari.sort(
      (a, b) => new Date(a.acilisZamani) - new Date(b.acilisZamani)
    );
    
    let kalanTutar = tutar;
    
    for (let borc of siraliBorclar) {
      if (kalanTutar <= 0) break;
      
      const borcIndex = borclar.findIndex(b => b.id === borc.id);
      if (borcIndex === -1) continue;
      
      const borcKalan = hesaplaKalanBorc(borclar[borcIndex]);
      const odeyecekTutar = Math.min(kalanTutar, borcKalan);
      
      if (odeyecekTutar > 0) {
        borclar[borcIndex] = {
          ...borclar[borcIndex],
          hareketler: [
            ...(borclar[borcIndex].hareketler || []),
            {
              tip: "ÖDEME ALINDI",
              tutar: odeyecekTutar,
              tarih: new Date().toISOString(),
              aciklama: tahsilatNot.trim() || "Müşteri İşlemleri sayfasından tahsilat",
              odemeTipi: tahsilatTipi,
              kalanTutar: kalanTutar - odeyecekTutar
            }
          ]
        };
        
        kalanTutar -= odeyecekTutar;
      }
    }
    
    yazJSON(BORC_KEY, borclar);
  }
  
  // 2. Finans Havuzuna Kayıt Ekle
  try {
    mcFinansHavuzu.finansTahsilatKaydiEkle({
      tip: tahsilatTipi,
      tutar: tutar,
      aciklama: `Müşteri Tahsilat - ${selectedCustomer.adSoyad} - ${tahsilatNot || "Tahsilat"}`,
      musteriId: selectedCustomer.id,
      referansId: `tah_${Date.now()}`
    });
  } catch (error) {
    console.error("Finans kaydı eklenirken hata:", error);
  }
  
  // 3. Müşteriyi güncelle
  const updatedCustomers = customers.map(c => {
    if (c.id === selectedCustomer.id) {
      const yeniNetBorc = Math.max(0, (c.netBorc || 0) - tutar);
      
      return {
        ...c,
        netBorc: yeniNetBorc,
        odeme: (c.odeme || 0) + tutar,
        sonIslemTarihi: new Date().toISOString()
      };
    }
    return c;
  });
  
  updatedCustomers.sort((a, b) => {
    if ((a.netBorc || 0) > 0 && (b.netBorc || 0) === 0) return -1;
    if ((a.netBorc || 0) === 0 && (b.netBorc || 0) > 0) return 1;
    return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
  });
  
  setCustomers(updatedCustomers);
  setFilteredCustomers([...updatedCustomers]);
  yazJSON(MUSTERI_KEY, updatedCustomers);
  
  const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
  setSelectedCustomer(updatedCustomer);
  
  handleCustomerSelect(updatedCustomer);
  
  setTahsilatTutar((updatedCustomer.netBorc || 0) > 0 ? Number(updatedCustomer.netBorc || 0).toFixed(2) : "");
  setTahsilatNot("");
  
  alert(`${Number(tutar || 0).toFixed(2)} ₺ tahsilat başarıyla alındı!`);
};

  // --------------------------------------------------
  // İNDİRİM UYGULA - DÜZELTİLDİ
  // --------------------------------------------------
  const handleApplyDiscount = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    if (selectedCustomer.aktif === false) {
      alert("Pasif durumdaki müşteriye indirim uygulanamaz!");
      return;
    }
    
    const tutar = Number(indirimTutar || 0);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir indirim tutarı giriniz!");
      return;
    }
    
    if (tutar > (selectedCustomer.netBorc || 0)) {
      alert("İndirim tutarı kalan borçtan fazla olamaz!");
      return;
    }
    
    const borclar = okuJSON(BORC_KEY, []);
    const musteriBorclari = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (musteriBorclari.length > 0) {
      const siraliBorclar = musteriBorclari.sort(
        (a, b) => new Date(a.acilisZamani) - new Date(b.acilisZamani)
      );
      
      let kalanTutar = tutar;
      
      for (let borc of siraliBorclari) {
        if (kalanTutar <= 0) break;
        
        const borcIndex = borclar.findIndex(b => b.id === borc.id);
        if (borcIndex === -1) continue;
        
        const borcKalan = hesaplaKalanBorc(borclar[borcIndex]);
        const indirimUygulanacakTutar = Math.min(kalanTutar, borcKalan);
        
        if (indirimUygulanacakTutar > 0) {
          borclar[borcIndex] = {
            ...borclar[borcIndex],
            hareketler: [
              ...(borclar[borcIndex].hareketler || []),
              {
                tip: "İNDİRİM",
                tutar: indirimUygulanacakTutar,
                tarih: new Date().toISOString(),
                aciklama: indirimNot.trim() || "Müşteri İşlemleri sayfasından indirim",
                indirimTipi: "MANUEL",
                kalanTutar: kalanTutar - indirimUygulanacakTutar
              }
            ]
          };
          
          kalanTutar -= indirimUygulanacakTutar;
        }
      }
      
      yazJSON(BORC_KEY, borclar);
    }
    
    // Finans Havuzuna İndirim Kaydı - DÜZELTİLDİ
    try {
      mcFinansHavuzu.finansIndirimKaydiEkle({
        tutar: tutar,
        aciklama: `Müşteri İndirimi - ${selectedCustomer.adSoyad} - ${indirimNot || "İndirim"}`,
        musteriId: selectedCustomer.id,
        referansId: `ind_${Date.now()}`
      });
    } catch (error) {
      console.error("Finans indirim kaydı eklenirken hata:", error);
    }
    
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const yeniNetBorc = Math.max(0, (c.netBorc || 0) - tutar);
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
    
    updatedCustomers.sort((a, b) => {
      if ((a.netBorc || 0) > 0 && (b.netBorc || 0) === 0) return -1;
      if ((a.netBorc || 0) === 0 && (b.netBorc || 0) > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
    
    handleCustomerSelect(updatedCustomer);
    
    setIndirimTutar("");
    setIndirimNot("");
    
    alert(`${Number(tutar || 0).toFixed(2)} ₺ indirim başarıyla uygulandı!`);
  };

  // --------------------------------------------------
  // BORÇ TRANSFERİ MODALI AÇ
  // --------------------------------------------------
  const openTransferModal = () => {
    if (!selectedCustomer) {
      alert("Önce bir müşteri seçiniz!");
      return;
    }
    
    if (selectedCustomer.aktif === false) {
      alert("Pasif durumdaki müşteriden borç transferi yapılamaz!");
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
    
    const tutar = Number(transferTutar || 0);
    if (!tutar || tutar <= 0) {
      alert("Geçerli bir transfer tutarı giriniz!");
      return;
    }
    
    if (tutar > (selectedCustomer.netBorc || 0)) {
      alert("Transfer tutarı kalan borçtan fazla olamaz!");
      return;
    }
    
    const borclar = okuJSON(BORC_KEY, []);
    const kaynakBorclar = borclar.filter(b => b.musteriId === selectedCustomer.id);
    
    if (kaynakBorclar.length > 0) {
      const siraliKaynakBorclar = kaynakBorclar.sort(
        (a, b) => new Date(a.acilisZamani) - new Date(b.acilisZamani)
      );
      
      let kalanTransferTutar = tutar;
      
      for (let borc of siraliKaynakBorclar) {
        if (kalanTransferTutar <= 0) break;
        
        const borcIndex = borclar.findIndex(b => b.id === borc.id);
        if (borcIndex === -1) continue;
        
        const borcKalan = hesaplaKalanBorc(borclar[borcIndex]);
        const transferEdilecekTutar = Math.min(kalanTransferTutar, borcKalan);
        
        if (transferEdilecekTutar > 0) {
          borclar[borcIndex] = {
            ...borclar[borcIndex],
            hareketler: [
              ...(borclar[borcIndex].hareketler || []),
              {
                tip: "BORÇ TRANSFERİ",
                tutar: -transferEdilecekTutar,
                tarih: new Date().toISOString(),
                aciklama: `Transfer: ${transferMusteriAdi} müşterisine aktarıldı`,
                transferNot: transferNot.trim(),
                kalanTutar: kalanTransferTutar - transferEdilecekTutar
              }
            ]
          };
          
          kalanTransferTutar -= transferEdilecekTutar;
        }
      }
    }
    
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
    
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const yeniNetBorc = Math.max(0, (c.netBorc || 0) - tutar);
        const yeniTransfer = (c.transfer || 0) + tutar;
        
        return {
          ...c,
          netBorc: yeniNetBorc,
          transfer: yeniTransfer,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      if (c.id === transferMusteriId) {
        const yeniNetBorc = (c.netBorc || 0) + tutar;
        
        return {
          ...c,
          netBorc: yeniNetBorc,
          sonIslemTarihi: new Date().toISOString()
        };
      }
      return c;
    });
    
    updatedCustomers.sort((a, b) => {
      if ((a.netBorc || 0) > 0 && (b.netBorc || 0) === 0) return -1;
      if ((a.netBorc || 0) === 0 && (b.netBorc || 0) > 0) return 1;
      return new Date(b.sonIslemTarihi || 0) - new Date(a.sonIslemTarihi || 0);
    });
    
    setCustomers(updatedCustomers);
    setFilteredCustomers([...updatedCustomers]);
    yazJSON(MUSTERI_KEY, updatedCustomers);
    
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(updatedCustomer);
    
    setTransferModalOpen(false);
    
    handleCustomerSelect(updatedCustomer);
    
    alert(`${Number(tutar || 0).toFixed(2)} ₺ borç ${transferMusteriAdi} müşterisine transfer edildi!`);
  };

  // --------------------------------------------------
  // MANUEL KAYIT İŞLEMLERİ (BORÇ TRANSFER MODALI GÖRÜNÜMÜNDE)
  // --------------------------------------------------
  const openManuelKayitModal = () => {
    setManuelKayitModalOpen(true);
    setYeniMusteriAdi("");
    setYeniMusteriTelefon("");
    setBorcTutari("");
    setMasaNo("");
    setAciklama("");
    setUrunler([]);
    setUrunAdi("");
    setUrunAdet("1");
    setUrunFiyat("");
  };

  const urunEkle = () => {
    if (!urunAdi || !urunFiyat) {
      alert("Lütfen ürün adı ve fiyatı giriniz!");
      return;
    }
    
    const yeniUrun = {
      id: Date.now(),
      ad: urunAdi,
      adet: Number(urunAdet) || 1,
      fiyat: Number(urunFiyat),
      toplam: Number(urunFiyat) * (Number(urunAdet) || 1)
    };
    
    setUrunler([...urunler, yeniUrun]);
    
    const toplamUrunTutari = urunler.reduce((sum, urun) => sum + Number(urun.toplam || 0), 0) + yeniUrun.toplam;
    setBorcTutari(Number(toplamUrunTutari || 0).toFixed(2));
    
    setUrunAdi("");
    setUrunAdet("1");
    setUrunFiyat("");
  };

  const urunSil = (id) => {
    const silinecekUrun = urunler.find(u => u.id === id);
    const yeniUrunler = urunler.filter(u => u.id !== id);
    setUrunler(yeniUrunler);
    
    if (silinecekUrun) {
      const toplamUrunTutari = yeniUrunler.reduce((sum, urun) => sum + Number(urun.toplam || 0), 0);
      setBorcTutari(Number(toplamUrunTutari || 0).toFixed(2));
    }
  };

  const handleManuelKayit = () => {
    if (!yeniMusteriAdi || !borcTutari) {
      alert("Lütfen müşteri adı ve borç tutarını giriniz!");
      return;
    }
    
    const tutar = Number(borcTutari || 0);
    if (tutar <= 0) {
      alert("Geçerli bir borç tutarı giriniz!");
      return;
    }
    
    // 1. ÖNCE MÜŞTERİ KONTROLÜ (Birleştirme Özelliği)
    const existingCustomers = okuJSON(MUSTERI_KEY, []);
    let existingCustomer = null;
    
    // İsim ve telefon ile eşleştirme
    if (yeniMusteriTelefon) {
      existingCustomer = existingCustomers.find(
        c => c.telefon === yeniMusteriTelefon
      );
    }
    
    if (!existingCustomer) {
      // Sadece isim ile eşleştirme (case-insensitive)
      existingCustomer = existingCustomers.find(
        c => c.adSoyad.toLowerCase() === yeniMusteriAdi.toLowerCase()
      );
    }
    
    let musteriId;
    let musteriAdi;
    
    if (existingCustomer) {
      // Mevcut müşteri bulundu - BİRLEŞTİR
      musteriId = existingCustomer.id;
      musteriAdi = existingCustomer.adSoyad;
      
      alert(`"${musteriAdi}" müşterisi zaten kayıtlı. Mevcut hesaba borç eklenecek.`);
    } else {
      // Yeni müşteri oluştur
      musteriId = Date.now().toString();
      musteriAdi = yeniMusteriAdi;
      
      const yeniMusteri = {
        id: musteriId,
        adSoyad: yeniMusteriAdi,
        telefon: yeniMusteriTelefon || "",
        not: "",
        created_at: new Date().toISOString(),
        sonIslemTarihi: new Date().toISOString(),
        aktif: true
      };
      
      const yeniMusteriListesi = [...existingCustomers, yeniMusteri];
      yazJSON(MUSTERI_KEY, yeniMusteriListesi);
    }
    
    // 2. BORÇ KAYDI EKLE
    const borclar = okuJSON(BORC_KEY, []);
    const yeniBorcId = `manuel_${Date.now()}`;
    
    const yeniBorc = {
      id: yeniBorcId,
      musteriId: musteriId,
      masaNo: masaNo || "MANUEL",
      urunler: urunler.length > 0 ? urunler : [
        {
          ad: "Manuel Kayıt",
          adet: 1,
          fiyat: tutar,
          toplam: tutar
        }
      ],
      tutar: tutar,
      acilisZamani: new Date().toISOString(),
      aciklama: aciklama || "Manuel kayıt",
      hareketler: [
        {
          tip: "BORÇ EKLENDİ",
          tutar: tutar,
          tarih: new Date().toISOString(),
          aciklama: "Manuel kayıt - Müşteri İşlemleri"
        }
      ]
    };
    
    borclar.push(yeniBorc);
    yazJSON(BORC_KEY, borclar);
    
    // 3. MÜŞTERİ LİSTESİNİ GÜNCELLE
    const musteriler = okuJSON(MUSTERI_KEY, []);
    yukleMusteriler(musteriler);
    
    // 4. EKLENEN MÜŞTERİYİ SEÇ
    const yeniMusteriData = musteriler.find(m => m.id === musteriId);
    if (yeniMusteriData) {
      handleCustomerSelect(yeniMusteriData);
    }
    
    setManuelKayitModalOpen(false);
    
    alert(`${musteriAdi} müşterisine ${Number(tutar || 0).toFixed(2)} ₺ borç kaydı başarıyla eklendi!`);
  };

  // --------------------------------------------------
  // TARİH FORMATLAMA
  // --------------------------------------------------
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Geçersiz tarih";
    }
  };

  const formatShortDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return "Geçersiz";
    }
  };

  // --------------------------------------------------
  // İSTATİSTİKLER
  // --------------------------------------------------
  const hesaplaIstatistikler = () => {
    const aktifMusteriler = customers.filter(c => c.aktif !== false);
    const pasifMusteriler = customers.filter(c => c.aktif === false);
    const borcluMusteriler = customers.filter(c => c.netBorc > 0);
    const odemisMusteriler = customers.filter(c => c.netBorc === 0);
    
    const toplamBorc = customers.reduce((sum, c) => sum + (c.netBorc || 0), 0);
    const toplamTahsilat = customers.reduce((sum, c) => sum + (c.odeme || 0), 0);
    const toplamIndirim = customers.reduce((sum, c) => sum + (c.indirim || 0), 0);
    
    return {
      toplamMusteri: customers.length,
      aktifMusteri: aktifMusteriler.length,
      pasifMusteri: pasifMusteriler.length,
      borcluMusteri: borcluMusteriler.length,
      odemisMusteri: odemisMusteriler.length,
      toplamBorc: toplamBorc,
      toplamTahsilat: toplamTahsilat,
      toplamIndirim: toplamIndirim
    };
  };

  const istatistikler = hesaplaIstatistikler();

  // --------------------------------------------------
  // TASARIM RENDER
  // --------------------------------------------------
  return (
    <div className="musteri-islemleri-v2">
      {/* BAŞLIK */}
      <div className="page-header">
        <div className="header-top">
          <h1>MÜŞTERİ İŞLEMLERİ</h1>
          <div className="header-actions">
            <div className="role-badge">
              {role === "ADMIN" ? "ADMIN" : "GARSON"}
            </div>
            <button 
              className="btn-manuel-kayit"
              onClick={openManuelKayitModal}
              title="Yeni müşteri ve borç kaydı ekle"
            >
              ✍️ Manuel Kayıt
            </button>
          </div>
        </div>
                
        {/* İSTATİSTİKLER */}
        <div className="statistics-container">
          <div className="statistic-card">
            <div className="statistic-value">{istatistikler.toplamMusteri}</div>
            <div className="statistic-label">Toplam Müşteri</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-value" style={{ color: "#2e7d32" }}>{istatistikler.aktifMusteri}</div>
            <div className="statistic-label">Aktif</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-value" style={{ color: "#d32f2f" }}>{istatistikler.borcluMusteri}</div>
            <div className="statistic-label">Borçlu</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-value" style={{ color: "#1976d2" }}>{istatistikler.odemisMusteri}</div>
            <div className="statistic-label">Ödemiş</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-value" style={{ color: "#d2691e" }}>{Number(istatistikler.toplamBorc || 0).toFixed(2)} ₺</div>
            <div className="statistic-label">Toplam Borç</div>
          </div>
        </div>
      </div>
      
      {/* 3 KOLONLU ANA YAPI */}
      <div className="three-column-layout">
        {/* SOL KOLON - MÜŞTERİLER */}
        <div className="column customers-column">
          <div className="column-header">
            <h2>MÜŞTERİLER</h2>
            <div className="customer-controls">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="İsim, telefon veya not ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")}>✕</button>
                )}
              </div>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Tümü
                </button>
                <button 
                  className={`filter-btn ${filterType === 'debt' ? 'active' : ''}`}
                  onClick={() => setFilterType('debt')}
                >
                  Borçlu
                </button>
                <button 
                  className={`filter-btn ${filterType === 'paid' ? 'active' : ''}`}
                  onClick={() => setFilterType('paid')}
                >
                  Ödemiş
                </button>
                <button 
                  className={`filter-btn ${filterType === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterType('active')}
                >
                  Aktif
                </button>
              </div>
            </div>
          </div>
          
          <div className="customer-list">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <div 
                  key={customer.id}
                  className={`customer-card ${customer.aktif === false ? 'inactive' : ''} ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-info">
                    <div className="customer-header">
                      <div className="customer-name">
                        {customer.adSoyad}
                        {customer.aktif === false && (
                          <span className="inactive-badge">PASİF</span>
                        )}
                      </div>
                      <div className="customer-actions">
                        <button 
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMusteriDuzenleModal(customer);
                          }}
                          title="Müşteriyi düzenle"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMusteriSilmeOnay(customer);
                          }}
                          title="Müşteriyi sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="customer-phone">{customer.telefon || "Telefon yok"}</div>
                    {customer.not && (
                      <div className="customer-note">
                        <span className="note-label">Not:</span> {customer.not}
                      </div>
                    )}
                    <div className="customer-stats">
                      <span className="stat-item">📋 {customer.adisyonSayisi || 0} kayıt</span>
                      <span className="stat-item">📅 {formatShortDate(customer.sonIslemTarihi)}</span>
                      {Number(customer.indirim || 0) > 0 && (
                        <span className="stat-item discount">🎁 {Number(customer.indirim || 0).toFixed(2)} ₺ indirim</span>
                      )}
                    </div>
                  </div>
                  <div className="customer-balance">
                    {Number(customer.netBorc || 0) > 0 ? (
                      <div className="balance-negative">-{Number(customer.netBorc || 0).toFixed(2)} ₺</div>
                    ) : (
                      <div className="balance-zero">0,00 ₺</div>
                    )}
                    {customer.aktif !== false ? (
                      <button 
                        className="btn-status"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMusteriDurumDegistir(customer.id, false);
                        }}
                        title="Müşteriyi pasif yap"
                      >
                        🔴
                      </button>
                    ) : (
                      <button 
                        className="btn-status active"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMusteriDurumDegistir(customer.id, true);
                        }}
                        title="Müşteriyi aktif yap"
                      >
                        🟢
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-list">
                {searchTerm ? "Aranan müşteri bulunamadı." : "Henüz müşteri kaydı yok."}
                <button 
                  className="btn-manuel-kayit-small"
                  onClick={openManuelKayitModal}
                  style={{ marginTop: '10px' }}
                >
                  İlk Müşteriyi Manuel Ekle
                </button>
              </div>
            )}
          </div>
          
          {/* SAYFA BİLGİSİ */}
          <div className="page-info">
            <span>{filteredCustomers.length} müşteri gösteriliyor</span>
            {filterType !== 'all' && (
              <button 
                className="btn-clear-filter"
                onClick={() => setFilterType('all')}
              >
                Filtreyi Temizle
              </button>
            )}
          </div>
        </div>
        
        {/* ORTA KOLON - BORÇ KAYITLARI */}
        <div className="column debts-column">
          <div className="column-header">
            <h2>BORÇ KAYITLARI</h2>
            {selectedCustomer && (
              <div className="customer-summary">
                <div className="customer-detail-header">
                  <span className="customer-name">{selectedCustomer.adSoyad}</span>
                  {selectedCustomer.telefon && (
                    <span className="customer-phone-summary">📱 {selectedCustomer.telefon}</span>
                  )}
                </div>
                <div className="total-debt-section">
                  <span className="total-debt">Kalan: {Number(selectedCustomer.netBorc || 0).toFixed(2)} ₺</span>
                  {selectedCustomer.toplamBorc > 0 && (
                    <span className="total-original">Toplam: {Number(selectedCustomer.toplamBorc || 0).toFixed(2)} ₺</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* TRANSFER BUTTONU */}
          {selectedCustomer && Number(selectedCustomer.netBorc || 0) > 0 && selectedCustomer.aktif !== false && (
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
                      <div className="debt-amount">
                        <div className="original-amount">{Number(record.borcTutari || 0).toFixed(2)} ₺</div>
                        {Number(record.kalanBorc || 0) < Number(record.borcTutari || 0) && (
                          <div className="remaining-amount">Kalan: {Number(record.kalanBorc || 0).toFixed(2)} ₺</div>
                        )}
                      </div>
                    </div>
                    <div className="debt-date">
                      {formatDate(record.tarih)}
                    </div>
                    <div className="debt-status">
                      {record.hareketler?.some(h => h.tip === "İNDİRİM") && "🎁 İndirimli • "}
                      {record.hareketler?.some(h => h.tip === "BORÇ TRANSFERİ" && Number(h.tutar || 0) < 0) && "🔄 Transfer Edildi • "}
                      {Number(record.kalanBorc || 0) === 0 ? "✅ Ödendi" : 
                       Number(record.kalanBorc || 0) < Number(record.borcTutari || 0) ? "💰 Kısmen Ödendi" : "⏳ Ödenmedi"}
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
          
          {/* SOL BÖLÜM - ADISYON DETAYLARI (GENİŞ) */}
          <div className="adisyon-details-section">
            <div className="column-header">
              <h2>ADISYON DETAYLARI</h2>
              {adisyonDetails && adisyonDetails.kalanBorc !== undefined && (
                <div className="remaining-debt-badge">
                  Kalan Borç: {Number(adisyonDetails.kalanBorc || 0).toFixed(2)} ₺
                </div>
              )}
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
                        <div className="original-amount">{Number(adisyonDetails.toplamTutar || 0).toFixed(2)} ₺</div>
                        {adisyonDetails.kalanBorc !== undefined && Number(adisyonDetails.kalanBorc || 0) < Number(adisyonDetails.toplamTutar || 0) && (
                          <div className="remaining-amount">Kalan: {Number(adisyonDetails.kalanBorc || 0).toFixed(2)} ₺</div>
                        )}
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
                          {adisyonDetails.tip === "BORC" ? "📝 Borç Kaydı" : "📝 Kayıt"}
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
                              <div className="product-price">{Number(product.birimFiyat || 0).toFixed(2)} ₺</div>
                              <div className="product-total">{Number(product.toplam || 0).toFixed(2)} ₺</div>
                            </div>
                          ))}
                        </div>
                        
                        {/* TOPLAMLAR */}
                        <div className="adisyon-total">
                          <div className="total-item">
                            <div className="total-label">TOPLAM TUTAR</div>
                            <div className="total-value" style={{ color: "#d32f2f", fontSize: "24px" }}>
                              {Number(calculateAdisyonTotals(prepareAdisyonProducts(adisyonDetails)).genelToplam || 0).toFixed(2)} ₺
                            </div>
                          </div>
                          {adisyonDetails.kalanBorc !== undefined && Number(adisyonDetails.kalanBorc || 0) < Number(adisyonDetails.toplamTutar || 0) && (
                            <div className="total-item">
                              <div className="total-label">KALAN BORÇ</div>
                              <div className="total-value" style={{ color: "#1976d2", fontSize: "20px" }}>
                                {Number(adisyonDetails.kalanBorc || 0).toFixed(2)} ₺
                              </div>
                            </div>
                          )}
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
          
          {/* SAĞ BÖLÜM - İŞLEM DETAYLARI (DAR) */}
          <div className="islem-details-section">
            <div className="column-header">
              <h2>İŞLEM DETAYLARI</h2>
              {selectedCustomer && (
                <div className="customer-status-badge">
                  {selectedCustomer.aktif === false ? "🔴 PASİF" : "🟢 AKTİF"}
                </div>
              )}
            </div>
            
            <div className="islem-content">
              {/* TAHSILAT ALANI */}
              <div className="payment-section">
                <h3>TAHSİLAT</h3>
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
                      max={Number(selectedCustomer?.netBorc || 0)}
                      disabled={!selectedCustomer || Number(selectedCustomer.netBorc || 0) <= 0 || selectedCustomer.aktif === false}
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
                          disabled={!selectedCustomer || selectedCustomer.aktif === false}
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
                          disabled={!selectedCustomer || selectedCustomer.aktif === false}
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
                          disabled={!selectedCustomer || selectedCustomer.aktif === false}
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
                      disabled={!selectedCustomer || selectedCustomer.aktif === false}
                    />
                  </div>
                  
                  <button 
                    className="btn-tahsilat"
                    onClick={handleCollectPayment}
                    disabled={!selectedCustomer || Number(selectedCustomer.netBorc || 0) <= 0 || !tahsilatTutar || selectedCustomer.aktif === false}
                  >
                    💰 TAHSİL ET
                  </button>
                  {selectedCustomer?.aktif === false && (
                    <div className="warning-message">
                      ⚠️ Pasif müşteriye tahsilat yapılamaz
                    </div>
                  )}
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
                      max={Number(selectedCustomer?.netBorc || 0)}
                      disabled={!selectedCustomer || Number(selectedCustomer.netBorc || 0) <= 0 || selectedCustomer.aktif === false}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>İndirim Nedeni (Opsiyonel)</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Sadakat indirimi, hata düzeltme..."
                      value={indirimNot}
                      onChange={(e) => setIndirimNot(e.target.value)}
                      disabled={!selectedCustomer || selectedCustomer.aktif === false}
                    />
                  </div>
                  
                  <button 
                    className="btn-indirim"
                    onClick={handleApplyDiscount}
                    disabled={!selectedCustomer || Number(selectedCustomer.netBorc || 0) <= 0 || !indirimTutar || selectedCustomer.aktif === false}
                  >
                    🎁 İNDİRİM UYGULA
                  </button>
                  {selectedCustomer?.aktif === false && (
                    <div className="warning-message">
                      ⚠️ Pasif müşteriye indirim uygulanamaz
                    </div>
                  )}
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
                          transaction.tip.includes('TAHSİLAT') ? 'type-payment' :
                          transaction.tip.includes('TRANSFER') ? 'type-transfer' :
                          transaction.tip.includes('BORÇ') ? 'type-debt' : ''
                        }`}>
                          {transaction.tip}
                        </div>
                        <div className={`transaction-amount ${
                          transaction.tip.includes('İNDİRİM') || 
                          transaction.tip.includes('TAHSİLAT') || 
                          transaction.tip.includes('TRANSFER EDİLDİ') ? 'amount-negative' : 'amount-positive'
                        }`}>
                          {transaction.tip.includes('İNDİRİM') || 
                           transaction.tip.includes('TAHSİLAT') || 
                           transaction.tip.includes('TRANSFER EDİLDİ') ? '-' : '+'}
                          {Number(transaction.tutar || 0).toFixed(2)} ₺
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
      <BorcTransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onConfirm={handleTransferDebt}
        kaynakMusteri={selectedCustomer}
        musteriler={customers}
        transferTutar={transferTutar}
        setTransferTutar={setTransferTutar}
        transferMusteriId={transferMusteriId}
        setTransferMusteriId={setTransferMusteriId}
        transferNot={transferNot}
        setTransferNot={setTransferNot}
      />
      
      {/* MANUEL KAYIT MODAL */}
{manuelKayitModalOpen && (
  <div className="modal-overlay" onClick={() => setManuelKayitModalOpen(false)}>
    <div className="manuel-kayit-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>✍️ Manuel Borç Kaydı Ekle</h3>
      </div>
      
      <div className="modal-content">
        <div className="form-row">
          <div className="form-group">
            <label>Müşteri Adı Soyadı *</label>
            <input 
              type="text" 
              placeholder="Müşteri adı soyadı"
              value={yeniMusteriAdi}
              onChange={(e) => setYeniMusteriAdi(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Telefon (Opsiyonel)</label>
            <input 
              type="text" 
              placeholder="5xxxxxxxxx"
              value={yeniMusteriTelefon}
              onChange={(e) => setYeniMusteriTelefon(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Borç Tutarı (₺) *</label>
            <input 
              type="number" 
              placeholder="0,00" 
              value={borcTutari}
              onChange={(e) => setBorcTutari(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label>Masa No (Opsiyonel)</label>
            <input 
              type="text" 
              placeholder="Örn: MASA 1, BİLARDO"
              value={masaNo}
              onChange={(e) => setMasaNo(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Açıklama (Opsiyonel)</label>
          <input 
            type="text" 
            placeholder="Borç kaydı açıklaması..."
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
          />
        </div>
        
        {/* ÜRÜN EKLEME BÖLÜMÜ */}
        <div className="urun-ekle-section">
          <h4>🛒 Ürün Ekle (Opsiyonel)</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Ürün Adı</label>
              <input 
                type="text" 
                placeholder="Ürün adı"
                value={urunAdi}
                onChange={(e) => setUrunAdi(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Adet</label>
              <input 
                type="number" 
                placeholder="1" 
                value={urunAdet}
                onChange={(e) => setUrunAdet(e.target.value)}
                min="1"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label>Fiyat (₺)</label>
              <input 
                type="number" 
                placeholder="0,00" 
                value={urunFiyat}
                onChange={(e) => setUrunFiyat(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>&nbsp;</label>
              <button 
                className="btn-urun-ekle"
                onClick={urunEkle}
              >
                ➕ Ekle
              </button>
            </div>
          </div>
          
          {urunler.length > 0 && (
            <div className="urun-listesi">
              {urunler.map(urun => (
                <div key={urun.id} className="urun-item">
                  <div>{urun.ad}</div>
                  <div>{urun.adet} adet</div>
                  <div>{Number(urun.fiyat || 0).toFixed(2)} ₺</div>
                  <button 
                    className="btn-urun-sil"
                    onClick={() => urunSil(urun.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-iptal"
            onClick={() => setManuelKayitModalOpen(false)}
          >
            İptal
          </button>
          <button 
            className="btn-kaydet"
            onClick={handleManuelKayit}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      
      {/* MÜŞTERİ DÜZENLEME MODAL */}
      {musteriDuzenleModalOpen && (
        <div className="modal-overlay" onClick={() => setMusteriDuzenleModalOpen(false)}>
          <div className="musteri-duzenle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Müşteri Düzenle</h3>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Müşteri Adı Soyadı *</label>
                <input 
                  type="text" 
                  placeholder="Müşteri adı soyadı"
                  value={duzenleAdSoyad}
                  onChange={(e) => setDuzenleAdSoyad(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Telefon (Opsiyonel)</label>
                <input 
                  type="text" 
                  placeholder="5xxxxxxxxx"
                  value={duzenleTelefon}
                  onChange={(e) => setDuzenleTelefon(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Not (Opsiyonel)</label>
                <textarea 
                  placeholder="Müşteri notları..."
                  value={duzenleNot}
                  onChange={(e) => setDuzenleNot(e.target.value)}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-iptal"
                  onClick={() => setMusteriDuzenleModalOpen(false)}
                >
                  İptal
                </button>
                <button 
                  className="btn-kaydet"
                  onClick={handleMusteriDuzenle}
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MÜŞTERİ SİLME ONAY MODAL */}
      {silmeOnayModalOpen && (
        <div className="modal-overlay" onClick={() => setSilmeOnayModalOpen(false)}>
          <div className="silme-onay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <h3>⚠️ Müşteri Sil</h3>
            </div>
            
            <div className="modal-content">
              <p>
                <strong>{silinecekMusteri?.adSoyad}</strong> müşterisini silmek istediğinize emin misiniz?
              </p>
              <p className="warning-text">
                Bu işlem geri alınamaz! Müşteri ve tüm borç kayıtları silinecektir.
              </p>
              
              <div className="musteri-bilgileri">
                <div className="info-item">
                  <span className="info-label">Toplam Borç Kaydı:</span>
                  <span className="info-value">{silinecekMusteri?.adisyonSayisi || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Kalan Borç:</span>
                  <span className="info-value">{Number(silinecekMusteri?.netBorc || 0).toFixed(2)} ₺</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-iptal"
                  onClick={() => setSilmeOnayModalOpen(false)}
                >
                  Vazgeç
                </button>
                <button 
                  className="btn-sil"
                  onClick={handleMusteriSil}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}