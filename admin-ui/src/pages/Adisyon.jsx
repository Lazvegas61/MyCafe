import React, { useEffect, useMemo, useState } from "react";

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
  const [adisyon, setAdisyon] = useState(null);
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
  // ADİSYON YÜKLE
  // --------------------------------------------------
  useEffect(() => {
    if (!masaNo) return;
    const adisyonlar = okuJSON(ADISYON_KEY, []);
    const aktif = adisyonlar.find((a) => a.masaNo === masaNo && !a.kapali);
    if (aktif) {
      setAdisyon(aktif);
    } else {
      const yeni = {
        id: Date.now().toString(),
        masaNo,
        acilisZamani: new Date().toISOString(),
        kapanisZamani: null,
        kalemler: [],
        odemeler: [],
        indirim: 0,
        hesabaYazKayitlari: [],
        kapali: false,
        status: "OPEN",
        durum: "AÇIK",
      };
      adisyonlar.push(yeni);
      yazJSON(ADISYON_KEY, adisyonlar);
      setAdisyon(yeni);
    }
  }, [masaNo]);

  // --------------------------------------------------
  // GEÇEN SÜRE HESAPLA
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
  // ADİSYON TOPLAM ve KALAN HESABI
  // --------------------------------------------------
  useEffect(() => {
    if (!adisyon) return;

    const satirToplam = (adisyon.kalemler || []).reduce(
      (sum, k) => sum + (Number(k.toplam) || 0),
      0
    );
    const odemelerToplam = (adisyon.odemeler || []).reduce(
      (sum, o) => sum + (Number(o.tutar) || 0),
      0
    );

    setToplam(satirToplam);
    const kalanTutar = Math.max(
      satirToplam - (indirim || 0) - odemelerToplam,
      0
    );
    setKalan(kalanTutar);
  }, [adisyon, indirim]);

  // --------------------------------------------------
  // MENÜ ÜRÜNLERİNİ YÜKLE
  // --------------------------------------------------
 useEffect(() => {
  const list = okuJSON(URUN_KEY, []);

  // ------------------------------------------------------
  //   ÜRÜN FİX: categoryName → kategori, salePrice → satis
  // ------------------------------------------------------
  const fixed = (Array.isArray(list) ? list : []).map(u => ({
    ...u,
    kategori: u.kategori || u.categoryName || u.kategoriAd || u.Kategori || "GENEL",
    ad: u.ad || u.name || u.UrunAdi || "",
    satis: Number(u.satis || u.salePrice || u.Fiyat || 0)
  }));

  setUrunler(fixed);
}, []);


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
  // ADİSYONA ÜRÜN EKLEME
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
    if (!adisyon) return;

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
  // SATIR SİLME ve ADET ARTIR/AZALT
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
  // İNDİRİM
  // --------------------------------------------------
  const indirimEnter = (e) => {
    if (e.key !== "Enter") return;
    const val = Number(indirimInput);
    if (isNaN(val) || val < 0) {
      alert("Geçerli bir indirim tutarı giriniz.");
      return;
    }
    setIndirim(val);
  };

  // --------------------------------------------------
  // ÖDEME EKLEME
  // --------------------------------------------------
  const odemeEkle = () => {
    if (!adisyon) return;

    if (aktifOdemeTipi === "HESABA_YAZ") {
      setHesabaYazModu(true);
      setBorcTutarInput(String(kalan || 0));
      return;
    }

    let tutar = Number(odemeInput);
    if (!tutar || tutar <= 0) {
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
  // ADİSYON KAPAT
  // --------------------------------------------------
  const adisyonKapat = () => {
    if (!adisyon) return;

    if (kalan === 0) {
      const yeniAdisyon = {
        ...adisyon,
        kapali: true,
        status: "CLOSED",
        durum: "KAPALI",
        kapanisZamani: new Date().toISOString(),
      };

      setAdisyon(yeniAdisyon);
      guncelAdisyonLocal(yeniAdisyon);

      // MASAYI BOŞA DÖN
      let masalar = okuJSON(MASA_KEY, []);
      const masaNum = Number(masaNo.replace("MASA ", ""));
      const mIdx = masalar.findIndex((m) => Number(m.no) === masaNum);
      if (mIdx !== -1) {
        masalar[mIdx] = {
          ...masalar[mIdx],
          adisyonId: null,
        };
        yazJSON(MASA_KEY, masalar);
      }

      setKapanisMesaji("ADİSYON KAPATILDI");

      setTimeout(() => {
        const params = new URLSearchParams();
        if (masaNo) {
          params.set("masa", masaNo);
        }
        const query = params.toString();
        if (isBilardoMasa(masaNo)) {
          window.location.href = query ? `/bilardo?${query}` : "/bilardo";
        } else {
          window.location.href = query ? `/masalar?${query}` : "/masalar";
        }
      }, 1500);
    } else {
      alert("Adisyonu kapatmak için kalan tutar 0 olmalıdır.");
    }
  };

  // --------------------------------------------------
  // MASAYA DÖN
  // --------------------------------------------------
  const masayaDon = () => {
    const params = new URLSearchParams();
    if (masaNo) {
      params.set("masa", masaNo);
    }
    const query = params.toString();
    if (isBilardoMasa(masaNo)) {
      window.location.href = query ? `/bilardo?${query}` : "/bilardo";
    } else {
      window.location.href = query ? `/masalar?${query}` : "/masalar";
    }
  };

  // --------------------------------------------------
  // HESABA YAZ ÖZETLERİ
  // --------------------------------------------------
  const seciliMusteri = useMemo(
    () => musteriler.find((m) => m.id === seciliMusteriId) || null,
    [musteriler, seciliMusteriId]
  );

  const mevcutBorcOzet = useMemo(() => {
    if (!seciliMusteri) {
      return { toplamBorc: 0, toplamOdeme: 0, kalan: 0 };
    }
    const borclar = okuJSON(BORC_KEY, []);
    const kayitlar = borclar.filter((b) => b.musteriId === seciliMusteri.id);
    let tb = 0;
    let to = 0;
    kayitlar.forEach((b) => {
      tb += Number(b.tutar) || 0;
      (b.hareketler || []).forEach((h) => {
        if (h.tip === "TAHSİLAT") {
          to += Number(h.tutar) || 0;
        }
      });
    });
    return {
      toplamBorc: tb,
      toplamOdeme: to,
      kalan: tb - to,
    };
  }, [seciliMusteri]);

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
      adisyonId: adisyon.id,
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

    yazJSON(MUSTERI_KEY, guncelMusteriler);
    setMusteriler(guncelMusteriler);

    alert("Borç kaydedildi. (Hesaba Yaz) – Adisyon kapatılmadı.");
    setHesabaYazModu(false);
    setHesabaYazSonrasiMasaDon(true);
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  if (!adisyon) {
    return <div>Adisyon yükleniyor...</div>;
  }

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
      {/* SOL PANEL – ÖDEMELER */}
      <div
        style={{
          width: "300px",
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

          {/* ÖDEME TİPİ BUTONLARI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {[
              { tip: "NAKIT", etiket: "Nakit" },
              { tip: "KART", etiket: "Kredi Kartı" },
              { tip: "HAVALE", etiket: "Havale/EFT" },
              { tip: "HESABA_YAZ", etiket: "Hesaba Yaz" },
            ].map((o) => (
              <button
                key={o.tip}
                onClick={() => {
                  setAktifOdemeTipi(o.tip);
                  if (o.tip === "HESABA_YAZ") {
                    setHesabaYazModu(true);
                    setBorcTutarInput(String(kalan || 0));
                  }
                }}
                style={{
                  padding: "8px 6px",
                  borderRadius: "8px",
                  border:
                    aktifOdemeTipi === o.tip
                      ? "2px solid #c57f3e"
                      : "1px solid #bfa37d",
                  background:
                    aktifOdemeTipi === o.tip ? "#f7d9a8" : "#ffffff",
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
            <input
              type="number"
              value={indirimInput}
              onChange={(e) => setIndirimInput(e.target.value)}
              onKeyDown={indirimEnter}
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

          {/* ÖZET */}
          <div
            style={{
              marginTop: "12px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "#fff",
              border: "1px solid #ecd3a5",
              fontSize: "15px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              TOPLAM: <b>{toplam.toFixed(2)} ₺</b>
            </div>
            <div>
              KALAN:{" "}
              <b style={{ color: kalan === 0 ? "#4CAF50" : "#c0392b" }}>
                {kalan.toFixed(2)} ₺
              </b>
            </div>
          </div>

          {/* ÖDEME YAP / ADİSYON KAPAT */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              onClick={adisyonKapat}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#27ae60",
                color: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ÖDEME YAP / ADİSYON KAPAT
            </button>
          </div>
        </div>

        {/* ALT – MASAYA DÖN */}
        <div style={{ marginTop: "12px" }}>
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

      {/* ORTA PANEL – ADİSYON / HESABA YAZ */}
      <div
        style={{
          flex: 1.2,
          background: "#fff7e6",
          borderRadius: "12px",
          padding: "12px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ÜST BAŞLIK */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "28px",
                letterSpacing: "1px",
              }}
            >
              ADİSYON
            </div>
            <div style={{ fontSize: "14px", marginTop: "4px" }}>
              Masa: <b>{masaNo}</b>
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>
              Açılış:{" "}
              {adisyon.acilisZamani
                ? new Date(adisyon.acilisZamani).toLocaleString()
                : "-"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "15px",
            }}
          >
            <div>
              Geçen Süre: <b>{gecenSure}</b>
            </div>
            {hesabaYazSonrasiMasaDon && (
              <button
                onClick={masayaDon}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #bfa37d",
                  background: "#4b2e05",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                MASAYA DÖN
              </button>
            )}
          </div>
        </div>

        {/* İÇERİK */}
        {!hesabaYazModu ? (
          <>
            {/* ADİSYON SATIRLARI – Sadece burası scroll */}
            <div
              style={{
                flex: 1,
                border: "1px solid #ecd3a5",
                borderRadius: "8px",
                background: "#fff",
                overflowY: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "15px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f5e7d0",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #ecd3a5",
                        textAlign: "left",
                      }}
                    >
                      Ürün
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #ecd3a5",
                        textAlign: "center",
                      }}
                    >
                      Adet
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #ecd3a5",
                        textAlign: "right",
                      }}
                    >
                      Birim
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #ecd3a5",
                        textAlign: "right",
                      }}
                    >
                      Toplam
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #ecd3a5",
                        textAlign: "center",
                      }}
                    >
                      İşlem
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
                        }}
                      >
                        {k.urunAd}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #f4e0c2",
                          textAlign: "center",
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
                        }}
                      >
                        {Number(k.birimFiyat || 0).toFixed(2)} ₺
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #f4e0c2",
                          textAlign: "right",
                        }}
                      >
                        {Number(k.toplam || 0).toFixed(2)} ₺
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #f4e0c2",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => satirSil(k.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #e57373",
                            background: "#ffebee",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Ödemeler satırları */}
                  {(adisyon.odemeler || []).map((o) => (
                    <tr key={o.id}>
                      <td
                        colSpan={5}
                        style={{
                          padding: "4px 8px",
                          background: "#e8f5e9",
                          color: "#1e8449",
                          fontSize: "14px",
                          borderBottom: "1px solid #c8e6c9",
                        }}
                      >
                        Ödeme: {odemeTipiLabel(o.tip)} —{" "}
                        {Number(o.tutar || 0).toFixed(2)} ₺
                      </td>
                    </tr>
                  ))}

                  {/* İndirim satırı */}
                  {indirim > 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "4px 8px",
                          background: "#fff3e0",
                          color: "#e65100",
                          fontSize: "14px",
                          borderBottom: "1px solid #ffe0b2",
                        }}
                      >
                        İNDİRİM (-) {indirim.toFixed(2)} ₺
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          // HESABA YAZ MODU
          <div
            style={{
              flex: 1,
              border: "1px solid #ecd3a5",
              borderRadius: "10px",
              background: "#fff",
              padding: "12px",
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "12px",
            }}
          >
            {/* Sol: Müşteri seçimi */}
            <div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                HESABA YAZ
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label> Kayıtlı Müşteri </label>
                <select
                  value={seciliMusteriId || ""}
                  onChange={(e) =>
                    setSeciliMusteriId(e.target.value || null)
                  }
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
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  borderRadius: "8px",
                  background: "#fff8e1",
                  border: "1px solid #ffe082",
                  fontSize: "14px",
                }}
              >
                <div>
                  Toplam Borç:{" "}
                  <b>{mevcutBorcOzet.toplamBorc.toFixed(2)} ₺</b>
                </div>
                <div>
                  Toplam Ödeme:{" "}
                  <b>{mevcutBorcOzet.toplamOdeme.toFixed(2)} ₺</b>
                </div>
                <div>
                  Kalan:{" "}
                  <b>{mevcutBorcOzet.kalan.toFixed(2)} ₺</b>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <button
                  onClick={hesabaYazKaydet}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#4b2e05",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  HESABA YAZ KAYDET
                </button>
                <button
                  onClick={() => setHesabaYazModu(false)}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
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
          </div>
        )}
      </div>

      {/* SAĞ PANEL – MENÜ */}
      <div
        style={{
          width: "340px",
          background: "#fdf4e4",
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
            fontSize: "22px",
            marginBottom: "8px",
          }}
        >
          MENÜ
        </div>

        {/* KATEGORİLER */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {kategoriler.map((kat) => (
            <button
              key={kat}
              onClick={() => setAktifKategori(kat)}
              style={{
                padding: "6px 10px",
                borderRadius: "20px",
                border:
                  aktifKategori === kat
                    ? "2px solid #c57f3e"
                    : "1px solid #bfa37d",
                background:
                  aktifKategori === kat ? "#f7d9a8" : "rgba(255,255,255,0.9)",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {kat}
            </button>
          ))}
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
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: "8px",
              }}
            >
              {filtreliUrunler.map((u) => (
                <button
                  key={u.id}
                  onClick={() => uruneTiklandi(u)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "10px",
                    border: "1px solid #d7b98a",
                    background: "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{u.ad}</span>
                  {u.kategori !== "SİPARİŞ YEMEK" && (
                    <span style={{ fontSize: "13px" }}>
                      {Number(u.satis || 0).toFixed(2)} ₺
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SİPARİŞ YEMEK ALT PANELİ */}
        {adetPanelAcik && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #e57373",
              background: "#ffebee",
              fontSize: "14px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              SİPARİŞ YEMEK
            </div>
            <div style={{ marginBottom: "4px" }}>
              <label>Fiyat (₺)</label>
              <input
                type="number"
                value={siparisYemekFiyat}
                onChange={(e) => setSiparisYemekFiyat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #bfa37d",
                  marginTop: "2px",
                }}
              />
            </div>
            <div style={{ marginBottom: "4px" }}>
              <label>Not (isteğe bağlı)</label>
              <input
                type="text"
                value={siparisYemekNot}
                onChange={(e) => setSiparisYemekNot(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #bfa37d",
                  marginTop: "2px",
                }}
              />
            </div>
            <div
              style={{
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Adet:</span>
              <button
                onClick={() => setAdet((a) => Math.max(1, a - 1))}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #d0b48c",
                  background: "#fbe9e7",
                  cursor: "pointer",
                }}
              >
                -
              </button>
              <span>{adet}</span>
              <button
                onClick={() => setAdet((a) => a + 1)}
                style={{
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #d0b48c",
                  background: "#e8f5e9",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "4px",
              }}
            >
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

      {/* ÖDEME SÖZÜ POPUP */}
      {odemeSozuPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "360px",
              background: "#fff7e6",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 0 18px rgba(0,0,0,0.25)",
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
