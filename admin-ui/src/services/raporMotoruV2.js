// src/services/raporMotoruV2.js
import localStorageService from './localStorageService';

/**
 * MYCAFE RAPOR MOTORU V2
 * Tüm hesaplamalar burada yapılır
 */
class RaporMotoruV2 {
  constructor() {
    this.cache = {};
    this.debugMode = false;
  }

  // Debug log
  log(...args) {
    if (this.debugMode) {
      console.log('[RaporMotoru]', ...args);
    }
  }

  // 1. GENEL ÖZET RAPORU
  async genelOzet(startDate = null, endDate = null) {
    try {
      const data = localStorageService.getAll();
      
      // Adisyonlardan ciro hesapla
      const adisyonlar = localStorageService.filterByDate(data.adisyonlar || [], startDate, endDate);
      const toplamCiro = adisyonlar.reduce((sum, adisyon) => {
        return sum + (parseFloat(adisyon.toplamTutar) || 0);
      }, 0);

      // Tahsilatlar (kapalı adisyonlar)
      const kapaliAdisyonlar = adisyonlar.filter(a => 
        a.durum === 'kapandi' || 
        a.odendi === true || 
        a.kapali === true
      );
      const toplamTahsilat = kapaliAdisyonlar.reduce((sum, adisyon) => {
        return sum + (parseFloat(adisyon.tahsilat) || parseFloat(adisyon.toplamTutar) || 0);
      }, 0);

      // Giderler
      const giderler = localStorageService.filterByDate(data.giderler || [], startDate, endDate);
      const toplamGider = giderler.reduce((sum, gider) => {
        return sum + (parseFloat(gider.tutar) || 0);
      }, 0);

      // Net kazanç
      const netKazanc = toplamTahsilat - toplamGider;

      // Açık/Kapalı gün durumu
      const gunDurumuKayit = localStorage.getItem('mycafe_gun_durumu');
      const gunDurumu = gunDurumuKayit === 'aktif' ? 'acik' : 'kapali';

      // Gün bilgileri
      const gunBilgileri = data.gun_bilgileri || {};
      
      return {
        toplamCiro,
        toplamTahsilat,
        toplamGider,
        netKazanc,
        gunDurumu,
        adisyonSayisi: adisyonlar.length,
        acikAdisyonSayisi: (data.acik_adisyonlar || []).length,
        aktifMasaSayisi: (data.masalar || []).filter(m => m.durum === 'dolu' || m.durum === 'DOLU').length,
        tarihAraligi: {
          start: startDate,
          end: endDate
        },
        hesaplamaZamani: new Date().toISOString()
      };
    } catch (error) {
      console.error('Genel özet hatası:', error);
      return {
        toplamCiro: 0,
        toplamTahsilat: 0,
        toplamGider: 0,
        netKazanc: 0,
        gunDurumu: 'kapali',
        adisyonSayisi: 0,
        acikAdisyonSayisi: 0,
        aktifMasaSayisi: 0,
        tarihAraligi: { start: startDate, end: endDate },
        hesaplamaZamani: new Date().toISOString(),
        hata: error.message
      };
    }
  }

  // 2. KASA RAPORU
  async kasaRaporu(startDate = null, endDate = null) {
    try {
      const data = localStorageService.getAll();
      const kasaHareketleri = localStorageService.filterByDate(data.kasa_hareketleri || [], startDate, endDate);
      
      // Ödeme türlerine göre grupla
      const odemeGruplari = {
        nakit: 0,
        kart: 0,
        havale: 0,
        diger: 0
      };

      kasaHareketleri.forEach(hareket => {
        const odemeTuru = (hareket.odemeTuru || 'nakit').toLowerCase();
        const tutar = parseFloat(hareket.tutar) || 0;
        
        if (odemeGruplari.hasOwnProperty(odemeTuru)) {
          odemeGruplari[odemeTuru] += tutar;
        } else {
          odemeGruplari.diger += tutar;
        }
      });

      // Gün sonu kapanışları
      const gunSonuListesi = localStorageService.filterByDate(data.gun_sonu_listesi || [], startDate, endDate);

      return {
        odemeGruplari,
        toplamTahsilat: Object.values(odemeGruplari).reduce((a, b) => a + b, 0),
        hareketSayisi: kasaHareketleri.length,
        gunSonuKapanislari: gunSonuListesi,
        detaylar: kasaHareketleri.map(h => ({
          tarih: h.tarih,
          aciklama: h.aciklama,
          tutar: h.tutar,
          odemeTuru: h.odemeTuru,
          personel: h.personelAdi
        }))
      };
    } catch (error) {
      console.error('Kasa raporu hatası:', error);
      return {
        odemeGruplari: { nakit: 0, kart: 0, havale: 0, diger: 0 },
        toplamTahsilat: 0,
        hareketSayisi: 0,
        gunSonuKapanislari: [],
        detaylar: [],
        hata: error.message
      };
    }
  }

  // 3. GİDER RAPORU
  async giderRaporu(startDate = null, endDate = null) {
    try {
      const giderler = localStorageService.filterByDate(
        localStorageService.get('giderler') || [],
        startDate,
        endDate
      );

      // Gider türlerine göre grupla
      const giderTurleri = {};
      
      giderler.forEach(gider => {
        const tur = gider.tur || 'Diger';
        const tutar = parseFloat(gider.tutar) || 0;
        
        if (!giderTurleri[tur]) {
          giderTurleri[tur] = {
            toplam: 0,
            sayi: 0,
            detaylar: []
          };
        }
        
        giderTurleri[tur].toplam += tutar;
        giderTurleri[tur].sayi += 1;
        giderTurleri[tur].detaylar.push({
          tarih: gider.tarih,
          aciklama: gider.aciklama,
          tutar: tutar,
          personel: gider.personelAdi
        });
      });

      // Günlük giderler
      const gunlukGiderler = {};
      giderler.forEach(gider => {
        const tarih = gider.tarih ? gider.tarih.split('T')[0] : 'Belirsiz';
        const tutar = parseFloat(gider.tutar) || 0;
        
        if (!gunlukGiderler[tarih]) {
          gunlukGiderler[tarih] = 0;
        }
        gunlukGiderler[tarih] += tutar;
      });

      return {
        toplamGider: giderler.reduce((sum, g) => sum + (parseFloat(g.tutar) || 0), 0),
        giderSayisi: giderler.length,
        giderTurleri,
        gunlukGiderler,
        tumGiderler: giderler
      };
    } catch (error) {
      console.error('Gider raporu hatası:', error);
      return {
        toplamGider: 0,
        giderSayisi: 0,
        giderTurleri: {},
        gunlukGiderler: {},
        tumGiderler: [],
        hata: error.message
      };
    }
  }

  // 4. ÜRÜN RAPORU
  async urunRaporu(startDate = null, endDate = null) {
    try {
      const data = localStorageService.getAll();
      const adisyonlar = localStorageService.filterByDate(data.adisyonlar || [], startDate, endDate);
      const urunler = data.urunler || [];

      // Ürün satış analizi
      const urunSatislari = {};
      
      adisyonlar.forEach(adisyon => {
        if (!adisyon.urunler || !Array.isArray(adisyon.urunler)) return;
        
        adisyon.urunler.forEach(urunItem => {
          const urunId = urunItem.urunId || urunItem.id;
          const adet = parseInt(urunItem.adet) || 0;
          const birimFiyat = parseFloat(urunItem.birimFiyat) || parseFloat(urunItem.fiyat) || 0;
          
          if (!urunSatislari[urunId]) {
            urunSatislari[urunId] = {
              urunId,
              toplamAdet: 0,
              toplamCiro: 0,
              satislar: []
            };
          }
          
          urunSatislari[urunId].toplamAdet += adet;
          urunSatislari[urunId].toplamCiro += adet * birimFiyat;
          urunSatislari[urunId].satislar.push({
            adisyonId: adisyon.id,
            tarih: adisyon.tarih,
            adet,
            birimFiyat,
            toplam: adet * birimFiyat
          });
        });
      });

      // Ürün bilgileriyle birleştir
      const rapor = Object.values(urunSatislari).map(urunSatis => {
        const urunBilgisi = urunler.find(u => u.id === urunSatis.urunId);
        return {
          ...urunSatis,
          urunAdi: urunBilgisi ? urunBilgisi.adi || urunBilgisi.name : `Ürün #${urunSatis.urunId}`,
          kategoriId: urunBilgisi ? (urunBilgisi.kategoriId || urunBilgisi.categoryId) : null
        };
      });

      // En çok satanlar
      const enCokSatanlar = [...rapor].sort((a, b) => b.toplamAdet - a.toplamAdet).slice(0, 10);
      
      // En yüksek ciro yapanlar
      const enYuksekCiro = [...rapor].sort((a, b) => b.toplamCiro - a.toplamCiro).slice(0, 10);

      return {
        tumUrunSatislari: rapor,
        enCokSatanlar,
        enYuksekCiro,
        toplamSatisAdeti: rapor.reduce((sum, u) => sum + u.toplamAdet, 0),
        toplamUrunCirosu: rapor.reduce((sum, u) => sum + u.toplamCiro, 0),
        raporlananUrunSayisi: rapor.length
      };
    } catch (error) {
      console.error('Ürün raporu hatası:', error);
      return {
        tumUrunSatislari: [],
        enCokSatanlar: [],
        enYuksekCiro: [],
        toplamSatisAdeti: 0,
        toplamUrunCirosu: 0,
        raporlananUrunSayisi: 0,
        hata: error.message
      };
    }
  }

  // 5. KATEGORİ RAPORU
  async kategoriRaporu(startDate = null, endDate = null) {
    try {
      const data = localStorageService.getAll();
      const urunRaporu = await this.urunRaporu(startDate, endDate);
      const kategoriler = data.kategoriler || [];

      // Kategori bazlı gruplama
      const kategoriPerformansi = {};
      
      kategoriler.forEach(kategori => {
        const kategoriId = kategori.id;
        kategoriPerformansi[kategoriId] = {
          kategoriId: kategoriId,
          kategoriAdi: kategori.adi || kategori.name,
          toplamCiro: 0,
          toplamSatisAdeti: 0,
          urunSayisi: 0
        };
      });

      // Ürün raporundaki verileri kategorilere dağıt
      urunRaporu.tumUrunSatislari.forEach(urunSatis => {
        const kategoriId = urunSatis.kategoriId;
        if (kategoriId && kategoriPerformansi[kategoriId]) {
          kategoriPerformansi[kategoriId].toplamCiro += urunSatis.toplamCiro;
          kategoriPerformansi[kategoriId].toplamSatisAdeti += urunSatis.toplamAdet;
          kategoriPerformansi[kategoriId].urunSayisi += 1;
        }
      });

      const aktifKategoriler = Object.values(kategoriPerformansi).filter(k => k.toplamCiro > 0);
      
      return {
        kategoriPerformansi: aktifKategoriler,
        enCiroYapanKategori: aktifKategoriler.length > 0 ? 
          aktifKategoriler.sort((a, b) => b.toplamCiro - a.toplamCiro)[0] : null,
        toplamKategoriCirosu: aktifKategoriler.reduce((sum, k) => sum + k.toplamCiro, 0),
        kategoriSayisi: aktifKategoriler.length
      };
    } catch (error) {
      console.error('Kategori raporu hatası:', error);
      return {
        kategoriPerformansi: [],
        enCiroYapanKategori: null,
        toplamKategoriCirosu: 0,
        kategoriSayisi: 0,
        hata: error.message
      };
    }
  }

  // 6. MASA RAPORU
  async masaRaporu(startDate = null, endDate = null) {
    try {
      const data = localStorageService.getAll();
      const masalar = data.masalar || [];
      const adisyonlar = localStorageService.filterByDate(data.adisyonlar || [], startDate, endDate);

      // Masa bazlı analiz
      const masaPerformansi = {};
      
      masalar.forEach(masa => {
        masaPerformansi[masa.id] = {
          masaId: masa.id,
          masaAdi: masa.adi || `Masa ${masa.id}`,
          toplamCiro: 0,
          adisyonSayisi: 0,
          ortalamaCiro: 0,
          sonKullanma: null
        };
      });

      // Adisyonları masalara ata
      adisyonlar.forEach(adisyon => {
        const masaId = adisyon.masaId;
        if (masaId && masaPerformansi[masaId]) {
          const tutar = parseFloat(adisyon.toplamTutar) || 0;
          
          masaPerformansi[masaId].toplamCiro += tutar;
          masaPerformansi[masaId].adisyonSayisi += 1;
          
          if (!masaPerformansi[masaId].sonKullanma || 
              new Date(adisyon.tarih) > new Date(masaPerformansi[masaId].sonKullanma)) {
            masaPerformansi[masaId].sonKullanma = adisyon.tarih;
          }
        }
      });

      // Ortalama hesapla
      Object.keys(masaPerformansi).forEach(masaId => {
        const masa = masaPerformansi[masaId];
        if (masa.adisyonSayisi > 0) {
          masa.ortalamaCiro = masa.toplamCiro / masa.adisyonSayisi;
        }
      });

      const aktifMasalar = Object.values(masaPerformansi).filter(m => m.toplamCiro > 0);
      
      return {
        tumMasalar: aktifMasalar,
        enCiroYapanMasa: aktifMasalar.length > 0 ? 
          aktifMasalar.sort((a, b) => b.toplamCiro - a.toplamCiro)[0] : null,
        enSikKullanilanMasa: aktifMasalar.length > 0 ? 
          aktifMasalar.sort((a, b) => b.adisyonSayisi - a.adisyonSayisi)[0] : null,
        toplamMasaCirosu: aktifMasalar.reduce((sum, m) => sum + m.toplamCiro, 0),
        ortalamaMasaCirosu: aktifMasalar.length > 0 ? 
          aktifMasalar.reduce((sum, m) => sum + m.toplamCiro, 0) / aktifMasalar.length : 0
      };
    } catch (error) {
      console.error('Masa raporu hatası:', error);
      return {
        tumMasalar: [],
        enCiroYapanMasa: null,
        enSikKullanilanMasa: null,
        toplamMasaCirosu: 0,
        ortalamaMasaCirosu: 0,
        hata: error.message
      };
    }
  }

  // 7. BİLARDO RAPORU
  async bilardoRaporu(startDate = null, endDate = null) {
    try {
      const bilardoAdisyonlar = localStorageService.filterByDate(
        localStorageService.get('bilardo_adisyonlar') || [],
        startDate,
        endDate
      );

      // Masa bazlı bilardo analizi
      const bilardoMasalari = {};
      
      bilardoAdisyonlar.forEach(adisyon => {
        const masaId = adisyon.masaId || adisyon.bilardoMasaId;
        if (!masaId) return;
        
        if (!bilardoMasalari[masaId]) {
          bilardoMasalari[masaId] = {
            masaId,
            toplamSure: 0, // dakika
            toplamUcret: 0,
            oturumSayisi: 0,
            detaylar: []
          };
        }
        
        const baslangic = new Date(adisyon.baslangicZamani || adisyon.acilisZamani);
        const bitis = new Date(adisyon.bitisZamani || new Date());
        const sureDakika = Math.round((bitis - baslangic) / (1000 * 60));
        const ucret = parseFloat(adisyon.toplamUcret) || parseFloat(adisyon.bilardoUcreti) || 0;
        
        bilardoMasalari[masaId].toplamSure += sureDakika;
        bilardoMasalari[masaId].toplamUcret += ucret;
        bilardoMasalari[masaId].oturumSayisi += 1;
        bilardoMasalari[masaId].detaylar.push({
          tarih: adisyon.tarih,
          baslangic: adisyon.baslangicZamani,
          bitis: adisyon.bitisZamani,
          sure: sureDakika,
          ucret,
          personel: adisyon.personelAdi
        });
      });

      const aktifBilardoMasalari = Object.values(bilardoMasalari).filter(m => m.oturumSayisi > 0);
      
      return {
        bilardoMasalari: aktifBilardoMasalari,
        toplamBilardoGeliri: aktifBilardoMasalari.reduce((sum, m) => sum + m.toplamUcret, 0),
        toplamOynananSure: aktifBilardoMasalari.reduce((sum, m) => sum + m.toplamSure, 0),
        ortalamaOturumSuresi: aktifBilardoMasalari.length > 0 ?
          aktifBilardoMasalari.reduce((sum, m) => sum + m.toplamSure, 0) / 
          aktifBilardoMasalari.reduce((sum, m) => sum + m.oturumSayisi, 0) : 0,
        oturumSayisi: aktifBilardoMasalari.reduce((sum, m) => sum + m.oturumSayisi, 0)
      };
    } catch (error) {
      console.error('Bilardo raporu hatası:', error);
      return {
        bilardoMasalari: [],
        toplamBilardoGeliri: 0,
        toplamOynananSure: 0,
        ortalamaOturumSuresi: 0,
        oturumSayisi: 0,
        hata: error.message
      };
    }
  }

  // 8. GÜN SONU RAPORU
  async gunSonuRaporu(startDate = null, endDate = null) {
    try {
      const gunSonuListesi = JSON.parse(localStorage.getItem('mycafe_gun_sonu_listesi') || '[]');
      
      // Tarih filtresi
      let filtrelenmis = gunSonuListesi;
      if (startDate) {
        const start = new Date(startDate);
        filtrelenmis = filtrelenmis.filter(gun => {
          const gunTarih = new Date(gun.tarih || gun.id?.split('_')[1] || gun.baslangic);
          return gunTarih >= start;
        });
      }
      if (endDate) {
        const end = new Date(endDate);
        filtrelenmis = filtrelenmis.filter(gun => {
          const gunTarih = new Date(gun.tarih || gun.id?.split('_')[1] || gun.baslangic);
          return gunTarih <= end;
        });
      }
      
      // Son 10 gün sonu raporu (en yeni başta)
      const sonGunler = filtrelenmis
        .sort((a, b) => new Date(b.tarih || b.baslangic) - new Date(a.tarih || a.baslangic))
        .slice(0, 10)
        .map(gun => ({
          id: gun.id,
          tarih: gun.tarih || gun.id?.split('_')[1] || 'Bilinmeyen',
          toplamCiro: parseFloat(gun.toplamCiro) || 0,
          nakit: parseFloat(gun.nakit) || 0,
          krediKarti: parseFloat(gun.krediKarti) || 0,
          bilardoCiro: parseFloat(gun.bilardoCiro) || 0,
          toplamAdisyon: gun.toplamAdisyon || 0,
          acikAdisyon: gun.acikAdisyon || 0,
          sureSaat: gun.sureSaat || 0,
          sureDakika: gun.sureDakika || 0,
          sure: gun.sureSaat ? `${gun.sureSaat} saat ${gun.sureDakika % 60} dakika` : 'Bilinmiyor'
        }));

      // İstatistikler
      const gunlukOrtalamaCiro = sonGunler.length > 0 
        ? sonGunler.reduce((sum, gun) => sum + gun.toplamCiro, 0) / sonGunler.length 
        : 0;

      const toplamCiro = sonGunler.reduce((sum, gun) => sum + gun.toplamCiro, 0);
      const toplamNakit = sonGunler.reduce((sum, gun) => sum + gun.nakit, 0);
      const toplamKrediKarti = sonGunler.reduce((sum, gun) => sum + gun.krediKarti, 0);
      const toplamBilardo = sonGunler.reduce((sum, gun) => sum + gun.bilardoCiro, 0);

      return {
        sonGunler,
        toplamGunSayisi: filtrelenmis.length,
        gunlukOrtalamaCiro,
        enYuksekGun: sonGunler.length > 0 ? 
          [...sonGunler].sort((a, b) => b.toplamCiro - a.toplamCiro)[0] : null,
        enDusukGun: sonGunler.length > 0 ? 
          [...sonGunler].sort((a, b) => a.toplamCiro - b.toplamCiro)[0] : null,
        toplamCiro,
        toplamNakit,
        toplamKrediKarti,
        toplamBilardo,
        tumGunSonulari: filtrelenmis
      };
    } catch (error) {
      console.error('Gün sonu raporu hatası:', error);
      return {
        sonGunler: [],
        toplamGunSayisi: 0,
        gunlukOrtalamaCiro: 0,
        enYuksekGun: null,
        enDusukGun: null,
        toplamCiro: 0,
        toplamNakit: 0,
        toplamKrediKarti: 0,
        toplamBilardo: 0,
        tumGunSonulari: [],
        hata: error.message
      };
    }
  }

  // 9. TÜM RAPORLARI TEK SEFERDE GETİR
  async tumRaporlar(startDate = null, endDate = null) {
    try {
      const [
        genelOzet,
        kasaRaporu,
        giderRaporu,
        urunRaporu,
        kategoriRaporu,
        masaRaporu,
        bilardoRaporu,
        gunSonuRaporu
      ] = await Promise.all([
        this.genelOzet(startDate, endDate),
        this.kasaRaporu(startDate, endDate),
        this.giderRaporu(startDate, endDate),
        this.urunRaporu(startDate, endDate),
        this.kategoriRaporu(startDate, endDate),
        this.masaRaporu(startDate, endDate),
        this.bilardoRaporu(startDate, endDate),
        this.gunSonuRaporu(startDate, endDate)
      ]);

      return {
        genelOzet,
        kasaRaporu,
        giderRaporu,
        urunRaporu,
        kategoriRaporu,
        masaRaporu,
        bilardoRaporu,
        gunSonuRaporu,
        meta: {
          uretimZamani: new Date().toISOString(),
          tarihAraligi: { startDate, endDate },
          dataSource: 'localStorage'
        }
      };
    } catch (error) {
      console.error('Tüm raporlar hatası:', error);
      // Hata durumunda boş raporlar döndür
      return {
        genelOzet: await this.genelOzet(startDate, endDate),
        kasaRaporu: await this.kasaRaporu(startDate, endDate),
        giderRaporu: await this.giderRaporu(startDate, endDate),
        urunRaporu: await this.urunRaporu(startDate, endDate),
        kategoriRaporu: await this.kategoriRaporu(startDate, endDate),
        masaRaporu: await this.masaRaporu(startDate, endDate),
        bilardoRaporu: await this.bilardoRaporu(startDate, endDate),
        gunSonuRaporu: await this.gunSonuRaporu(startDate, endDate),
        meta: {
          uretimZamani: new Date().toISOString(),
          tarihAraligi: { startDate, endDate },
          dataSource: 'localStorage',
          hata: error.message
        }
      };
    }
  }

  // Debug için global erişim
  enableDebug() {
    this.debugMode = true;
    window.__RAPOR_MOTORU__ = this;
    console.log('🔍 Rapor Motoru debug modu aktif. Konsolda window.__RAPOR_MOTORU__ kullanabilirsiniz.');
    return this;
  }

  // Sistem durumu kontrolü
  async sistemDurumu() {
    const anahtarlar = [
      'mc_masalar',
      'mc_adisyonlar', 
      'mc_urunler',
      'mc_kategoriler',
      'mc_giderler',
      'mc_kasa_hareketleri',
      'bilardo_adisyonlar',
      'mycafe_gun_sonu_listesi'
    ];

    const durum = {};
    anahtarlar.forEach(anahtar => {
      const veri = localStorage.getItem(anahtar);
      durum[anahtar] = {
        var: !!veri,
        kayitSayisi: veri ? JSON.parse(veri).length : 0,
        sonGuncelleme: new Date().toISOString()
      };
    });

    return {
      sistem: 'MyCafe Rapor Motoru V2',
      versiyon: '2.0.0',
      tarih: new Date().toISOString(),
      durum,
      toplamKayit: Object.values(durum).reduce((sum, d) => sum + d.kayitSayisi, 0)
    };
  }
}

// Singleton instance
const raporMotoruV2 = new RaporMotoruV2();
export default raporMotoruV2;