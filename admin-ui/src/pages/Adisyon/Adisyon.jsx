import React, { useEffect, useMemo, useState } from "react";
import "./Adisyon.css";

// LocalStorage key'leri
const MASA_KEY = "mc_masalar";
const ADISYON_KEY = "mc_adisyonlar";
const URUN_KEY = "mc_urunler";
const MUSTERI_KEY = "mc_musteriler";
const BORC_KEY = "mc_borclar";

export default function Adisyon() {
  // --------------------------------------------------
  // GENEL STATE
  // --------------------------------------------------
  const [masaNo, setMasaNo] = useState("MASA 1");
  const [adisyon, setAdisyon] = useState(null); // YENİ ADİSYON
  const [gecenSure, setGecenSure] = useState("00:00");
  const [indirimInput, setIndirimInput] = useState("");
  const [indirim, setIndirim] = useState(0);
  const [toplam, setToplam] = useState(0);
  const [kalan, setKalan] = useState(0);
  const [aktifOdemeTipi, setAktifOdemeTipi] = useState("NAKIT");
  const [odemeInput, setOdemeInput] = useState("");
  const [kapanisMesaji, setKapanisMesaji] = useState("");

  // MENÜ
  const [urunler, setUrunler] = useState([]);
  const [aktifKategori, setAktifKategori] = useState("");
  const [seciliUrun, setSeciliUrun] = useState(null);
  const [adetPanelAcik, setAdetPanelAcik] = useState(false);
  const [adet, setAdet] = useState(1);

  // SİPARİŞ YEMEK alanı
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
  const [hesabaYazSonrasiMasaDon, setHesabaYazSonrasiMasaDon] = useState(false);

  // ÖDEME SÖZÜ POPUP
  const [odemeSozuPopup, setOdemeSozuPopup] = useState(null);
  
  // --------------------------------------------------
  // HESABI AYIR (SPLIT BILL) STATE'LERİ
  // --------------------------------------------------
  const [splitAdisyon, setSplitAdisyon] = useState(null); // ESKİ ADİSYON (KİLİTLİ)

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
  
  // MASA BİLGİSİNİ GÜNCELLEYEN FONKSİYON
  const guncelMasaLocal = (masaNum, anaAdisyonId, splitAdisyonObj) => {
    let masalar = okuJSON(MASA_KEY, []);
    const masaNoNum = Number(masaNum.replace("MASA ", ""));
    const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);

    if (masaIdx !== -1) {
      masalar[masaIdx] = {
        ...masalar[masaIdx],
        adisyonId: anaAdisyonId, // Yeni adisyon ID'si
        ayirId: splitAdisyonObj ? splitAdisyonObj.id : null,
        ayirToplam: splitAdisyonObj ? 
          Number(splitAdisyonObj.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0)).toFixed(2) 
          : null,
      };
      yazJSON(MASA_KEY, masalar);
    }
  };

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
    const path = window.location.pathname; // /adisyon/1
    const parts = path.split("/");
    const masaId = parts[2] || "1";
    const masaLabel = `MASA ${masaId}`;
    setMasaNo(masaLabel);
  }, []);

  // --------------------------------------------------
  // ADİSYON YÜKLE (Yeni ve Eski)
  // --------------------------------------------------
  useEffect(() => {
    if (!masaNo) return;
    const adisyonlar = okuJSON(ADISYON_KEY, []);

    // 1. Aktif Yeni Adisyonu Bul/Oluştur
    let yeniAdisyon = adisyonlar.find(
      (a) => a.masaNo === masaNo && !a.kapali && !a.isSplit
    );

    if (!yeniAdisyon) {
      yeniAdisyon = {
        id: Date.now().toString(),
        masaNo,
        acilisZamani: new Date().toISOString(),
        kapanisZamani: null,
        kalemler: [],
        odemeler: [],
        indirim: 0,
        hesabaYazKayitlari: [],
        kapali: false,
        isSplit: false, // Yeni adisyon
        parentAdisyonId: null,
        durum: "AÇIK",
      };
      adisyonlar.push(yeniAdisyon);
      yazJSON(ADISYON_KEY, adisyonlar);
    }
    setAdisyon(yeniAdisyon);

    // 2. Eski (Split) Adisyonu Bul
    const eskiAdisyon = adisyonlar.find(
      (a) => a.masaNo === masaNo && !a.kapali && a.isSplit
    );
    setSplitAdisyon(eskiAdisyon || null);
  }, [masaNo]);

  // --------------------------------------------------
  // GEÇEN SÜRE HESAPLA (YENİ adisyon üzerinden)
  // --------------------------------------------------
  useEffect(() => {
    if (!adisyon || !adisyon.acilisZamani) return;

    const hesapla = () => {
      const acilis = new Date(adisyon.acilisZamani);
      const simdi = new Date();
      const diffMs = simdi - acilis;
      const dakika = Math.floor(diffMs / 60000);
      const saat = Math.floor(dakika / 60);
      const kalanDakika = dakika % 60;
      const sSaat = String(saat).padStart(2, "0");
      const sDakika = String(kalanDakika).padStart(2, "0");
      setGecenSure(`${sSaat}:${sDakika}`);
    };

    hesapla();
    const timer = setInterval(hesapla, 60000);
    return () => clearInterval(timer);
  }, [adisyon?.acilisZamani]);

  // --------------------------------------------------
  // MÜŞTERİ / BORÇ VERİLERİNİ YÜKLE
  // --------------------------------------------------
  useEffect(() => {
    const mList = okuJSON(MUSTERI_KEY, []);
    setMusteriler(Array.isArray(mList) ? mList : []);
  }, []);

  // --------------------------------------------------
  // ÖDEME SÖZÜ POPUP KONTROLÜ
  // --------------------------------------------------
  useEffect(() => {
    const borclar = okuJSON(BORC_KEY, []);
    if (!Array.isArray(borclar) || borclar.length === 0) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const bekleyen = borclar.find(
      (b) =>
        b.odemeSozu &&
        !b.hatirlatildi &&
        b.odemeSozu <= todayStr
    );

    if (bekleyen) {
      const musteri = (okuJSON(MUSTERI_KEY, []) || []).find(
        (m) => m.id === bekleyen.musteriId
      );
      setOdemeSozuPopup({
        borcId: bekleyen.id,
        musteriAd: musteri ? musteri.adSoyad : "Müşteri",
        odemeSozu: bekleyen.odemeSozu,
      });
    }
  }, []);

  const odemeSozuPopupKapat = () => {
    if (!odemeSozuPopup) return;
    const borclar = okuJSON(BORC_KEY, []);
    const idx = borclar.findIndex((b) => b.id === odemeSozuPopup.borcId);
    if (idx !== -1) {
      borclar[idx].hatirlatildi = true;
      yazJSON(BORC_KEY, borclar);
    }
    setOdemeSozuPopup(null);
  };

  const odemeSozuPopupDetayaGit = () => {
    odemeSozuPopupKapat();
    window.location.href = "/raporlar/musteri-borc";
  };

  // --------------------------------------------------
  // ADİSYON TOPLAM ve KALAN HESABI - GÜNCELLENDİ
  // --------------------------------------------------
  useEffect(() => {
    // 1. YENİ adisyon toplamları
    const yeniSatirToplam = (adisyon?.kalemler || []).reduce(
      (sum, k) => sum + (Number(k.toplam) || 0),
      0
    );
    const yeniOdemelerToplam = (adisyon?.odemeler || []).reduce(
      (sum, o) => sum + (Number(o.tutar) || 0),
      0
    );
    const yeniIndirim = indirim || 0;
    const yeniKalan = Math.max(yeniSatirToplam - yeniIndirim - yeniOdemelerToplam, 0);

    // 2. ESKİ adisyon toplamları (SADECE SATIR TOPLAMI)
    const eskiSatirToplam = (splitAdisyon?.kalemler || []).reduce(
      (sum, k) => sum + (Number(k.toplam) || 0),
      0
    );

    // 3. TOPLAM değerler (YENİ + ESKİ)
    const toplamSatir = yeniSatirToplam + eskiSatirToplam;
    const toplamOdemeler = yeniOdemelerToplam; // Sadece yeni adisyondaki ödemeler
    const toplamKalan = Math.max(toplamSatir - yeniIndirim - toplamOdemeler, 0);

    // ANA panelde gösterilecek toplam
    setToplam(toplamSatir);
    setKalan(toplamKalan);
  }, [adisyon, splitAdisyon, indirim]);

  // --------------------------------------------------
  // MENÜ ÜRÜNLERİNİ YÜKLE
  // --------------------------------------------------
  useEffect(() => {
    const list = okuJSON(URUN_KEY, []);

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
  // ADİSYONA ÜRÜN EKLEME (SADECE YENİ ADİSYONA)
  // --------------------------------------------------
  const guncelAdisyonLocal = (yeniAdisyon) => {
    const adisyonlar = okuJSON(ADISYON_KEY, []);
    const idx = adisyonlar.findIndex((a) => a.id === yeniAdisyon.id);
    if (idx === -1) {
      adisyonlar.push(yeniAdisyon);
    } else {
      adisyonlar[idx] = yeniAdisyon;
    }
    yazJSON(ADISYON_KEY, adisyonlar);
  };

  const uruneTiklandi = (urun) => {
    // Sadece YENİ adisyona ürün ekleyebiliriz
    if (!adisyon) {
      alert("Adisyon bulunamadı.");
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

    const mevcutKalemler = [...(adisyon.kalemler || [])];
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

    const guncel = { ...adisyon, kalemler: mevcutKalemler };
    setAdisyon(guncel);
    guncelAdisyonLocal(guncel);
  };

  const adetPanelEkle = () => {
    if (!seciliUrun || !adisyon) return;

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
      ...adisyon,
      kalemler: [...(adisyon.kalemler || []), yeniKalem],
    };
    setAdisyon(guncel);
    guncelAdisyonLocal(guncel);

    setAdetPanelAcik(false);
    setSeciliUrun(null);
  };

  // --------------------------------------------------
  // SATIR SİLME ve ADET ARTIR/AZALT (SADECE YENİ ADİSYON)
  // --------------------------------------------------
  const satirSil = (kalemId) => {
    if (!adisyon) return;
    if (!window.confirm("Bu satırı silmek istediğinize emin misiniz?")) return;

    const yeniKalemler = (adisyon.kalemler || []).filter(
      (k) => k.id !== kalemId
    );
    const guncel = { ...adisyon, kalemler: yeniKalemler };
    setAdisyon(guncel);
    guncelAdisyonLocal(guncel);
  };

  const adetArtir = (kalemId) => {
    if (!adisyon) return;
    
    const yeniKalemler = (adisyon.kalemler || []).map((k) => {
      if (k.id !== kalemId) return k;
      const yeniAdet = Number(k.adet || 0) + 1;
      return {
        ...k,
        adet: yeniAdet,
        toplam: yeniAdet * Number(k.birimFiyat || 0),
      };
    });
    const guncel = { ...adisyon, kalemler: yeniKalemler };
    
    setAdisyon(guncel);
    guncelAdisyonLocal(guncel);
  };

  const adetAzalt = (kalemId) => {
    if (!adisyon) return;

    const mevcutKalemler = adisyon.kalemler || [];
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

    const guncel = { ...adisyon, kalemler: yeniKalemler };
    setAdisyon(guncel);
    guncelAdisyonLocal(guncel);
  };

  // --------------------------------------------------
  // İNDİRİM - DÜZELTİLDİ (SADECE YENİ ADİSYON)
  // --------------------------------------------------
  const indirimEnter = (e) => {
    if (e.key !== "Enter") return;
    
    const val = Number(indirimInput);
    if (isNaN(val) || val < 0) {
      alert("Geçerli bir indirim tutarı giriniz.");
      return;
    }
    
    // İndirim sadece YENİ adisyona uygulanır
    const guncel = { ...adisyon, indirim: val };
    setAdisyon(guncel);
    setIndirim(val);
    guncelAdisyonLocal(guncel);
    
    setIndirimInput(""); // Input'u temizle
  };

  // --------------------------------------------------
  // ÖDEME SİLME (SADECE YENİ ADİSYON)
  // --------------------------------------------------
  const odemeSil = (odemeId) => {
    if (!adisyon) return;
    if (!window.confirm("Bu ödemeyi silmek istediğinize emin misiniz?")) return;

    const yeniOdemeler = (adisyon.odemeler || []).filter((o) => o.id !== odemeId);
    const yeniAdisyon = {
      ...adisyon,
      odemeler: yeniOdemeler,
    };

    setAdisyon(yeniAdisyon);
    guncelAdisyonLocal(yeniAdisyon);
  };
  
  // --------------------------------------------------
  // İNDİRİM SIFIRLAMA - DÜZELTİLDİ
  // --------------------------------------------------
  const indirimSifirla = () => {
    const guncel = { ...adisyon, indirim: 0 };
    setAdisyon(guncel);
    setIndirim(0);
    setIndirimInput("");
    guncelAdisyonLocal(guncel);
  };

  // --------------------------------------------------
  // HESABA YAZ ÖZETİ (Secili müşteri için)
  // --------------------------------------------------
  const mevcutBorcOzet = useMemo(() => {
    if (!seciliMusteriId) return { toplamBorc: 0, toplamOdeme: 0, kalan: 0 };
    const borclar = okuJSON(BORC_KEY, []);
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
  // ÖDEME EKLEME - GÜNCELLENDİ (SADECE YENİ ADİSYON)
  // --------------------------------------------------
  const odemeEkle = () => {
    // Ödeme her zaman YENİ adisyona eklenir
    if (!adisyon) return;

    // Hesaba Yaz için
    if (aktifOdemeTipi === "HESABA_YAZ") {
      setHesabaYazModu(true);
      setBorcTutarInput(String(kalan || 0));
      return;
    }

    let tutar = Number(odemeInput);
    if (!tutar || tutar <= 0) {
      // Ödeme input boşsa, kalan tutarın tamamını öde
      tutar = kalan;
    }

    if (tutar <= 0) {
      alert("Ödeme yapılacak tutar yok.");
      return;
    }

    const yeniOdeme = {
      id: Date.now().toString(),
      tip: aktifOdemeTipi,
      tutar,
    };

    const yeniAdisyon = {
      ...adisyon,
      odemeler: [...(adisyon.odemeler || []), yeniOdeme],
    };

    setAdisyon(yeniAdisyon);
    guncelAdisyonLocal(yeniAdisyon);
    setOdemeInput("");
  };

  // --------------------------------------------------
  // HESABA YAZ KAYDET (SADECE YENİ ADİSYON)
  // --------------------------------------------------
  const hesabaYazKaydet = () => {
    if (!adisyon) return;

    let borcTutar = Number(borcTutarInput);
    if (!borcTutar || borcTutar <= 0) {
      alert("Borç tutarı giriniz.");
      return;
    }

    let guncelMusteriler = [...musteriler];
    let musteriId = seciliMusteriId;

    if (!musteriId) {
      if (!yeniMusteriAdSoyad) {
        alert("Yeni müşteri için Ad Soyad giriniz.");
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

    const borclar = okuJSON(BORC_KEY, []);
    const yeniBorc = {
      id: Date.now().toString(),
      musteriId,
      masaNo,
      adisyonId: adisyon.id, // Yeni adisyon ID'si
      tutar: borcTutar,
      acilisZamani: adisyon.acilisZamani,
      kapanisZamani: adisyon.kapanisZamani,
      odemeSozu: null,
      hatirlatildi: false,
      hareketler: [
        {
          tip: "BORÇ EKLENDİ",
          tutar: borcTutar,
          tarih: new Date().toISOString(),
          aciklama: `Hesaba Yaz - ${masaNo}`,
        },
      ],
    };
    borclar.push(yeniBorc);
    yazJSON(BORC_KEY, borclar);

    const yeniOdeme = {
      id: `hy_${Date.now().toString()}`,
      tip: "HESABA_YAZ",
      tutar: borcTutar,
    };

    const guncelAdisyon = {
      ...adisyon,
      hesabaYazKayitlari: [
        ...(adisyon.hesabaYazKayitlari || []),
        { borcId: yeniBorc.id, musteriId },
      ],
      odemeler: [...(adisyon.odemeler || []), yeniOdeme],
    };
    setAdisyon(guncelAdisyon);
    guncelAdisyonLocal(guncelAdisyon);

    yazJSON(MUSTERI_KEY, guncelMusteriler);
    setMusteriler(guncelMusteriler);
    
    alert("Borç kaydedildi. (Hesaba Yaz) – Adisyon kapatılmadı.");
    setHesabaYazModu(false);
    setHesabaYazSonrasiMasaDon(true);
  };

  // --------------------------------------------------
  // HESABI AYIR (YENİ MANTIK - ESKİ ADİSYON KİLİTLİ)
  // --------------------------------------------------
  const hesabiAyir = () => {
    // Eğer adisyon boşsa, hiçbir şey yapma
    if (!adisyon || (adisyon.kalemler || []).length === 0) {
      alert("Adisyonda ürün yok!");
      return;
    }
    
    // Eğer zaten eski adisyon varsa, uyarı ver
    if (splitAdisyon) {
      alert("Bu masa için zaten bir eski adisyon mevcut!");
      return;
    }

    // Mevcut adisyonu ESKİ adisyon olarak kaydet (KİLİTLİ)
    const eskiAdisyon = {
      ...adisyon,
      id: adisyon.id,
      isSplit: true, // Artık ESKİ adisyon
      durum: "KİLİTLİ",
    };

    // YENİ bir adisyon oluştur
    const yeniAdisyon = {
      id: Date.now().toString(),
      masaNo: adisyon.masaNo,
      acilisZamani: new Date().toISOString(),
      kapanisZamani: null,
      kalemler: [], // Boş başlar
      odemeler: [], // Ödeme geçmişi sıfırlanır
      indirim: 0,
      hesabaYazKayitlari: [],
      kapali: false,
      isSplit: false, // Yeni adisyon
      parentAdisyonId: eskiAdisyon.id, // Eski adisyonun ID'sini referans alır
      durum: "AÇIK",
    };

    // 1. Eski adisyonu split olarak kaydet
    setSplitAdisyon(eskiAdisyon);
    
    // 2. Yeni adisyonu aktif adisyon olarak ayarla
    setAdisyon(yeniAdisyon);
    setIndirim(0); // Yeni adisyon için indirimi sıfırla
    setIndirimInput("");

    // 3. LocalStorage'ı güncelle
    let adisyonlar = okuJSON(ADISYON_KEY, []);
    
    // Eski adisyonu güncelle
    const eskiIdx = adisyonlar.findIndex(a => a.id === eskiAdisyon.id);
    if (eskiIdx !== -1) {
      adisyonlar[eskiIdx] = eskiAdisyon;
    }
    
    // Yeni adisyonu ekle
    adisyonlar.push(yeniAdisyon);
    yazJSON(ADISYON_KEY, adisyonlar);

    // 4. Masa kaydını güncelle
    guncelMasaLocal(masaNo, yeniAdisyon.id, eskiAdisyon);

    alert(`Hesap ayrıldı!\n\nEski adisyon kilitleyip sadece toplam görüntülenecek.\nYeni adisyon oluşturuldu.`);
  };

// Adisyon.jsx - MASAYI KAPAT BUTONU DÜZELTİLDİ
// ... önceki import'lar ve kodlar aynı ...

// --------------------------------------------------
// ADİSYON KAPAT - GÜNCELLENDİ (SYNC SERVICE EKLENDİ)
// --------------------------------------------------
const adisyonKapat = () => {
  // Kalan tutar kontrolü (YENİ + ESKİ toplamı)
  if (kalan > 0.01) {
    alert("Kalan tutar ödenmeden adisyon kapatılamaz.");
    return;
  }

  console.log('🔴 MASAYI KAPAT tıklandı - masaNo:', masaNo, 'adisyonId:', adisyon?.id);

  // 1. Masa numarasını doğru al (sadece numarayı al)
  const masaNum = masaNo.replace("MASA ", "").trim();
  
  // 2. syncService'ten masaBosalt fonksiyonunu çağır
  if (typeof window.syncService !== 'undefined') {
    console.log('🔄 syncService.masaBosalt çağrılıyor:', `MASA ${masaNum}`);
    const success = window.syncService.masaBosalt(`MASA ${masaNum}`);
    
    if (success) {
      console.log('✅ syncService: Masa başarıyla temizlendi');
    } else {
      console.error('❌ syncService: Masa temizlenemedi');
      alert('Masa temizlenirken bir hata oluştu!');
      return;
    }
  } else {
    console.error('❌ syncService bulunamadı');
    // Fallback: eski yöntemle devam et
    const masalar = okuJSON(MASA_KEY, []);
    const masaNoNum = Number(masaNum);
    const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);
    
    if (masaIdx !== -1) {
      masalar[masaIdx] = {
        ...masalar[masaIdx],
        adisyonId: null,
        ayirId: null,
        ayirToplam: null,
        toplamTutar: "0.00",
        acilisZamani: null,
        durum: "BOŞ",
        renk: "gri",
        musteriAdi: null,
        kisiSayisi: null,
        guncellemeZamani: new Date().toISOString()
      };
      yazJSON(MASA_KEY, masalar);
      window.dispatchEvent(new Event('storage'));
    }
  }

  const adisyonlar = okuJSON(ADISYON_KEY, []);

  // 3. YENİ adisyonu kapat
  if (adisyon) {
    const yeniIdx = adisyonlar.findIndex((a) => a.id === adisyon.id);
    if (yeniIdx !== -1) {
      const guncelYeniAdisyon = {
        ...adisyon,
        kapali: true,
        kapanisZamani: new Date().toISOString(),
        durum: "KAPALI",
      };
      adisyonlar[yeniIdx] = guncelYeniAdisyon;
      setAdisyon(guncelYeniAdisyon);
    }
  }

  // 4. ESKİ adisyonu kapat (varsa)
  if (splitAdisyon) {
    const eskiIdx = adisyonlar.findIndex((a) => a.id === splitAdisyon.id);
    if (eskiIdx !== -1) {
      const guncelEskiAdisyon = {
        ...splitAdisyon,
        kapali: true,
        kapanisZamani: new Date().toISOString(),
        durum: "KAPALI",
      };
      adisyonlar[eskiIdx] = guncelEskiAdisyon;
      setSplitAdisyon(guncelEskiAdisyon);
    }
  }

  yazJSON(ADISYON_KEY, adisyonlar);

  // 5. Masa kaydını temizle (syncService zaten yaptı)
  setKapanisMesaji(
    `✅ Masa başarıyla kapatıldı! ${splitAdisyon ? "(Eski adisyon da kapatıldı)" : ""} Masalar sayfasına yönlendiriliyorsunuz...`
  );
  
  // 6. Kısa gecikme ve yönlendirme
  setTimeout(() => {
    console.log('🔄 Masalar sayfasına yönlendiriliyor...');
    masayaDon();
  }, 1500);
};

  // --------------------------------------------------
  // MASAYA DÖN
  // --------------------------------------------------
  const masayaDon = () => {
    const params = new URLSearchParams();
    if (hesabaYazSonrasiMasaDon) {
      params.append("highlight", masaNo);
      setHesabaYazSonrasiMasaDon(false);
    }

    const query = params.toString();
    if (isBilardoMasa(masaNo)) {
      window.location.href = query ? `/bilardo?${query}` : "/bilardo";
    } else {
      window.location.href = query ? `/masalar?${query}` : "/masalar";
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  if (!adisyon) {
    return <div>Adisyon yükleniyor...</div>;
  }

  // YENİ adisyon ve ESKİ adisyon toplamları
  const yeniToplam = (adisyon?.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
  const eskiToplam = (splitAdisyon?.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
  const toplamTutar = yeniToplam + eskiToplam;
  
  // Yapılan ödemeler toplamı (SADECE YENİ ADİSYONDAN)
  const yapilanOdemeler = (adisyon?.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f5e7d0",
        color: "#4b2e05",
        padding: "12px",
        boxSizing: "border-box",
        gap: "12px",
      }}
    >
      {/* SÜTUN 1: SOL PANEL – ÖDEMELER */}
      <div
        style={{
          flex: "0 0 23%",
          background: "#fdf4e4",
          borderRadius: "12px",
          padding: "12px",
          boxSizing: "border-box",
          boxShadow: "0 0 14px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "22px",
              marginBottom: "10px",
              textAlign: "center",
              letterSpacing: "1px",
            }}
          >
            ÖDEMELER
          </div>
          
          {/* ÖDEME LİSTESİ (SADECE YENİ ADİSYON) */}
          <div
            style={{
              minHeight: "100px",
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #ecd3a5",
              borderRadius: "8px",
              padding: "8px",
              marginBottom: "10px",
              background: "#fff",
            }}
          >
            {(adisyon.odemeler || []).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#a0a0a0",
                  padding: "10px",
                }}
              >
                Henüz ödeme yok.
              </div>
            ) : (
              (adisyon.odemeler || []).map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px dashed #f4e0c2",
                    padding: "4px 0",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {odemeTipiLabel(o.tip)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                      {Number(o.tutar || 0).toFixed(2)} TL
                    </span>
                    <button
                      onClick={() => odemeSil(o.id)}
                      style={{
                        marginLeft: "8px",
                        padding: "0 4px",
                        border: "none",
                        background: "transparent",
                        color: "red",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TOPLAM / KALAN ALANI */}
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              borderRadius: "8px",
              background: "#e8d8c3",
              border: "1px solid #bfa37d",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontWeight: "500" }}>YENİ Adisyon:</span>
              <span style={{ fontWeight: "bold" }}>
                {yeniToplam.toFixed(2)} TL
              </span>
            </div>
            
            {/* ESKİ ADİSYON SATIRI - KOYU MAVİ */}
            {splitAdisyon && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontWeight: "500" }}>ESKİ Adisyon:</span>
                <span style={{ fontWeight: "bold", color: "#1a5fb4" }}>
                  {eskiToplam.toFixed(2)} TL
                </span>
              </div>
            )}
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                color: "red",
              }}
            >
              <span style={{ fontWeight: "500" }}>İndirim:</span>
              <span style={{ fontWeight: "bold" }}>
                -{indirim.toFixed(2)} TL
              </span>
            </div>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontWeight: "500" }}>Ödenen:</span>
              <span style={{ fontWeight: "bold", color: "green" }}>
                {yapilanOdemeler.toFixed(2)} TL
              </span>
            </div>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                borderTop: "1px solid #bfa37d",
                paddingTop: "6px",
                marginTop: "6px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>TOPLAM:</span>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                {toplamTutar.toFixed(2)} TL
              </span>
            </div>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #bfa37d",
                paddingTop: "6px",
                marginTop: "6px",
              }}
            >
              <span
                style={{ fontWeight: "bold", fontSize: "18px", color: "darkred" }}
              >
                KALAN
              </span>
              <span
                style={{ fontWeight: "bold", fontSize: "18px", color: "darkred" }}
              >
                {kalan.toFixed(2)} TL
              </span>
            </div>
          </div>

          {/* ÖDEME TİPİ SEÇİMİ */}
          <div
            style={{
              marginTop: "14px",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            {[
              { tip: "NAKIT", etiket: "Nakit" },
              { tip: "KART", etiket: "K.Kartı" },
              { tip: "HAVALE", etiket: "Havale" },
              { tip: "HESABA_YAZ", etiket: "Hesaba Yaz" },
            ].map((o) => (
              <button
                key={o.tip}
                onClick={() => setAktifOdemeTipi(o.tip)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "20px",
                  border:
                    aktifOdemeTipi === o.tip
                      ? "2px solid #c57f3e"
                      : "1px solid #bfa37d",
                  background: aktifOdemeTipi === o.tip ? "#f7d9a8" : "#ffffff",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                {o.etiket}
              </button>
            ))}
          </div>

          {/* ÖDEME TUTARI */}
          {aktifOdemeTipi !== "HESABA_YAZ" && (
            <>
              <div style={{ marginTop: "10px" }}>
                <label>Tutar</label>
                <input
                  type="number"
                  value={odemeInput}
                  onChange={(e) => setOdemeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") odemeEkle();
                  }}
                  placeholder={kalan.toFixed(2)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #bfa37d",
                    marginTop: "4px",
                    fontSize: "15px",
                  }}
                />
              </div>
              <button
                onClick={odemeEkle}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#4b2e05",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ÖDEME EKLE
              </button>
            </>
          )}

          {/* İNDİRİM */}
          <div style={{ marginTop: "14px" }}>
            <label>İndirim (Enter ile uygula)</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <input
                type="number"
                value={indirimInput}
                onChange={(e) => setIndirimInput(e.target.value)}
                onKeyDown={indirimEnter}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #bfa37d",
                  fontSize: "15px",
                  background: "#fff",
                }}
              />
              <button
                onClick={indirimSifirla}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #bfa37d",
                  background: "#fdf4e4",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Sıfırla
              </button>
            </div>
          </div>
        </div>

        {/* ALT BUTONLAR */}
        <div style={{ borderTop: "1px solid #ecd3a5", paddingTop: "12px" }}>
          {/* HESABI AYIR - Sadece ESKİ adisyon YOKSA ve YENİ adisyonda ürün varsa göster */}
          {!splitAdisyon && adisyon && adisyon.kalemler && adisyon.kalemler.length > 0 && (
            <button
              onClick={hesabiAyir}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#ffeedd",
                color: "#c57f3e",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              HESABI AYIR ✂️
            </button>
          )}

          {/* ÖDEME YAP / ADİSYON KAPAT */}
          <button
            onClick={adisyonKapat}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: kalan === 0 ? "#27ae60" : "#95a5a6",
              color: "#fff",
              cursor: kalan === 0 ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
            disabled={kalan !== 0}
          >
            MASAYI KAPAT
          </button>
          
          {kapanisMesaji && (
            <div
              style={{
                marginBottom: "8px",
                padding: "8px",
                borderRadius: "8px",
                background: "#e8f8f1",
                color: "#1e8449",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {kapanisMesaji}
            </div>
          )}

          {/* MASAYA DÖN */}
          <button
            onClick={masayaDon}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #bfa37d",
              background: "#fdf4e4",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            MASAYA DÖN
          </button>
        </div>
      </div>

      {/* SÜTUN 2: ORTA PANEL – ADİSYON GÖSTERİMİ */}
      <div
        style={{
          flex: 1.2, 
          background: "#fff7e6",
          borderRadius: "12px",
          padding: "12px",
          boxSizing: "border-box",
          boxShadow: "0 0 14px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "32px",
            marginBottom: "12px",
            textAlign: "center",
            letterSpacing: "1px",
            borderBottom: "2px solid #ecd3a5",
            paddingBottom: "8px",
            color: "#4b2e05",
          }}
        >
          MASA
        </div>

        {/* ESKİ ADİSYON GÖSTERİMİ - Sadece splitAdisyon VARKEN göster */}
        {splitAdisyon && (
          <div
            style={{
              marginBottom: "15px",
              padding: "10px",
              background: "#f0f0f0",
              borderRadius: "8px",
              border: "2px solid #ccc",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "8px",
                color: "#1a5fb4", // KOYU MAVİ
                textAlign: "center",
              }}
            >
              ESKİ ADİSYON (TOPLAM: {eskiToplam.toFixed(2)} TL)
            </div>
          </div>
        )}

        {/* YENİ ADİSYON GÖSTERİMİ */}
        {hesabaYazModu ? (
          // HESABA YAZ MODU
          <div style={{ flex: 1, padding: "12px", boxSizing: "border-box" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "24px",
                marginBottom: "20px",
                textAlign: "center",
                color: "#4b2e05",
              }}
            >
              HESABA YAZ (VERESİYE)
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Sol: Müşteri bilgileri */}
              <div>
                <div style={{ marginBottom: "15px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                    Mevcut Müşteri
                  </div>
                  <select
                    value={seciliMusteriId || ""}
                    onChange={(e) => setSeciliMusteriId(e.target.value || null)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #bfa37d",
                      marginTop: "4px",
                    }}
                  >
                    <option value="">Seçiniz</option>
                    {musteriler.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.adSoyad}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                    Yeni Müşteri
                  </div>
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={yeniMusteriAdSoyad}
                    onChange={(e) => setYeniMusteriAdSoyad(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #bfa37d",
                      marginBottom: "6px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Telefon"
                    value={yeniMusteriTelefon}
                    onChange={(e) => setYeniMusteriTelefon(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #bfa37d",
                      marginBottom: "6px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Not"
                    value={yeniMusteriNot}
                    onChange={(e) => setYeniMusteriNot(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #bfa37d",
                    }}
                  />
                </div>
              </div>

              {/* Sağ: Borç özeti ve tutar */}
              <div>
                <div style={{ marginBottom: "8px" }}>
                  <label>Borç Tutarı</label>
                  <input
                    type="number"
                    value={borcTutarInput}
                    onChange={(e) => setBorcTutarInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #bfa37d",
                      marginTop: "4px",
                      fontSize: "15px",
                    }}
                  />
                </div>

                {seciliMusteriId && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#e8d8c3",
                      border: "1px solid #bfa37d",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "6px",
                        textAlign: "center",
                      }}
                    >
                      Mevcut Borç Özeti
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "14px",
                      }}
                    >
                      <span>Toplam Borç:</span>
                      <b>{mevcutBorcOzet.toplamBorc.toFixed(2)} TL</b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        marginBottom: "4px",
                      }}
                    >
                      <span>Toplam Ödeme:</span>
                      <b>{mevcutBorcOzet.toplamOdeme.toFixed(2)} TL</b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderTop: "1px solid #bfa37d",
                        paddingTop: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "bold" }}>Net Borç:</span>
                      <span
                        style={{
                          fontWeight: "bold",
                          color:
                            mevcutBorcOzet.kalan > 0 ? "darkred" : "darkgreen",
                        }}
                      >
                        {mevcutBorcOzet.kalan.toFixed(2)} TL
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={hesabaYazKaydet}
                  disabled={!seciliMusteriId && !yeniMusteriAdSoyad}
                  style={{
                    marginTop: "20px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background:
                      !seciliMusteriId && !yeniMusteriAdSoyad
                        ? "#95a5a6"
                        : "#2980b9",
                    color: "#fff",
                    cursor:
                      !seciliMusteriId && !yeniMusteriAdSoyad
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  BORCU KAYDET
                </button>
                <button
                  onClick={() => setHesabaYazModu(false)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #bfa37d",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  İPTAL
                </button>
              </div>
            </div>
          </div>
        ) : (
          // YENİ ADİSYON İÇERİĞİ - SİYAH RENK
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "10px",
                color: "#000000", // SİYAH
              }}
            >
              ADİSYON
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ecd3a5",
                      textAlign: "left",
                      color: "#000",
                    }}
                  >
                    Ürün Adı
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ecd3a5",
                      textAlign: "center",
                      color: "#000",
                    }}
                  >
                    Adet
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ecd3a5",
                      textAlign: "right",
                      color: "#000",
                    }}
                  >
                    Birim
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ecd3a5",
                      textAlign: "right",
                      color: "#000",
                    }}
                  >
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody>
                {(adisyon.kalemler || []).map((k) => (
                  <tr key={k.id}>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f4e0c2",
                        color: "#000",
                      }}
                    >
                      {k.urunAd}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f4e0c2",
                        textAlign: "center",
                        color: "#000",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <button
                          onClick={() => adetAzalt(k.id)}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #d0b48c",
                            background: "#fbe9e7",
                            cursor: "pointer",
                            fontSize: "13px",
                            lineHeight: "1",
                          }}
                        >
                          -
                        </button>
                        <span>{k.adet}</span>
                        <button
                          onClick={() => adetArtir(k.id)}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #d0b48c",
                            background: "#e8f5e9",
                            cursor: "pointer",
                            fontSize: "13px",
                            lineHeight: "1",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f4e0c2",
                        textAlign: "right",
                        color: "#000",
                      }}
                    >
                      {Number(k.birimFiyat || 0).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        borderBottom: "1px solid #f4e0c2",
                        textAlign: "right",
                        color: "#000",
                      }}
                    >
                      <b>{Number(k.toplam || 0).toFixed(2)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {adisyon.kalemler.length === 0 && (
              <div
                style={{ textAlign: "center", color: "#888", padding: "20px" }}
              >
                Yeni adisyon üzerinde ürün bulunmamaktadır.
              </div>
            )}
          </div>
        )}
      </div>

      {/* SÜTUN 3: SAĞ 1 PANEL – MENÜ */}
      <div
        style={{
          flex: 1,
          background: "#fff7e6",
          borderRadius: "12px",
          padding: "12px",
          boxSizing: "border-box",
          boxShadow: "0 0 14px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "24px",
            marginBottom: "12px",
            textAlign: "center",
            letterSpacing: "1px",
            borderBottom: "2px solid #ecd3a5",
            paddingBottom: "8px",
          }}
        >
          MENÜ (Ürünler)
        </div>
        
        {/* ÜRÜN LİSTESİ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderRadius: "8px",
            border: "1px solid #ecd3a5",
            padding: "8px",
            background: "#fffdf7",
          }}
        >
          {filtreliUrunler.length === 0 ? (
            <div style={{ fontSize: "14px" }}>Bu kategoride ürün yok.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "8px",
              }}
            >
              {filtreliUrunler.map((u) => (
                <button
                  key={u.id}
                  onClick={() => uruneTiklandi(u)}
                  style={{
                    padding: "10px 6px",
                    borderRadius: "8px",
                    border: "1px solid #d0b48c",
                    background: "#ffeaa7",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    height: "60px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span style={{ lineHeight: "1.2" }}>{u.ad}</span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "normal",
                      color: "#4b2e05",
                    }}
                  >
                    {u.satis ? u.satis.toFixed(2) : "0.00"} TL
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* ÜRÜN ADET PANELİ */}
        {adetPanelAcik && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "24%",
              width: "250px",
              background: "#fff",
              border: "1px solid #bfa37d",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {seciliUrun.ad}
            </div>
            {seciliUrun.id === "siparis-yemek" && (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <label>Fiyat (TL)</label>
                  <input
                    type="number"
                    value={siparisYemekFiyat}
                    onChange={(e) => setSiparisYemekFiyat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #bfa37d",
                      marginTop: "4px",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <label>Not</label>
                  <input
                    type="text"
                    value={siparisYemekNot}
                    onChange={(e) => setSiparisYemekNot(e.target.value)}
                    placeholder="Ekstra not"
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid #bfa37d",
                      marginTop: "4px",
                    }}
                  />
                </div>
              </>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <label>Adet</label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  onClick={() => setAdet(Math.max(1, adet - 1))}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #d0b48c",
                    background: "#fbe9e7",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
                <span style={{ fontWeight: "bold" }}>{adet}</span>
                <button
                  onClick={() => setAdet(adet + 1)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #d0b48c",
                    background: "#e8f5e9",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={adetPanelEkle}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#4b2e05",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                EKLE
              </button>
              <button
                onClick={() => {
                  setAdetPanelAcik(false);
                  setSeciliUrun(null);
                }}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #bfa37d",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                İPTAL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SÜTUN 4: SAĞ 2 PANEL – KATEGORİLER */}
      <div
        style={{
          flex: 0.8,
          background: "#fff7e6",
          borderRadius: "12px",
          padding: "12px",
          boxSizing: "border-box",
          boxShadow: "0 0 14px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "24px",
            marginBottom: "12px",
            textAlign: "center",
            letterSpacing: "1px",
            borderBottom: "2px solid #ecd3a5",
            paddingBottom: "8px",
          }}
        >
          KATEGORİLER
        </div>
        
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            padding: "5px",
            border: "1px solid #ecd3a5",
            borderRadius: "8px",
            background: "#fffdf7",
            alignContent: "start",
          }}
        >
          {kategoriler.map((kat) => (
            <button
              key={kat}
              onClick={() => setAktifKategori(kat)}
              style={{
                padding: "15px 5px",
                borderRadius: "8px",
                border:
                  aktifKategori === kat
                    ? "2px solid #c57f3e"
                    : "1px solid #bfa37d",
                background:
                  aktifKategori === kat ? "#f7d9a8" : "rgba(255,255,255,0.9)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                textAlign: "center",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                wordBreak: "break-word",
                lineHeight: "1.2",
              }}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* ÖDEME SÖZÜ POPUP */}
      {odemeSozuPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff7e6",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              width: "300px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              MÜŞTERİ BORCU HATIRLATMA
            </div>
            <div style={{ fontSize: "14px", marginBottom: "12px" }}>
              {odemeSozuPopup.musteriAd} için ödeme sözü tarihi geldi:{" "}
              <b>{odemeSozuPopup.odemeSozu}</b>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={odemeSozuPopupKapat}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #bfa37d",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                TAMAM
              </button>
              <button
                onClick={odemeSozuPopupDetayaGit}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4b2e05",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                BORÇ DETAYINA GİT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}