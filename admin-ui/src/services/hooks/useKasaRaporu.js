/* ------------------------------------------------------------
   🎣 useKasaRaporu.js — Kasa Raporu Custom Hook
   📌 Ana kasa raporu state yönetimi, syncService entegrasyonu
------------------------------------------------------------ */

import { useState, useEffect, useCallback } from 'react';
import kasaService from '../services/kasaService';
import syncService from '../services/syncService';
import { 
  tariheGoreFiltrele, 
  kasaOzetiHesapla,
  odemeDagilimiHesapla,
  tahsilatTurleriHesapla,
  kasaFarkiDurumuBelirle,
  varsayilanTarihAraligiOlustur 
} from '../utils/kasaHesaplamalar';
import { tarihAraligiValidasyon } from '../utils/tarihFiltreleme';
import { YETKILI_ROLLER } from '../constants/kasaTipleri';

const useKasaRaporu = () => {
  // ======================================================
  // 🔐 YETKİ KONTROLÜ
  // ======================================================
  const [yetkiliMi, setYetkiliMi] = useState(false);
  const [kullanici, setKullanici] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("mc_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setKullanici(user);
        setYetkiliMi(YETKILI_ROLLER.includes(user.role));
      } catch (error) {
        console.error('Kullanıcı bilgisi okunamadı:', error);
      }
    }
  }, []);

  // ======================================================
  // 📅 TARİH STATE'LERİ
  // ======================================================
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [bitisTarihi, setBitisTarihi] = useState('');
  const [tarihHatalari, setTarihHatalari] = useState([]);

  // Varsayılan tarih aralığını ayarla (7 gün)
  useEffect(() => {
    const varsayilan = varsayilanTarihAraligiOlustur(7);
    setBaslangicTarihi(varsayilan.baslangic);
    setBitisTarihi(varsayilan.bitis);
  }, []);

  // ======================================================
  // 📊 VERİ STATE'LERİ
  // ======================================================
  const [raporVerisi, setRaporVerisi] = useState({
    hareketler: [],
    kasaOzet: {
      gunBasiKasa: 0,
      gunSonuKasa: 0,
      toplamTahsilat: 0,
      kasaFarki: 0
    },
    odemeDagilimi: {
      nakit: 0,
      kart: 0,
      havale: 0,
      hesabaYaz: 0
    },
    tahsilatTurleri: {
      adisyonTahsilat: 0,
      hesabaYazTahsilat: 0,
      sonradanTahsilat: 0
    },
    gunlukGruplar: [],
    kasaFarkiDurumu: null
  });

  // ======================================================
  // ⚙️ DİĞER STATE'LER
  // ======================================================
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [sonGuncelleme, setSonGuncelleme] = useState(null);

  // ======================================================
  // 🔄 SYNC SERVICE EVENT DİNLEYİCİLERİ
  // ======================================================
  useEffect(() => {
    if (!yetkiliMi) return;

    const handleKasaHareketi = (data) => {
      console.log('🔄 KASA HOOK: Yeni hareket geldi', data);
      
      // Sadece tarih aralığında ise güncelle
      if (baslangicTarihi && bitisTarihi) {
        const hareketTarihi = (data.odemeTarihi || data.tarih)?.split('T')[0];
        if (hareketTarihi >= baslangicTarihi && hareketTarihi <= bitisTarihi) {
          raporuYenile();
        }
      }
      
      setSonGuncelleme(new Date().toISOString());
    };

    const handleOdemeAlindi = (data) => {
      console.log('💰 KASA HOOK: Ödeme alındı', data);
      raporuYenile();
    };

    // Event listener'ları kaydet
    syncService.on('KASA_HAREKETI_EKLENDI', handleKasaHareketi);
    syncService.on('ODEME_ALINDI', handleOdemeAlindi);
    syncService.on('GUN_BASI_KASA_GIRILDI', handleKasaHareketi);
    syncService.on('GUN_SONU_KASA_GIRILDI', handleKasaHareketi);

    // Temizleme fonksiyonu
    return () => {
      syncService.off('KASA_HAREKETI_EKLENDI', handleKasaHareketi);
      syncService.off('ODEME_ALINDI', handleOdemeAlindi);
      syncService.off('GUN_BASI_KASA_GIRILDI', handleKasaHareketi);
      syncService.off('GUN_SONU_KASA_GIRILDI', handleKasaHareketi);
    };
  }, [yetkiliMi, baslangicTarihi, bitisTarihi]);

  // ======================================================
  // 📡 RAPOR GETİRME FONKSİYONU
  // ======================================================
  const raporGetir = useCallback(async () => {
    if (!yetkiliMi) {
      setHata('Bu raporu görüntülemek için yetkiniz yok.');
      return;
    }

    // Tarih validasyonu
    const validasyon = tarihAraligiValidasyon(baslangicTarihi, bitisTarihi);
    if (!validasyon.gecerli) {
      setTarihHatalari(validasyon.hatalar);
      setHata('Lütfen geçerli bir tarih aralığı seçin.');
      return;
    }

    setTarihHatalari([]);
    setYukleniyor(true);
    setHata(null);

    try {
      // Kasa servisinden raporu al
      const rapor = kasaService.kasaRaporuGetir(baslangicTarihi, bitisTarihi);
      
      if (!rapor) {
        throw new Error('Rapor oluşturulamadı.');
      }

      // Ek hesaplamalar
      const gunlukGruplar = hareketleriGunlereGoreGrupla(rapor.hareketler);
      const kasaFarkiDurumu = kasaFarkiDurumuBelirle(rapor.kasaOzet.kasaFarki);

      setRaporVerisi({
        ...rapor,
        gunlukGruplar,
        kasaFarkiDurumu
      });

      setSonGuncelleme(new Date().toISOString());
      
    } catch (err) {
      console.error('Kasa raporu hatası:', err);
      setHata(err.message || 'Rapor yüklenirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  }, [yetkiliMi, baslangicTarihi, bitisTarihi]);

  // ======================================================
  // 🔄 RAPORU YENİLEME
  // ======================================================
  const raporuYenile = useCallback(() => {
    if (baslangicTarihi && bitisTarihi) {
      raporGetir();
    }
  }, [raporGetir, baslangicTarihi, bitisTarihi]);

  // ======================================================
  // 📅 TARİH DEĞİŞİKLİKLERİ
  // ======================================================
  const handleBaslangicTarihiDegistir = (tarih) => {
    setBaslangicTarihi(tarih);
    setTarihHatalari([]);
  };

  const handleBitisTarihiDegistir = (tarih) => {
    setBitisTarihi(tarih);
    setTarihHatalari([]);
  };

  const handleBugunSec = () => {
    const bugun = new Date().toISOString().split('T')[0];
    setBaslangicTarihi(bugun);
    setBitisTarihi(bugun);
  };

  const handleBuHaftaSec = () => {
    const simdi = new Date();
    const gun = simdi.getDay();
    const pazartesiFarki = gun === 0 ? -6 : 1 - gun;
    
    const baslangic = new Date(simdi);
    baslangic.setDate(simdi.getDate() + pazartesiFarki);
    
    const bitis = new Date(baslangic);
    bitis.setDate(baslangic.getDate() + 6);
    
    setBaslangicTarihi(baslangic.toISOString().split('T')[0]);
    setBitisTarihi(bitis.toISOString().split('T')[0]);
  };

  const handleBuAySec = () => {
    const simdi = new Date();
    const yil = simdi.getFullYear();
    const ay = simdi.getMonth();
    
    const baslangic = new Date(yil, ay, 1);
    const bitis = new Date(yil, ay + 1, 0);
    
    setBaslangicTarihi(baslangic.toISOString().split('T')[0]);
    setBitisTarihi(bitis.toISOString().split('T')[0]);
  };

  // ======================================================
  // 💰 KASA YÖNETİM FONKSİYONLARI
  // ======================================================
  const gunBasiKasaEkle = (tutar, tarih) => {
    if (!yetkiliMi) {
      setHata('Bu işlem için yetkiniz yok.');
      return null;
    }

    try {
      const kayit = kasaService.gunBasiKasaEkle(tutar, tarih);
      if (kayit) {
        // Raporu yenile
        setTimeout(() => raporuYenile(), 500);
        return kayit;
      }
      return null;
    } catch (err) {
      setHata('Gün başı kasa eklenirken hata: ' + err.message);
      return null;
    }
  };

  const gunSonuKasaEkle = (tutar, tarih) => {
    if (!yetkiliMi) {
      setHata('Bu işlem için yetkiniz yok.');
      return null;
    }

    try {
      const kayit = kasaService.gunSonuKasaEkle(tutar, tarih);
      if (kayit) {
        // Raporu yenile
        setTimeout(() => raporuYenile(), 500);
        return kayit;
      }
      return null;
    } catch (err) {
      setHata('Gün sonu kasa eklenirken hata: ' + err.message);
      return null;
    }
  };

  const manuelHareketEkle = (hareketData) => {
    if (!yetkiliMi) {
      setHata('Bu işlem için yetkiniz yok.');
      return null;
    }

    try {
      const hareket = kasaService.hareketEkle(hareketData);
      if (hareket) {
        setTimeout(() => raporuYenile(), 500);
        return hareket;
      }
      return null;
    } catch (err) {
      setHata('Manuel hareket eklenirken hata: ' + err.message);
      return null;
    }
  };

  // ======================================================
  // 📊 YARDIMCI FONKSİYONLAR
  // ======================================================
  const hareketleriGunlereGoreGrupla = (hareketler) => {
    const gruplar = {};
    
    hareketler.forEach(hareket => {
      const tarih = (hareket.odemeTarihi || hareket.tarih).split('T')[0];
      
      if (!gruplar[tarih]) {
        gruplar[tarih] = {
          tarih,
          hareketler: [],
          toplamTahsilat: 0,
          toplamCiro: 0
        };
      }
      
      gruplar[tarih].hareketler.push(hareket);
      
      if (hareket.kasaGirisi === true) {
        gruplar[tarih].toplamTahsilat += parseFloat(hareket.tutar) || 0;
      }
      
      gruplar[tarih].toplamCiro += parseFloat(hareket.tutar) || 0;
    });
    
    return Object.values(gruplar).sort((a, b) => b.tarih.localeCompare(a.tarih));
  };

  // ======================================================
  // 📤 RETURN DEĞERLERİ
  // ======================================================
  return {
    // State'ler
    yetkiliMi,
    kullanici,
    baslangicTarihi,
    bitisTarihi,
    tarihHatalari,
    raporVerisi,
    yukleniyor,
    hata,
    sonGuncelleme,
    
    // Fonksiyonlar
    raporGetir,
    raporuYenile,
    handleBaslangicTarihiDegistir,
    handleBitisTarihiDegistir,
    handleBugunSec,
    handleBuHaftaSec,
    handleBuAySec,
    gunBasiKasaEkle,
    gunSonuKasaEkle,
    manuelHareketEkle,
    
    // Yardımcı getter'lar
    get toplamCiro() {
      return raporVerisi.hareketler
        .filter(h => h.tip === 'TAHSILAT')
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
    },
    
    get toplamKasaGirisi() {
      return raporVerisi.hareketler
        .filter(h => h.kasaGirisi === true)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
    },
    
    get hareketSayisi() {
      return raporVerisi.hareketler.length;
    }
  };
};

export default useKasaRaporu;