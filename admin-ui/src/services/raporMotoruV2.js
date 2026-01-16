/* ------------------------------------------------------------
   📊 raporMotoruV2.js — MyCafe Raporlama Motoru
   📌 GUNCELLENDI: Tarih standardizasyonu, Bilardo net ayrımı
   📌 localStorageService entegrasyonu eklendi
------------------------------------------------------------ */

import localStorageService from './localStorageService';

const raporMotoruV2 = {
  
  // YARDIMCI FONKSİYON: Tarih alanı standardizasyonu
  getItemDate: (item) => {
    if (!item) return new Date();
    
    // ÖNCELİK SIRASI (KRITIK):
    // 1. odemeTarihi (kasa hareketleri için - EN GÜVENİLİR)
    // 2. kapanisZamani (adisyonda ödeme tarihi)
    // 3. tarih (genel tarih alanı)
    // 4. acilisZamani (son çare)
    // 5. createdAt (en son çare)
    
    if (item.odemeTarihi) {
      const date = new Date(item.odemeTarihi);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (item.kapanisZamani) {
      const date = new Date(item.kapanisZamani);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (item.tarih) {
      const date = new Date(item.tarih);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (item.acilisZamani) {
      const date = new Date(item.acilisZamani);
      if (!isNaN(date.getTime())) return date;
    }
    
    if (item.createdAt) {
      const date = new Date(item.createdAt);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Hiçbiri geçerli değilse bugün
    return new Date();
  },

  // YARDIMCI FONKSİYON: Bilardo adisyonu kontrolü
  isBilardoAdisyon: (adisyon) => {
    if (!adisyon) return false;
    
    // 1. Özel tur alanı (EN GÜVENİLİR)
    if (adisyon.tur === 'BİLARDO' || adisyon.tur === 'bilardo') return true;
    
    // 2. Masa numarası B ile başlıyorsa
    const masaNo = adisyon.masaNo || adisyon.masaNum || '';
    const masaStr = masaNo.toString().toUpperCase();
    if (masaStr.startsWith('B')) return true;
    
    // 3. Masa tipi alanı
    if (adisyon.masaTipi === 'BİLARDO' || adisyon.masaTipi === 'bilardo') return true;
    
    // 4. isBilardo flag'i
    if (adisyon.isBilardo === true) return true;
    
    // 5. Bilardo ücreti varsa
    if (adisyon.bilardoUcret || adisyon.bilardoUcreti) return true;
    
    // 6. SyncService'de bilardo olarak işaretlenmişse
    if (typeof window !== 'undefined' && window.syncService) {
      const masa = window.syncService.masaBul(masaNo);
      if (masa && masa.isBilardo === true) return true;
    }
    
    return false;
  },

  // Tarihe göre filtreleme (GUNCELLENDI)
  filterByDate: (data, startDate, endDate) => {
    if (!data || !Array.isArray(data)) return [];
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Tarihleri normalize et
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    
    return data.filter(item => {
      if (!item) return false;
      
      // STANDART TARİH FONKSİYONUNU KULLAN
      const itemDate = raporMotoruV2.getItemDate(item);
      if (isNaN(itemDate.getTime())) return false;
      
      // Tarih karşılaştırması
      const itemDateOnly = new Date(itemDate);
      itemDateOnly.setHours(0, 0, 0, 0);
      
      if (start && itemDateOnly < start) return false;
      if (end && itemDateOnly > end) return false;
      
      return true;
    });
  },

  // GÜN SONU RAPORU HESAPLAMA
  gunSonuRaporuHesapla(gunSonuRaporlari) {
    try {
      if (!gunSonuRaporlari || gunSonuRaporlari.length === 0) {
        return this.bosRaporOlustur('gunSonu');
      }

      let toplamCiro = 0;
      let toplamIndirim = 0;
      let toplamNakit = 0;
      let toplamKart = 0;
      let toplamHesap = 0;
      let masaDetaylari = [];
      let urunSatislari = {};

      gunSonuRaporlari.forEach(rapor => {
        // Toplam ciro hesapla
        const raporToplam = parseFloat(rapor.toplamTutar || rapor.toplam || 0);
        toplamCiro += raporToplam;

        // İndirim hesapla
        const indirim = parseFloat(rapor.indirim || rapor.toplamIndirim || 0);
        toplamIndirim += indirim;

        // Ödeme dağılımı hesapla
        toplamNakit += parseFloat(rapor.nakitOdeme || rapor.nakit || 0);
        toplamKart += parseFloat(rapor.kartOdeme || rapor.kart || 0);
        toplamHesap += parseFloat(rapor.hesapOdeme || rapor.hesap || 0);

        // Masa detayları
        if (rapor.masaNo || rapor.masaNum) {
          const isBilardo = this.isBilardoAdisyon(rapor);
          
          masaDetaylari.push({
            masaNo: rapor.masaNo || rapor.masaNum,
            masaTipi: isBilardo ? 'BİLARDO' : 'NORMAL',
            acilisZamani: rapor.acilisZamani || rapor.acilisSaati,
            kapanisZamani: this.getItemDate(rapor).toISOString(), // STANDART TARİH
            toplamTutar: raporToplam,
            odemeTipi: rapor.odemeTipi || this.odemeTipiBelirle(rapor),
            durum: rapor.durum || 'KAPALI',
            urunSayisi: rapor.urunler?.length || 0,
            isBilardo: isBilardo // BİLARDO FLAG EKLENDİ
          });
        }

        // Ürün satışlarını topla
        if (rapor.urunler && Array.isArray(rapor.urunler)) {
          rapor.urunler.forEach(urun => {
            const urunId = urun.id || urun.urunId;
            const urunAdi = urun.name || urun.urunAdi;
            const adet = parseInt(urun.adet || urun.miktar || 1);
            const fiyat = parseFloat(urun.fiyat || urun.birimFiyat || 0);
            const kategori = urun.categoryName || urun.kategori;

            if (urunSatislari[urunId]) {
              urunSatislari[urunId].satisAdedi += adet;
              urunSatislari[urunId].toplamTutar += fiyat * adet;
            } else {
              urunSatislari[urunId] = {
                urunAdi,
                kategori,
                satisAdedi: adet,
                toplamTutar: fiyat * adet,
                birimFiyat: fiyat
              };
            }
          });
        }
      });

      // Ürün satışlarını diziye çevir ve sırala
      const enCokSatanUrunler = Object.values(urunSatislari)
        .sort((a, b) => b.satisAdedi - a.satisAdedi)
        .slice(0, 10);

      // Masa detaylarını kapanış zamanına göre sırala
      masaDetaylari.sort((a, b) => 
        new Date(b.kapanisZamani || 0) - new Date(a.kapanisZamani || 0)
      );

      // Ödeme dağılımı
      const odemeDagilimi = {
        nakit: toplamNakit,
        kart: toplamKart,
        hesap: toplamHesap
      };

      // Bilardo/Normal ayrımı
      const bilardoMasalar = masaDetaylari.filter(m => m.isBilardo);
      const normalMasalar = masaDetaylari.filter(m => !m.isBilardo);

      return {
        toplamCiro,
        netCiro: toplamCiro - toplamIndirim,
        toplamIndirim,
        odemeDagilimi,
        masaDetaylari,
        enCokSatanUrunler,
        toplamMasaSayisi: masaDetaylari.length,
        aktifMasaSayisi: masaDetaylari.filter(m => m.durum === 'DOLU' || m.durum === 'ACIK').length,
        ortalamaMasaTutari: masaDetaylari.length > 0 ? toplamCiro / masaDetaylari.length : 0,
        toplamUrunAdedi: Object.values(urunSatislari).reduce((sum, u) => sum + u.satisAdedi, 0),
        // BİLARDO/NORMAL AYRIMI EKLENDİ
        bilardoMasaSayisi: bilardoMasalar.length,
        normalMasaSayisi: normalMasalar.length,
        bilardoCiro: bilardoMasalar.reduce((sum, m) => sum + m.toplamTutar, 0),
        normalCiro: normalMasalar.reduce((sum, m) => sum + m.toplamTutar, 0)
      };
    } catch (error) {
      console.error('Gün sonu raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('gunSonu');
    }
  },

  // KASA RAPORU HESAPLAMA (GUNCELLENDI - STANDART TARİH KULLANIMI)
  kasaRaporuHesapla(gunSonuRaporlari) {
    try {
      if (!gunSonuRaporlari || gunSonuRaporlari.length === 0) {
        return this.bosRaporOlustur('kasa');
      }

      let toplamGelir = 0;
      let nakitGelir = 0;
      let kartGelir = 0;
      let hesapGelir = 0;
      let gunlukGelirler = {};
      let gunSayisi = 0;

      // Gün sonu raporlarından gelirleri hesapla
      gunSonuRaporlari.forEach(rapor => {
        // STANDART TARİH FONKSİYONUNU KULLAN
        const tarih = this.getItemDate(rapor);
        const gunKey = tarih.toISOString().split('T')[0]; // YYYY-MM-DD formatı
        
        const nakit = parseFloat(rapor.nakitOdeme || rapor.nakit || 0);
        const kart = parseFloat(rapor.kartOdeme || rapor.kart || 0);
        const hesap = parseFloat(rapor.hesapOdeme || rapor.hesap || 0);
        const toplam = nakit + kart + hesap;

        toplamGelir += toplam;
        nakitGelir += nakit;
        kartGelir += kart;
        hesapGelir += hesap;

        // Günlük gelirleri topla
        if (gunlukGelirler[gunKey]) {
          gunlukGelirler[gunKey].toplam += toplam;
          gunlukGelirler[gunKey].nakit += nakit;
          gunlukGelirler[gunKey].kart += kart;
          gunlukGelirler[gunKey].hesap += hesap;
        } else {
          gunlukGelirler[gunKey] = {
            toplam,
            nakit,
            kart,
            hesap,
            tarih: gunKey
          };
          gunSayisi++;
        }
      });

      // Giderleri hesapla - localStorageService KULLAN
      const giderler = localStorageService.get('mc_giderler') || [];
      
      // Tarih aralığı filtrelemesi
      const tarihAraligi = this.getTarihAraligi(gunSonuRaporlari);
      const filtrelenmisGiderler = this.filterByDate(giderler, tarihAraligi.start, tarihAraligi.end);

      const toplamGider = filtrelenmisGiderler.reduce((sum, gider) => 
        sum + parseFloat(gider.tutar || 0), 0
      );

      // Günlük gelirleri diziye çevir ve sırala
      const gunlukGelirListesi = Object.values(gunlukGelirler)
        .map(g => ({
          tarih: g.tarih,
          gelir: g.toplam,
          nakit: g.nakit,
          kart: g.kart,
          hesap: g.hesap
        }))
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

      return {
        toplamGelir,
        nakitGelir,
        kartGelir,
        hesapGelir,
        toplamGider,
        netKasa: toplamGelir - toplamGider,
        odemeDagilimi: {
          nakit: nakitGelir,
          kart: kartGelir,
          hesap: hesapGelir
        },
        gunlukGelirler: gunlukGelirListesi,
        gunSayisi,
        ortalamaGelir: gunSayisi > 0 ? toplamGelir / gunSayisi : 0,
        giderSayisi: filtrelenmisGiderler.length,
        enYuksekGun: gunlukGelirListesi.length > 0 ? 
          gunlukGelirListesi.reduce((max, gun) => gun.gelir > max.gelir ? gun : max) : 
          null,
        enDusukGun: gunlukGelirListesi.length > 0 ? 
          gunlukGelirListesi.reduce((min, gun) => gun.gelir < min.gelir ? gun : min) : 
          null
      };
    } catch (error) {
      console.error('Kasa raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('kasa');
    }
  },

  // ÜRÜN RAPORU HESAPLAMA
  urunRaporuHesapla(gunSonuRaporlari) {
    try {
      if (!gunSonuRaporlari || gunSonuRaporlari.length === 0) {
        return this.bosRaporOlustur('urun');
      }

      // localStorageService KULLAN
      const urunler = localStorageService.get('mc_urunler') || [];
      const kategoriler = localStorageService.get('mc_kategoriler') || [];
      
      let urunSatislari = {};
      let kategoriSatislari = {};
      let toplamSatis = 0;
      let toplamAdet = 0;

      // Tüm raporlardaki ürünleri topla
      gunSonuRaporlari.forEach(rapor => {
        if (rapor.urunler && Array.isArray(rapor.urunler)) {
          rapor.urunler.forEach(urun => {
            const urunId = urun.id || urun.urunId;
            const adet = parseInt(urun.adet || urun.miktar || 1);
            const fiyat = parseFloat(urun.fiyat || urun.birimFiyat || 0);
            const toplamTutar = fiyat * adet;
            
            toplamSatis += toplamTutar;
            toplamAdet += adet;

            // Ürün satışlarını topla
            if (urunSatislari[urunId]) {
              urunSatislari[urunId].satisAdedi += adet;
              urunSatislari[urunId].toplamTutar += toplamTutar;
            } else {
              const urunBilgisi = urunler.find(u => u.id == urunId) || {};
              urunSatislari[urunId] = {
                urunAdi: urun.name || urun.urunAdi || urunBilgisi.name || 'Bilinmeyen Ürün',
                kategori: urun.categoryName || urun.kategori || urunBilgisi.categoryName || 'Bilinmeyen',
                kategoriId: urun.categoryId || urunBilgisi.categoryId,
                satisAdedi: adet,
                toplamTutar: toplamTutar,
                birimFiyat: fiyat,
                maliyet: parseFloat(urunBilgisi.costPrice || 0)
              };
            }

            // Kategori satışlarını topla
            const kategoriId = urun.categoryId || urunSatislari[urunId].kategoriId;
            const kategoriAdi = urunSatislari[urunId].kategori;
            
            if (kategoriId) {
              if (kategoriSatislari[kategoriId]) {
                kategoriSatislari[kategoriId].satisAdedi += adet;
                kategoriSatislari[kategoriId].toplamTutar += toplamTutar;
              } else {
                kategoriSatislari[kategoriId] = {
                  kategoriAdi,
                  satisAdedi: adet,
                  toplamTutar: toplamTutar
                };
              }
            }
          });
        }
      });

      // En çok satan ürünleri sırala
      const enCokSatanUrunler = Object.values(urunSatislari)
        .sort((a, b) => b.satisAdedi - a.satisAdedi)
        .slice(0, 20);

      // Kategori satışlarını diziye çevir
      const kategoriSatisListesi = Object.values(kategoriSatislari)
        .sort((a, b) => b.toplamTutar - a.toplamTutar);

      // Kar hesaplamaları
      const urunKarListesi = enCokSatanUrunler.map(urun => {
        const maliyet = urun.maliyet || 0;
        const gelir = urun.toplamTutar;
        const kar = gelir - (maliyet * urun.satisAdedi);
        const karOrani = maliyet > 0 ? (kar / (maliyet * urun.satisAdedi)) * 100 : 100;
        
        return {
          ...urun,
          kar,
          karOrani
        };
      });

      // Stok analizi
      const kritikStokUrunler = urunler.filter(u => 
        (parseInt(u.stock || 0) || 0) <= (parseInt(u.critical || 10) || 10)
      );
      
      const azStokUrunler = urunler.filter(u => {
        const stok = parseInt(u.stock || 0);
        const kritik = parseInt(u.critical || 10);
        return stok > kritik && stok <= kritik * 2;
      });
      
      const yeterliStokUrunler = urunler.filter(u => {
        const stok = parseInt(u.stock || 0);
        const kritik = parseInt(u.critical || 10);
        return stok > kritik * 2 && stok <= kritik * 4;
      });
      
      const fazlaStokUrunler = urunler.filter(u => {
        const stok = parseInt(u.stock || 0);
        const kritik = parseInt(u.critical || 10);
        return stok > kritik * 4;
      });

      // Toplam kar hesapla
      const toplamKar = urunKarListesi.reduce((sum, urun) => sum + urun.kar, 0);
      const toplamMaliyet = urunKarListesi.reduce((sum, urun) => 
        sum + ((urun.maliyet || 0) * urun.satisAdedi), 0
      );
      const karOrani = toplamMaliyet > 0 ? (toplamKar / toplamMaliyet) * 100 : 100;

      return {
        toplamSatis,
        toplamKar,
        karOrani,
        toplamAdet,
        toplamUrunSayisi: Object.keys(urunSatislari).length,
        enCokSatanUrunler,
        kategoriSatislari: kategoriSatisListesi,
        urunKarListesi,
        ortalamaSatis: Object.keys(urunSatislari).length > 0 ? 
          toplamSatis / Object.keys(urunSatislari).length : 0,
        ortalamaKar: Object.keys(urunSatislari).length > 0 ? 
          toplamKar / Object.keys(urunSatislari).length : 0,
        enCokSatanUrun: enCokSatanUrunler.length > 0 ? enCokSatanUrunler[0] : null,
        enKarliUrun: urunKarListesi.length > 0 ? 
          urunKarListesi.reduce((max, urun) => urun.kar > max.kar ? urun : max) : 
          null,
        kritikStokUrunler,
        azStokUrunler,
        yeterliStokUrunler,
        fazlaStokUrunler
      };
    } catch (error) {
      console.error('Ürün raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('urun');
    }
  },

  // KATEGORİ RAPORU HESAPLAMA
  kategoriRaporuHesapla(gunSonuRaporlari) {
    try {
      if (!gunSonuRaporlari || gunSonuRaporlari.length === 0) {
        return this.bosRaporOlustur('kategori');
      }

      // localStorageService KULLAN
      const kategoriler = localStorageService.get('mc_kategoriler') || [];
      const urunler = localStorageService.get('mc_urunler') || [];
      
      let kategoriSatislari = {};
      let toplamSatis = 0;

      // Tüm raporlardaki kategorileri topla
      gunSonuRaporlari.forEach(rapor => {
        if (rapor.urunler && Array.isArray(rapor.urunler)) {
          rapor.urunler.forEach(urun => {
            const kategoriId = urun.categoryId;
            const adet = parseInt(urun.adet || urun.miktar || 1);
            const fiyat = parseFloat(urun.fiyat || urun.birimFiyat || 0);
            const toplamTutar = fiyat * adet;
            
            toplamSatis += toplamTutar;

            if (kategoriId) {
              if (kategoriSatislari[kategoriId]) {
                kategoriSatislari[kategoriId].satisAdedi += adet;
                kategoriSatislari[kategoriId].toplamTutar += toplamTutar;
              } else {
                const kategoriBilgisi = kategoriler.find(k => k.id == kategoriId) || {};
                const kategoriUrunleri = urunler.filter(u => u.categoryId == kategoriId);
                const ortalamaFiyat = kategoriUrunleri.length > 0 ? 
                  kategoriUrunleri.reduce((sum, u) => sum + parseFloat(u.salePrice || 0), 0) / kategoriUrunleri.length : 0;
                
                kategoriSatislari[kategoriId] = {
                  kategoriId,
                  kategoriAdi: kategoriBilgisi.name || 'Bilinmeyen Kategori',
                  satisAdedi: adet,
                  toplamTutar: toplamTutar,
                  ortalamaFiyat,
                  urunSayisi: kategoriUrunleri.length,
                  aktif: kategoriBilgisi.aktif !== false
                };
              }
            }
          });
        }
      });

      // Kategori satışlarını diziye çevir
      const kategoriSatisListesi = Object.values(kategoriSatislari)
        .sort((a, b) => b.toplamTutar - a.toplamTutar);

      // Kar hesaplamaları
      const kategoriKarListesi = kategoriSatisListesi.map(kategori => {
        const kategoriUrunleri = urunler.filter(u => u.categoryId == kategori.kategoriId);
        const toplamMaliyet = kategoriUrunleri.reduce((sum, urun) => 
          sum + (parseFloat(urun.costPrice || 0) * 
            (urunSatisAdediHesapla(urun.id, gunSonuRaporlari) || 0)), 0
        );
        
        const kar = kategori.toplamTutar - toplamMaliyet;
        const karOrani = toplamMaliyet > 0 ? (kar / toplamMaliyet) * 100 : 100;
        
        return {
          ...kategori,
          kar,
          karOrani,
          toplamMaliyet
        };
      });

      // Alt kategori analizi
      const altKategoriAnaliz = kategoriler
        .filter(k => k.parentId)
        .reduce((analiz, altKategori) => {
          const anaKategori = kategoriler.find(k => k.id == altKategori.parentId);
          if (anaKategori) {
            const anaKey = anaKategori.name;
            
            if (!analiz[anaKey]) {
              analiz[anaKey] = {
                anaKategori: anaKey,
                altKategoriSayisi: 0,
                toplamSatis: 0,
                satisAdedi: 0,
                altKategoriler: []
              };
            }
            
            const altSatis = kategoriSatislari[altKategori.id] || {
              toplamTutar: 0,
              satisAdedi: 0
            };
            
            analiz[anaKey].altKategoriSayisi++;
            analiz[anaKey].toplamSatis += altSatis.toplamTutar;
            analiz[anaKey].satisAdedi += altSatis.satisAdedi;
            analiz[anaKey].altKategoriler.push({
              kategoriAdi: altKategori.name,
              toplamTutar: altSatis.toplamTutar,
              satisAdedi: altSatis.satisAdedi
            });
          }
          return analiz;
        }, {});

      // Performans kategorileri
      const ortalamaKategoriSatis = kategoriSatisListesi.length > 0 ? 
        toplamSatis / kategoriSatisListesi.length : 0;
      
      const yuksekPerformansKategoriler = kategoriKarListesi
        .filter(k => k.toplamTutar > ortalamaKategoriSatis * 1.5)
        .sort((a, b) => b.toplamTutar - a.toplamTutar);
      
      const ortaPerformansKategoriler = kategoriKarListesi
        .filter(k => k.toplamTutar > ortalamaKategoriSatis * 0.5 && 
                    k.toplamTutar <= ortalamaKategoriSatis * 1.5)
        .sort((a, b) => b.toplamTutar - a.toplamTutar);
      
      const dusukPerformansKategoriler = kategoriKarListesi
        .filter(k => k.toplamTutar <= ortalamaKategoriSatis * 0.5)
        .sort((a, b) => b.toplamTutar - a.toplamTutar);

      return {
        toplamKategori: kategoriler.length,
        aktifKategori: kategoriler.filter(k => k.aktif !== false).length,
        pasifKategori: kategoriler.filter(k => k.aktif === false).length,
        toplamSatis,
        kategoriSatislari: kategoriKarListesi,
        altKategoriAnaliz: Object.values(altKategoriAnaliz),
        enCokSatanKategori: kategoriSatisListesi.length > 0 ? kategoriSatisListesi[0] : null,
        enKarliKategori: kategoriKarListesi.length > 0 ? 
          kategoriKarListesi.reduce((max, kategori) => kategori.kar > max.kar ? kategori : max) : 
          null,
        ortalamaKategoriSatis,
        yuksekPerformansKategoriler,
        ortaPerformansKategoriler,
        dusukPerformansKategoriler
      };

      // Yardımcı fonksiyon
      function urunSatisAdediHesapla(urunId, raporlar) {
        let toplamAdet = 0;
        raporlar.forEach(rapor => {
          if (rapor.urunler && Array.isArray(rapor.urunler)) {
            rapor.urunler.forEach(urun => {
              if ((urun.id || urun.urunId) == urunId) {
                toplamAdet += parseInt(urun.adet || urun.miktar || 1);
              }
            });
          }
        });
        return toplamAdet;
      }
    } catch (error) {
      console.error('Kategori raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('kategori');
    }
  },

  // MASA RAPORU HESAPLAMA (GUNCELLENDI - BİLARDO NET AYRIMI)
  masaRaporuHesapla(gunSonuRaporlari) {
    try {
      if (!gunSonuRaporlari || gunSonuRaporlari.length === 0) {
        return this.bosRaporOlustur('masa');
      }

      // localStorageService KULLAN
      const masalar = localStorageService.get('mc_masalar') || [];
      let masaPerformanslari = {};
      let toplamCiro = 0;
      let normalMasaToplamCiro = 0;
      let bilardoMasaToplamCiro = 0;

      // Masa performanslarını hesapla
      gunSonuRaporlari.forEach(rapor => {
        const masaNo = rapor.masaNo || rapor.masaNum;
        const isBilardo = this.isBilardoAdisyon(rapor); // BİLARDO KONTROLÜ
        const masaTipi = isBilardo ? 'BİLARDO' : 'NORMAL';
        const toplamTutar = parseFloat(rapor.toplamTutar || rapor.toplam || 0);
        const acilisZamani = new Date(rapor.acilisZamani || rapor.acilisSaati);
        const kapanisZamani = this.getItemDate(rapor); // STANDART TARİH
        const sureDakika = (kapanisZamani - acilisZamani) / (1000 * 60);

        toplamCiro += toplamTutar;

        if (isBilardo) {
          bilardoMasaToplamCiro += toplamTutar;
        } else {
          normalMasaToplamCiro += toplamTutar;
        }

        if (masaNo) {
          if (!masaPerformanslari[masaNo]) {
            masaPerformanslari[masaNo] = {
              masaNo,
              masaTipi,
              kullanimSayisi: 0,
              toplamTutar: 0,
              toplamSure: 0,
              ortalamaTutar: 0,
              ortalamaSure: 0,
              sonKullanim: null,
              isBilardo: isBilardo // FLAG EKLENDİ
            };
          }

          masaPerformanslari[masaNo].kullanimSayisi++;
          masaPerformanslari[masaNo].toplamTutar += toplamTutar;
          masaPerformanslari[masaNo].toplamSure += sureDakika;
          masaPerformanslari[masaNo].ortalamaTutar = 
            masaPerformanslari[masaNo].toplamTutar / masaPerformanslari[masaNo].kullanimSayisi;
          masaPerformanslari[masaNo].ortalamaSure = 
            masaPerformanslari[masaNo].toplamSure / masaPerformanslari[masaNo].kullanimSayisi;
          
          // En son kullanım tarihini güncelle
          if (!masaPerformanslari[masaNo].sonKullanim || 
              kapanisZamani > new Date(masaPerformanslari[masaNo].sonKullanim)) {
            masaPerformanslari[masaNo].sonKullanim = kapanisZamani.toISOString();
          }
        }
      });

      // Masa detaylarını diziye çevir
      const masaDetaylari = Object.values(masaPerformanslari)
        .map(masa => ({
          ...masa,
          toplamSaat: Math.floor(masa.toplamSure / 60) + 'sa ' + Math.floor(masa.toplamSure % 60) + 'dk'
        }))
        .sort((a, b) => b.toplamTutar - a.toplamTutar);

      // En çok kullanılan masalar
      const enCokKullanilanMasalar = Object.values(masaPerformanslari)
        .sort((a, b) => b.kullanimSayisi - a.kullanimSayisi)
        .slice(0, 10);

      // En çok ciro yapan masalar
      const enCokCiroYapanMasalar = Object.values(masaPerformanslari)
        .sort((a, b) => b.toplamTutar - a.toplamTutar)
        .slice(0, 10);

      // Masa doluluk analizi - BİLARDO/NORMAL AYRIMI
      const normalMasalar = masalar.filter(m => !this.isBilardoAdisyon(m));
      const bilardoMasalar = masalar.filter(m => this.isBilardoAdisyon(m));
      
      const normalMasaDolu = normalMasalar.filter(m => m.durum === 'DOLU').length;
      const bilardoMasaDolu = bilardoMasalar.filter(m => m.durum === 'DOLU').length;

      const normalMasaDoluluk = normalMasalar.length > 0 ? 
        (normalMasaDolu / normalMasalar.length) * 100 : 0;
      
      const bilardoMasaDoluluk = bilardoMasalar.length > 0 ? 
        (bilardoMasaDolu / bilardoMasalar.length) * 100 : 0;

      // Masa kullanım oranları
      const normalMasaKullanimOrani = normalMasalar.length > 0 ? 
        (Object.values(masaPerformanslari).filter(m => !m.isBilardo).length / normalMasalar.length) * 100 : 0;
      
      const bilardoMasaKullanimOrani = bilardoMasalar.length > 0 ? 
        (Object.values(masaPerformanslari).filter(m => m.isBilardo).length / bilardoMasalar.length) * 100 : 0;

      return {
        toplamMasa: masalar.length,
        normalMasa: normalMasalar.length,
        bilardoMasa: bilardoMasalar.length,
        toplamCiro,
        normalMasaToplamCiro,
        bilardoMasaToplamCiro,
        normalMasaOrtalamaCiro: Object.values(masaPerformanslari)
          .filter(m => !m.isBilardo).length > 0 ?
          Object.values(masaPerformanslari)
            .filter(m => !m.isBilardo)
            .reduce((sum, masa) => sum + masa.toplamTutar, 0) / 
          Object.values(masaPerformanslari).filter(m => !m.isBilardo).length : 0,
        bilardoMasaOrtalamaCiro: Object.values(masaPerformanslari)
          .filter(m => m.isBilardo).length > 0 ?
          Object.values(masaPerformanslari)
            .filter(m => m.isBilardo)
            .reduce((sum, masa) => sum + masa.toplamTutar, 0) / 
          Object.values(masaPerformanslari).filter(m => m.isBilardo).length : 0,
        normalMasaOrtalamaSure: Object.values(masaPerformanslari)
          .filter(m => !m.isBilardo).length > 0 ?
          Object.values(masaPerformanslari)
            .filter(m => !m.isBilardo)
            .reduce((sum, masa) => sum + masa.toplamSure, 0) / 
          Object.values(masaPerformanslari).filter(m => !m.isBilardo).length : 0,
        bilardoMasaOrtalamaSure: Object.values(masaPerformanslari)
          .filter(m => m.isBilardo).length > 0 ?
          Object.values(masaPerformanslari)
            .filter(m => m.isBilardo)
            .reduce((sum, masa) => sum + masa.toplamSure, 0) / 
          Object.values(masaPerformanslari).filter(m => m.isBilardo).length : 0,
        masaDetaylari,
        enCokKullanilanMasalar,
        enCokCiroYapanMasalar,
        enCokCiroYapanMasa: enCokCiroYapanMasalar.length > 0 ? enCokCiroYapanMasalar[0] : null,
        enAktifMasa: enCokKullanilanMasalar.length > 0 ? enCokKullanilanMasalar[0] : null,
        normalMasaDoluluk,
        bilardoMasaDoluluk,
        normalMasaDolu,
        bilardoMasaDolu,
        normalMasaBos: normalMasalar.length - normalMasaDolu,
        bilardoMasaBos: bilardoMasalar.length - bilardoMasaDolu,
        normalMasaKullanimOrani,
        bilardoMasaKullanimOrani,
        ortalamaMasaCiro: masaDetaylari.length > 0 ? toplamCiro / masaDetaylari.length : 0
      };
    } catch (error) {
      console.error('Masa raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('masa');
    }
  },

  // BİLARDO RAPORU HESAPLAMA (GUNCELLENDI - NET AYRIM)
  bilardoRaporuHesapla(gunSonuRaporlari, bilardoAdisyonlar) {
    try {
      // Bilardo masalarını filtrele - YENİ FONKSİYONU KULLAN
      const bilardoRaporlari = gunSonuRaporlari.filter(rapor => 
        this.isBilardoAdisyon(rapor) // NET AYRIM
      );

      if (bilardoRaporlari.length === 0 && (!bilardoAdisyonlar || bilardoAdisyonlar.length === 0)) {
        return this.bosRaporOlustur('bilardo');
      }

      // localStorageService KULLAN
      const bilardoMasalar = localStorageService.get('bilardo') || [];
      const ucretAyarlari = localStorageService.get('bilardo_ucretleri') || {
        bilardo30dk: 80,
        bilardo1saat: 120,
        bilardoDakikaUcreti: 2
      };

      let toplamGelir = 0;
      let sure30dkSayisi = 0;
      let sure1saatSayisi = 0;
      let sureDakikaSayisi = 0;
      let sure30dkGelir = 0;
      let sure1saatGelir = 0;
      let sureDakikaGelir = 0;
      let masaPerformanslari = {};
      let gunlukGelirler = {};
      let saatlikKullanim = Array.from({length: 24}, (_, i) => ({
        saat: i,
        kullanimSayisi: 0,
        toplamGelir: 0,
        ortalamaGelir: 0
      }));

      // Bilardo raporlarından gelirleri hesapla
      bilardoRaporlari.forEach(rapor => {
        const toplamTutar = parseFloat(rapor.toplamTutar || rapor.toplam || 0);
        const masaNo = rapor.masaNo || rapor.masaNum;
        const sureTipi = rapor.sureTipi || 'dakika';
        const tarih = this.getItemDate(rapor); // STANDART TARİH
        const saat = tarih.getHours();

        toplamGelir += toplamTutar;

        // Süre tipi dağılımı
        if (sureTipi === '30dk') {
          sure30dkSayisi++;
          sure30dkGelir += toplamTutar;
        } else if (sureTipi === '1saat') {
          sure1saatSayisi++;
          sure1saatGelir += toplamTutar;
        } else {
          sureDakikaSayisi++;
          sureDakikaGelir += toplamTutar;
        }

        // Masa performansı
        if (masaNo) {
          if (!masaPerformanslari[masaNo]) {
            masaPerformanslari[masaNo] = {
              masaNo,
              kullanimSayisi: 0,
              toplamGelir: 0,
              toplamSaat: 0,
              ortalamaGelir: 0,
              ortalamaSaat: 0,
              sonKullanim: null,
              isBilardo: true // FLAG EKLENDİ
            };
          }

          masaPerformanslari[masaNo].kullanimSayisi++;
          masaPerformanslari[masaNo].toplamGelir += toplamTutar;
          masaPerformanslari[masaNo].ortalamaGelir = 
            masaPerformanslari[masaNo].toplamGelir / masaPerformanslari[masaNo].kullanimSayisi;
          
          // Süre hesapla
          const acilisZamani = new Date(rapor.acilisZamani || rapor.acilisSaati);
          const kapanisZamani = this.getItemDate(rapor);
          const sureSaat = (kapanisZamani - acilisZamani) / (1000 * 60 * 60);
          masaPerformanslari[masaNo].toplamSaat += sureSaat;
          masaPerformanslari[masaNo].ortalamaSaat = 
            masaPerformanslari[masaNo].toplamSaat / masaPerformanslari[masaNo].kullanimSayisi;
          
          // Son kullanım
          if (!masaPerformanslari[masaNo].sonKullanim || 
              kapanisZamani > new Date(masaPerformanslari[masaNo].sonKullanim)) {
            masaPerformanslari[masaNo].sonKullanim = kapanisZamani.toISOString();
          }
        }

        // Günlük gelirler
        const gunKey = tarih.toISOString().split('T')[0];
        if (gunlukGelirler[gunKey]) {
          gunlukGelirler[gunKey].toplam += toplamTutar;
        } else {
          gunlukGelirler[gunKey] = {
            toplam: toplamTutar,
            tarih: gunKey
          };
        }

        // Saatlik kullanım
        saatlikKullanim[saat].kullanimSayisi++;
        saatlikKullanim[saat].toplamGelir += toplamTutar;
        saatlikKullanim[saat].ortalamaGelir = 
          saatlikKullanim[saat].toplamGelir / saatlikKullanim[saat].kullanimSayisi;
      });

      // Aktif bilardo adisyonlarını da ekle
      if (bilardoAdisyonlar && Array.isArray(bilardoAdisyonlar)) {
        bilardoAdisyonlar.forEach(adisyon => {
          if (adisyon.durum === 'ACIK' || adisyon.durum === 'DOLU') {
            const masaNo = adisyon.bilardoMasaNo;
            const saat = new Date().getHours();

            // Saatlik kullanıma ekle (aktif masa)
            saatlikKullanim[saat].kullanimSayisi++;

            // Masa durumunu güncelle
            if (masaNo && masaPerformanslari[masaNo]) {
              masaPerformanslari[masaNo].kullanimSayisi++;
            }
          }
        });
      }

      // Masa durumları
      const masaDurumlari = bilardoMasalar.map(masa => {
        const performans = masaPerformanslari[masa.no] || {
          kullanimSayisi: 0,
          toplamGelir: 0,
          toplamSaat: 0,
          sonKullanim: null
        };

        // Aktif adisyon kontrolü
        const aktifAdisyon = bilardoAdisyonlar?.find(a => 
          a.bilardoMasaNo === masa.no && (a.durum === 'ACIK' || a.durum === 'DOLU')
        );

        let gecenSure = 0;
        let tahminiUcret = 0;

        if (aktifAdisyon && aktifAdisyon.acilisZamani) {
          const acilis = new Date(aktifAdisyon.acilisZamani);
          const simdi = new Date();
          gecenSure = Math.floor((simdi - acilis) / (1000 * 60)); // dakika
          
          // Tahmini ücret hesapla
          if (aktifAdisyon.sureTipi === '30dk') {
            tahminiUcret = ucretAyarlari.bilardo30dk;
          } else if (aktifAdisyon.sureTipi === '1saat') {
            tahminiUcret = ucretAyarlari.bilardo1saat;
          } else {
            tahminiUcret = gecenSure * ucretAyarlari.bilardoDakikaUcreti;
          }
        }

        return {
          masaNo: masa.no,
          durum: aktifAdisyon ? 'DOLU' : (masa.durum || 'BOŞ'),
          acilisZamani: aktifAdisyon?.acilisZamani,
          gecenSure,
          tahminiUcret,
          sonKullanim: performans.sonKullanim,
          kullanimSayisi: performans.kullanimSayisi,
          toplamGelir: performans.toplamGelir,
          isBilardo: true // FLAG EKLENDİ
        };
      });

      // Masa performanslarını diziye çevir
      const masaPerformansListesi = Object.values(masaPerformanslari)
        .map(masa => ({
          ...masa,
          toplamSaat: masa.toplamSaat.toFixed(1) + ' saat'
        }))
        .sort((a, b) => b.toplamGelir - a.toplamGelir);

      // Günlük gelirleri diziye çevir
      const gunlukGelirListesi = Object.values(gunlukGelirler)
        .map(g => ({
          tarih: g.tarih,
          gelir: g.toplam
        }))
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

      // Toplam oyun sayısı
      const toplamOyun = sure30dkSayisi + sure1saatSayisi + sureDakikaSayisi;

      // En çok kullanılan saat
      const maxKullanim = Math.max(...saatlikKullanim.map(s => s.kullanimSayisi));

      // Ortalama dakika ücreti
      const ortalamaDakikaUcreti = toplamGelir > 0 && toplamOyun > 0 ? 
        (toplamGelir / toplamOyun) / 60 : ucretAyarlari.bilardoDakikaUcreti;

      return {
        toplamGelir,
        toplamOyun,
        toplamSaat: Object.values(masaPerformanslari).reduce((sum, masa) => sum + masa.toplamSaat, 0),
        toplamDakika: Object.values(masaPerformanslari).reduce((sum, masa) => sum + masa.toplamSaat, 0) * 60,
        sure30dkSayisi,
        sure1saatSayisi,
        sureDakikaSayisi,
        sure30dkYuzde: toplamOyun > 0 ? (sure30dkSayisi / toplamOyun) * 100 : 0,
        sure1saatYuzde: toplamOyun > 0 ? (sure1saatSayisi / toplamOyun) * 100 : 0,
        sureDakikaYuzde: toplamOyun > 0 ? (sureDakikaSayisi / toplamOyun) * 100 : 0,
        sure30dkGelir,
        sure1saatGelir,
        sureDakikaGelir,
        masaDurumlari,
        masaPerformanslari: masaPerformansListesi,
        gunlukGelirler: gunlukGelirListesi,
        saatlikKullanim: saatlikKullanim.filter(s => s.kullanimSayisi > 0),
        maxKullanim,
        enCokGelirMasa: masaPerformansListesi.length > 0 ? masaPerformansListesi[0] : null,
        enAktifMasa: masaPerformansListesi.length > 0 ? 
          masaPerformansListesi.reduce((max, masa) => masa.kullanimSayisi > max.kullanimSayisi ? masa : max) : 
          null,
        ortalamaGelir: masaPerformansListesi.length > 0 ? 
          toplamGelir / masaPerformansListesi.length : 0,
        gunlukOrtalama: gunlukGelirListesi.length > 0 ? 
          toplamGelir / gunlukGelirListesi.length : 0,
        ortalamaSaat: masaPerformansListesi.length > 0 ? 
          Object.values(masaPerformanslari).reduce((sum, masa) => sum + masa.toplamSaat, 0) / masaPerformansListesi.length : 0,
        ucretAyarlari,
        ortalamaDakikaUcreti
      };
    } catch (error) {
      console.error('Bilardo raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('bilardo');
    }
  },

  // GİDER RAPORU HESAPLAMA
  giderRaporuHesapla(giderler) {
    try {
      if (!giderler || giderler.length === 0) {
        return this.bosRaporOlustur('gider');
      }

      let toplamGider = 0;
      let giderTipleri = {};
      let gunlukGiderler = {};
      let aylikGiderler = {};
      let enYuksekGider = null;

      giderler.forEach(gider => {
        const tutar = parseFloat(gider.tutar || 0);
        const tip = gider.tip || 'GENEL';
        const tarih = this.getItemDate(gider); // STANDART TARİH
        const gunKey = tarih.toISOString().split('T')[0];
        const ayKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
        const ayAdi = tarih.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

        toplamGider += tutar;

        // En yüksek gider
        if (!enYuksekGider || tutar > enYuksekGider.tutar) {
          enYuksekGider = {
            ...gider,
            tutar
          };
        }

        // Gider tipleri
        if (giderTipleri[tip]) {
          giderTipleri[tip].toplam += tutar;
          giderTipleri[tip].sayi++;
          giderTipleri[tip].ortalama = giderTipleri[tip].toplam / giderTipleri[tip].sayi;
        } else {
          giderTipleri[tip] = {
            ad: tip,
            toplam: tutar,
            sayi: 1,
            ortalama: tutar
          };
        }

        // Günlük giderler
        if (gunlukGiderler[gunKey]) {
          gunlukGiderler[gunKey].toplamGider += tutar;
          gunlukGiderler[gunKey].kayitSayisi++;
          if (tutar > gunlukGiderler[gunKey].enBuyukGider) {
            gunlukGiderler[gunKey].enBuyukGider = tutar;
          }
        } else {
          gunlukGiderler[gunKey] = {
            tarih: gunKey,
            toplamGider: tutar,
            kayitSayisi: 1,
            enBuyukGider: tutar,
            gunlukOrtalama: tutar
          };
        }

        // Aylık giderler
        if (aylikGiderler[ayKey]) {
          aylikGiderler[ayKey].toplamGider += tutar;
          aylikGiderler[ayKey].kayitSayisi++;
          if (tutar > aylikGiderler[ayKey].enBuyukGider) {
            aylikGiderler[ayKey].enBuyukGider = tutar;
          }
        } else {
          aylikGiderler[ayKey] = {
            ay: ayAdi,
            yil: tarih.getFullYear(),
            ayNum: tarih.getMonth() + 1,
            toplamGider: tutar,
            kayitSayisi: 1,
            enBuyukGider: tutar,
            gunlukOrtalama: 0,
            enCokGiderTipi: tip
          };
        }
      });

      // Gider tiplerini diziye çevir
      const giderTipListesi = Object.values(giderTipleri)
        .sort((a, b) => b.toplam - a.toplam);

      // Günlük giderleri diziye çevir ve ortalama hesapla
      const gunlukGiderListesi = Object.values(gunlukGiderler)
        .map(gun => ({
          ...gun,
          gunlukOrtalama: gun.toplamGider / gun.kayitSayisi
        }))
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

      // Aylık giderleri diziye çevir ve ortalama hesapla
      const aylikGiderListesi = Object.values(aylikGiderler)
        .map(ay => {
          // Bu ayın gün sayısını hesapla
          const gunSayisi = new Date(ay.yil, ay.ayNum, 0).getDate();
          return {
            ...ay,
            gunlukOrtalama: ay.toplamGider / gunSayisi
          };
        })
        .sort((a, b) => {
          if (a.yil !== b.yil) return b.yil - a.yil;
          return b.ayNum - a.ayNum;
        });

      // En çok gider tipi
      const enCokGiderTipi = giderTipListesi.length > 0 ? giderTipListesi[0] : null;

      // Gün sayısı
      const gunSayisi = Object.keys(gunlukGiderler).length;

      // Gelir-gider karşılaştırması (yaklaşık değer)
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      const toplamGelir = gunSonuRaporlari.reduce((sum, rapor) => 
        sum + parseFloat(rapor.toplamTutar || rapor.toplam || 0), 0
      );

      return {
        toplamGider,
        toplamKayit: giderler.length,
        ortalamaGider: giderler.length > 0 ? toplamGider / giderler.length : 0,
        gunlukOrtalama: gunSayisi > 0 ? toplamGider / gunSayisi : 0,
        giderTipleri: giderTipListesi,
        giderListesi: giderler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)),
        gunlukGiderler: gunlukGiderListesi,
        aylikGiderler: aylikGiderListesi,
        gunSayisi,
        enYuksekGider,
        enCokGiderTipi,
        karsilastirma: {
          toplamGelir,
          toplamGider,
          netKar: toplamGelir - toplamGider,
          karOrani: toplamGelir > 0 ? ((toplamGelir - toplamGider) / toplamGelir) * 100 : 0,
          giderGelirOrani: toplamGelir > 0 ? (toplamGider / toplamGelir) * 100 : 0,
          gunlukOrtalamaGelir: gunSayisi > 0 ? toplamGelir / gunSayisi : 0,
          gunlukOrtalamaGider: gunlukOrtalama
        }
      };
    } catch (error) {
      console.error('Gider raporu hesaplama hatası:', error);
      return this.bosRaporOlustur('gider');
    }
  },

  // YARDIMCI FONKSİYONLAR
  odemeTipiBelirle(rapor) {
    const nakit = parseFloat(rapor.nakitOdeme || rapor.nakit || 0);
    const kart = parseFloat(rapor.kartOdeme || rapor.kart || 0);
    const hesap = parseFloat(rapor.hesapOdeme || rapor.hesap || 0);

    if (nakit > 0 && kart === 0 && hesap === 0) return 'Nakit';
    if (kart > 0 && nakit === 0 && hesap === 0) return 'Kart';
    if (hesap > 0 && nakit === 0 && kart === 0) return 'Hesap';
    if (nakit > 0 && kart > 0) return 'Nakit+Kart';
    if (nakit > 0 && hesap > 0) return 'Nakit+Hesap';
    if (kart > 0 && hesap > 0) return 'Kart+Hesap';
    return 'Karma';
  },

  getTarihAraligi(raporlar) {
    if (!raporlar || raporlar.length === 0) {
      return { start: null, end: null };
    }
    
    let minDate = new Date(raporlar[0].acilisZamani || raporlar[0].tarih || new Date());
    let maxDate = new Date(raporlar[0].acilisZamani || raporlar[0].tarih || new Date());
    
    raporlar.forEach(rapor => {
      const raporTarihi = this.getItemDate(rapor);
      if (raporTarihi < minDate) minDate = raporTarihi;
      if (raporTarihi > maxDate) maxDate = raporTarihi;
    });
    
    return {
      start: minDate.toISOString().split('T')[0],
      end: maxDate.toISOString().split('T')[0]
    };
  },

  bosRaporOlustur(tip) {
    const bosRaporlar = {
      gunSonu: {
        toplamCiro: 0,
        netCiro: 0,
        toplamIndirim: 0,
        odemeDagilimi: { nakit: 0, kart: 0, hesap: 0 },
        masaDetaylari: [],
        enCokSatanUrunler: [],
        toplamMasaSayisi: 0,
        aktifMasaSayisi: 0,
        ortalamaMasaTutari: 0,
        toplamUrunAdedi: 0,
        bilardoMasaSayisi: 0,
        normalMasaSayisi: 0,
        bilardoCiro: 0,
        normalCiro: 0
      },
      kasa: {
        toplamGelir: 0,
        nakitGelir: 0,
        kartGelir: 0,
        hesapGelir: 0,
        toplamGider: 0,
        netKasa: 0,
        odemeDagilimi: { nakit: 0, kart: 0, hesap: 0 },
        gunlukGelirler: [],
        gunSayisi: 0,
        ortalamaGelir: 0,
        giderSayisi: 0,
        enYuksekGun: null,
        enDusukGun: null
      },
      urun: {
        toplamSatis: 0,
        toplamKar: 0,
        karOrani: 0,
        toplamAdet: 0,
        toplamUrunSayisi: 0,
        enCokSatanUrunler: [],
        kategoriSatislari: [],
        urunKarListesi: [],
        ortalamaSatis: 0,
        ortalamaKar: 0,
        enCokSatanUrun: null,
        enKarliUrun: null,
        kritikStokUrunler: [],
        azStokUrunler: [],
        yeterliStokUrunler: [],
        fazlaStokUrunler: []
      },
      kategori: {
        toplamKategori: 0,
        aktifKategori: 0,
        pasifKategori: 0,
        toplamSatis: 0,
        kategoriSatislari: [],
        altKategoriAnaliz: [],
        enCokSatanKategori: null,
        enKarliKategori: null,
        ortalamaKategoriSatis: 0,
        yuksekPerformansKategoriler: [],
        ortaPerformansKategoriler: [],
        dusukPerformansKategoriler: []
      },
      masa: {
        toplamMasa: 0,
        normalMasa: 0,
        bilardoMasa: 0,
        toplamCiro: 0,
        normalMasaToplamCiro: 0,
        bilardoMasaToplamCiro: 0,
        normalMasaOrtalamaCiro: 0,
        bilardoMasaOrtalamaCiro: 0,
        normalMasaOrtalamaSure: 0,
        bilardoMasaOrtalamaSure: 0,
        masaDetaylari: [],
        enCokKullanilanMasalar: [],
        enCokCiroYapanMasalar: [],
        enCokCiroYapanMasa: null,
        enAktifMasa: null,
        normalMasaDoluluk: 0,
        bilardoMasaDoluluk: 0,
        normalMasaDolu: 0,
        bilardoMasaDolu: 0,
        normalMasaBos: 0,
        bilardoMasaBos: 0,
        normalMasaKullanimOrani: 0,
        bilardoMasaKullanimOrani: 0,
        ortalamaMasaCiro: 0
      },
      bilardo: {
        toplamGelir: 0,
        toplamOyun: 0,
        toplamSaat: 0,
        toplamDakika: 0,
        sure30dkSayisi: 0,
        sure1saatSayisi: 0,
        sureDakikaSayisi: 0,
        sure30dkYuzde: 0,
        sure1saatYuzde: 0,
        sureDakikaYuzde: 0,
        sure30dkGelir: 0,
        sure1saatGelir: 0,
        sureDakikaGelir: 0,
        masaDurumlari: [],
        masaPerformanslari: [],
        gunlukGelirler: [],
        saatlikKullanim: [],
        maxKullanim: 0,
        enCokGelirMasa: null,
        enAktifMasa: null,
        ortalamaGelir: 0,
        gunlukOrtalama: 0,
        ortalamaSaat: 0,
        ucretAyarlari: {
          bilardo30dk: 80,
          bilardo1saat: 120,
          bilardoDakikaUcreti: 2
        },
        ortalamaDakikaUcreti: 2
      },
      gider: {
        toplamGider: 0,
        toplamKayit: 0,
        ortalamaGider: 0,
        gunlukOrtalama: 0,
        giderTipleri: [],
        giderListesi: [],
        gunlukGiderler: [],
        aylikGiderler: [],
        gunSayisi: 0,
        enYuksekGider: null,
        enCokGiderTipi: null,
        karsilastirma: {
          toplamGelir: 0,
          toplamGider: 0,
          netKar: 0,
          karOrani: 0,
          giderGelirOrani: 0,
          gunlukOrtalamaGelir: 0,
          gunlukOrtalamaGider: 0
        }
      }
    };

    return bosRaporlar[tip] || {};
  }
};

// Global erişim için
if (typeof window !== 'undefined') {
  window.raporMotoruV2 = raporMotoruV2;
  console.log('✅ raporMotoruV2 global olarak yüklendi');
}

export { raporMotoruV2 };
export default raporMotoruV2;