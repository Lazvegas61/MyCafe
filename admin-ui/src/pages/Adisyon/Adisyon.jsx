import React, { useEffect, useMemo, useState } from "react";
import "./Adisyon.css";
import syncService, { SYNC_EVENTS } from "../../services/syncService";

// LocalStorage key'leri - ESKİ KONSTANTLAR SİLİNDİ
// const MASA_KEY = "mc_masalar";     // syncService.oku('mc_masalar')
// const ADISYON_KEY = "mc_adisyonlar"; // syncService.oku('mc_adisyonlar')
// const URUN_KEY = "mc_urunler";      // syncService.oku('mc_urunler')
// const MUSTERI_KEY = "mc_musteriler"; // syncService.oku('mc_musteriler')
// const BORC_KEY = "mc_borclar";      // syncService.oku('mc_borclar')

export default function Adisyon() {
  // --------------------------------------------------
  // GENEL STATE
  // --------------------------------------------------
  const [masaNo, setMasaNo] = useState("MASA 1");
  const [adisyon, setAdisyon] = useState(null);
  const [gecenSure, setGecenSure] = useState("00:00");
  const [indirimInput, setIndirimInput] = useState("");
  const [indirim, setIndirim] = useState(0);
  const [toplam, setToplam] = useState(0);
  const [kalan, setKalan] = useState(0);
  const [aktifOdemeTipi, setAktifOdemeTipi] = useState("NAKIT");
  const [odemeInput, setOdemeInput] = useState("");
  const [kapanisMesaji, setKapanisMesaji] = useState("");
  const [islemMesaji, setIslemMesaji] = useState("");

  // MENÜ
  const [urunler, setUrunler] = useState([]);
  const [aktifKategori, setAktifKategori] = useState("");
  const [seciliUrun, setSeciliUrun] = useState(null);
  const [adetPanelAcik, setAdetPanelAcik] = useState(false);
  const [seciliOdemeAdisyonlari, setSeciliOdemeAdisyonlari] = useState([]);
  const [adet, setAdet] = useState(1);

  // SİPARİŞ YEMEK
  const [siparisYemekFiyat, setSiparisYemekFiyat] = useState("");
  const [siparisYemekNot, setSiparisYemekNot] = useState("");

  // MÜŞTERİ / HESABA YAZ
  const [musteriler, setMusteriler] = useState([]);
  const [seciliMusteriId, setSeciliMusteriId] = useState(null);
  const [yeniMusteriAdSoyad, setYeniMusteriAdSoyad] = useState("");
  const [yeniMusteriTelefon, setYeniMusteriTelefon] = useState("");
  const [yeniMusteriNot, setYeniMusteriNot] = useState("");

  const [borcTutarInput, setBorcTutarInput] = useState("");
  const [hesabaYazModu, setHesabaYazModu] = useState(false);
  const [odemeSozuPopup, setOdemeSozuPopup] = useState(null);

  // HESABI AYIR (SPLIT BILL)
  const [splitAdisyon, setSplitAdisyon] = useState(null);
  const [aktifAdisyon, setAktifAdisyon] = useState("ANA");

  // --------------------------------------------------
  // YARDIMCI HOOK'LAR
  // --------------------------------------------------
  useEffect(() => {
    if (islemMesaji) {
      const timer = setTimeout(() => setIslemMesaji(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [islemMesaji]);

  // ESKİ LOCALSTORAGE FONKSİYONLARI SİLİNDİ
  // --------------------------------------------------
  // LOCALSTORAGE YARDIMCI FONKSİYONLARI - SİLİNDİ
  // --------------------------------------------------
  // const okuJSON = (key, defaultValue) => { ... } - SİLİNDİ
  // const yazJSON = (key, value) => { ... } - SİLİNDİ
  // const guncelMasaLocal = () => { ... } - SİLİNDİ
  // const masaBosaltLocal = () => { ... } - SİLİNDİ
  // const guncelAdisyonLocal = () => { ... } - SİLİNDİ

  const odemeTipiLabel = (tip) => {
    switch (tip) {
      case "NAKIT":
        return "Nakit";
      case "KART":
        return "Kredi Kartı";
      case "HAVALE":
        return "Havale / EFT";
      case "HESABA_YAZ":
        return "Hesaba Yaz";
      default:
        return tip;
    }
  };

  const isBilardoMasa = (masaStr) => {
    if (!masaStr) return false;
    const upper = masaStr.toUpperCase();
    return upper.includes("BİLARDO") || upper.includes("BILARDO");
  };

  // --------------------------------------------------
  // URL'DEN MASA NUMARASINI AL
  // --------------------------------------------------
  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split("/");
    const masaId = parts[2] || "1";
    const masaLabel = `MASA ${masaId}`;
    setMasaNo(masaLabel);
    console.log("📍 Masa No ayarlandı:", masaLabel);
  }, []);

  // --------------------------------------------------
  // ADİSYON YÜKLE - syncService İLE
  // --------------------------------------------------
  useEffect(() => {
    if (!masaNo) return;
    
    console.log("🔄 Adisyon yükleniyor, masaNo:", masaNo);
    
    const adisyonlar = syncService.oku('mc_adisyonlar');
    
    // DEBUG: Tüm adisyonları logla
    console.log("📋 Tüm adisyonlar:", adisyonlar.map(a => ({
      id: a.id,
      masaNo: a.masaNo,
      isSplit: a.isSplit,
      kapali: a.kapali,
      kalemSayisi: a.kalemler?.length || 0
    })));
    
    // 1. Split adisyon kontrolü
    const acikSplitAdisyon = adisyonlar.find(
      (a) => a.masaNo === masaNo && !a.kapali && a.isSplit
    );
    
    let parentAnaAdisyon = null;
    if (acikSplitAdisyon) {
      parentAnaAdisyon = adisyonlar.find(
        (a) => a.id === acikSplitAdisyon.parentAdisyonId && !a.kapali
      );
    }
    
    // 2. Boş split'i kapat
    if (acikSplitAdisyon && (!parentAnaAdisyon || (parentAnaAdisyon.kalemler || []).length === 0)) {
      const guncelAdisyonlar = adisyonlar.map(a => {
        if (a.id === acikSplitAdisyon.id) {
          return {
            ...a,
            kapali: true,
            kapanisZamani: new Date().toISOString(),
            durum: "KAPALI"
          };
        }
        return a;
      });
      
      syncService.yaz('mc_adisyonlar', guncelAdisyonlar);
      
      let aktifAna = guncelAdisyonlar.find(
        (a) => a.masaNo === masaNo && !a.kapali && !a.isSplit
      );
      
      if (!aktifAna) {
        aktifAna = {
          id: Date.now().toString(),
          masaNo,
          acilisZamani: new Date().toISOString(),
          kapanisZamani: null,
          kalemler: [],
          odemeler: [],
          indirim: 0,
          hesabaYazKayitlari: [],
          kapali: false,
          isSplit: false,
          parentAdisyonId: null,
          durum: "AÇIK",
        };
        guncelAdisyonlar.push(aktifAna);
        syncService.yaz('mc_adisyonlar', guncelAdisyonlar);
      }
      
      setAdisyon(aktifAna);
      setSplitAdisyon(null);
      setAktifAdisyon("ANA");
      setSeciliOdemeAdisyonlari(["ANA"]);
      
      // MASALARI GÜNCELLE - syncService İLE
      syncService.guncelMasa(masaNo, aktifAna.id, null);
      
    } else {
      // 3. Ana Adisyonu Bul/Oluştur
      let aktifAna = adisyonlar.find(
        (a) => a.masaNo === masaNo && !a.kapali && !a.isSplit
      );

      if (!aktifAna) {
        aktifAna = {
          id: Date.now().toString(),
          masaNo,
          acilisZamani: new Date().toISOString(),
          kapanisZamani: null,
          kalemler: [],
          odemeler: [],
          indirim: 0,
          hesabaYazKayitlari: [],
          kapali: false,
          isSplit: false,
          parentAdisyonId: null,
          durum: "AÇIK",
        };
        adisyonlar.push(aktifAna);
        syncService.yaz('mc_adisyonlar', adisyonlar);
      }
      setAdisyon(aktifAna);

      // 4. Split Adisyonu Bul
      let aktifSplit = null;
      if (acikSplitAdisyon && parentAnaAdisyon) {
        aktifSplit = {
          ...acikSplitAdisyon,
          kalemler: acikSplitAdisyon.kalemler || [],
          odemeler: acikSplitAdisyon.odemeler || []
        };
      }
      
      setSplitAdisyon(aktifSplit || null);
      
      // Aktif adisyonu ayarla
      if (aktifSplit) {
        setAktifAdisyon("SPLIT");
        setSeciliOdemeAdisyonlari(["SPLIT"]);
      } else {
        setAktifAdisyon("ANA");
        setSeciliOdemeAdisyonlari(["ANA"]);
      }
      
      // MASALARI GÜNCELLE (İLK YÜKLEMEDE) - syncService İLE
      syncService.guncelMasa(masaNo, aktifAna.id, aktifSplit);
    }
  }, [masaNo]);

  // --------------------------------------------------
  // GEÇEN SÜRE HESAPLA - syncService İLE
  // --------------------------------------------------
  useEffect(() => {
    if (!masaNo) return;
    
    // syncService ile geçen süreyi hesapla
    const hesaplaSure = () => {
      const sure = syncService.hesaplaGecenSure(masaNo);
      setGecenSure(sure);
    };
    
    hesaplaSure();
    const timer = setInterval(hesaplaSure, 60000);
    
    return () => clearInterval(timer);
  }, [masaNo]);

  // MASA BİLGİLERİNİ DİNLE
  useEffect(() => {
    const handleMasaGuncellendi = (eventData) => {
      if (eventData.masaNo === Number(masaNo.replace("MASA ", ""))) {
        console.log("🔄 Masa güncellendi, geçen süre yeniden hesaplanıyor...");
        const sure = syncService.hesaplaGecenSure(masaNo);
        setGecenSure(sure);
      }
    };
    
    syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
    
    return () => {
      syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
    };
  }, [masaNo]);

  // --------------------------------------------------
  // MÜŞTERİ / BORÇ VERİLERİNİ YÜKLE - syncService İLE
  // --------------------------------------------------
  useEffect(() => {
    const mList = syncService.oku('mc_musteriler');
    setMusteriler(Array.isArray(mList) ? mList : []);
  }, []);

  // --------------------------------------------------
  // ADİSYON TOPLAM ve KALAN HESABI
  // --------------------------------------------------
  useEffect(() => {
    const adisyonListesi = [];
    if (seciliOdemeAdisyonlari.includes("ANA") && adisyon && !adisyon.kapali) {
        adisyonListesi.push({...adisyon, tip: "ANA"});
    }
    if (seciliOdemeAdisyonlari.includes("SPLIT") && splitAdisyon && !splitAdisyon.kapali) {
        adisyonListesi.push({...splitAdisyon, tip: "SPLIT"});
    }

    let toplamTutar = 0;
    let odemelerToplam = 0;
    let indirimMiktari = 0;

    adisyonListesi.forEach(a => {
        const satirToplam = (a.kalemler || []).reduce(
            (sum, k) => sum + (Number(k.toplam) || 0),
            0
        );
        const odemelerTutar = (a.odemeler || []).reduce(
            (sum, o) => sum + (Number(o.tutar) || 0),
            0
        );

        toplamTutar += satirToplam;
        odemelerToplam += odemelerTutar;

        if (a.tip === "ANA") {
            indirimMiktari += (indirim || 0);
        }
    });

    setToplam(toplamTutar);
    
    const kalanTutar = Math.max(
      toplamTutar - indirimMiktari - odemelerToplam,
      0
    );
    setKalan(kalanTutar);
  }, [adisyon, splitAdisyon, indirim, seciliOdemeAdisyonlari]);
  
  // İndirim değişikliğini ANA adisyona kaydet
  useEffect(() => {
    if(aktifAdisyon !== 'ANA' || !adisyon) return;
    const guncel = { ...adisyon, indirim: indirim };
    // ESKİ: guncelAdisyonLocal(guncel);
    // YENİ:
    syncService.guncelAdisyon(guncel);
  }, [indirim, adisyon, aktifAdisyon]);

  // --------------------------------------------------
  // MENÜ ÜRÜNLERİNİ YÜKLE - syncService İLE
  // --------------------------------------------------
  useEffect(() => {
    const list = syncService.oku('mc_urunler');

    const fixed = (Array.isArray(list) ? list : []).map(u => ({
      ...u,
      kategori: u.kategori || u.categoryName || u.kategoriAd || u.Kategori || "GENEL",
      ad: u.ad || u.name || u.UrunAdi || "",
      satis: Number(u.satis || u.salePrice || u.Fiyat || 0)
    }));

    setUrunler(fixed);
  }, [adisyon]);

  const kategoriler = useMemo(() => {
    const set = new Set();
    urunler.forEach((u) => {
      if (u.kategori) set.add(u.kategori);
    });
    set.add("SİPARİŞ YEMEK");
    const arr = Array.from(set);
    return arr.sort((a, b) => a.localeCompare(b, "tr"));
  }, [urunler]);

  useEffect(() => {
    if (!aktifKategori && kategoriler.length > 0) {
      setAktifKategori(kategoriler[0]);
    }
  }, [kategoriler, aktifKategori]);

  const filtreliUrunler = useMemo(() => {
    if (!aktifKategori) return [];
    if (aktifKategori === "SİPARİŞ YEMEK") {
      return [
        {
          id: "siparis-yemek",
          ad: "SİPARİŞ YEMEK",
          kategori: "SİPARİŞ YEMEK",
        },
      ];
    }
    return urunler.filter((u) => u.kategori === aktifKategori);
  }, [urunler, aktifKategori]);

  // --------------------------------------------------
  // ADİSYONA ÜRÜN EKLEME - syncService İLE
  // --------------------------------------------------
  const uruneTiklandi = (urun) => {
    // Hangi adisyona ekleneceğini belirle
    let targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    let setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    // Eğer targetAdisyon null ise ve split modundaysak, split adisyonu oluştur
    if (!targetAdisyon && aktifAdisyon === "SPLIT") {
      console.log("⚠️ Split adisyon yok, yeni oluşturuluyor...");
      const yeniSplitAdisyon = {
        id: Date.now().toString(),
        masaNo,
        acilisZamani: new Date().toISOString(),
        kapanisZamani: null,
        kalemler: [],
        odemeler: [],
        indirim: 0,
        hesabaYazKayitlari: [],
        kapali: false,
        isSplit: true,
        parentAdisyonId: adisyon ? adisyon.id : null,
        durum: "AÇIK",
      };
      setSplitAdisyon(yeniSplitAdisyon);
      targetAdisyon = yeniSplitAdisyon;
      setTargetAdisyon = setSplitAdisyon;
      
      // LocalStorage'a kaydet - syncService İLE
      syncService.guncelAdisyon(yeniSplitAdisyon);
    }
    
    if (!targetAdisyon) {
      console.error("❌ Hedef adisyon bulunamadı:", { aktifAdisyon, adisyon, splitAdisyon });
      setIslemMesaji("⚠️ Ürün eklemek için önce bir adisyon seçiniz.");
      return;
    }

    if (urun.kategori === "SİPARİŞ YEMEK") {
      setSeciliUrun(urun);
      setSiparisYemekFiyat("");
      setSiparisYemekNot("");
      setAdet(1);
      setAdetPanelAcik(true);
      return;
    }

    const mevcutKalemler = [...(targetAdisyon.kalemler || [])];
    const index = mevcutKalemler.findIndex(
      (k) =>
        k.urunId === urun.id &&
        Number(k.birimFiyat) === Number(urun.satis || 0)
    );

    if (index === -1) {
      const yeniKalem = {
        id: Date.now().toString(),
        urunId: urun.id,
        urunAd: urun.ad,
        adet: 1,
        birimFiyat: Number(urun.satis || 0),
        toplam: Number(urun.satis || 0),
      };
      mevcutKalemler.push(yeniKalem);
    } else {
      const kalem = { ...mevcutKalemler[index] };
      kalem.adet += 1;
      kalem.toplam = kalem.adet * kalem.birimFiyat;
      mevcutKalemler[index] = kalem;
    }

    const guncel = { ...targetAdisyon, kalemler: mevcutKalemler };
    setTargetAdisyon(guncel);
    
    // ESKİ: guncelAdisyonLocal(guncel);
    // YENİ:
    syncService.guncelAdisyon(guncel);
    
    console.log(`🛒 Ürün ${aktifAdisyon} adisyona eklendi, masa otomatik güncellenecek...`);
  };

  const adetPanelEkle = () => {
    if (!seciliUrun) return;
    
    // Hangi adisyona ekleneceğini belirle
    let targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    let setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) {
      console.error("❌ Hedef adisyon bulunamadı");
      return;
    }

    const f = Number(siparisYemekFiyat);
    if (!f || f <= 0) {
      alert("SİPARİŞ YEMEK için fiyat giriniz.");
      return;
    }

    const yeniKalem = {
      id: Date.now().toString(),
      urunId: seciliUrun.id,
      urunAd: "SİPARİŞ YEMEK",
      adet: adet,
      birimFiyat: f,
      toplam: f * adet,
      not: siparisYemekNot || "",
    };

    const guncel = {
      ...targetAdisyon,
      kalemler: [...(targetAdisyon.kalemler || []), yeniKalem],
    };
    setTargetAdisyon(guncel);
    
    // ESKİ: guncelAdisyonLocal(guncel);
    // YENİ:
    syncService.guncelAdisyon(guncel);

    setAdetPanelAcik(false);
    setSeciliUrun(null);
  };

  // --------------------------------------------------
  // SATIR SİLME ve ADET ARTIR/AZALT - syncService İLE
  // --------------------------------------------------
  const satirSil = (kalemId) => {
    const targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    const setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) return;
    if (!window.confirm(`Bu satırı ${aktifAdisyon === "ANA" ? "ANA" : "AYRILAN"} adisyondan silmek istediğinize emin misiniz?`)) return;

    const yeniKalemler = (targetAdisyon.kalemler || []).filter(
      (k) => k.id !== kalemId
    );
    const guncel = { ...targetAdisyon, kalemler: yeniKalemler };
    setTargetAdisyon(guncel);
    
    // ESKİ: guncelAdisyonLocal(guncel);
    // YENİ:
    syncService.guncelAdisyon(guncel);
  };

  const adetArtir = (kalemId) => {
    const targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    const setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) return;
    
    const yeniKalemler = (targetAdisyon.kalemler || []).map((k) => {
      if (k.id !== kalemId) return k;
      const yeniAdet = Number(k.adet || 0) + 1;
      return {
        ...k,
        adet: yeniAdet,
        toplam: yeniAdet * Number(k.birimFiyat || 0),
      };
    });
    const guncelAdisyon = { ...targetAdisyon, kalemler: yeniKalemler };
    
    setTargetAdisyon(guncelAdisyon);
    
    // ESKİ: guncelAdisyonLocal(guncelAdisyon);
    // YENİ:
    syncService.guncelAdisyon(guncelAdisyon);
  };

  const adetAzalt = (kalemId) => {
    const targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    const setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) return;

    const mevcutKalemler = targetAdisyon.kalemler || [];
    const yeniKalemler = mevcutKalemler
      .map((k) => {
        if (k.id !== kalemId) return k;
        const yeniAdet = Number(k.adet || 0) - 1;
        if (yeniAdet <= 0) {
          return null;
        }
        return {
          ...k,
          adet: yeniAdet,
          toplam: yeniAdet * Number(k.birimFiyat || 0),
        };
      })
      .filter(Boolean);

    const guncelAdisyon = { ...targetAdisyon, kalemler: yeniKalemler };
    setTargetAdisyon(guncelAdisyon);
    
    // ESKİ: guncelAdisyonLocal(guncelAdisyon);
    // YENİ:
    syncService.guncelAdisyon(guncelAdisyon);
  };

  // --------------------------------------------------
  // İNDİRİM
  // --------------------------------------------------
  const indirimEnter = (e) => {
    if (e.key !== "Enter") return;
    if(aktifAdisyon !== "ANA") {
        alert("İndirim sadece ANA adisyona uygulanabilir.");
        return;
    }
    const val = Number(indirimInput);
    if (isNaN(val) || val < 0) {
      alert("Geçerli bir indirim tutarı giriniz.");
      return;
    }
    setIndirim(val);
  };

  // --------------------------------------------------
  // ÖDEME SİLME - syncService İLE
  // --------------------------------------------------
  const odemeSil = (odemeId) => {
    const targetAdisyon = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
    const setTargetAdisyon = aktifAdisyon === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) return;
    if (!window.confirm("Bu ödemeyi silmek istediğinize emin misiniz?")) return;

    const yeniOdemeler = (targetAdisyon.odemeler || []).filter((o) => o.id !== odemeId);
    const yeniAdisyon = {
      ...targetAdisyon,
      odemeler: yeniOdemeler,
    };

    setTargetAdisyon(yeniAdisyon);
    
    // ESKİ: guncelAdisyonLocal(yeniAdisyon);
    // YENİ:
    syncService.guncelAdisyon(yeniAdisyon);
  };
  
  // --------------------------------------------------
  // İNDİRİM SIFIRLAMA
  // --------------------------------------------------
 const indirimSifirla = () => {
    if(!seciliOdemeAdisyonlari.includes("ANA")) return;
    setIndirim(0);
    setIndirimInput("");
  };

  // --------------------------------------------------
  // HESABA YAZ ÖZETİ - syncService İLE
  // --------------------------------------------------
  const mevcutBorcOzet = useMemo(() => {
    if (!seciliMusteriId) return { toplamBorc: 0, toplamOdeme: 0, kalan: 0 };
    const borclar = syncService.oku('mc_borclar');
    const musteriBorclari = borclar.filter((b) => b.musteriId === seciliMusteriId);
    
    const toplamBorc = musteriBorclari.reduce((sum, b) => 
        sum + b.hareketler.filter(h => h.tip === "BORÇ EKLENDİ").reduce((s, h) => s + (h.tutar || 0), 0)
    , 0);
    
    const toplamOdeme = musteriBorclari.reduce((sum, b) => 
        sum + b.hareketler.filter(h => h.tip === "ÖDEME ALINDI").reduce((s, h) => s + (h.tutar || 0), 0)
    , 0);

    return {
      toplamBorc: toplamBorc,
      toplamOdeme: toplamOdeme,
      kalan: toplamBorc - toplamOdeme,
    };
  }, [seciliMusteriId, hesabaYazModu, borcTutarInput]);

  // --------------------------------------------------
  // ÖDEME EKLEME - syncService İLE
  // --------------------------------------------------
const odemeEkle = () => {
    if (seciliOdemeAdisyonlari.length === 0) {
        setIslemMesaji("⚠️ Lütfen ödeme yapmak istediğiniz adisyonu/adisyonları seçiniz.");
        return;
    }
      
    if (aktifOdemeTipi === "HESABA_YAZ") {
        if (seciliOdemeAdisyonlari.length !== 1) {
            setIslemMesaji("⚠️ Hesaba Yaz işlemi için tek bir adisyon seçimi yapınız (ANA veya AYRILAN).");
            return;
        }
        setHesabaYazModu(true);
        setBorcTutarInput(String(kalan || 0));
        return;
    }

    let odemeTutar = Number(odemeInput);
    if (!odemeTutar || odemeTutar <= 0) {
      odemeTutar = kalan;
    }

    if (odemeTutar <= 0) {
      setIslemMesaji("⚠️ Ödeme yapılacak tutar yok.");
      return;
    }
    
    let kalanOdeme = odemeTutar;
    
    const odemeHedefleri = [];
    if (seciliOdemeAdisyonlari.includes("ANA") && adisyon) {
        odemeHedefleri.push({ tip: "ANA", adisyon: adisyon, setAdisyon: setAdisyon });
    }
    if (seciliOdemeAdisyonlari.includes("SPLIT") && splitAdisyon) {
        odemeHedefleri.push({ tip: "SPLIT", adisyon: splitAdisyon, setAdisyon: setSplitAdisyon });
    }
    
    const hesaplaAdisyonKalan = (adisyonData, tip) => {
        const satirToplam = (adisyonData.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        const odemelerToplam = (adisyonData.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);
        const indirimMiktari = tip === "ANA" ? (indirim || 0) : 0;
        return Math.max(satirToplam - indirimMiktari - odemelerToplam, 0);
    };
    
    odemeHedefleri.forEach(h => {
        h.kalan = hesaplaAdisyonKalan(h.adisyon, h.tip);
    });
    
    const odemeBekleyenHedefler = odemeHedefleri.filter(h => h.kalan > 0);
    const toplamSeciliKalan = odemeBekleyenHedefler.reduce((sum, h) => sum + h.kalan, 0);
    
    odemeBekleyenHedefler.forEach((h, index) => {
        if (kalanOdeme <= 0) return;

        let uygulanacakTutar;
        
        if (odemeTutar >= toplamSeciliKalan) {
             uygulanacakTutar = h.kalan;
        } else {
             const oransalPay = h.kalan / toplamSeciliKalan;
             uygulanacakTutar = odemeTutar * oransalPay;
        }
        
        if (index === odemeBekleyenHedefler.length - 1) {
             uygulanacakTutar = kalanOdeme; 
        } else {
             uygulanacakTutar = Math.min(h.kalan, uygulanacakTutar);
        }
        
        if (uygulanacakTutar <= 0) return;
        
        const yeniOdeme = {
          id: Date.now().toString() + h.tip + Math.random().toFixed(4),
          tip: aktifOdemeTipi,
          tutar: uygulanacakTutar,
          isSplit: h.tip === "SPLIT",
        };

        const yeniAdisyon = {
          ...h.adisyon,
          odemeler: [...(h.adisyon.odemeler || []), yeniOdeme],
        };
        
        h.setAdisyon(yeniAdisyon);
        
        // ESKİ: guncelAdisyonLocal(yeniAdisyon);
        // YENİ:
        syncService.guncelAdisyon(yeniAdisyon);
        
        kalanOdeme -= uygulanacakTutar;
    });
    
    if (kalanOdeme > 0.01) {
        setIslemMesaji(`💵 Para üstü: ${kalanOdeme.toFixed(2)} TL.`);
    } else {
        setIslemMesaji(`✅ Ödeme başarıyla eklendi. Kalan: ${kalan.toFixed(2)} TL`);
    }

    setOdemeInput("");
  };

  // --------------------------------------------------
  // HESABA YAZ KAYDET - syncService İLE
  // --------------------------------------------------
const hesabaYazKaydet = () => {
    if (seciliOdemeAdisyonlari.length !== 1) {
        setIslemMesaji("⚠️ HESABA YAZ kaydı için tek bir adisyon seçilmelidir. Lütfen tekrar deneyiniz.");
        setHesabaYazModu(false);
        return;
    }
    
    const seciliTip = seciliOdemeAdisyonlari[0];
    const targetAdisyon = seciliTip === "ANA" ? adisyon : splitAdisyon;
    const setTargetAdisyon = seciliTip === "ANA" ? setAdisyon : setSplitAdisyon;
    
    if (!targetAdisyon) return;

    let borcTutar = Number(borcTutarInput);
    if (!borcTutar || borcTutar <= 0) {
      setIslemMesaji("⚠️ Borç tutarı giriniz.");
      return;
    }

    let guncelMusteriler = [...musteriler];
    let musteriId = seciliMusteriId;

    if (!musteriId) {
      if (!yeniMusteriAdSoyad) {
        setIslemMesaji("⚠️ Yeni müşteri için Ad Soyad giriniz.");
        return;
      }
      const yeniId = Date.now().toString();
      const yeniMusteri = {
        id: yeniId,
        adSoyad: yeniMusteriAdSoyad,
        telefon: yeniMusteriTelefon,
        not: yeniMusteriNot,
      };
      guncelMusteriler.push(yeniMusteri);
      musteriId = yeniId;
    }

    const borclar = syncService.oku('mc_borclar');
    const yeniBorc = {
      id: Date.now().toString(),
      musteriId,
      masaNo,
      adisyonId: targetAdisyon.id,
      tutar: borcTutar,
      acilisZamani: targetAdisyon.acilisZamani,
      kapanisZamani: targetAdisyon.kapanisZamani,
      odemeSozu: null,
      hatirlatildi: false,
      hareketler: [
        {
          tip: "BORÇ EKLENDİ",
          tutar: borcTutar,
          tarih: new Date().toISOString(),
          aciklama: `Hesaba Yaz - ${masaNo} (${seciliTip})`,
        },
      ],
    };
    borclar.push(yeniBorc);
    syncService.yaz('mc_borclar', borclar);

    const yeniOdeme = {
      id: `hy_${Date.now().toString()}`,
      tip: "HESABA_YAZ",
      tutar: borcTutar,
      isSplit: seciliTip === "SPLIT",
    };

    const guncelAdisyon = {
      ...targetAdisyon,
      hesabaYazKayitlari: [
        ...(targetAdisyon.hesabaYazKayitlari || []),
        { borcId: yeniBorc.id, musteriId },
      ],
      odemeler: [...(targetAdisyon.odemeler || []), yeniOdeme],
    };
    setTargetAdisyon(guncelAdisyon);
    
    // ESKİ: guncelAdisyonLocal(guncelAdisyon);
    // YENİ:
    syncService.guncelAdisyon(guncelAdisyon);

    syncService.yaz('mc_musteriler', guncelMusteriler);
    setMusteriler(guncelMusteriler);
    
    setIslemMesaji(`📝 Borç başarıyla kaydedildi: ${borcTutar.toFixed(2)} TL (${seciliTip}).`);
    setHesabaYazModu(false);
  };

  // --------------------------------------------------
  // HESABI AYIR (Split) - syncService İLE
  // --------------------------------------------------
 const hesabiAyir = () => {
    if (!adisyon || (adisyon.kalemler || []).length === 0) {
        setIslemMesaji("⚠️ Adisyon üzerinde ürün olmadan ayırma işlemi başlatılamaz.");
        return;
    }
    if(splitAdisyon) {
        setIslemMesaji("⚠️ Masa üzerinde zaten ayırılmış bir adisyon var. Lütfen önce onu kapatın.");
        return;
    }
    
    // MEVCUT ürünleri al
    const mevcutKalemler = [...(adisyon.kalemler || [])];
    
    console.log("✂️ Split yapılıyor...", {
      orijinalKalemSayisi: mevcutKalemler.length,
      masaNo: masaNo,
      anaAdisyonId: adisyon.id
    });
    
    // YENİ split adisyon oluştur
    const yeniSplitAdisyon = {
        id: Date.now().toString(),
        masaNo: masaNo,
        acilisZamani: new Date().toISOString(),
        kapanisZamani: null,
        kalemler: mevcutKalemler.map(k => ({ 
            ...k, 
            id: `${k.id}_split_${Date.now()}`,
        })), 
        odemeler: [],
        indirim: 0,
        hesabaYazKayitlari: [],
        kapali: false,
        isSplit: true,
        parentAdisyonId: adisyon.id,
        durum: "AÇIK",
    };
    
    // Ana adisyonu temizle (sadece kalemler)
    const guncelAnaAdisyon = { 
        ...adisyon, 
        kalemler: [],
    }; 
    
    // ÖNCE STATE'İ GÜNCELLE
    setAdisyon(guncelAnaAdisyon);
    setSplitAdisyon(yeniSplitAdisyon);

    // SONRA LOCALSTORAGE'İ GÜNCELLE - syncService İLE
    let adisyonlar = syncService.oku('mc_adisyonlar');
    
    // 1. Ana adisyonu güncelle
    const anaIdx = adisyonlar.findIndex(a => a.id === adisyon.id);
    if(anaIdx !== -1) {
        adisyonlar[anaIdx] = guncelAnaAdisyon;
    }
    
    // 2. Split adisyonu ekle
    adisyonlar.push(yeniSplitAdisyon);
    syncService.yaz('mc_adisyonlar', adisyonlar);
    
    console.log("📦 Adisyonlar güncellendi:", {
      anaAdisyon: guncelAnaAdisyon,
      splitAdisyon: yeniSplitAdisyon,
      toplamAdisyonSayisi: adisyonlar.length
    });
    
    // 3. MASALARI GÜNCELLE - syncService İLE
    console.log("🔄 Split yapıldı, masa güncelleniyor...");
    console.log("📊 Güncelleme verileri:", {
        masaNo: masaNo,
        anaAdisyonId: guncelAnaAdisyon.id,
        splitAdisyon: yeniSplitAdisyon,
        anaKalemSayisi: guncelAnaAdisyon.kalemler?.length || 0,
        splitKalemSayisi: yeniSplitAdisyon.kalemler?.length || 0
    });
    
    const guncellemeSonucu = syncService.guncelMasa(masaNo, guncelAnaAdisyon.id, yeniSplitAdisyon);
    
    if (guncellemeSonucu) {
        console.log("✅ Masa başarıyla güncellendi");
    } else {
        console.error("❌ Masa güncellemesi başarısız");
    }

    // UI STATE'İNİ GÜNCELLE
    setAktifAdisyon("SPLIT");
    setSeciliOdemeAdisyonlari(["SPLIT"]);
    setIslemMesaji("✅ Hesap başarıyla ayrıldı. Tüm ürünler yeni fişe aktarıldı.");
    
    // DEBUG: State'leri kontrol et
    setTimeout(() => {
        console.log("🔍 Split sonrası state kontrolü:", {
            adisyon: adisyon,
            splitAdisyon: splitAdisyon,
            aktifAdisyon: aktifAdisyon,
            localStorageAdisyonlar: syncService.oku('mc_adisyonlar').length,
            localStorageMasalar: syncService.oku('mc_masalar')
        });
    }, 100);
  };

  // --------------------------------------------------
  // ADİSYON KAPAT - syncService İLE
  // --------------------------------------------------
const adisyonKapat = () => {
    if (seciliOdemeAdisyonlari.length === 0) {
        setIslemMesaji("⚠️ Lütfen kapatmak istediğiniz adisyonu/adisyonları seçiniz.");
        return;
    }

    const yenidenHesaplaKalan = () => {
        let toplamKalan = 0;
        
        if (seciliOdemeAdisyonlari.includes("ANA") && adisyon && !adisyon.kapali) {
            const anaToplam = (adisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
            const anaOdemeler = (adisyon.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);
            toplamKalan += Math.max(anaToplam - (indirim || 0) - anaOdemeler, 0);
        }
        
        if (seciliOdemeAdisyonlari.includes("SPLIT") && splitAdisyon && !splitAdisyon.kapali) {
            const splitToplam = (splitAdisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
            const splitOdemeler = (splitAdisyon.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);
            toplamKalan += Math.max(splitToplam - splitOdemeler, 0);
        }
        
        return toplamKalan;
    };

    const gercekKalan = yenidenHesaplaKalan();

    if (gercekKalan > 0.1) { 
        setIslemMesaji(`⚠️ Kalan tutar ödenmeden adisyon(lar) kapatılamaz. (Kalan: ${gercekKalan.toFixed(2)} TL)`);
        return;
    }
    
    const adisyonlarKapatilacak = [];
    if (seciliOdemeAdisyonlari.includes("ANA") && adisyon && !adisyon.kapali) {
        adisyonlarKapatilacak.push({ data: adisyon, tip: "ANA" });
    }
    if (seciliOdemeAdisyonlari.includes("SPLIT") && splitAdisyon && !splitAdisyon.kapali) {
        adisyonlarKapatilacak.push({ data: splitAdisyon, tip: "SPLIT" });
    }
    
    if (adisyonlarKapatilacak.length === 0) {
        setIslemMesaji("⚠️ Kapatılacak açık adisyon bulunamadı.");
        return;
    }

    const onayMesaji = adisyonlarKapatilacak.length === 2 
        ? "ANA ve AYRILAN adisyonları kapatmak istediğinize emin misiniz?"
        : adisyonlarKapatilacak[0].tip === "ANA"
        ? "ANA adisyonu kapatmak istediğinize emin misiniz?"
        : "AYRILAN adisyonu kapatmak istediğinize emin misiniz?";
    
    if (!window.confirm(onayMesaji)) {
        return;
    }

    const adisyonlar = syncService.oku('mc_adisyonlar');
    let isSplitKapatildi = false;
    let isAnaKapatildi = false;

    adisyonlarKapatilacak.forEach(aktifAdisyonObj => {
        const targetAdisyon = aktifAdisyonObj.data;
        const tip = aktifAdisyonObj.tip;

        const idx = adisyonlar.findIndex((a) => a.id === targetAdisyon.id);

        if (idx !== -1) {
          const guncelAdisyon = {
            ...targetAdisyon,
            kapali: true,
            kapanisZamani: new Date().toISOString(),
            durum: "KAPALI"
          };
          adisyonlar[idx] = guncelAdisyon;
          
          if (tip === "ANA") {
              isAnaKapatildi = true;
          } else if (tip === "SPLIT") {
              isSplitKapatildi = true;
          }
        }
    });

    syncService.yaz('mc_adisyonlar', adisyonlar);

    if (isSplitKapatildi) {
        setSplitAdisyon(null); 
    }
    
    if (isAnaKapatildi) {
        // ESKİ: masaBosaltLocal(masaNo);
        // YENİ:
        syncService.masaBosalt(masaNo);
        setAdisyon(null);
    } else {
        // ESKİ: guncelMasaLocal(masaNo, adisyon ? adisyon.id : null, isSplitKapatildi ? null : splitAdisyon);
        // YENİ:
        syncService.guncelMasa(masaNo, adisyon ? adisyon.id : null, isSplitKapatildi ? null : splitAdisyon);
    }
    
    // Event'leri tetikle
    syncService.emitEvent(SYNC_EVENTS.ADİSYON_GUNCELLENDI, {});
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: Number(masaNo.replace("MASA ", ""))
    });
    
    setIslemMesaji(`✅ Adisyon(lar) başarıyla kapatıldı. Masalara yönlendiriliyorsunuz...`);
    
    setTimeout(() => {
        const query = new URLSearchParams().toString();
        
        if (isBilardoMasa(masaNo)) {
          window.location.href = query ? `/bilardo?${query}` : "/bilardo";
        } else {
          window.location.href = query ? `/masalar?${query}` : "/masalar";
        }
    }, 1000);
};

  // --------------------------------------------------
  // MASAYA DÖN
  // --------------------------------------------------
  const masayaDon = () => {
    const isRedirectingAfterClosure = !!kapanisMesaji;
    
    if (isRedirectingAfterClosure) {
        setKapanisMesaji("");
    }

    const query = new URLSearchParams().toString();
    
    if (isBilardoMasa(masaNo)) {
      window.location.href = query ? `/bilardo?${query}` : "/bilardo";
    } else {
      window.location.href = query ? `/masalar?${query}` : "/masalar";
    }
  };

  // --------------------------------------------------
  // HESAPLAMALAR
  // --------------------------------------------------
  const hesaplaAdisyonTutari = (adisyonData) => {
    if (!adisyonData) return 0;
    return (adisyonData.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
  };

  const hesaplaAdisyonKalan = (adisyonData, tip) => {
    if (!adisyonData) return 0;
    const satirToplam = hesaplaAdisyonTutari(adisyonData);
    const odemelerToplam = (adisyonData.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);
    const indirimMiktari = tip === "ANA" ? (indirim || 0) : 0;
    return Math.max(satirToplam - indirimMiktari - odemelerToplam, 0);
  };

  // Ana ve Ayrı hesap tutarları
  const anaHesapToplam = useMemo(() => hesaplaAdisyonTutari(adisyon), [adisyon]);
  const ayriHesapToplam = useMemo(() => hesaplaAdisyonTutari(splitAdisyon), [splitAdisyon]);
  const anaHesapKalan = useMemo(() => hesaplaAdisyonKalan(adisyon, "ANA"), [adisyon, indirim]);
  const ayriHesapKalan = useMemo(() => hesaplaAdisyonKalan(splitAdisyon, "SPLIT"), [splitAdisyon]);

  // --------------------------------------------------
  // RENDER - GÜNCELLENMİŞ: AKTİF ADİSYON GÖSTERGESİ EKLENDİ
  // --------------------------------------------------
  const aktifAdisyonData = aktifAdisyon === "ANA" ? adisyon : splitAdisyon;
  const kalanTotal = kalan;
  
  const toggleOdemeAdisyonSecimi = (tip) => {
      setSeciliOdemeAdisyonlari(prev => {
          if (prev.includes(tip)) {
              return prev.filter(t => t !== tip);
          } else {
              return [...prev, tip];
          }
      });
  };
  
  const setAktifAdisyonGoster = (tip) => {
    if(tip === 'ANA' && adisyon && !adisyon.kapali) {
        setAktifAdisyon('ANA');
    } else if (tip === 'SPLIT' && splitAdisyon && !splitAdisyon.kapali) {
        setAktifAdisyon('SPLIT');
    }
  };

  // DEBUG: Masa güncellemesini izle
  useEffect(() => {
    console.log("🔍 DEBUG: Masa No:", masaNo);
    console.log("🔍 DEBUG: Adisyon:", adisyon);
    console.log("🔍 DEBUG: Split Adisyon:", splitAdisyon);
    
    // Sayfa yüklendiğinde masa güncelle
    if (adisyon && adisyon.id) {
      console.log("🔄 Sayfa yüklendi, masa güncelleniyor...");
      syncService.guncelMasa(masaNo, adisyon.id, splitAdisyon);
    }
  }, [masaNo, adisyon?.id, splitAdisyon?.id]);

  // MASA GEÇEN SÜRE GÖSTERİMİ
  useEffect(() => {
    if (masaNo) {
      const sure = syncService.hesaplaGecenSure(masaNo);
      setGecenSure(sure);
    }
  }, [masaNo]);

  return (
    <div className="adisyon-container">
      {/* SÜTUN 1: SOL PANEL – ÖDEMELER & KONTROLLER */}
      <div className="sol-panel">
        <div>
          {/* GEÇEN SÜRE GÖSTERGESİ */}
          <div className="gecen-sure-gostergesi">
            <div className="gecen-sure-label">GEÇEN SÜRE</div>
            <div className="gecen-sure-deger">{gecenSure}</div>
          </div>

          {/* TOPLAM / KALAN ALANI */}
          <div className="odeme-kontrol">
            <div className="odeme-kontrol-title">
              ÖDEME KONTROL
            </div>
            
            {/* ADİSYON SEÇİMİ (ÖDEME İÇİN) */}
            <div className="adisyon-secim">
              <button
                onClick={() => toggleOdemeAdisyonSecimi("ANA")}
                onDoubleClick={() => setAktifAdisyonGoster("ANA")}
                className={`adisyon-secim-btn ${seciliOdemeAdisyonlari.includes("ANA") ? "secili" : ""}`}
                disabled={!adisyon || adisyon.kapali}
              >
                {seciliOdemeAdisyonlari.includes("ANA") ? "✔️ ANA HESAP" : "ANA HESAP"}
              </button>
              
              {splitAdisyon && !splitAdisyon.kapali && (
                <button
                  onClick={() => toggleOdemeAdisyonSecimi("SPLIT")}
                  onDoubleClick={() => setAktifAdisyonGoster("SPLIT")}
                  className={`adisyon-secim-btn ${seciliOdemeAdisyonlari.includes("SPLIT") ? "secili" : ""}`}
                  disabled={!splitAdisyon || splitAdisyon.kapali}
                >
                  {seciliOdemeAdisyonlari.includes("SPLIT") ? "✔️ AYRI HESAP" : "AYRI HESAP"}
                </button>
              )}
            </div>

            {/* AKTİF ADİSYON GÖSTERGESİ */}
            <div className="aktif-adisyon-gostergesi">
              <div className="aktif-label">AKTİF FİŞ:</div>
              <div className={`aktif-deger ${aktifAdisyon === "ANA" ? "ana-aktif" : "split-aktif"}`}>
                {aktifAdisyon === "ANA" ? "ANA HESAP" : "AYRI HESAP"}
              </div>
            </div>

            <div className="hesap-bilgi">
              <span className="hesap-label">Ana Hesap:</span>
              <span className="hesap-tutar">{anaHesapToplam.toFixed(2)} TL</span>
            </div>
            {splitAdisyon && !splitAdisyon.kapali && (
              <div className="hesap-bilgi">
                <span className="hesap-label">Ayrı Hesap:</span>
                <span className="hesap-tutar">{ayriHesapToplam.toFixed(2)} TL</span>
              </div>
            )}
            <div className="toplam-bilgi">
              <span className="toplam-label">Toplam Tutar:</span>
              <span className="toplam-tutar">{toplam.toFixed(2)} TL</span>
            </div>
            <div className="kalan-bilgi">
              <span className="kalan-label">KALAN (SEÇİLİ)</span>
              <span className="kalan-tutar">{kalanTotal.toFixed(2)} TL</span>
            </div>
          </div>

          {/* ÖDEME TİPİ SEÇİMİ */}
          <div className="odeme-tipi-secim">
            {[
              { tip: "NAKIT", etiket: "Nakit" },
              { tip: "KART", etiket: "K.Kartı" },
              { tip: "HAVALE", etiket: "Havale" },
              { tip: "HESABA_YAZ", etiket: "Hesaba Yaz" },
            ].map((o) => (
              <button
                key={o.tip}
                onClick={() => setAktifOdemeTipi(o.tip)}
                className={`odeme-tipi-btn ${aktifOdemeTipi === o.tip ? "aktif" : ""}`}
              >
                {o.etiket}
              </button>
            ))}
          </div>

          {/* ÖDEME TUTARI */}
          {aktifOdemeTipi !== "HESABA_YAZ" && (
            <>
              <div className="odeme-tutar-input">
                <label>Tutar</label>
                <input
                  type="number"
                  value={odemeInput}
                  onChange={(e) => setOdemeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") odemeEkle();
                  }}
                  placeholder={kalanTotal.toFixed(2)}
                  className="tutar-input"
                />
              </div>
              <button
                onClick={odemeEkle}
                disabled={seciliOdemeAdisyonlari.length === 0}
                className={`odeme-ekle-btn ${seciliOdemeAdisyonlari.length > 0 ? "aktif" : "pasif"}`}
              >
                ÖDEME EKLE
              </button>
            </>
          )}

          {/* İNDİRİM */}
          <div className="indirim-alani">
            <label>İndirim (Enter ile uygula)</label>
            <div className="indirim-input-group">
              <input
                type="number"
                value={indirimInput}
                onChange={(e) => setIndirimInput(e.target.value)}
                onKeyDown={indirimEnter}
                disabled={!seciliOdemeAdisyonlari.includes("ANA")}
                className={`indirim-input ${!seciliOdemeAdisyonlari.includes("ANA") ? "pasif" : ""}`}
              />
              {seciliOdemeAdisyonlari.includes("ANA") && (
                <button
                  onClick={indirimSifirla}
                  className="indirim-sifirla-btn"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ALT BUTONLAR */}
        <div className="alt-butonlar">
          <button
            onClick={hesabiAyir}
            disabled={!adisyon || (adisyon.kalemler || []).length === 0 || !!splitAdisyon}
            className={`hesap-ayir-btn ${!adisyon || (adisyon.kalemler || []).length === 0 || !!splitAdisyon ? "pasif" : "aktif"}`}
          >
            HESABI AYIR ✂️ (Tümünü)
          </button>

          <button
            onClick={adisyonKapat}
            className={`kapat-btn ${seciliOdemeAdisyonlari.length > 0 ? "aktif" : "pasif"}`}
            disabled={seciliOdemeAdisyonlari.length === 0}
          >
            {seciliOdemeAdisyonlari.length === 2 ? "FİŞLERİ KAPAT" : 
             (seciliOdemeAdisyonlari.includes("ANA") ? "MASAYI KAPAT" : 
             (seciliOdemeAdisyonlari.includes("SPLIT") ? "AYRI FİŞİ KAPAT" : "KAPAT"))}
          </button>

          <button
            onClick={masayaDon}
            className="masaya-don-btn"
          >
            MASAYA DÖN
          </button>
        </div>
      </div>

      {/* SÜTUN 2: ORTA PANEL – ADİSYON / HESABA YAZ */}
      <div className="orta-panel">
        <div className="masa-title">
          {masaNo} - ADİSYON
          <span className="aktif-adisyon-badge">
            {aktifAdisyon === "ANA" ? "ANA HESAP" : "AYRI HESAP"}
          </span>
        </div>

        {hesabaYazModu ? (
          <div className="hesaba-yaz-modu">
            <div className="hesaba-yaz-title">
              HESABA YAZ (VERESİYE)
            </div>

            <div className="hesaba-yaz-grid">
              <div>
                <div className="musteri-secim">
                  <div className="musteri-label">Mevcut Müşteri</div>
                  <select
                    value={seciliMusteriId || ""}
                    onChange={(e) => setSeciliMusteriId(e.target.value || null)}
                    className="musteri-select"
                  >
                    <option value="">Seçiniz</option>
                    {musteriler.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.adSoyad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="yeni-musteri">
                  <div className="musteri-label">Yeni Müşteri</div>
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={yeniMusteriAdSoyad}
                    onChange={(e) => setYeniMusteriAdSoyad(e.target.value)}
                    className="musteri-input"
                  />
                  <input
                    type="text"
                    placeholder="Telefon"
                    value={yeniMusteriTelefon}
                    onChange={(e) => setYeniMusteriTelefon(e.target.value)}
                    className="musteri-input"
                  />
                  <input
                    type="text"
                    placeholder="Not"
                    value={yeniMusteriNot}
                    onChange={(e) => setYeniMusteriNot(e.target.value)}
                    className="musteri-input"
                  />
                </div>
              </div>

              <div>
                <div className="borc-tutar">
                  <label>Borç Tutarı</label>
                  <input
                    type="number"
                    value={borcTutarInput}
                    onChange={(e) => setBorcTutarInput(e.target.value)}
                    className="borc-input"
                  />
                </div>

                {seciliMusteriId && (
                  <div className="mevcut-borc">
                    <div className="borc-baslik">
                      Mevcut Borç Özeti
                    </div>
                    <div className="borc-satir">
                      <span>Toplam Borç:</span>
                      <b>{mevcutBorcOzet.toplamBorc.toFixed(2)} TL</b>
                    </div>
                    <div className="borc-satir">
                      <span>Toplam Ödeme:</span>
                      <b>{mevcutBorcOzet.toplamOdeme.toFixed(2)} TL</b>
                    </div>
                    <div className="net-borc">
                      <span>Net Borç:</span>
                      <span className={`${mevcutBorcOzet.kalan > 0 ? "borclu" : "borcsuz"}`}>
                        {mevcutBorcOzet.kalan.toFixed(2)} TL
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={hesabaYazKaydet}
                  disabled={!seciliMusteriId && !yeniMusteriAdSoyad}
                  className={`borc-kaydet-btn ${!seciliMusteriId && !yeniMusteriAdSoyad ? "pasif" : "aktif"}`}
                >
                  BORCU KAYDET
                </button>
                <button
                  onClick={() => setHesabaYazModu(false)}
                  className="iptal-btn"
                >
                  İPTAL
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="adisyon-icerik">
            <div className="kalemler-tablosu">
              <table className="siparis-tablosu">
                <thead>
                  <tr>
                    <th className="urun-ad-th">Ürün Adı</th>
                    <th className="adet-th">Adet</th>
                    <th className="tutar-th">Tutar</th>
                    <th className="islem-th">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {((aktifAdisyonData?.kalemler) || []).map((k) => (
                    <tr key={k.id} className="kalem-satir">
                      <td className="urun-ad-td">
                        {k.urunAd}
                        {k.not && k.urunAd === "SİPARİŞ YEMEK" && (
                          <div className="urun-not">
                            Not: {k.not}
                          </div>
                        )}
                        <span className="birim-fiyat">
                          ({Number(k.birimFiyat || 0).toFixed(2)} TL)
                        </span>
                      </td>
                      <td className="adet-td">
                        <div className="adet-kontrol">
                          <button
                            onClick={() => adetAzalt(k.id)}
                            className="adet-azalt-btn"
                          >
                            -
                          </button>
                          <span>{k.adet}</span>
                          <button
                            onClick={() => adetArtir(k.id)}
                            className="adet-artir-btn"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="tutar-td">
                        {Number(k.toplam || 0).toFixed(2)}
                      </td>
                      <td className="islem-td">
                        <button
                          onClick={() => satirSil(k.id)}
                          className="sil-btn"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {((aktifAdisyonData?.kalemler) || []).length === 0 && (
                <div className="bos-kalem">
                  {aktifAdisyon === "ANA"
                    ? "Adisyon üzerinde ürün bulunmamaktadır."
                    : "Ayrılan adisyon üzerinde ürün bulunmamaktadır. Ana adisyona geçiniz."}
                </div>
              )}
            </div>
            
            <div className="odeme-hareketleri">
                <div className="odeme-hareketleri-title">
                    ÖDEME HAREKETLERİ
                </div>
                <div className="odeme-listesi">
                    {indirim > 0 && aktifAdisyon === "ANA" && (
                      <div className="indirim-kalem">
                        <span className="indirim-label">
                          İNDİRİM
                        </span>
                        <div className="indirim-deger">
                          <span className="indirim-tutar">
                            -{indirim.toFixed(2)} TL
                          </span>
                        </div>
                      </div>
                    )}
                    {((aktifAdisyonData?.odemeler) || []).length === 0 ? (
                        <div className="bos-odeme">
                            Henüz ödeme hareketi yok.
                        </div>
                    ) : (
                        ((aktifAdisyonData?.odemeler) || []).map((o) => (
                            <div
                                key={o.id}
                                className="odeme-kalem"
                            >
                                <span className="odeme-tipi">
                                    {odemeTipiLabel(o.tip)}
                                </span>
                                <div className="odeme-islem">
                                    <span className="odeme-tutar">
                                        {Number(o.tutar || 0).toFixed(2)} TL
                                    </span>
                                    <button
                                        onClick={() => odemeSil(o.id)}
                                        className="odeme-sil-btn"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* SÜTUN 3: SAĞ 1 PANEL – MENÜ */}
      <div className="urun-panel">
        <div className="urun-panel-title">
          MENÜ (Ürünler)
          <div className="urun-panel-bilgi">
            Aktif Fiş: <span className={`aktif-bilgi ${aktifAdisyon === "ANA" ? "ana-bilgi" : "split-bilgi"}`}>
              {aktifAdisyon === "ANA" ? "ANA" : "AYRI"}
            </span>
          </div>
        </div>
        
        <div className="urun-listesi">
          {filtreliUrunler.length === 0 ? (
            <div className="bos-urun">Bu kategoride ürün yok.</div>
          ) : (
            <div className="urun-grid">
              {filtreliUrunler.map((u) => (
                <button
                  key={u.id}
                  onClick={() => uruneTiklandi(u)}
                  className={`urun-btn aktif`}
                  title={u.ad}
                >
                  <div className="urun-adi">
                    {u.ad}
                  </div>
                  <span className="urun-fiyat">
                    {u.satis ? u.satis.toFixed(2) : "0.00"} TL
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {adetPanelAcik && (
          <div className="adet-panel">
            <div className="adet-panel-baslik">
              {seciliUrun.ad}
              <div className="adet-panel-bilgi">
                Fiş: {aktifAdisyon === "ANA" ? "ANA" : "AYRI"}
              </div>
            </div>
            {seciliUrun.id === "siparis-yemek" && (
              <>
                <div className="adet-input-group">
                  <label>Fiyat (TL)</label>
                  <input
                    type="number"
                    value={siparisYemekFiyat}
                    onChange={(e) => setSiparisYemekFiyat(e.target.value)}
                    className="adet-input"
                  />
                </div>
                <div className="adet-input-group">
                  <label>Not</label>
                  <input
                    type="text"
                    value={siparisYemekNot}
                    onChange={(e) => setSiparisYemekNot(e.target.value)}
                    placeholder="Ekstra not"
                    className="adet-input"
                  />
                </div>
              </>
            )}
            <div className="adet-kontrol-grup">
              <label>Adet</label>
              <div className="adet-dugme-grup">
                <button
                  onClick={() => setAdet(Math.max(1, adet - 1))}
                  className="adet-dugme"
                >
                  -
                </button>
                <span className="adet-deger">{adet}</span>
                <button
                  onClick={() => setAdet(adet + 1)}
                  className="adet-dugme"
                >
                  +
                </button>
              </div>
            </div>
            <div className="adet-panel-butonlar">
              <button
                onClick={adetPanelEkle}
                className="adet-ekle-btn"
              >
                EKLE
              </button>
              <button
                onClick={() => {
                  setAdetPanelAcik(false);
                  setSeciliUrun(null);
                }}
                className="adet-iptal-btn"
              >
                İPTAL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SÜTUN 4: SAĞ 2 PANEL – KATEGORİLER */}
      <div className="kategori-panel">
        <div className="kategori-panel-title">
          KATEGORİLER
        </div>
        <div className="kategori-grid">
          {kategoriler.map((kat) => (
            <button
              key={kat}
              onClick={() => setAktifKategori(kat)}
              className={`kategori-btn ${aktifKategori === kat ? "aktif" : ""}`}
              title={kat}
            >
              <div className="kategori-adi">
                {kat}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {islemMesaji && (
        <div className={`islem-mesaji ${islemMesaji.includes("⚠️") ? "hata" : "basari"}`}>
          {islemMesaji}
        </div>
      )}
    </div>
  );
}