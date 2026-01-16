// File: admin-ui/src/pages/AnaEkran/AnaEkran.jsx (GÜNCELLENMİŞ - GÜN BAŞLANGIÇ KONTROLLÜ)
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGunDurumu } from "../../context/GunDurumuContext"; // DÜZELTİLDİ
import "./AnaEkran.css";

export default function AnaEkran() {
  const [currentTime, setCurrentTime] = useState("");
  const [dashboardData, setDashboardData] = useState({
    dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
    criticalProducts: [],
    openTables: [],
    dailyExpenses: 0
  });
  
  const { gunAktif, gunBilgileri, gunBaslat, gunDurumunuKontrolEt } = useGunDurumu();
  const [gunSuresi, setGunSuresi] = useState({
    saat: 0,
    dakika: 0
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // GELİŞMİŞ KAPALI KONTROL FONKSİYONU
  const isAdisyonKapali = useCallback((adisyon) => {
    if (!adisyon) return true;
    
    const isBilardo = adisyon.tur === "BİLARDO";
    
    // 1. Temel kapalı kontrolü
    if (adisyon.kapali === true) {
      return true;
    }
    
    // 2. Durum değişkeni kontrolü
    const durum = adisyon.durum?.toUpperCase();
    if (durum === "KAPALI" || durum === "KAPATILDI" || durum === "ÖDENDİ") {
      return true;
    }
    
    // 3. Kapanış zamanı kontrolü
    if (adisyon.kapanisZamani) {
      const kapanisZamani = new Date(adisyon.kapanisZamani);
      if (!isNaN(kapanisZamani.getTime())) {
        return true;
      }
    }
    
    // 4. Ödemeler dizisi kontrolü
    if (adisyon.odemeler && Array.isArray(adisyon.odemeler) && adisyon.odemeler.length > 0) {
      const toplamOdenen = adisyon.odemeler.reduce((sum, odeme) => {
        return sum + (parseFloat(odeme.miktar) || 0);
      }, 0);
      
      let toplamTutar = 0;
      if (isBilardo) {
        const bilardoUcret = parseFloat(adisyon.bilardoUcret || 0);
        const ekUrunToplam = parseFloat(adisyon.ekUrunToplam || 0);
        toplamTutar = bilardoUcret + ekUrunToplam;
      } else {
        toplamTutar = parseFloat(adisyon.toplamTutar || 0);
      }
      
      if (toplamOdenen >= toplamTutar) {
        return true;
      }
    }
    
    // 5. Bilardo özel kontrolü
    if (isBilardo && adisyon.sureBitti !== undefined) {
      if (adisyon.sureBitti === true || adisyon.sureBitti === "true") {
        return true;
      }
    }
    
    // 6. Transfer edilmiş adisyon kontrolü
    if (adisyon.transferEdildi === true || adisyon.transferEdildi === "true") {
      return true;
    }
    
    return false;
  }, []);

  // GÜNLÜK GİDERLERİ HESAPLA FONKSİYONU - GÜN BAŞLANGICI KONTROLLÜ
  const calculateDailyExpenses = useCallback(() => {
    try {
      // Gün başlangıcını kontrol et
      const gunBaslangic = localStorage.getItem('mycafe_gun_baslangic');
      if (!gunBaslangic) return 0;
      
      const gunBaslangicTarih = new Date(gunBaslangic);
      
      const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
      
      const dailyExpenses = giderler
        .filter(gider => {
          if (!gider.tarih) return false;
          const giderTarihi = new Date(gider.tarih);
          return giderTarihi >= gunBaslangicTarih;
        })
        .reduce((sum, gider) => {
          return sum + (parseFloat(gider.tutar) || 0);
        }, 0);
      
      return dailyExpenses;
    } catch (error) {
      console.error("❌ Gider hesaplama hatası:", error);
      return 0;
    }
  }, []);

  // GELİŞMİŞ BOŞ ADISYON TEMİZLEME FONKSİYONU
  const cleanupEmptyAdisyonlar = useCallback(() => {
    try {
      const allAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      
      console.log('🧹 ANA EKRAN: Gelişmiş adisyon temizliği başlıyor...', {
        totalAdisyon: allAdisyonlar.length,
        totalAcikAdisyon: acikAdisyonlar.length
      });
      
      // 1. mc_adisyonlar'dan kapalı ve boş olanları temizle
      const filteredAdisyonlar = allAdisyonlar.filter(ad => {
        if (isAdisyonKapali(ad)) {
          return true;
        }
        
        let hasItems = false;
        
        if (ad.tur === "BİLARDO") {
          const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
          const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
          if (bilardoUcret > 0 || ekUrunToplam > 0) hasItems = true;
        } else {
          if (ad.kalemler && ad.kalemler.length > 0) {
            const total = ad.kalemler.reduce((sum, kalem) => {
              const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
              const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
              return sum + (birimFiyat * miktar);
            }, 0);
            if (total > 0) hasItems = true;
          }
        }
        
        return hasItems;
      });
      
      // 2. mc_acik_adisyonlar'dan kapalı ve boş olanları temizle
      let filteredAcikAdisyonlar = acikAdisyonlar.filter(ad => {
        if (isAdisyonKapali(ad)) {
          console.log('🧹 Kapalı adisyon açık adisyonlar listesinden çıkarıldı:', {
            id: ad.id,
            tur: ad.tur,
            masaNo: ad.masaNo || ad.masaNum
          });
          return false;
        }
        
        if (ad.tur === "BİLARDO") {
          const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
          const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
          const hasItems = (bilardoUcret + ekUrunToplam) > 0;
          if (!hasItems) {
            console.log('🧹 Boş bilardo adisyonu temizlendi:', ad.id);
          }
          return hasItems;
        } else {
          let total = 0;
          if (ad.kalemler && ad.kalemler.length > 0) {
            total = ad.kalemler.reduce((sum, kalem) => {
              const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
              const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
              return sum + (birimFiyat * miktar);
            }, 0);
          }
          const hasItems = total > 0;
          if (!hasItems) {
            console.log('🧹 Boş normal adisyon temizlendi:', ad.id);
          }
          return hasItems;
        }
      });
      
      // 3. KAPALI BİLARDO ADISYONLARINI TEMİZLEME
      const kapaliBilardoAdisyonlar = allAdisyonlar.filter(ad => 
        ad.tur === "BİLARDO" && isAdisyonKapali(ad)
      );
      
      if (kapaliBilardoAdisyonlar.length > 0) {
        console.log('🎱 Kapalı bilardo adisyonları temizleniyor:', kapaliBilardoAdisyonlar.length);
        
        const filteredAcikWithoutClosedBilardo = filteredAcikAdisyonlar.filter(ad => 
          !(ad.tur === "BİLARDO" && isAdisyonKapali(ad))
        );
        
        const removedCount = filteredAcikAdisyonlar.length - filteredAcikWithoutClosedBilardo.length;
        if (removedCount > 0) {
          console.log(`🎱 ${removedCount} kapalı bilardo adisyonu açık adisyonlar listesinden temizlendi.`);
          filteredAcikAdisyonlar = filteredAcikWithoutClosedBilardo;
        }
      }
      
      // 4. TUTARSIZLIK KONTROLÜ
      const acikAdisyonIds = new Set(filteredAcikAdisyonlar.map(ad => ad.id));
      const finalFilteredAdisyonlar = filteredAdisyonlar.map(ad => {
        if (acikAdisyonIds.has(ad.id)) {
          const acikVersiyon = filteredAcikAdisyonlar.find(a => a.id === ad.id);
          
          const isKapali1 = isAdisyonKapali(ad);
          const isKapali2 = isAdisyonKapali(acikVersiyon);
          
          if (isKapali1 !== isKapali2) {
            console.log(`🔄 Adisyon ${ad.id} durum tutarsızlığı düzeltiliyor:`, {
              onceki: isKapali1,
              yeni: isKapali2,
              tur: ad.tur,
              masaNo: ad.masaNo || ad.masaNum
            });
            
            if (isKapali2) {
              return { 
                ...ad, 
                kapali: true,
                durum: "KAPALI",
                kapanisZamani: acikVersiyon.kapanisZamani || new Date().toISOString()
              };
            } else {
              return { 
                ...ad, 
                kapali: false,
                durum: "ACIK"
              };
            }
          }
        }
        return ad;
      });
      
      // 5. LocalStorage'ı güncelle
      localStorage.setItem("mc_adisyonlar", JSON.stringify(finalFilteredAdisyonlar));
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(filteredAcikAdisyonlar));
      
      console.log('✅ ANA EKRAN: Gelişmiş adisyon temizliği tamamlandı:', {
        beforeAll: allAdisyonlar.length,
        afterAll: finalFilteredAdisyonlar.length,
        beforeAcik: acikAdisyonlar.length,
        afterAcik: filteredAcikAdisyonlar.length,
        removedEmpty: allAdisyonlar.length - finalFilteredAdisyonlar.length + acikAdisyonlar.length - filteredAcikAdisyonlar.length,
        kapaliBilardoTemizlendi: kapaliBilardoAdisyonlar.length
      });
      
      return true;
    } catch (error) {
      console.error('❌ ANA EKRAN: Gelişmiş adisyon temizleme hatası:', error);
      return false;
    }
  }, [isAdisyonKapali]);

  // Dashboard verilerini güncelle fonksiyonu - GUNCELLENDI
  const updateDashboardData = useCallback(() => {
    console.log('📊 ANA EKRAN: Dashboard verileri güncelleniyor...');
    
    try {
      // Gün başlangıcını kontrol et
      const gunBaslangic = localStorage.getItem('mycafe_gun_baslangic');
      
      if (!gunBaslangic) {
        // Gün başlatılmamışsa boş veri göster
        setDashboardData({
          dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
          criticalProducts: [],
          openTables: [],
          dailyExpenses: 0
        });
        return;
      }
      
      const gunBaslangicTarih = new Date(gunBaslangic);
      
      // Bugünün tarihi
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
      const borclar = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      
      // GÜNLÜK SATIŞ HESAPLAMA - GÜN BAŞLANGICINDAN SONRAKİLER
      const todayNormalSales = adisyonlar
        .filter(a => {
          if (!a.acilisZamani) return false;
          const adisyonTarihi = new Date(a.acilisZamani);
          const tarihStr = adisyonTarihi.toISOString().split('T')[0];
          
          // Sadece bugün VE gün başlangıcından sonraki adisyonlar
          return tarihStr === todayStr && 
                 adisyonTarihi >= gunBaslangicTarih && 
                 isAdisyonKapali(a);
        })
        .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
      
      // Bugünkü borçlar
      const todayDebts = borclar
        .filter(b => {
          if (!b.tarih && !b.acilisZamani) return false;
          const borcTarihi = b.tarih 
            ? new Date(b.tarih)
            : new Date(b.acilisZamani);
          const tarihStr = borcTarihi.toISOString().split('T')[0];
          
          return tarihStr === todayStr && borcTarihi >= gunBaslangicTarih;
        })
        .reduce((sum, b) => sum + (parseFloat(b.tutar || b.toplamTutar || 0) || 0), 0);
      
      // Bugünkü bilardo satışları
      const todayBilardoSales = bilardoAdisyonlar
        .filter(b => {
          if (!b.acilisZamani) return false;
          const adisyonTarihi = new Date(b.acilisZamani);
          const tarihStr = adisyonTarihi.toISOString().split('T')[0];
          
          return tarihStr === todayStr && 
                 adisyonTarihi >= gunBaslangicTarih &&
                 b.durum === "KAPANDI" && !b.iptal && !b.transferEdildi;
        })
        .reduce((sum, b) => {
          const bilardoUcret = parseFloat(b.bilardoUcret || b.bilardoUcreti || 0) || 0;
          const ekUrunToplam = parseFloat(b.ekUrunToplam || 0) || 0;
          return sum + bilardoUcret + ekUrunToplam;
        }, 0);
      
      // KRITIK STOK KONTROLÜ
      const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
      const criticalProducts = urunler
        .filter(u => {
          const stockTakip = u.stockTakip === true || u.stockTakip === "true";
          const stock = parseInt(u.stock || 0);
          const critical = parseInt(u.critical || 10);
          return stockTakip && stock <= critical;
        })
        .slice(0, 5);
      
      // GÜNLÜK GİDERLERİ HESAPLA (gün başlangıcından sonraki)
      const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
      const dailyExpenses = giderler
        .filter(gider => {
          if (!gider.tarih) return false;
          const giderTarihi = new Date(gider.tarih);
          return giderTarihi >= gunBaslangicTarih;
        })
        .reduce((sum, gider) => sum + (parseFloat(gider.tutar) || 0), 0);
      
      // AÇIK ADISYONLARI AL (Gün başlangıcından sonra açılmış olanlar)
      const openTables = [];
      
      // Normal masalar
      adisyonlar
        .filter(a => !isAdisyonKapali(a))
        .forEach(ad => {
          const adisyonTarihi = new Date(ad.acilisZamani);
          if (adisyonTarihi < gunBaslangicTarih) return;
          
          const masaNo = ad.masaNo || `MASA ${ad.masaNum}`;
          let toplamTutar = 0;
          
          if (ad.kalemler && ad.kalemler.length > 0) {
            toplamTutar = ad.kalemler.reduce((sum, kalem) => {
              const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
              const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
              return sum + (birimFiyat * miktar);
            }, 0);
          }
          
          if (ad.toplamTutar && parseFloat(ad.toplamTutar) > 0) {
            toplamTutar = parseFloat(ad.toplamTutar);
          }
          
          if (toplamTutar > 0) {
            openTables.push({
              id: ad.id || `normal_${ad.masaNo || ad.masaNum}`,
              no: ad.masaNum || ad.masaNo || "1",
              masaNo: masaNo,
              toplamTutar: toplamTutar,
              tur: "NORMAL",
              urunSayisi: ad.kalemler?.length || 0,
              adisyonData: ad
            });
          }
        });
      
      // Bilardo masaları
      bilardoAdisyonlar
        .filter(b => b.durum === "ACIK")
        .forEach(ad => {
          const adisyonTarihi = new Date(ad.acilisZamani);
          if (adisyonTarihi < gunBaslangicTarih) return;
          
          const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
          const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
          const toplamTutar = bilardoUcret + ekUrunToplam;
          
          if (toplamTutar > 0) {
            openTables.push({
              id: ad.id || `bilardo_${ad.masaNo}`,
              no: ad.masaNo,
              masaNo: `BİLARDO ${ad.masaNo}`,
              toplamTutar: toplamTutar,
              tur: "BİLARDO",
              urunSayisi: ad.ekUrunler?.length || 0,
              bilardoUcret: bilardoUcret,
              ekUrunToplam: ekUrunToplam,
              adisyonData: ad
            });
          }
        });
      
      // Açık adisyonları benzersiz yap
      const uniqueOpenTables = [];
      const masaNoMap = new Map();
      
      openTables.forEach(table => {
        const masaKey = `${table.tur}_${table.no}`;
        
        if (!masaNoMap.has(masaKey)) {
          masaNoMap.set(masaKey, table);
          uniqueOpenTables.push(table);
        } else {
          const existing = masaNoMap.get(masaKey);
          if (table.toplamTutar > existing.toplamTutar) {
            const index = uniqueOpenTables.findIndex(t => t.id === existing.id);
            if (index !== -1) {
              uniqueOpenTables[index] = table;
            }
            masaNoMap.set(masaKey, table);
          }
        }
      });
      
      const newDashboardData = {
        dailySales: {
          total: todayNormalSales + todayDebts + todayBilardoSales,
          normal: todayNormalSales,
          bilardo: todayBilardoSales,
          debt: todayDebts
        },
        criticalProducts: criticalProducts,
        openTables: uniqueOpenTables.sort((a, b) => {
          if (a.tur === "NORMAL" && b.tur === "BİLARDO") return -1;
          if (a.tur === "BİLARDO" && b.tur === "NORMAL") return 1;
          
          const aNum = parseInt(a.no.replace('B', '').replace(/\D/g, ''));
          const bNum = parseInt(b.no.replace('B', '').replace(/\D/g, ''));
          return aNum - bNum;
        }),
        dailyExpenses: dailyExpenses
      };
      
      setDashboardData(newDashboardData);
      console.log('✅ ANA EKRAN: Dashboard verileri güncellendi', {
        dailySales: newDashboardData.dailySales,
        dailyExpenses: newDashboardData.dailyExpenses,
        openTables: newDashboardData.openTables.length,
        criticalProducts: newDashboardData.criticalProducts.length
      });

    } catch (error) {
      console.error("❌ ANA EKRAN: Dashboard veri yükleme hatası:", error);
      setDashboardData({
        dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
        criticalProducts: [],
        openTables: [],
        dailyExpenses: 0
      });
    }
  }, [isAdisyonKapali]);

  // Canlı saat güncellemesi
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Gün süresini güncelle (gün aktifse)
  useEffect(() => {
    if (gunAktif) {
      const gunBaslangicZamani = localStorage.getItem('mycafe_gun_baslangic');
      
      if (gunBaslangicZamani) {
        const updateGunSuresi = () => {
          const now = new Date();
          const baslangic = new Date(gunBaslangicZamani);
          const farkMs = now - baslangic;
          
          const saat = Math.floor(farkMs / (1000 * 60 * 60));
          const dakika = Math.floor((farkMs % (1000 * 60 * 60)) / (1000 * 60));
          
          setGunSuresi({ saat, dakika });
        };
        
        updateGunSuresi();
        const interval = setInterval(updateGunSuresi, 60000);
        
        return () => clearInterval(interval);
      }
    }
  }, [gunAktif]);

  // SyncService event'lerini dinle
  useEffect(() => {
    console.log('🔔 ANA EKRAN: SyncService event listenerları kuruluyor...');
    
    cleanupEmptyAdisyonlar();
    updateDashboardData();
    
    const handleSyncEvent = (event) => {
      console.log('📢 ANA EKRAN: Sync event alındı:', event.type, event.detail);
      
      updateDashboardData();
      
      setTimeout(updateDashboardData, 300);
    };
    
    const syncEvents = [
      'sync:masa_güncellendi',
      'sync:adisyongüncellendi',
      'sync:fiyat_güncellendi',
      'sync:kalem_eklendi',
      'sync:senkronize_et',
      'sync:masa_temizlendi',
      'sync:panel_güncellendi',
      'sync:dashboard_güncellendi',
      'sync:gider_eklendi',
      'sync:gider_silindi',
      'gunSonuYapildi',
      'gunBaslatildi'
    ];
    
    syncEvents.forEach(eventName => {
      window.addEventListener(eventName, handleSyncEvent);
    });
    
    const otherEvents = [
      'storage',
      'adisyonGuncellendi',
      'masaGuncellendi',
      'bilardoAdisyonGuncellendi',
      'urunEklendi',
      'urunSilindi',
      'musteriEklendi',
      'borcEklendi',
      'borcSilindi',
      'giderEklendi',
      'giderSilindi'
    ];
    
    otherEvents.forEach(eventName => {
      window.addEventListener(eventName, handleSyncEvent);
    });
    
    const periodicInterval = setInterval(updateDashboardData, 30000);
    const cleanupInterval = setInterval(cleanupEmptyAdisyonlar, 300000);
    
    return () => {
      syncEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleSyncEvent);
      });
      
      otherEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleSyncEvent);
      });
      
      clearInterval(periodicInterval);
      clearInterval(cleanupInterval);
      console.log('🧹 ANA EKRAN: Event listenerları temizlendi');
    };
  }, [updateDashboardData, cleanupEmptyAdisyonlar]);

  // Format para
  const formatPara = useCallback((value) => {
    try {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return "0,00";
      
      return numValue.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.error("Para formatlama hatası:", error, value);
      return "0,00";
    }
  }, []);

  // Masa veya bilardo detayına git
  const goToTableDetail = useCallback((masa) => {
    if (!gunAktif) {
      alert('❌ Gün başlatılmamış! Günlük işlemler için sol taraftaki menüden "Gün Başlat" butonuna tıklayın.');
      return;
    }
    
    console.log('Adisyon detayına gidiliyor:', masa);
    
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    
    const adisyonId = masa.adisyonData?.id;
    let adisyonBulundu = false;
    
    if (adisyonId) {
      const adisyon = adisyonlar.find(a => a.id === adisyonId) || 
                      acikAdisyonlar.find(a => a.id === adisyonId);
      
      if (adisyon) {
        adisyonBulundu = true;
        console.log('✅ Adisyon bulundu:', adisyonId);
      } else {
        console.warn('⚠️ Adisyon bulunamadı:', adisyonId);
        
        const masaNo = masa.no.toString().replace('BİLARDO ', '').replace('B', '').replace(/\D/g, '');
        
        if (masa.tur === "BİLARDO") {
          const bilardoAdisyon = acikAdisyonlar.find(a => 
            a.tur === "BİLARDO" && 
            a.masaNo === masaNo
          ) || adisyonlar.find(a => 
            a.tur === "BİLARDO" && 
            a.masaNo === masaNo &&
            !isAdisyonKapali(a)
          );
          
          if (bilardoAdisyon) {
            console.log('✅ Bilardo adisyonu masa numarasıyla bulundu:', masaNo);
            navigate(`/bilardo-adisyon/${masaNo}`);
            return;
          }
        } else {
          const normalAdisyon = acikAdisyonlar.find(a => 
            a.tur !== "BİLARDO" && 
            (a.masaNum === masaNo || a.masaNo === `MASA ${masaNo}`)
          ) || adisyonlar.find(a => 
            a.tur !== "BİLARDO" && 
            (a.masaNum === masaNo || a.masaNo === `MASA ${masaNo}`) &&
            !isAdisyonKapali(a)
          );
          
          if (normalAdisyon) {
            console.log('✅ Normal adisyon masa numarasıyla bulndu:', masaNo);
            navigate(`/adisyondetay/${masaNo}`);
            return;
          }
        }
      }
    }
    
    if (masa.tur === "BİLARDO") {
      const masaNumarasi = masa.no.toString().replace('BİLARDO ', '').replace('B', '').replace(/\D/g, '');
      
      const bilardoAdisyonlar = acikAdisyonlar.filter(a => 
        a.tur === "BİLARDO" && a.masaNo === masaNumarasi && !isAdisyonKapali(a)
      );
      
      if (bilardoAdisyonlar.length === 0) {
        alert('⚠️ Bu bilardo adisyonu bulunamadı veya kapalı. Lütfen masa durumunu kontrol edin.');
        return;
      }
      
      console.log(`Bilardo adisyonuna gidiliyor: /bilardo-adisyon/${masaNumarasi}`);
      navigate(`/bilardo-adisyon/${masaNumarasi}`);
    } else {
      const masaNumarasi = masa.no.toString().replace('MASA ', '').replace(/\D/g, '');
      
      const normalAdisyonlar = acikAdisyonlar.filter(a => 
        a.tur !== "BİLARDO" && 
        (a.masaNum === masaNumarasi || a.masaNo === `MASA ${masaNumarasi}`) &&
        !isAdisyonKapali(a)
      );
      
      if (normalAdisyonlar.length === 0) {
        alert('⚠️ Bu masa adisyonu bulunamadı veya kapalı. Lütfen masa durumunu kontrol edin.');
        return;
      }
      
      console.log(`Normal adisyona gidiliyor: /adisyondetay/${masaNumarasi}`);
      navigate(`/adisyondetay/${masaNumarasi}`);
    }
  }, [navigate, gunAktif, isAdisyonKapali]);

  // Raporlar sayfasına git
  const goToReports = useCallback(() => {
    navigate('/raporlar');
  }, [navigate]);

  // Giderler sayfasına git
  const goToExpenses = useCallback(() => {
    navigate('/giderler');
  }, [navigate]);

  return (
    <div className="ana-wrapper">
      <div className="top-bar">
        <div className="title-3d">GÜNLÜK ÖZET</div>
        <div className="clock-box">{currentTime}</div>
      </div>

      {/* GÜN DURUMU BİLGİ KARTI */}
      {gunAktif && (
        <div className="gun-durumu-kart">
          <div className="gun-durumu-left">
            <div className="gun-durumu-icon">
              ⏰
            </div>
            <div>
              <div className="gun-suresi">
                Gün Süresi: {gunSuresi.saat} saat {gunSuresi.dakika} dakika
              </div>
              <div className="gun-baslangic">
                Başlangıç: {new Date(localStorage.getItem('mycafe_gun_baslangic') || new Date()).toLocaleDateString('tr-TR')} {new Date(localStorage.getItem('mycafe_gun_baslangic') || new Date()).toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
          
          <div className="gun-durumu-right">
            <div className="gun-istatistik">
              <div className="gun-istatistik-label">Bugünkü Satış</div>
              <div className="gun-istatistik-deger">
                {formatPara(dashboardData.dailySales.total)} ₺
              </div>
            </div>
            
            <div className="gun-istatistik">
              <div className="gun-istatistik-label">Açık Adisyon</div>
              <div className="gun-istatistik-deger">
                {dashboardData.openTables.length}
              </div>
            </div>
            
            <div className="gun-istatistik">
              <div className="gun-istatistik-label">Günlük Gider</div>
              <div className="gun-istatistik-deger">
                {formatPara(dashboardData.dailyExpenses)} ₺
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GÜN BAŞLATILMAMIŞ UYARI KARTI (BUTONSUZ) */}
      {!gunAktif && (
        <div className="gun-baslat-container">
          <div className="gun-baslat-kart" style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
          }}>
            <div className="gun-baslat-icon" style={{ fontSize: '48px' }}>⏸️</div>
            <div className="gun-baslat-bilgi">
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Gün Başlatılmamış</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', lineHeight: '1.5' }}>
                Günlük işlemleri başlatmak için <strong>sol taraftaki menüden</strong> "Gün Başlat" butonuna tıklayın.
              </p>
              <div style={{
                marginTop: '15px',
                padding: '10px 15px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                borderLeft: '4px solid white',
                fontSize: '14px'
              }}>
                📍 <strong>Yönlendirme:</strong> Sol tarafta bulunan sidebar menüsündeki <strong>"🚀 Gün Başlat"</strong> butonunu kullanın.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SATIŞ İSTATİSTİKLERİ (GÜN AKTİFSE) */}
      {gunAktif && (
        <>
          <div className="summary-cards">
            <div className="sum-card">
              <div className="sum-icon">💰</div>
              <div className="sum-title">GÜNLÜK TOPLAM SATIŞ</div>
              <div className="sum-value">
                {formatPara(dashboardData.dailySales.total)} ₺
              </div>
              <div className="sum-detaylar">
                <div className="sum-detay-item">
                  <div className="sum-detay-label">🍽 Normal</div>
                  <div className="sum-detay-deger">{formatPara(dashboardData.dailySales.normal)} ₺</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">🎱 Bilardo</div>
                  <div className="sum-detay-deger">{formatPara(dashboardData.dailySales.bilardo)} ₺</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">📝 Hesaba Yaz</div>
                  <div className="sum-detay-deger">{formatPara(dashboardData.dailySales.debt)} ₺</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">📊 Net</div>
                  <div className="sum-detay-deger">
                    {formatPara(dashboardData.dailySales.total - dashboardData.dailySales.debt)} ₺
                  </div>
                </div>
              </div>
            </div>

            <div className="sum-card">
              <div className="sum-icon">🪑</div>
              <div className="sum-title">AÇIK ADISYONLAR</div>
              <div className="sum-value">
                {dashboardData.openTables.length} Masa
              </div>
              <div className="sum-detaylar">
                <div className="sum-detay-item">
                  <div className="sum-detay-label">🍽 Normal</div>
                  <div className="sum-detay-deger">
                    {dashboardData.openTables.filter(t => t.tur === "NORMAL").length}
                  </div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">🎱 Bilardo</div>
                  <div className="sum-detay-deger">
                    {dashboardData.openTables.filter(t => t.tur === "BİLARDO").length}
                  </div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">💵 Toplam Tutar</div>
                  <div className="sum-detay-deger">
                    {formatPara(dashboardData.openTables.reduce((sum, t) => {
                      const tutar = parseFloat(t.toplamTutar) || 0;
                      return sum + tutar;
                    }, 0))} ₺
                  </div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">📦 Toplam Ürün</div>
                  <div className="sum-detay-deger">
                    {dashboardData.openTables.reduce((sum, t) => sum + (t.urunSayisi || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="sum-card">
              <div className="sum-icon">🏦</div>
              <div className="sum-title">KRITIK STOK</div>
              <div className="sum-value">
                {dashboardData.criticalProducts.length} Ürün
              </div>
              <div className="critical-products-list">
                {dashboardData.criticalProducts.slice(0, 3).map((urun, idx) => (
                  <div key={idx} className="critical-product-item">
                    <span className="critical-product-name">
                      {urun.name ? (urun.name.length > 15 ? urun.name.substring(0, 12) + "..." : urun.name) : "İsimsiz"}
                    </span>
                    <span className="critical-product-stock">
                      {urun.stock || 0}/{urun.critical || 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RAPORLAR BUTONU */}
            <div className="sum-card">
              <div className="sum-icon">📊</div>
              <div className="sum-title">RAPORLAR</div>
              <div className="sum-value">
                Detaylı Analiz
              </div>
              <div className="raporlar-button-container">
                <div 
                  className="raporlar-button"
                  onClick={goToReports}
                >
                  📈 Raporlara Git
                </div>
              </div>
              <div className="sum-detaylar">
                <div className="sum-detay-item">
                  <div className="sum-detay-label">Günlük Özet</div>
                  <div className="sum-detay-deger">📋</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">Kategori Raporu</div>
                  <div className="sum-detay-deger">📊</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">Kasa Raporu</div>
                  <div className="sum-detay-deger">💰</div>
                </div>
                <div className="sum-detay-item">
                  <div className="sum-detay-label">Detaylı Analiz</div>
                  <div className="sum-detay-deger">🔍</div>
                </div>
              </div>
            </div>

            {/* GİDERLER PANELİ */}
            <div className="sum-card">
              <div className="sum-icon">💸</div>
              <div className="sum-title">GÜNLÜK GİDERLER</div>
              <div className="sum-value">
                {formatPara(dashboardData.dailyExpenses)} ₺
              </div>
              <div className="expenses-summary">
                <div className="expenses-net-profit">
                  <div className="expenses-net-label">Net Kâr:</div>
                  <div 
                    className="expenses-net-value"
                    style={{
                      color: (dashboardData.dailySales.total - dashboardData.dailySales.debt - dashboardData.dailyExpenses) > 0 ? '#10b981' : '#ef4444'
                    }}
                  >
                    {formatPara(dashboardData.dailySales.total - dashboardData.dailySales.debt - dashboardData.dailyExpenses)} ₺
                  </div>
                </div>
                <div className="expenses-button-container">
                  <div 
                    className="expenses-button"
                    onClick={goToExpenses}
                  >
                    📋 Gider Detayları
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AÇIK ADISYONLAR PANELİ */}
          <div className="panel-box-wide">
            <div className="panel-header-wide">
              <span>📋 AÇIK ADISYONLAR</span>
              <span className="panel-small-wide">
                {dashboardData.openTables.length} Masa • 
                Toplam: {formatPara(dashboardData.openTables.reduce((sum, t) => {
                  const tutar = parseFloat(t.toplamTutar) || 0;
                  return sum + tutar;
                }, 0))} ₺
                <span className="live-update-badge"></span>
              </span>
            </div>
            
            <div className="panel-list-wide">
              {dashboardData.openTables.length > 0 ? (
                <div className="table-container-wide">
                  <table className="open-tables-table">
                    <thead>
                      <tr>
                        <th>MASALAR</th>
                        <th>MASA TÜRÜ</th>
                        <th>MASA NO</th>
                        <th>TOPLAM TUTAR</th>
                        <th>İŞLEMLER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.openTables.map((masa) => {
                        const isBilardo = masa.tur === "BİLARDO";
                        
                        return (
                          <tr 
                            key={masa.id}
                            className={`table-row ${isBilardo ? 'bilardo-row' : 'normal-row'}`}
                          >
                            <td>
                              <div className="table-icon-cell">
                                <div className="table-icon">
                                  {isBilardo ? '🎱' : '🍽'}
                                </div>
                              </div>
                            </td>
                            <td className="table-type-cell">
                              <div className="table-type-badge">
                                {isBilardo ? 'BİLARDO' : 'YEMEK/İÇECEK'}
                              </div>
                            </td>
                            <td className="table-number">
                              <strong>{masa.masaNo}</strong>
                            </td>
                            <td className="table-amount">
                              <div className="amount-main">
                                {formatPara(masa.toplamTutar)} ₺
                              </div>
                              <div className="amount-details">
                                {masa.urunSayisi || 0} ürün
                              </div>
                            </td>
                            <td className="table-actions">
                              <button 
                                className="action-button"
                                onClick={() => goToTableDetail(masa)}
                              >
                                📋 Detay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-wide">
                  <div className="empty-icon-wide">✅</div>
                  <div className="empty-text-wide">Açık Adisyon Bulunmuyor</div>
                  <div className="empty-subtext-wide">
                    Yeni adisyon açmak için Masalar sayfasına gidin
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}