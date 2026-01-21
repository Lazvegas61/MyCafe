/*
  GÜNCELLENMİŞ RAPOR AGGREGATOR - TÜM VERİLER
  --------------------------------------------
  - Satışlar, giderler, tahsilatlar tek yerde
  - Detaylı adisyon bilgileri
  - Ödeme türleri ve saatler
*/

// 🔧 ADİSYONLARDAN SATIŞ VERİSİ OLUŞTUR
export const adisyonlardanSatisVerisiOlustur = () => {
  try {
    const adisyonlar = JSON.parse(
      localStorage.getItem("mc_adisyonlar") || "[]"
    );
    
    const bilardoAdisyonlar = JSON.parse(
      localStorage.getItem("bilardo_adisyonlar") || "[]"
    );
    
    const tumAdisyonlar = [...adisyonlar, ...bilardoAdisyonlar];
    const satisVerileri = [];
    
    // SADECE KAPALI VE ÖDENMİŞ ADİSYONLAR
    const kapaliAdisyonlar = tumAdisyonlar.filter(ad => 
      ad.kapali === true && ad.odemeDurumu === "ODENDI"
    );
    
    kapaliAdisyonlar.forEach(adisyon => {
      const adisyonTipi = adisyon.tip === "BİLARDO" ? "BİLARDO" : "NORMAL";
      const masaNo = adisyon.masaNo || adisyon.masaAdi || "Bilardo Masası";
      
      // ÖDEME TÜRÜ ANALİZİ
      let odemeTuru = "NAKIT";
      let odemeDetay = "";
      
      if (adisyon.odemeBilgisi) {
        if (typeof adisyon.odemeBilgisi === 'string') {
          odemeDetay = adisyon.odemeBilgisi;
          if (adisyon.odemeBilgisi.includes("KART")) odemeTuru = "KART";
          if (adisyon.odemeBilgisi.includes("HAVALE")) odemeTuru = "HAVALE";
          if (adisyon.odemeBilgisi.includes("KREDİ")) odemeTuru = "KREDI_KARTI";
        } else if (typeof adisyon.odemeBilgisi === 'object') {
          odemeTuru = adisyon.odemeBilgisi.tur || "NAKIT";
          odemeDetay = adisyon.odemeBilgisi.detay || "";
        }
      }
      
      // ADİSYON KALEMLERİ ANALİZİ
      let urunler = [];
      let kategoriDagilimi = {};
      
      if (adisyon.kalemler && Array.isArray(adisyon.kalemler)) {
        urunler = adisyon.kalemler.map(kalem => ({
          ad: kalem.urunAdi || kalem.ad || "Ürün",
          adet: kalem.adet || 1,
          birimFiyat: kalem.birimFiyat || kalem.fiyat || 0,
          toplam: (kalem.adet || 1) * (kalem.birimFiyat || kalem.fiyat || 0)
        }));
        
        // Kategori analizi
        adisyon.kalemler.forEach(kalem => {
          const kategori = kalem.kategori || "Diğer";
          kategoriDagilimi[kategori] = (kategoriDagilimi[kategori] || 0) + 
            ((kalem.adet || 1) * (kalem.birimFiyat || kalem.fiyat || 0));
        });
      }
      
      satisVerileri.push({
        id: `satis_${adisyon.id}`,
        tip: "SATIS",
        adisyonTipi,
        adisyonId: adisyon.id,
        masaNo,
        tarih: adisyon.kapanisZamani || adisyon.gunId || new Date().toISOString(),
        acilisSaati: adisyon.acilisZamani ? 
          new Date(adisyon.acilisZamani).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : "",
        kapanisSaati: adisyon.kapanisZamani ? 
          new Date(adisyon.kapanisZamani).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : "",
        toplamTutar: adisyon.toplamTutar || 0,
        odemeTuru,
        odemeDetay,
        urunler,
        kategoriDagilimi,
        gunId: adisyon.gunId || adisyon.gunld || 
          (adisyon.kapanisZamani ? new Date(adisyon.kapanisZamani).toISOString().split('T')[0] : ""),
        personel: adisyon.personel || "",
        not: adisyon.not || "",
        kaynak: "ADISYON"
      });
    });
    
    return satisVerileri;
  } catch (error) {
    console.error("❌ Adisyon satış verisi oluşturma hatası:", error);
    return [];
  }
};

// 🔧 GİDER VERİLERİNİ DETAYLI AL
export const getDetayliGiderVerileri = () => {
  try {
    const giderler = JSON.parse(
      localStorage.getItem("mc_giderler") || "[]"
    );
    
    return giderler.map(gider => ({
      id: `gider_${gider.id}`,
      tip: "GIDER",
      giderId: gider.id,
      tarih: gider.tarih || new Date().toISOString(),
      giderTuru: gider.giderTuru || "GENEL",
      aciklama: gider.aciklama || "Gider",
      tutar: gider.tutar || 0,
      gunId: gider.gunId || 
        (gider.tarih ? new Date(gider.tarih).toISOString().split('T')[0] : ""),
      personel: gider.personel || "",
      not: gider.not || "",
      kaynak: "GIDER"
    }));
  } catch (error) {
    console.error("❌ Gider verisi alma hatası:", error);
    return [];
  }
};

// 🔧 HESABA YAZ / TAHSİLAT VERİLERİ
export const getHesabaYazVerileri = () => {
  try {
    const hesabaYazlar = JSON.parse(
      localStorage.getItem("mc_hesaba_yaz") || "[]"
    );
    
    const tahsilatlar = JSON.parse(
      localStorage.getItem("mc_tahsilatlar") || "[]"
    );
    
    const veriler = [];
    
    // HESABA YAZILANLAR
    hesabaYazlar.forEach(kayit => {
      veriler.push({
        id: `hesaba_yaz_${kayit.id}`,
        tip: "HESABA_YAZ",
        musteri: kayit.musteri || "",
        tarih: kayit.tarih || new Date().toISOString(),
        aciklama: kayit.aciklama || "Hesaba Yazıldı",
        tutar: kayit.tutar || 0,
        durum: kayit.durum || "BEKLEMEDE",
        gunId: kayit.gunId || 
          (kayit.tarih ? new Date(kayit.tarih).toISOString().split('T')[0] : ""),
        kaynak: "HESABA_YAZ"
      });
    });
    
    // TAHSİLATLAR
    tahsilatlar.forEach(tahsilat => {
      veriler.push({
        id: `tahsilat_${tahsilat.id}`,
        tip: "TAHSILAT",
        musteri: tahsilat.musteri || "",
        tarih: tahsilat.tarih || new Date().toISOString(),
        aciklama: tahsilat.aciklama || "Tahsilat",
        tutar: tahsilat.tutar || 0,
        tahsilatTuru: tahsilat.tahsilatTuru || "NAKIT",
        hesabaYazId: tahsilat.hesabaYazId || "",
        gunId: tahsilat.gunId || 
          (tahsilat.tarih ? new Date(tahsilat.tarih).toISOString().split('T')[0] : ""),
        kaynak: "TAHSILAT"
      });
    });
    
    return veriler;
  } catch (error) {
    console.error("❌ Hesaba yaz verisi alma hatası:", error);
    return [];
  }
};

// 🔧 GÜN SONU DETAYLI RAPOR OLUŞTUR
export const createGunSonuDetayliRapor = (gunId) => {
  try {
    // 1. TÜM VERİLERİ TOPLA
    const satislar = adisyonlardanSatisVerisiOlustur().filter(s => s.gunId === gunId);
    const giderler = getDetayliGiderVerileri().filter(g => g.gunId === gunId);
    const hesabaYazlar = getHesabaYazVerileri().filter(h => h.gunId === gunId);
    const sistemKayitlari = JSON.parse(
      localStorage.getItem("mc_gunluk_gecisler") || "[]"
    ).filter(k => k.gunId === gunId);
    
    // 2. TOPLAMLARI HESAPLA
    const toplamSatis = satislar.reduce((sum, s) => sum + (s.toplamTutar || 0), 0);
    const toplamGider = giderler.reduce((sum, g) => sum + (g.tutar || 0), 0);
    
    // 3. ÖDEME TÜRLERİNE GÖRE DAĞILIM
    const odemeDagilimi = {};
    satislar.forEach(satis => {
      const tur = satis.odemeTuru || "NAKIT";
      odemeDagilimi[tur] = (odemeDagilimi[tur] || 0) + (satis.toplamTutar || 0);
    });
    
    // 4. MASA BAZLI ANALİZ
    const masaBazliSatislar = {};
    satislar.forEach(satis => {
      const masa = satis.masaNo || "Bilinmeyen";
      if (!masaBazliSatislar[masa]) {
        masaBazliSatislar[masa] = {
          toplam: 0,
          adet: 0,
          tip: satis.adisyonTipi || "NORMAL"
        };
      }
      masaBazliSatislar[masa].toplam += satis.toplamTutar || 0;
      masaBazliSatislar[masa].adet += 1;
    });
    
    // 5. SAAT BAZLI ANALİZ
    const saatBazliSatislar = {};
    satislar.forEach(satis => {
      if (satis.kapanisSaati) {
        const saat = satis.kapanisSaati.split(':')[0] + ":00";
        saatBazliSatislar[saat] = (saatBazliSatislar[saat] || 0) + (satis.toplamTutar || 0);
      }
    });
    
    // 6. DETAYLI RAPOR OLUŞTUR
    const detayliRapor = {
      id: `gun_rapor_${gunId}_${Date.now()}`,
      tip: "GUN_DETAYLI_RAPOR",
      gunId,
      olusturulmaTarihi: new Date().toISOString(),
      
      // GENEL TOPLAMLAR
      toplamSatis,
      toplamGider,
      netKasa: toplamSatis - toplamGider,
      
      // SATIŞ ANALİZLERİ
      satisAnaliz: {
        toplamAdisyon: satislar.length,
        normalAdisyon: satislar.filter(s => s.adisyonTipi === "NORMAL").length,
        bilardoAdisyon: satislar.filter(s => s.adisyonTipi === "BİLARDO").length,
        ortalamaAdisyon: satislar.length > 0 ? toplamSatis / satislar.length : 0
      },
      
      // ÖDEME DAĞILIMI
      odemeDagilimi,
      
      // MASA BAZLI ANALİZ
      masaBazliSatislar,
      
      // SAAT BAZLI ANALİZ
      saatBazliSatislar,
      
      // GİDER DAĞILIMI
      giderDagilimi: giderler.reduce((acc, g) => {
        const tur = g.giderTuru || "GENEL";
        acc[tur] = (acc[tur] || 0) + (g.tutar || 0);
        return acc;
      }, {}),
      
      // HESABA YAZ ANALİZİ
      hesabaYazAnaliz: {
        toplamHesabaYaz: hesabaYazlar.filter(h => h.tip === "HESABA_YAZ").length,
        toplamTahsilat: hesabaYazlar.filter(h => h.tip === "TAHSILAT").length,
        bekleyenHesabaYaz: hesabaYazlar.filter(h => h.tip === "HESABA_YAZ" && h.durum === "BEKLEMEDE").length
      },
      
      // HAM VERİLER (referans için)
      satislar,
      giderler,
      hesabaYazlar,
      sistemKayitlari
    };
    
    // 7. LOCALSTORAGE'A KAYDET
    const mevcutRaporlar = JSON.parse(
      localStorage.getItem("mc_detayli_gun_raporlari") || "[]"
    );
    
    // Aynı günün eski raporunu sil
    const yeniRaporlar = mevcutRaporlar.filter(r => r.gunId !== gunId);
    yeniRaporlar.push(detayliRapor);
    
    localStorage.setItem(
      "mc_detayli_gun_raporlari",
      JSON.stringify(yeniRaporlar)
    );
    
    console.log(`✅ ${gunId} detaylı rapor oluşturuldu:`, detayliRapor);
    return detayliRapor;
    
  } catch (error) {
    console.error("❌ Detaylı rapor oluşturma hatası:", error);
    return null;
  }
};

// 🔧 TÜM DETAYLI VERİLERİ GETİR
export const getTumDetayliVeriler = () => {
  try {
    const satislar = adisyonlardanSatisVerisiOlustur();
    const giderler = getDetayliGiderVerileri();
    const hesabaYazlar = getHesabaYazVerileri();
    const sistemKayitlari = JSON.parse(
      localStorage.getItem("mc_gunluk_gecisler") || "[]"
    );
    
    const detayliRaporlar = JSON.parse(
      localStorage.getItem("mc_detayli_gun_raporlari") || "[]"
    );
    
    // TÜM VERİLERİ BİRLEŞTİR
    const tumVeriler = [
      ...satislar,
      ...giderler,
      ...hesabaYazlar,
      ...sistemKayitlari.map(k => ({
        ...k,
        tip: "SISTEM",
        aciklama: k.tip === "GUN_BASI" ? "Gün Başı" : "Gün Sonu",
        tutar: 0,
        kaynak: "SISTEM"
      })),
      ...detayliRaporlar
    ];
    
    return tumVeriler.sort((a, b) => 
      new Date(b.tarih || b.olusturulmaTarihi) - new Date(a.tarih || a.olusturulmaTarihi)
    );
    
  } catch (error) {
    console.error("❌ Tüm detaylı verileri getirme hatası:", error);
    return [];
  }
};

// 🔧 BELİRLİ BİR GÜNÜN DETAYLI RAPORUNU GETİR
export const getGunDetayliRaporu = (gunId) => {
  try {
    const detayliRaporlar = JSON.parse(
      localStorage.getItem("mc_detayli_gun_raporlari") || "[]"
    );
    
    return detayliRaporlar.find(r => r.gunId === gunId) || null;
  } catch (error) {
    console.error("❌ Gün detaylı rapor getirme hatası:", error);
    return null;
  }
};