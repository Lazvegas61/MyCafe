import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

// Yardımcı fonksiyonlar
const generateId = () => crypto.randomUUID();
const read = (k, d) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : d;
  } catch {
    return d;
  }
};
const write = (k, val) => localStorage.setItem(k, JSON.stringify(val));

export default function UrunStokYonetimi() {
  const KATEGORI_KEY = "mc_kategoriler";
  const URUN_KEY = "mc_urunler";

  // ---------- STATE ----------
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [yeniKategori, setYeniKategori] = useState("");
  const [uAd, setUAd] = useState("");
  const [uKategoriId, setUKategoriId] = useState("");
  const [uBarkod, setUBarkod] = useState("");
  const [uMaliyet, setUMaliyet] = useState("");
  const [uSatis, setUSatis] = useState("");
  const [uStok, setUStok] = useState("");
  const [uKritik, setUKritik] = useState("10");
  const [uTakip, setUTakip] = useState(true);
  const [filtreKategoriId, setFiltreKategoriId] = useState("");
  const [seciliUrunId, setSeciliUrunId] = useState("");
  const [gStok, setGStok] = useState("");
  const [gMaliyet, setGMaliyet] = useState("");
  const [gSatis, setGSatis] = useState("");
  const [gKritik, setGKritik] = useState("");
  const [gTakip, setGTakip] = useState(true);
  const [kritikAlarm, setKritikAlarm] = useState(false);
  
  // Güncelleme modları
  const [urunGuncellemeModu, setUrunGuncellemeModu] = useState(false);
  const [kategoriGuncellemeModu, setKategoriGuncellemeModu] = useState(false);
  const [guncellenenUrunAd, setGuncellenenUrunAd] = useState("");
  const [guncellenenUrunKategoriId, setGuncellenenUrunKategoriId] = useState("");
  const [guncellenenKategoriAd, setGuncellenenKategoriAd] = useState("");
  const [seciliKategoriId, setSeciliKategoriId] = useState("");

  const guncelleRef = useRef(null);
  const kategoriInputRef = useRef(null);
  const urunAdInputRef = useRef(null);

  // ---------- TEMALAR ----------
  const TEMA = {
    arkaPlan: "linear-gradient(135deg, #f9f3e9 0%, #f5e7d0 100%)",
    kart: "#fffaf2",
    anaRenk: "#4b2e05",
    altin: "#d4af37",
    altinAcik: "#f4e4b5",
    border: "#e0d1b8",
    borderKoyu: "#c9b897",
    success: "#2e7d32",
    danger: "#c62828",
    warning: "#f57c00",
    info: "#0288d1",
    text: "#3e2a0f",
    textLight: "#8d7b5f",
    selected: "#e8f5e9",
    kategoriSelected: "#e3f2fd"
  };

  const stil = {
    input: {
      padding: "10px 12px",
      borderRadius: "10px",
      border: `1px solid ${TEMA.border}`,
      fontSize: "15px",
      backgroundColor: "white",
      color: TEMA.text,
      transition: "all 0.2s ease",
      outline: "none",
      width: "100%"
    },
    button: {
      background: TEMA.anaRenk,
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "10px 16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    kart: {
      background: TEMA.kart,
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 4px 20px rgba(75, 46, 5, 0.08)",
      border: `1px solid ${TEMA.border}`,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    },
    baslik: {
      color: TEMA.anaRenk,
      margin: "0 0 20px 0",
      paddingBottom: "12px",
      borderBottom: `2px solid ${TEMA.altinAcik}`,
      fontSize: "1.5rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    badge: {
      background: TEMA.altinAcik,
      color: TEMA.anaRenk,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: "500"
    },
    badgeDanger: {
      background: "#ffebee",
      color: TEMA.danger,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: "500"
    },
    badgeSuccess: {
      background: "#e8f5e9",
      color: TEMA.success,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: "500"
    },
    badgeInfo: {
      background: "#e3f2fd",
      color: TEMA.info,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: "500"
    }
  };

  // ---------- MIGRATION (Eski verileri dönüştür) ----------
useEffect(() => {
  const migrateOldData = () => {
    const eskiUrunler = read(URUN_KEY, []);
    if (eskiUrunler.length === 0) return;
    
    // Eski veride kategoriId var mı kontrol et (yeni format)
    const ilkUrun = eskiUrunler[0];
    if (ilkUrun.kategoriId && ilkUrun.name) return; // Zaten yeni formatta
    
    // Migration yap - hem eski hem yeni formatları destekle
    const migratedUrunler = eskiUrunler.map(urun => {
      // Kategori ID'sini belirle
      let kategoriId;
      if (urun.kategoriId) {
        kategoriId = urun.kategoriId.toString(); // Var olan kategoriId'yi string yap
      } else if (urun.categoryId) {
        kategoriId = urun.categoryId.toString(); // categoryId'den al
      } else {
        kategoriId = "1"; // Varsayılan kategori
      }
      
      return {
        id: urun.id || generateId(),
        name: urun.name || "",
        kategoriId: kategoriId,
        barkod: urun.barkod || "",
        costPrice: Number(urun.costPrice || urun.maliyet || 0),
        salePrice: Number(urun.salePrice || urun.satis || 0),
        stock: Number(urun.stock || urun.stok || 0),
        critical: Number(urun.critical || urun.kritik || 10),
        stokTakibi: urun.stokTakibi !== undefined ? urun.stokTakibi : true,
      };
    });
    
    write(URUN_KEY, migratedUrunler);
    console.log(`${migratedUrunler.length} ürün migrate edildi`);
  };
  
  const migrateOldCategories = () => {
    const eskiKategoriler = read(KATEGORI_KEY, []);
    if (eskiKategoriler.length === 0) return;
    
    const ilkKategori = eskiKategoriler[0];
    if (ilkKategori.ad) return; // Zaten yeni formatta
    
    const migratedKategoriler = eskiKategoriler.map(kat => ({
      id: (kat.id || kat.categoryId || generateId()).toString(),
      ad: kat.ad || kat.name || kat.categoryName || ""
    }));
    
    write(KATEGORI_KEY, migratedKategoriler);
    console.log(`${migratedKategoriler.length} kategori migrate edildi`);
  };
  
  try {
    migrateOldCategories();
    migrateOldData();
  } catch (error) {
    console.error("Migration hatası:", error);
  }
}, []);

  // ---------- REFRESH ----------
  const refresh = () => {
    const kat = read(KATEGORI_KEY, []);
    const ur = read(URUN_KEY, []);
    
    // Kategorileri alfabetik sırala
    const sortedKat = [...kat].sort((a, b) => 
      (a.ad || "").localeCompare(b.ad || "")
    );
    
    // Ürünleri alfabetik sırala
    const sortedUr = [...ur].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
    
    setKategoriler(sortedKat);
    setUrunler(sortedUr);
  };

  const notify = () => window.dispatchEvent(new Event("mc_data_updated"));

  useEffect(() => {
    refresh();
  }, []);

  // ---------- ALARM HESAPLAMA ----------
  useEffect(() => {
    const kritiks = urunler.filter(
      (u) =>
        u.stokTakibi === true &&
        Number(u.stock || 0) <= Number(u.critical || 0)
    );
    setKritikAlarm(kritiks.length > 0);
  }, [urunler]);

  // ---------- KATEGORİ ----------
  const kategoriEkle = () => {
    const ad = yeniKategori.trim().toUpperCase();
    if (!ad) return alert("Kategori adı giriniz.");
    const list = read(KATEGORI_KEY, []);
    if (list.some((k) => k.ad === ad)) {
      return alert("Bu kategori zaten var.");
    }
    
    const yeniKategoriObj = { 
      id: generateId(), 
      ad 
    };
    list.push(yeniKategoriObj);
    
    const sortedList = [...list].sort((a, b) => 
      (a.ad || "").localeCompare(b.ad || "")
    );
    write(KATEGORI_KEY, sortedList);

    setYeniKategori("");
    refresh();
    notify();
    if (kategoriInputRef.current) {
      kategoriInputRef.current.focus();
    }
  };

  const kategoriSil = useCallback((silinecekKategoriId) => {
    const kategori = kategoriler.find(k => k.id === silinecekKategoriId);
    if (!kategori) return;
    
    if (!window.confirm(`${kategori.ad} kategorisi ve bu kategorideki tüm ürünler silinsin mi?`)) return;
    
    const kat = read(KATEGORI_KEY, []).filter((k) => k.id !== silinecekKategoriId);
    const sortedKat = [...kat].sort((a, b) => 
      (a.ad || "").localeCompare(b.ad || "")
    );
    write(KATEGORI_KEY, sortedKat);

    const uru = read(URUN_KEY, []).filter((u) => u.kategoriId !== silinecekKategoriId);
    write(URUN_KEY, uru);

    refresh();
    notify();
    
    if (seciliKategoriId === silinecekKategoriId) {
      setSeciliKategoriId("");
    }
  }, [kategoriler, seciliKategoriId]);

  // Kategori düzenle
  const kategoriDuzenle = () => {
    const yeniAd = guncellenenKategoriAd.trim().toUpperCase();
    if (!yeniAd) return alert("Kategori adı giriniz.");
    
    const seciliKategori = kategoriler.find(k => k.id === seciliKategoriId);
    if (!seciliKategori) return;
    
    if (yeniAd === seciliKategori.ad) {
      setKategoriGuncellemeModu(false);
      return;
    }

    const katList = read(KATEGORI_KEY, []);
    if (katList.some((k) => k.ad === yeniAd && k.id !== seciliKategoriId)) {
      return alert("Bu kategori adı zaten kullanılıyor.");
    }

    const yeniKatList = katList.map(k => 
      k.id === seciliKategoriId ? { ...k, ad: yeniAd } : k
    );
    
    const sortedKatList = [...yeniKatList].sort((a, b) => 
      (a.ad || "").localeCompare(b.ad || "")
    );
    write(KATEGORI_KEY, sortedKatList);

    refresh();
    notify();
    setKategoriGuncellemeModu(false);
    
    if (filtreKategoriId === seciliKategoriId) {
      setFiltreKategoriId(seciliKategoriId);
    }
  };

  // Kategori satırına tıklandığında
  const kategoriSec = useCallback((kategoriId) => {
    setSeciliKategoriId(kategoriId);
    const kategori = kategoriler.find(k => k.id === kategoriId);
    if (kategori) {
      setGuncellenenKategoriAd(kategori.ad);
    }
    setKategoriGuncellemeModu(false);
    
    // Bu kategoriye ait ürünleri bul
    const kategoriUrunleri = urunler.filter(u => u.kategoriId === kategoriId);
    
    if (kategoriUrunleri.length > 0) {
      // İlk ürünü seç
      setFiltreKategoriId(kategoriId);
      setSeciliUrunId(kategoriUrunleri[0].id);
    } else {
      // Kategori boşsa sadece filtreyi ayarla
      setFiltreKategoriId(kategoriId);
      setSeciliUrunId("");
    }
    
    setTimeout(() => {
      guncelleRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [kategoriler, urunler]);

  // ---------- ÜRÜN EKLE ----------
  const urunEkle = () => {
    if (!uAd.trim() || !uKategoriId.trim())
      return alert("Ürün adı ve kategori zorunludur.");

    const list = read(URUN_KEY, []);
    if (list.some((x) => x.name === uAd.trim()))
      return alert("Bu ürün zaten var.");

    const yeniUrun = {
      id: generateId(),
      name: uAd.trim(),
      kategoriId: uKategoriId.trim(),
      barkod: uBarkod.trim(),
      costPrice: Number(uMaliyet || 0),
      salePrice: Number(uSatis || 0),
      stock: Number(uStok || 0),
      critical: Number(uKritik || 10),
      stokTakibi: uTakip,
    };

    list.push(yeniUrun);

    const sortedList = [...list].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
    write(URUN_KEY, sortedList);
    
    notify();
    refresh();

    // Formu temizle
    setUAd("");
    setUBarkod("");
    setUKategoriId("");
    setUMaliyet("");
    setUSatis("");
    setUStok("");
    setUKritik("10");
    setUTakip(true);
    
    if (urunAdInputRef.current) {
      urunAdInputRef.current.focus();
    }
  };

  const urunSil = useCallback((urunId) => {
    const urun = urunler.find(u => u.id === urunId);
    if (!urun) return;
    
    if (!window.confirm(`${urun.name} ürünü silinsin mi?`)) return;
    const list = read(URUN_KEY, []);
    const yeni = list.filter((u) => u.id !== urunId);
    
    const sortedList = [...yeni].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
    write(URUN_KEY, sortedList);
    
    refresh();
    notify();

    if (seciliUrunId === urunId) {
      setSeciliUrunId("");
    }
  }, [urunler, seciliUrunId]);

  // Ürün satırına tıklandığında
  const urunSec = useCallback((urunId, kategoriId) => {
    setFiltreKategoriId(kategoriId);
    setSeciliUrunId(urunId);
    setSeciliKategoriId(kategoriId);
    setKategoriGuncellemeModu(false);
    
    setTimeout(() => {
      guncelleRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // ---------- ÜRÜN LİSTE ----------
  const filtreliUrunler = useMemo(() => {
    const filtered = urunler.filter((u) =>
      filtreKategoriId ? u.kategoriId === filtreKategoriId : true
    );
    
    return filtered.sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
  }, [urunler, filtreKategoriId]);

  const seciliUrun = useMemo(
    () => urunler.find((u) => u.id === seciliUrunId) || null,
    [urunler, seciliUrunId]
  );

  // Ürün seçilince input doldur
  useEffect(() => {
    if (!seciliUrun) {
      setGMaliyet("");
      setGSatis("");
      setGStok("");
      setGKritik("10");
      setGTakip(true);
      setGuncellenenUrunAd("");
      setGuncellenenUrunKategoriId("");
      setUrunGuncellemeModu(false);
      return;
    }

    setGMaliyet(seciliUrun.costPrice);
    setGSatis(seciliUrun.salePrice);
    setGStok(seciliUrun.stock);
    setGKritik(seciliUrun.critical);
    setGTakip(seciliUrun.stokTakibi === true);
    setGuncellenenUrunAd(seciliUrun.name);
    setGuncellenenUrunKategoriId(seciliUrun.kategoriId);
  }, [seciliUrun]);

  // ---------- UPDATE ----------
  const temelGuncelle = useCallback((cb) => {
    if (!seciliUrun) return alert("Önce ürün seçin.");
    const list = read(URUN_KEY, []);
    const idx = list.findIndex((u) => u.id === seciliUrun.id);
    if (idx === -1) return;

    const kopya = { ...list[idx] };
    cb(kopya);
    list[idx] = kopya;

    const sortedList = [...list].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
    write(URUN_KEY, sortedList);
    
    refresh();
    notify();
  }, [seciliUrun]);

  const stokGuncelle = useCallback(() =>
    temelGuncelle((x) => (x.stock = Number(gStok))), [temelGuncelle, gStok]);

  const maliyetGuncelle = useCallback(() =>
    temelGuncelle((x) => (x.costPrice = Number(gMaliyet))), [temelGuncelle, gMaliyet]);

  const satisGuncelle = useCallback(() =>
    temelGuncelle((x) => (x.salePrice = Number(gSatis))), [temelGuncelle, gSatis]);

  const kritikGuncelle = useCallback(() =>
    temelGuncelle((x) => (x.critical = Number(gKritik))), [temelGuncelle, gKritik]);

  const takipGuncelle = useCallback(() =>
    temelGuncelle((x) => (x.stokTakibi = gTakip)), [temelGuncelle, gTakip]);

  // Ürün adı ve kategori güncelleme
  const urunAdiVeKategoriGuncelle = useCallback(() => {
    if (!seciliUrun) return alert("Önce ürün seçin.");
    
    const yeniAd = guncellenenUrunAd.trim();
    const yeniKategoriId = guncellenenUrunKategoriId.trim();
    
    if (!yeniAd || !yeniKategoriId) {
      return alert("Ürün adı ve kategori zorunludur.");
    }
    
    const list = read(URUN_KEY, []);
    const idx = list.findIndex((u) => u.id === seciliUrun.id);
    if (idx === -1) return;

    // Yeni ad başka bir üründe kullanılıyor mu kontrol et
    if (yeniAd !== seciliUrun.name && list.some(u => u.name === yeniAd)) {
      return alert("Bu ürün adı zaten kullanılıyor.");
    }

    const kopya = { ...list[idx] };
    kopya.name = yeniAd;
    kopya.kategoriId = yeniKategoriId;
    list[idx] = kopya;

    const sortedList = [...list].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
    write(URUN_KEY, sortedList);
    
    refresh();
    notify();
    setSeciliUrunId(seciliUrun.id); // ID değişmez
    setFiltreKategoriId(yeniKategoriId);
    setSeciliKategoriId(yeniKategoriId);
    setUrunGuncellemeModu(false);
  }, [seciliUrun, guncellenenUrunAd, guncellenenUrunKategoriId]);

  // ---------- ENTER TUŞU HANDLER ----------
  const handleKeyPress = useCallback((e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  }, []);

  // ---------- Alarm → İlk kritik ürüne git ----------
  const kritikUrunGoster = useCallback(() => {
    const kritiks = urunler.filter(
      (u) => u.stokTakibi === true && u.stock <= u.critical
    );
    if (kritiks.length === 0) return;
    const ilk = kritiks[0];
    setFiltreKategoriId(ilk.kategoriId);
    setSeciliUrunId(ilk.id);
    setSeciliKategoriId(ilk.kategoriId);
    setTimeout(
      () =>
        guncelleRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }, [urunler]);

  // Kritik stok sayısı
  const kritikStokSayisi = urunler.filter(
    u => u.stokTakibi === true && u.stock <= u.critical
  ).length;

  // Seçili kategoriye ait ürün sayısı
  const seciliKategoriUrunSayisi = urunler.filter(
    u => u.kategoriId === seciliKategoriId
  ).length;

  // Kategori lookup fonksiyonu
  const kategoriAdiniBul = useCallback((kategoriId) => {
    const kategori = kategoriler.find(k => k.id === kategoriId);
    return kategori ? kategori.ad : "-";
  }, [kategoriler]);

  // Seçili kategori bilgisi
  const seciliKategori = seciliKategoriId ? kategoriler.find(k => k.id === seciliKategoriId) : null;

  return (
    <div
      style={{
        background: TEMA.arkaPlan,
        minHeight: "100vh",
        padding: "20px",
        color: TEMA.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* KRITIK STOK ALARM BUTTON */}
      {kritikAlarm && (
        <div
          onClick={kritikUrunGoster}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: TEMA.danger,
            color: "white",
            padding: "12px 20px",
            borderRadius: "12px",
            cursor: "pointer",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(198, 40, 40, 0.3)",
            animation: "pulse 2s infinite"
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          KRITIK STOK ({kritikStokSayisi})
        </div>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: TEMA.anaRenk, margin: "0 0 10px 0", fontSize: "2rem" }}>
          Ürün Stok Yönetimi
        </h1>
        <p style={{ color: TEMA.textLight, margin: 0 }}>
          Kategori ve ürünlerinizi yönetin, stok takibini gerçekleştirin
        </p>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "20px",
          height: "calc(100vh - 140px)"
        }}
      >
        {/* KATEGORİ YÖNETİMİ - 3 KOLON */}
        <div style={{ gridColumn: "span 3" }}>
          <div style={stil.kart}>
            <h2 style={stil.baslik}>
              <span style={{ color: TEMA.altin }}>📂</span>
              Kategori Yönetimi
            </h2>
            
            {/* Yeni Kategori Ekle */}
            <div style={{ marginBottom: "20px", flexShrink: 0 }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                Yeni Kategori Ekle
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  ref={kategoriInputRef}
                  type="text"
                  style={stil.input}
                  placeholder="Kategori adı..."
                  value={yeniKategori}
                  onChange={(e) => setYeniKategori(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, kategoriEkle)}
                />
                <button
                  style={stil.button}
                  onClick={kategoriEkle}
                >
                  Ekle
                </button>
              </div>
            </div>

            {/* Kategori Listesi */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexShrink: 0 }}>
                <label style={{ fontWeight: "500", color: TEMA.text }}>
                  Mevcut Kategoriler ({kategoriler.length})
                </label>
                <span style={{ fontSize: "0.9rem", color: TEMA.textLight }}>
                  Alfabetik Sıralı
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: "5px"
                }}
              >
                {kategoriler.map((kategori, index) => (
                  <div
                    key={kategori.id}
                    onClick={() => kategoriSec(kategori.id)}
                    style={{
                      padding: "12px 15px",
                      background: seciliKategoriId === kategori.id ? TEMA.kategoriSelected : 
                                 filtreKategoriId === kategori.id ? TEMA.selected : "white",
                      borderRadius: "10px",
                      marginBottom: "8px",
                      border: `1px solid ${seciliKategoriId === kategori.id ? TEMA.info : 
                                           filtreKategoriId === kategori.id ? TEMA.success : TEMA.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      position: "relative",
                      "&:hover": {
                        background: seciliKategoriId === kategori.id ? TEMA.kategoriSelected : TEMA.selected
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ 
                        fontSize: "0.9rem", 
                        color: TEMA.textLight,
                        minWidth: "20px",
                        textAlign: "center"
                      }}>
                        {index + 1}.
                      </span>
                      <div>
                        <div style={{ fontWeight: "500" }}>{kategori.ad}</div>
                        <div style={{ fontSize: "0.8rem", color: TEMA.textLight }}>
                          {urunler.filter(u => u.kategoriId === kategori.id).length} ürün
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        kategoriSil(kategori.id);
                      }}
                      style={{
                        background: "transparent",
                        border: `1px solid ${TEMA.danger}`,
                        color: TEMA.danger,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "500"
                      }}
                      onKeyPress={(e) => handleKeyPress(e, () => kategoriSil(kategori.id))}
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ÜRÜN EKLE/SİL - 5 KOLON */}
        <div style={{ gridColumn: "span 5" }}>
          <div style={stil.kart}>
            <h2 style={stil.baslik}>
              <span style={{ color: TEMA.altin }}>➕</span>
              Ürün Ekle / Sil
            </h2>

            {/* Yeni Ürün Formu */}
            <div style={{ marginBottom: "25px", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Ürün Adı *
                  </label>
                  <input
                    ref={urunAdInputRef}
                    style={stil.input}
                    placeholder="Ürün adını girin"
                    value={uAd}
                    onChange={(e) => setUAd(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Barkod
                  </label>
                  <input
                    style={stil.input}
                    placeholder="Barkod numarası"
                    value={uBarkod}
                    onChange={(e) => setUBarkod(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                  Kategori *
                </label>
                <select
                  style={stil.input}
                  value={uKategoriId}
                  onChange={(e) => setUKategoriId(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                >
                  <option value="">Kategori seçin</option>
                  {kategoriler.map((k) => (
                    <option key={k.id} value={k.id}>{k.ad}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Maliyet Fiyatı (₺)
                  </label>
                  <input
                    style={stil.input}
                    type="number"
                    placeholder="0.00"
                    value={uMaliyet}
                    onChange={(e) => setUMaliyet(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Satış Fiyatı (₺)
                  </label>
                  <input
                    style={stil.input}
                    type="number"
                    placeholder="0.00"
                    value={uSatis}
                    onChange={(e) => setUSatis(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Mevcut Stok
                  </label>
                  <input
                    style={stil.input}
                    type="number"
                    placeholder="0"
                    value={uStok}
                    onChange={(e) => setUStok(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Kritik Stok
                  </label>
                  <input
                    style={stil.input}
                    type="number"
                    placeholder="10"
                    value={uKritik}
                    onChange={(e) => setUKritik(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={uTakip}
                    onChange={(e) => setUTakip(e.target.checked)}
                    style={{ width: "18px", height: "18px" }}
                    onKeyPress={(e) => handleKeyPress(e, urunEkle)}
                  />
                  <span style={{ fontWeight: "500" }}>Stok Takibi Yap</span>
                </label>
              </div>

              <button
                style={{
                  ...stil.button,
                  background: TEMA.success,
                  padding: "12px 20px",
                  fontSize: "16px",
                  width: "100%"
                }}
                onClick={urunEkle}
              >
                📦 ÜRÜNÜ EKLE
              </button>
            </div>

            {/* Mevcut Ürünler Listesi */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexShrink: 0 }}>
                <h3 style={{ margin: 0, color: TEMA.text, fontSize: "1.1rem" }}>
                  Mevcut Ürünler ({urunler.length})
                </h3>
                <span style={{ fontSize: "0.9rem", color: TEMA.textLight }}>
                  Alfabetik Sıralı
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  borderRadius: "10px",
                  border: `1px solid ${TEMA.border}`
                }}
              >
                {urunler.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => urunSec(u.id, u.kategoriId)}
                    style={{
                      padding: "12px 15px",
                      background: seciliUrunId === u.id ? TEMA.selected : "white",
                      borderBottom: `1px solid ${TEMA.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      borderLeft: seciliUrunId === u.id ? `4px solid ${TEMA.success}` : "none"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                        <span style={{ fontWeight: "600", color: TEMA.text }}>{u.name}</span>
                        <span style={stil.badge}>{kategoriAdiniBul(u.kategoriId)}</span>
                        {!u.stokTakibi && (
                          <span style={stil.badgeDanger}>TAKİP YOK</span>
                        )}
                        {u.stokTakibi && u.stock <= u.critical && (
                          <span style={stil.badgeDanger}>KRITIK</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "15px", fontSize: "0.9rem", color: TEMA.textLight }}>
                        <span>Stok: {u.stock}</span>
                        <span>Maliyet: {u.costPrice}₺</span>
                        <span>Satış: {u.salePrice}₺</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        urunSil(u.id);
                      }}
                      style={{
                        background: "transparent",
                        border: `1px solid ${TEMA.danger}`,
                        color: TEMA.danger,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        minWidth: "60px"
                      }}
                      onKeyPress={(e) => handleKeyPress(e, () => urunSil(u.id))}
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ÜRÜN/KATEGORİ GÜNCELLE - 4 KOLON */}
        <div style={{ gridColumn: "span 4" }}>
          <div style={{ ...stil.kart, overflow: "hidden" }} ref={guncelleRef}>
            <h2 style={stil.baslik}>
              <span style={{ color: TEMA.altin }}>⚙️</span>
              Ürün/Kategori Güncelle
            </h2>

            {/* Seçim Kontrolleri */}
            <div style={{ marginBottom: "20px", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Kategori Filtresi
                  </label>
                  <select
                    style={stil.input}
                    value={filtreKategoriId}
                    onChange={(e) => {
                      setFiltreKategoriId(e.target.value);
                      setSeciliUrunId("");
                      setSeciliKategoriId(e.target.value || "");
                    }}
                    onKeyPress={(e) => handleKeyPress(e, () => {})}
                  >
                    <option value="">Tüm Kategoriler</option>
                    {kategoriler.map((k) => (
                      <option key={k.id} value={k.id}>{k.ad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: TEMA.text }}>
                    Ürün Seçin
                  </label>
                  <select
                    style={stil.input}
                    value={seciliUrunId}
                    onChange={(e) => {
                      setSeciliUrunId(e.target.value);
                      if (e.target.value) {
                        const urun = urunler.find(u => u.id === e.target.value);
                        if (urun) {
                          setSeciliKategoriId(urun.kategoriId);
                          setFiltreKategoriId(urun.kategoriId);
                        }
                      }
                    }}
                    onKeyPress={(e) => handleKeyPress(e, () => {})}
                  >
                    <option value="">Ürün seçin</option>
                    {filtreliUrunler.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Seçili Öğe Bilgileri ve Güncelleme Alanları */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
              {seciliKategoriId || seciliUrunId ? (
                <>
                  {/* KATEGORİ GÜNCELLEME */}
                  {seciliKategoriId && seciliKategori && (
                    <div
                      style={{
                        background: TEMA.kategoriSelected,
                        padding: "15px",
                        borderRadius: "12px",
                        border: `1px solid ${TEMA.info}`,
                        marginBottom: "20px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 8px 0", color: TEMA.info }}>
                            <span style={{ marginRight: "8px" }}>📂</span>
                            {seciliKategori.ad}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={stil.badgeInfo}>
                              {seciliKategoriUrunSayisi} Ürün
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <button
                            onClick={() => setKategoriGuncellemeModu(!kategoriGuncellemeModu)}
                            style={{
                              background: kategoriGuncellemeModu ? TEMA.danger : TEMA.info,
                              color: "white",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "500"
                            }}
                          >
                            {kategoriGuncellemeModu ? "İptal" : "Kategori Düzenle"}
                          </button>
                        </div>
                      </div>
                      
                      {kategoriGuncellemeModu ? (
                        <div style={{ display: "grid", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: TEMA.text }}>
                              Kategori Adı
                            </label>
                            <input
                              style={stil.input}
                              value={guncellenenKategoriAd}
                              onChange={(e) => setGuncellenenKategoriAd(e.target.value)}
                              placeholder="Yeni kategori adı"
                              onKeyPress={(e) => handleKeyPress(e, kategoriDuzenle)}
                            />
                          </div>
                          <button
                            style={{
                              ...stil.button,
                              background: TEMA.success,
                              padding: "10px 16px"
                            }}
                            onClick={kategoriDuzenle}
                          >
                            Kategoriyi Kaydet
                          </button>
                          <div style={{ fontSize: "0.85rem", color: TEMA.textLight, marginTop: "10px" }}>
                            <b>Not:</b> Kategori adı değiştirildiğinde, kategori ID'si aynı kalır.
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.9rem", color: TEMA.text }}>
                          Kategori adını değiştirmek için "Kategori Düzenle" butonuna tıklayın.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ÜRÜN GÜNCELLEME */}
                  {seciliUrun && (
                    <>
                      <div
                        style={{
                          background: "white",
                          padding: "15px",
                          borderRadius: "12px",
                          border: `1px solid ${TEMA.border}`,
                          marginBottom: "20px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                          <div>
                            <h3 style={{ margin: "0 0 8px 0", color: TEMA.anaRenk }}>{seciliUrun.name}</h3>
                            <span style={stil.badge}>{kategoriAdiniBul(seciliUrun.kategoriId)}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ 
                              ...(seciliUrun.stokTakibi && seciliUrun.stock <= seciliUrun.critical ? stil.badgeDanger : stil.badgeSuccess),
                              fontSize: "0.8rem",
                              marginBottom: "8px"
                            }}>
                              {seciliUrun.stokTakibi ? 
                                `Stok: ${seciliUrun.stock} / ${seciliUrun.critical}` : 
                                "Takip Yok"
                              }
                            </div>
                            <button
                              onClick={() => setUrunGuncellemeModu(!urunGuncellemeModu)}
                              style={{
                                background: urunGuncellemeModu ? TEMA.danger : TEMA.altin,
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500"
                              }}
                            >
                              {urunGuncellemeModu ? "İptal" : "Ürün Düzenle"}
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(2, 1fr)", 
                          gap: "12px",
                          fontSize: "0.95rem",
                          marginBottom: "15px"
                        }}>
                          <div><b>Barkod:</b> {seciliUrun.barkod || "-"}</div>
                          <div><b>Takip Durumu:</b> {seciliUrun.stokTakibi ? "Açık" : "Kapalı"}</div>
                          <div><b>Maliyet:</b> {seciliUrun.costPrice}₺</div>
                          <div><b>Satış:</b> {seciliUrun.salePrice}₺</div>
                          <div><b>Kar Marjı:</b> {seciliUrun.salePrice - seciliUrun.costPrice}₺</div>
                          <div><b>Stok Değeri:</b> {seciliUrun.stock * seciliUrun.costPrice}₺</div>
                        </div>

                        {/* Ürün Adı ve Kategori Güncelleme */}
                        {urunGuncellemeModu && (
                          <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: `1px solid ${TEMA.border}` }}>
                            <b style={{ display: "block", marginBottom: "10px", color: TEMA.text }}>Ürün Bilgilerini Düzenle</b>
                            <div style={{ display: "grid", gap: "10px" }}>
                              <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: TEMA.text }}>
                                  Ürün Adı
                                </label>
                                <input
                                  style={stil.input}
                                  value={guncellenenUrunAd}
                                  onChange={(e) => setGuncellenenUrunAd(e.target.value)}
                                  placeholder="Yeni ürün adı"
                                  onKeyPress={(e) => handleKeyPress(e, urunAdiVeKategoriGuncelle)}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", color: TEMA.text }}>
                                  Kategori
                                </label>
                                <select
                                  style={stil.input}
                                  value={guncellenenUrunKategoriId}
                                  onChange={(e) => setGuncellenenUrunKategoriId(e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(e, urunAdiVeKategoriGuncelle)}
                                >
                                  <option value="">Kategori seçin</option>
                                  {kategoriler.map((k) => (
                                    <option key={k.id} value={k.id}>{k.ad}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                style={{
                                  ...stil.button,
                                  background: TEMA.success,
                                  padding: "8px 16px"
                                }}
                                onClick={urunAdiVeKategoriGuncelle}
                              >
                                Ürün Bilgilerini Kaydet
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ÜRÜN DETAY GÜNCELLEME ALANLARI */}
                      <div style={{ display: "grid", gap: "15px" }}>
                        {/* Stok Güncelle */}
                        <div style={{ 
                          background: "white", 
                          padding: "15px", 
                          borderRadius: "12px",
                          border: `1px solid ${TEMA.border}`
                        }}>
                          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: TEMA.text }}>
                            Stok Güncelle
                          </label>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input
                              style={{ 
                                ...stil.input, 
                                flex: 1,
                                opacity: gTakip ? 1 : 0.5,
                                background: gTakip ? "white" : "#f5f5f5"
                              }}
                              disabled={!gTakip}
                              value={gStok}
                              onChange={(e) => setGStok(e.target.value)}
                              placeholder="Yeni stok miktarı"
                              onKeyPress={(e) => handleKeyPress(e, stokGuncelle)}
                            />
                            <button
                              style={{ 
                                ...stil.button,
                                opacity: gTakip ? 1 : 0.5,
                                cursor: gTakip ? "pointer" : "not-allowed"
                              }}
                              disabled={!gTakip}
                              onClick={stokGuncelle}
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>

                        {/* Fiyat Güncellemeleri */}
                        <div style={{ 
                          background: "white", 
                          padding: "15px", 
                          borderRadius: "12px",
                          border: `1px solid ${TEMA.border}`
                        }}>
                          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: TEMA.text }}>
                            Fiyat Güncelle
                          </label>
                          <div style={{ display: "grid", gap: "10px" }}>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <input
                                style={{ ...stil.input, flex: 1 }}
                                value={gMaliyet}
                                onChange={(e) => setGMaliyet(e.target.value)}
                                placeholder="Maliyet fiyatı"
                                onKeyPress={(e) => handleKeyPress(e, maliyetGuncelle)}
                              />
                              <button
                                style={stil.button}
                                onClick={maliyetGuncelle}
                              >
                                Maliyet
                              </button>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <input
                                style={{ ...stil.input, flex: 1 }}
                                value={gSatis}
                                onChange={(e) => setGSatis(e.target.value)}
                                placeholder="Satış fiyatı"
                                onKeyPress={(e) => handleKeyPress(e, satisGuncelle)}
                              />
                              <button
                                style={stil.button}
                                onClick={satisGuncelle}
                              >
                                Satış
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Kritik Stok ve Takip */}
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "1fr 1fr", 
                          gap: "15px"
                        }}>
                          <div style={{ 
                            background: "white", 
                            padding: "15px", 
                            borderRadius: "12px",
                            border: `1px solid ${TEMA.border}`
                          }}>
                            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: TEMA.text }}>
                              Kritik Stok
                            </label>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <input
                                style={{ 
                                  ...stil.input,
                                  opacity: gTakip ? 1 : 0.5,
                                  background: gTakip ? "white" : "#f5f5f5"
                                }}
                                disabled={!gTakip}
                                value={gKritik}
                                onChange={(e) => setGKritik(e.target.value)}
                                placeholder="Kritik seviye"
                                onKeyPress={(e) => handleKeyPress(e, kritikGuncelle)}
                              />
                              <button
                                style={{ 
                                  ...stil.button,
                                  opacity: gTakip ? 1 : 0.5,
                                  cursor: gTakip ? "pointer" : "not-allowed"
                                }}
                                disabled={!gTakip}
                                onClick={kritikGuncelle}
                              >
                                Kaydet
                              </button>
                            </div>
                          </div>

                          <div style={{ 
                            background: "white", 
                            padding: "15px", 
                            borderRadius: "12px",
                            border: `1px solid ${TEMA.border}`
                          }}>
                            <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: TEMA.text }}>
                              Stok Takibi
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={gTakip}
                                  onChange={(e) => setGTakip(e.target.checked)}
                                  style={{ width: "18px", height: "18px" }}
                                  onKeyPress={(e) => handleKeyPress(e, takipGuncelle)}
                                />
                                <span>{gTakip ? "Açık" : "Kapalı"}</span>
                              </label>
                              <button
                                style={stil.button}
                                onClick={takipGuncelle}
                              >
                                Kaydet
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ 
                  flex: 1, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: TEMA.textLight,
                  textAlign: "center",
                  padding: "40px 20px"
                }}>
                  <div>
                    <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📋</div>
                    <h3 style={{ color: TEMA.anaRenk, marginBottom: "10px" }}>Öğe Seçilmemiş</h3>
                    <p>Güncelleme yapmak için sol panellerden bir kategori veya ürün seçin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          input:focus, select:focus {
            border-color: ${TEMA.altin} !important;
            box-shadow: 0 0 0 2px ${TEMA.altinAcik} !important;
          }
          
          button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          button:active {
            transform: translateY(0);
          }
          
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${TEMA.borderKoyu};
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${TEMA.altin};
          }
          
          select {
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
}