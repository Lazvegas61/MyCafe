const RaporMotoruV2 = {
  // ===== SABİTLER =====
  ADISYON_TURLERI: {
    NORMAL: 'NORMAL',
    BILARDO: 'BİLARDO'
  },

  ODEME_TIPLERI: {
    NAKIT: 'NAKIT',
    KART: 'KART',
    HAVALE: 'HAVALE',
    HESABA_YAZ: 'HESABA_YAZ'
  },

  // ===== YARDIMCI FONKSİYONLAR =====
  parseFloatSafe(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  },

  filterByDate(items, dateField = 'tarih') {
    const bugun = new Date().toISOString().split('T')[0];
    return items.filter(item => {
      try {
        const itemDate = new Date(item[dateField] || item.acilisZamani || item.tarih);
        const itemDateStr = itemDate.toISOString().split('T')[0];
        return itemDateStr === bugun;
      } catch {
        return false;
      }
    });
  },

  isBilardoMasa(masaLabel) {
    if (!masaLabel) return false;
    const str = String(masaLabel).toUpperCase();
    return str.includes('BİLARDO') || str.includes('BILARDO') || /^B\d+/i.test(str);
  },

  // ===== ÇEKİRDEK FONKSİYONLAR =====

  // 1️⃣ ADİSYON KAPALI MI KONTROLÜ
  isAdisyonKapali(adisyon) {
    if (!adisyon) return true;

    if (adisyon.kapali === true) return true;

    const durum = String(adisyon.durum || '').toUpperCase();
    const kapaliDurumlar = ['KAPALI', 'KAPATILDI', 'ÖDENDİ', 'CLOSED', 'PAID'];
    if (kapaliDurumlar.includes(durum)) return true;

    if (adisyon.kapanisZamani) {
      try {
        const kapanisZamani = new Date(adisyon.kapanisZamani);
        if (!isNaN(kapanisZamani.getTime())) return true;
      } catch {
        // Geçersiz tarih, devam et
      }
    }

    if (adisyon.odemeler && Array.isArray(adisyon.odemeler)) {
      const toplamOdenen = adisyon.odemeler.reduce((sum, odeme) => {
        return sum + this.parseFloatSafe(odeme.tutar || odeme.miktar);
      }, 0);

      let toplamTutar = 0;
      if (adisyon.tur === 'BİLARDO' || adisyon.isBilardo) {
        toplamTutar = this.parseFloatSafe(adisyon.bilardoUcreti) + 
                     this.parseFloatSafe(adisyon.ekUrunToplam);
      } else {
        const kalemToplam = (adisyon.kalemler || []).reduce((sum, kalem) => {
          return sum + this.parseFloatSafe(kalem.toplam);
        }, 0);
        toplamTutar = kalemToplam || this.parseFloatSafe(adisyon.toplamTutar);
      }

      if (toplamOdenen >= toplamTutar - 0.01) {
        return true;
      }
    }

    if (adisyon.tur === 'BİLARDO' || adisyon.isBilardo) {
      if (adisyon.sureBitti === true || adisyon.sureBitti === 'true') {
        return true;
      }
    }

    return false;
  },

  // 2️⃣ TÜM AÇIK ADİSYONLARI GETİR
  getAcikAdisyonlar() {
    try {
      console.log('🔄 Açık adisyonlar getiriliyor...');
      
      const normalAdisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');

      const tumAdisyonlar = [...normalAdisyonlar, ...bilardoAdisyonlar];

      const acikAdisyonlar = tumAdisyonlar
        .map(adisyon => {
          // Basit normalizasyon
          if (!adisyon || !adisyon.id) return null;
          
          const isBilardo = adisyon.tur === 'BİLARDO' || adisyon.isBilardo === true;
          
          let masaLabel = "";
          if (isBilardo) {
            masaLabel = adisyon.bilardoMasaNo || 
                       adisyon.masaNo || 
                       `BİLARDO ${adisyon.masaNum || '?'}`;
          } else {
            masaLabel = adisyon.masaNo || `MASA ${adisyon.masaNum || '?'}`;
          }

          let toplamTutar = 0;
          if (isBilardo) {
            toplamTutar = this.parseFloatSafe(adisyon.bilardoUcreti) + 
                         this.parseFloatSafe(adisyon.ekUrunToplam);
          } else {
            const kalemToplam = (adisyon.kalemler || []).reduce((sum, kalem) => {
              return sum + this.parseFloatSafe(kalem.toplam);
            }, 0);
            toplamTutar = kalemToplam || this.parseFloatSafe(adisyon.toplamTutar);
          }

          return {
            id: adisyon.id,
            tur: isBilardo ? 'BİLARDO' : 'NORMAL',
            masaLabel: masaLabel,
            toplamTutar: toplamTutar,
            urunSayisi: (adisyon.kalemler || []).length,
            acilisZamani: adisyon.acilisZamani || adisyon.tarih || new Date().toISOString(),
            durum: this.isAdisyonKapali(adisyon) ? "KAPALI" : "AÇIK",
            isBilardo: isBilardo,
            musteriAdi: adisyon.musteriAdi || null
          };
        })
        .filter(adisyon => adisyon && adisyon.durum === 'AÇIK');

      console.log(`✅ ${acikAdisyonlar.length} açık adisyon bulundu`);
      return acikAdisyonlar;
    } catch (error) {
      console.error('Açık adisyon getirme hatası:', error);
      return [];
    }
  },

  // 3️⃣ DASHBOARD VERİSİ GETİR (GİDERLER DAHİL)
  getDashboardData() {
    try {
      const bugun = new Date().toISOString().split('T')[0];
      
      // AÇIK ADİSYONLAR
      const acikAdisyonlar = this.getAcikAdisyonlar();
      
      // BUGÜNKÜ ADİSYONLAR
      const normalAdisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
      
      const bugunkuNormal = this.filterByDate(normalAdisyonlar, 'acilisZamani');
      const bugunkuBilardo = this.filterByDate(bilardoAdisyonlar, 'acilisZamani');

      // ✅ GÜNLÜK GİDERLER (SİZİN TESPİTİNİZ)
      const giderler = JSON.parse(localStorage.getItem('mc_giderler') || '[]');
      const bugunkuGiderler = this.filterByDate(giderler, 'tarih');
      const gunlukGiderToplam = bugunkuGiderler.reduce((sum, gider) => {
        // ✅ TÜM ALANLARI KONTROL ET (SİZİN TESPİTİNİZ)
        return sum + this.parseFloatSafe(gider.tutar ?? gider.amount ?? gider.price ?? 0);
      }, 0);

      // GÜNLÜK HESAP
      const gunlukHesap = {
        normal: bugunkuNormal.reduce((sum, adisyon) => {
          const kalemToplam = (adisyon.kalemler || []).reduce((s, kalem) => 
            s + this.parseFloatSafe(kalem.toplam), 0);
          return sum + (kalemToplam || this.parseFloatSafe(adisyon.toplamTutar));
        }, 0),
        bilardo: bugunkuBilardo.reduce((sum, adisyon) => {
          const bilardoUcret = this.parseFloatSafe(adisyon.bilardoUcreti);
          const ekUrunToplam = this.parseFloatSafe(adisyon.ekUrunToplam);
          return sum + bilardoUcret + ekUrunToplam;
        }, 0),
        acikAdisyonlar: acikAdisyonlar.length,
        toplam: 0,
        // ✅ GİDER EKLENDİ
        gider: gunlukGiderToplam
      };
      
      gunlukHesap.toplam = gunlukHesap.normal + gunlukHesap.bilardo;

      // KRİTİK STOK
      const urunler = JSON.parse(localStorage.getItem('mc_urunler') || '[]');
      const kritikStoklar = urunler.filter(u => 
        (parseInt(u.stock || 0) || 0) <= (parseInt(u.critical || 10) || 10)
      );

      // AÇIK MASALAR
      const normalMasalar = JSON.parse(localStorage.getItem('mc_masalar') || '[]');
      const acikNormalMasalar = normalMasalar
        .filter(m => m.durum === 'DOLU')
        .map(m => ({
          ...m,
          tip: 'NORMAL',
          masaLabel: `MASA ${m.no || m.masaNum || '?'}`
        }));

      const bilardoMasalar = JSON.parse(localStorage.getItem('bilardo') || '[]');
      const acikBilardoMasalar = bilardoMasalar
        .filter(m => m.durum === 'ACIK')
        .map(m => ({
          ...m,
          tip: 'BİLARDO',
          masaLabel: `BİLARDO ${m.no || m.masaNum || '?'}`
        }));

      const acikMasalar = [...acikNormalMasalar, ...acikBilardoMasalar];

      return {
        gunlukHesap,
        acikMasalar,
        kritikStokSayisi: kritikStoklar.length,
        acikAdisyonlar,
        // ✅ GİDER DETAYI
        gunlukGiderler: bugunkuGiderler,
        gunlukGiderToplam: gunlukGiderToplam,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Dashboard verisi getirme hatası:', error);
      return {
        gunlukHesap: { 
          normal: 0, 
          bilardo: 0, 
          acikAdisyonlar: 0, 
          toplam: 0,
          gider: 0
        },
        acikMasalar: [],
        kritikStokSayisi: 0,
        acikAdisyonlar: [],
        gunlukGiderler: [],
        gunlukGiderToplam: 0,
        timestamp: new Date().toISOString()
      };
    }
  },

  // 4️⃣ GÜN SONU RAPORU OLUŞTUR (TÜM DÜZELTMELER)
  createGunSonuRaporu(baslangicTarihi = null, bitisTarihi = null) {
    try {
      console.log('📊 Gün sonu raporu oluşturuluyor...');
      
      const baslangic = baslangicTarihi || localStorage.getItem('mycafe_gun_baslangic') || new Date().toISOString();
      const bitis = bitisTarihi || new Date().toISOString();
      const bugun = new Date().toISOString().split('T')[0];
      const user = JSON.parse(localStorage.getItem('mc_user') || '{}');

      // ===== VERİ TOPLAMA =====
      
      // 1️⃣ NORMAL ADİSYONLAR
      const normalAdisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
      const bugunkuNormal = this.filterByDate(normalAdisyonlar, 'acilisZamani');
      
      // 2️⃣ BİLARDO ADİSYONLARI
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
      const bugunkuBilardo = this.filterByDate(bilardoAdisyonlar, 'acilisZamani');

      // 3️⃣ GİDERLER (DÜZELTİLMİŞ - TÜM ALANLAR)
      const giderler = JSON.parse(localStorage.getItem('mc_giderler') || '[]');
      const bugunkuGiderler = this.filterByDate(giderler, 'tarih');

      // 4️⃣ KASA HAREKETLERİ
      const kasaHareketleri = JSON.parse(localStorage.getItem('mc_kasa_hareketleri') || '[]');
      const bugunkuKasa = this.filterByDate(kasaHareketleri, 'tarih');

      // ===== HESAPLAMALAR =====
      
      // NORMAL SATIŞ
      const normalCiro = bugunkuNormal.reduce((sum, adisyon) => {
        const kalemToplam = (adisyon.kalemler || []).reduce((s, kalem) => 
          s + this.parseFloatSafe(kalem.toplam), 0);
        return sum + (kalemToplam || this.parseFloatSafe(adisyon.toplamTutar));
      }, 0);

      // BİLARDO SATIŞ
      const bilardoCiro = bugunkuBilardo.reduce((sum, adisyon) => {
        const bilardoUcret = this.parseFloatSafe(adisyon.bilardoUcreti);
        const ekUrunToplam = this.parseFloatSafe(adisyon.ekUrunToplam);
        return sum + bilardoUcret + ekUrunToplam;
      }, 0);

      // ✅ GİDER TOPLAM (TÜM ALANLAR KONTROLLÜ)
      const giderToplam = bugunkuGiderler.reduce((sum, gider) => {
        // ✅ TÜM MÜMKÜN ALANLARI KONTROL ET
        const tutar = this.parseFloatSafe(
  gider.tutar ?? gider.amount ?? gider.price ?? 0
);

        return sum + tutar;
      }, 0);

      // ✅ KASA ANALİZİ - SADECE ADİSYONLARDAN (ÇİFTE SAYIM ENGELLENDİ)
const kasa = { nakit: 0, kart: 0, havale: 0, hesabaYaz: 0, toplam: 0 };
const tumAdisyonlar = [...bugunkuNormal, ...bugunkuBilardo];

tumAdisyonlar.forEach(adisyon => {
  if (adisyon.odemeler && Array.isArray(adisyon.odemeler)) {
    adisyon.odemeler.forEach(odeme => {
      const tutar = this.parseFloatSafe(odeme.tutar || odeme.miktar);
      const tip = (odeme.tip || odeme.odemeTipi || '').toUpperCase();
      
      if (tutar > 0) {
        if (tip.includes('NAKIT') || tip.includes('NAKİT')) kasa.nakit += tutar;
        else if (tip.includes('KART')) kasa.kart += tutar;
        else if (tip.includes('HAVALE')) kasa.havale += tutar;
        else if (tip.includes('HESABA_YAZ') || tip.includes('BORÇ') || tip.includes('HESAP')) kasa.hesabaYaz += tutar;
        else kasa.nakit += tutar; // Default Fallback

        kasa.toplam += tutar;
      }
    });
  }
});

      console.log('🧾 Kasa özeti:', kasa);
      console.log('💰 Gider toplamı:', giderToplam);
      console.log('🎱 Bilardo ciro:', bilardoCiro);

      // ===== RAPOR OLUŞTUR =====
      const raporId = `GUN_${bugun.replace(/-/g, '')}_${Date.now()}`;
      
      const rapor = {
        id: raporId,
        baslangic: baslangic,
        bitis: bitis,
        toplamCiro: normalCiro + bilardoCiro,
        normalCiro: normalCiro,
        bilardoCiro: bilardoCiro,
        kasa: kasa,
        giderler: giderToplam,
        kritikStokSayisi: 0,
        acikAdisyonSayisi: this.getAcikAdisyonlar().length,
        toplamAdisyonSayisi: bugunkuNormal.length + bugunkuBilardo.length,
        olusturan: user.adSoyad || user.username || 'Bilinmiyor',
        tarih: bugun,
        olusturulmaZamani: new Date().toISOString(),
        // DEBUG BİLGİLERİ
        _debug: {
          normalAdisyonSayisi: bugunkuNormal.length,
          bilardoAdisyonSayisi: bugunkuBilardo.length,
          giderSayisi: bugunkuGiderler.length,
          kasaHareketSayisi: bugunkuKasa.length
        }
      };

      // ===== RAPORU KAYDET =====
      const eskiRaporlar = JSON.parse(localStorage.getItem('mycafe_gun_sonu_raporlar') || '[]');
      eskiRaporlar.unshift(rapor);
      localStorage.setItem('mycafe_gun_sonu_raporlar', JSON.stringify(eskiRaporlar.slice(0, 100)));

      console.log('✅ Gün sonu raporu oluşturuldu:', raporId);
      return rapor;

    } catch (error) {
      console.error('❌ Gün sonu raporu oluşturma hatası:', error);
      throw new Error(`Rapor oluşturulamadı: ${error.message}`);
    }
  },

  // 5️⃣ KASA RAPORU HESAPLAMA
  kasaRaporuHesapla(gunSonuRaporlari = []) {
    try {
      console.log('💰 Kasa raporu hesaplanıyor:', gunSonuRaporlari?.length || 0);
      
      const raporlar = Array.isArray(gunSonuRaporlari) ? gunSonuRaporlari : [];

      let nakitGelir = 0;
      let kartGelir = 0;
      let havaleGelir = 0;
      let hesapGelir = 0;
      let toplamGelir = 0;
      let toplamGider = 0;
      let giderSayisi = 0;

      // Gün sonu raporlarından gelir hesapla
      raporlar.forEach(r => {
        nakitGelir += this.parseFloatSafe(r?.kasa?.nakit);
        kartGelir += this.parseFloatSafe(r?.kasa?.kart);
        havaleGelir += this.parseFloatSafe(r?.kasa?.havale);
        hesapGelir += this.parseFloatSafe(r?.kasa?.hesabaYaz);
        
        // Giderleri de ekle
        toplamGider += this.parseFloatSafe(r?.giderler);
        if (this.parseFloatSafe(r?.giderler) > 0) {
          giderSayisi++;
        }
      });

      toplamGelir = nakitGelir + kartGelir + havaleGelir + hesapGelir;

      // Günlük gelirleri hesapla (tarihe göre)
      const gunlukGelirler = {};
      raporlar.forEach(r => {
        const tarih = r.tarih || new Date(r.bitis).toISOString().split('T')[0];
        const gunlukToplam = 
          this.parseFloatSafe(r?.kasa?.nakit) +
          this.parseFloatSafe(r?.kasa?.kart) + 
          this.parseFloatSafe(r?.kasa?.havale) +
          this.parseFloatSafe(r?.kasa?.hesabaYaz);
        
        gunlukGelirler[tarih] = (gunlukGelirler[tarih] || 0) + gunlukToplam;
      });

      const gunlukGelirArray = Object.entries(gunlukGelirler)
        .map(([tarih, tutar]) => ({ tarih, tutar }))
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

      return {
        // Gelir bilgileri
        nakitGelir,
        kartGelir,
        havaleGelir,
        hesapGelir,
        toplamGelir,
        
        // Gider bilgileri
        toplamGider,
        giderSayisi,
        
        // Net kasa
        netKasa: toplamGelir - toplamGider,
        
        // İstatistikler
        gunSayisi: Object.keys(gunlukGelirler).length || 1,
        raporSayisi: raporlar.length,
        ortalamaGelir: Object.keys(gunlukGelirler).length > 0 
          ? toplamGelir / Object.keys(gunlukGelirler).length 
          : 0,
        
        // Görselleştirme için
        odemeDagilimi: [
          { label: 'Nakit', value: nakitGelir, color: '#4CAF50' },
          { label: 'Kart', value: kartGelir, color: '#2196F3' },
          { label: 'Havale', value: havaleGelir, color: '#9C27B0' },
          { label: 'Hesap', value: hesapGelir, color: '#FF9800' }
        ],
        
        // Zaman serisi verisi
        gunlukGelirler: gunlukGelirArray
      };
      
    } catch (error) {
      console.error('❌ Kasa raporu hesaplama hatası:', error);
      return {
        nakitGelir: 0,
        kartGelir: 0,
        havaleGelir: 0,
        hesapGelir: 0,
        toplamGelir: 0,
        toplamGider: 0,
        giderSayisi: 0,
        netKasa: 0,
        gunSayisi: 1,
        raporSayisi: 0,
        ortalamaGelir: 0,
        odemeDagilimi: [
          { label: 'Nakit', value: 0, color: '#4CAF50' },
          { label: 'Kart', value: 0, color: '#2196F3' },
          { label: 'Havale', value: 0, color: '#9C27B0' },
          { label: 'Hesap', value: 0, color: '#FF9800' }
        ],
        gunlukGelirler: []
      };
    }
  },

  // 6️⃣ RAPORLARI LİSTELE
  getRaporListesi(limit = 50) {
    try {
      const raporlar = JSON.parse(localStorage.getItem('mycafe_gun_sonu_raporlar') || '[]');
      return raporlar.slice(0, limit);
    } catch (error) {
      console.error('Rapor listesi getirme hatası:', error);
      return [];
    }
  },

  // 7️⃣ SİSTEM SAĞLIĞI KONTROLÜ
  sistemSaglikKontrol() {
    const kontroller = [];
    
    try {
      // Rapor motoru global mi?
      const motorHazir = typeof window !== 'undefined' && 
                        window.raporMotoruV2 && 
                        typeof window.raporMotoruV2.createGunSonuRaporu === 'function';

      kontroller.push({
        ad: 'Rapor Motoru Global',
        durum: motorHazir,
        mesaj: motorHazir ? '✅ Rapor motoru hazır' : '❌ Rapor motoru eksik / hazır değil'
      });

      // Temel veriler kontrolü
      const veriler = {
        'mc_adisyonlar': JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]'),
        'bilardo_adisyonlar': JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]'),
        'mc_masalar': JSON.parse(localStorage.getItem('mc_masalar') || '[]'),
        'bilardo': JSON.parse(localStorage.getItem('bilardo') || '[]'),
        'mc_urunler': JSON.parse(localStorage.getItem('mc_urunler') || '[]'),
        'mc_giderler': JSON.parse(localStorage.getItem('mc_giderler') || '[]'),
        'mc_kasa_hareketleri': JSON.parse(localStorage.getItem('mc_kasa_hareketleri') || '[]')
      };

      Object.entries(veriler).forEach(([key, value]) => {
        kontroller.push({
          ad: key,
          durum: Array.isArray(value),
          mesaj: Array.isArray(value) ? `✅ ${value.length} kayıt` : '❌ Dizi değil'
        });
      });

      // Açık adisyon kontrolü
      const acikAdisyonlar = this.getAcikAdisyonlar();
      kontroller.push({
        ad: 'Açık Adisyonlar',
        durum: true,
        mesaj: `✅ ${acikAdisyonlar.length} açık adisyon`
      });

      return {
        saglik: kontroller.every(c => c.durum),
        kontroller,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Sistem sağlık kontrol hatası:', error);
      return {
        saglik: false,
        kontroller: [{ ad: 'Hata', durum: false, mesaj: error.message }],
        timestamp: new Date().toISOString()
      };
    }
  }
}; // ⭐ BU SÜSLÜ PARANTEZ KRİTİK!

// ===== TEK GLOBAL KAYIT =====
if (typeof window !== 'undefined') {
  window.raporMotoruV2 = RaporMotoruV2;
  console.log('🌟 RaporMotoruV2 global olarak kaydedildi');
  
  // Debug için global fonksiyon
  if (process.env.NODE_ENV === 'development') {
    window.raporDebug = {
      saglikKontrol: () => RaporMotoruV2.sistemSaglikKontrol(),
      dashboardData: () => RaporMotoruV2.getDashboardData(),
      acikAdisyonlar: () => RaporMotoruV2.getAcikAdisyonlar(),
      gunSonuRaporu: () => RaporMotoruV2.createGunSonuRaporu(),
      kasaRaporu: (raporlar) => RaporMotoruV2.kasaRaporuHesapla(raporlar)
    };
  }
}

export default RaporMotoruV2;