/* ============================================================
   📄 DOSYA: MusteriIslemleri.jsx
   📌 AMAÇ:
   MyCafe — Müşteri İşlemleri (Hesaba Yaz & Tahsilat) sayfası.
   - Görseldeki 3 kolonlu yapı (Müşteriler | Borç Kayıtları | İşlem Detayları)
   - Premium MyCafe bej–kahve teması
   - Kurallara uygun işlevsellik
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
  
  // Filtreleme
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tahsilat
  const [tahsilatTutar, setTahsilatTutar] = useState("");
  const [tahsilatTipi, setTahsilatTipi] = useState("NAKIT");
  const [tahsilatNot, setTahsilatNot] = useState("");

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
    
    // Borçları hesapla ve sırala
    const musterilerBorclu = musteriler.map(musteri => {
      // ADİSYON_KEY'den borçları hesapla
      const adisyonlar = okuJSON(ADISYON_KEY, []).filter(a => a.musteriId === musteri.id);
      
      // BORC_KEY'den borçları hesapla
      const borclar = okuJSON(BORC_KEY, []).filter(b => b.musteriId === musteri.id);
      
      let toplamBorcAdisyon = 0;
      let toplamBorcYeni = 0;
      let toplamOdemeYeni = 0;
      
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
          });
        }
      });
      
      // Eski tahsilatları düş
      const tahsilatlar = okuJSON(TAHBILAT_KEY, []).filter(t => t.musteriId === musteri.id);
      const toplamTahsilat = tahsilatlar.reduce((sum, t) => sum + (t.tutar || 0), 0);
      
      // TOPLAM BORÇ
      const toplamBorc = toplamBorcAdisyon + toplamBorcYeni;
      
      // TOPLAM ÖDEME
      const toplamOdeme = toplamTahsilat + toplamOdemeYeni;
      
      // İndirimleri kontrol et
      let toplamIndirim = 0;
      if (musteri.indirimler) {
        toplamIndirim = musteri.indirimler.reduce((sum, i) => sum + (i.tutar || 0), 0);
      }
      
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
    
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // --------------------------------------------------
  // MÜŞTERİ SEÇİMİ
  // --------------------------------------------------
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedDebtRecord(null);
    
    // Müşterinin tüm borç kayıtlarını getir
    const adisyonlar = okuJSON(ADISYON_KEY, [])
      .filter(a => a.musteriId === customer.id && a.hesabaYazilanTutar > 0)
      .map(adisyon => ({
        ...adisyon,
        tip: "ADISYON",
        borcTutari: adisyon.hesabaYazilanTutar,
        tarih: adisyon.tarih || adisyon.acilisZamani,
        masaNo: adisyon.masaNo || "-",
        id: `adisyon_${adisyon.id}`
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
        hareketler: borc.hareketler || []
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    const tumBorclar = [...adisyonlar, ...borclar]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    setDebtRecords(tumBorclar);
    
    // İşlem geçmişini hazırla
    const tahsilatlar = okuJSON(TAHBILAT_KEY, [])
      .filter(t => t.musteriId === customer.id)
      .map(t => ({
        tip: "TAHSİLAT",
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
      
      // Borç hareketlerini ekle (ödeme varsa)
      if (borc.hareketler) {
        borc.hareketler.forEach(hareket => {
          if (hareket.tip === "ÖDEME ALINDI") {
            tumHareketler.push({
              tip: "TAHSİLAT YAPILDI",
              tutar: hareket.tutar,
              tarih: hareket.tarih,
              odemeTipi: hareket.odemeTipi,
              borcId: borc.id
            });
          }
        });
      }
    });
    
    // Eski tahsilatları ekle
    tahsilatlar.forEach(t => {
      tumHareketler.push({
        tip: "TAHSİLAT YAPILDI",
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
  };

  // --------------------------------------------------
  // BORÇ KAYDI SEÇİMİ
  // --------------------------------------------------
  const handleDebtRecordSelect = (record) => {
    setSelectedDebtRecord(record);
  };

  // --------------------------------------------------
  // TAHSİLAT AL
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
    
    // 1. TAHSİLAT_KEY'e kaydet
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
                      <div className="table-info">Masa {record.masaNo}</div>
                      <div className="debt-amount">{record.borcTutari.toFixed(2)} ₺</div>
                    </div>
                    <div className="debt-date">
                      {new Date(record.tarih).toLocaleDateString('tr-TR')} {new Date(record.tarih).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div className="debt-status">
                      {record.hareketler?.some(h => h.tip === "ÖDEME ALINDI") ? "Kısmen Ödendi" : "Ödenmedi"}
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
        
        {/* SAĞ KOLON - İŞLEM DETAYLARI */}
        <div className="column details-column">
          <div className="column-header">
            <h2>İŞLEM DETAYLARI</h2>
          </div>
          
          <div className="details-content">
            {/* TAHSİLAT ALANI */}
            <div className="payment-section">
              <h3>TAHSİLAT</h3>
              <div className="payment-form">
                <div className="form-group">
                  <label>Tutar</label>
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
                
                <button 
                  className="btn-tahsilat"
                  onClick={handleCollectPayment}
                  disabled={!selectedCustomer || selectedCustomer.netBorc <= 0 || !tahsilatTutar}
                >
                  TAHSİL ET
                </button>
              </div>
            </div>
            
            {/* ADİSYON ÜRÜNLERİ */}
            {selectedDebtRecord && (
              <div className="products-section">
                <h3>ADİSYON ÜRÜNLERİ</h3>
                <div className="products-list">
                  {selectedDebtRecord.urunler && selectedDebtRecord.urunler.length > 0 ? (
                    selectedDebtRecord.urunler.map((urun, index) => (
                      <div key={index} className="product-item">
                        <div className="product-name">{urun.ad || urun.urunAd}</div>
                        <div className="product-quantity">{urun.adet || urun.miktar || 1} adet</div>
                        <div className="product-price">{(urun.birimFiyat || urun.fiyat || 0).toFixed(2)} ₺</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-products">
                      Bu adisyona ait ürün listesi bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* BORÇ HAREKETLERİ */}
            {selectedCustomer && transactionHistory.length > 0 && (
              <div className="transactions-section">
                <h3>BORÇ HAREKETLERİ</h3>
                <div className="transactions-list">
                  {transactionHistory.map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-type">{transaction.tip}</div>
                      <div className="transaction-amount">{transaction.tutar.toFixed(2)} ₺</div>
                      <div className="transaction-date">
                        {new Date(transaction.tarih).toLocaleDateString('tr-TR')} {new Date(transaction.tarih).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
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
  );
}