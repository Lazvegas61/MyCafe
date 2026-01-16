import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// MyCafe Premium Tema Renkleri
const RENK = {
  arka: "#e5cfa5",
  kart: "#4a3722",
  kartYazi: "#ffffff",
  altin: "#f5d085",
  yesil: "#2ecc71",
  kirmizi: "#c0392b",
  turuncu: "#e67e22",
};

// --------------------------------------------------
// UTILITY FUNCTIONS
// --------------------------------------------------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

// NORMALİZASYON: Sadece ilk yüklemede veya eksik alanlar varsa
const normalizeMasa = (masa, index) => {
  // Eğer masa zaten normalize edilmişse değiştirme
  if (masa.id && masa.no) return masa;
  
  const no = masa.no ?? masa.id ?? (index + 1);
  return {
    ...masa,
    id: masa.id ?? `masa_${no}`,
    no: no.toString(),
  };
};

const normalizeMasalarList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((m, index) => normalizeMasa(m, index));
};

const formatSure = (dakika) => {
  const h = Math.floor(dakika / 60);
  const m = dakika % 60;

  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
};

const formatTime = (date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// YENİ: Adisyon toplamını al - TÜM ADISYONLARI KONTROL ET
const getAdisyonToplam = (adisyonId) => {
  try {
    const key = `mc_adisyon_toplam_${adisyonId}`;
    const toplam = localStorage.getItem(key);
    return toplam ? parseFloat(toplam) : 0;
  } catch {
    return 0;
  }
};

// YENİ: Masa toplamını al (AnaEkran ile uyumlu)
const getMasaToplam = (masaNo) => {
  try {
    const key = `mc_masa_toplam_${masaNo}`;
    const toplam = localStorage.getItem(key);
    return toplam ? parseFloat(toplam) : 0;
  } catch {
    return 0;
  }
};

// YENİ: Bugünkü tarihi al
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// YENİ: Adisyonun bugüne ait olup olmadığını kontrol et
const isBugunkuAdisyon = (adisyon) => {
  if (!adisyon || !adisyon.acilisZamani) return false;
  try {
    const adisyonTarih = new Date(adisyon.acilisZamani).toISOString().split('T')[0];
    const bugun = getTodayString();
    return adisyonTarih === bugun;
  } catch {
    return false;
  }
};

// YENİ: Bugünkü ve açık adisyonları filtrele
const filterBugunkuVeAcikAdisyonlar = (adisyonlar) => {
  const bugun = getTodayString();
  
  return adisyonlar.filter(adisyon => {
    // Tarih kontrolü
    if (!adisyon.acilisZamani) return false;
    
    try {
      const adisyonTarih = new Date(adisyon.acilisZamani).toISOString().split('T')[0];
      if (adisyonTarih !== bugun) return false;
    } catch {
      return false;
    }
    
    // Kapalı kontrolü
    const status = adisyon.status?.toUpperCase() || adisyon.durum?.toUpperCase() || "";
    const kapali = adisyon.kapali || status === "CLOSED" || status === "KAPALI";
    
    return !kapali;
  });
};

// YENİ: Gün aktif mi kontrol et
const isGunAktif = () => {
  const gunDurumu = localStorage.getItem('mycafe_gun_durumu');
  return gunDurumu === 'aktif';
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function Masalar({ onOpenAdisyon }) {
  const navigate = useNavigate();
  
  // STATE
  const [masalar, setMasalar] = useState(() => {
    const raw = readJSON("mc_masalar", []);
    return normalizeMasalarList(raw);
  });
  const [adisyonlar, setAdisyonlar] = useState(() => readJSON("mc_adisyonlar", []));
  const [bugunkuAdisyonlar, setBugunkuAdisyonlar] = useState([]);
  const [seciliMasa, setSeciliMasa] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  const [gunAktif, setGunAktif] = useState(isGunAktif());
  const [bugunTarihi, setBugunTarihi] = useState(getTodayString());
  
  // REFS
  const dragSourceMasaNoRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // --------------------------------------------------
  // DATA MANAGEMENT - GUNCELLENDI
  // --------------------------------------------------
  const loadData = useCallback(() => {
    const now = Date.now();
    // 500ms'den daha sık güncelleme yapma
    if (now - lastUpdateRef.current < 500) return;
    
    lastUpdateRef.current = now;
    
    const rawMasalar = readJSON("mc_masalar", []);
    const rawAdisyonlar = readJSON("mc_adisyonlar", []);
    
    // Gün durumunu kontrol et
    setGunAktif(isGunAktif());
    setBugunTarihi(getTodayString());
    
    // Bugünkü ve açık adisyonları filtrele
    const filteredAdisyonlar = filterBugunkuVeAcikAdisyonlar(rawAdisyonlar);
    setBugunkuAdisyonlar(filteredAdisyonlar);
    
    // Masaları güncelle (normalizasyon korunuyor)
    setMasalar(prev => {
      // Yeni masaları ekle veya güncelle
      const updated = rawMasalar.map((rawMasa, index) => {
        const existing = prev.find(m => m.no === rawMasa.no);
        if (existing) {
          // Var olan masayı koru, sadece adisyonId güncelle
          return { 
            ...existing, 
            adisyonId: rawMasa.adisyonId || existing.adisyonId,
            durum: rawMasa.durum || existing.durum || "BOŞ"
          };
        }
        // Yeni masa için normalize et
        return normalizeMasa(rawMasa, index);
      });
      return updated;
    });
    
    setAdisyonlar(rawAdisyonlar);
    
    console.log('📊 Masalar.jsx: Veriler yüklendi', {
      toplamMasa: rawMasalar.length,
      bugunkuAdisyon: filteredAdisyonlar.length,
      tumAdisyon: rawAdisyonlar.length,
      gunAktif: isGunAktif(),
      bugunTarihi: getTodayString()
    });
  }, []);

  const saveMasalar = useCallback((list) => {
    // Kaydetmeden önce normalize et (sadece eksik alanlar için)
    const normalized = list.map((m, index) => normalizeMasa(m, index));
    setMasalar(normalized);
    writeJSON("mc_masalar", normalized);
  }, []);

  const saveAdisyonlar = useCallback((list) => {
    setAdisyonlar(list);
    writeJSON("mc_adisyonlar", list);
  }, []);

  // --------------------------------------------------
  // REAL-TIME UPDATES - GUNCELLENDI
  // --------------------------------------------------
  useEffect(() => {
    loadData();
    
    // 2 saniyede bir kontrol et
    const interval = setInterval(loadData, 2000);
    
    const handleStorageChange = () => {
      loadData();
    };
    
    // Adisyon güncellendiğinde tetiklenecek event'leri dinle
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adisyonGuncellendi', handleStorageChange);
    window.addEventListener('odemelerGuncellendi', handleStorageChange);
    window.addEventListener('gunDurumuDegisti', handleStorageChange);
    window.addEventListener('gunSonuYapildi', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonGuncellendi', handleStorageChange);
      window.removeEventListener('odemelerGuncellendi', handleStorageChange);
      window.removeEventListener('gunDurumuDegisti', handleStorageChange);
      window.removeEventListener('gunSonuYapildi', handleStorageChange);
    };
  }, [loadData]);

  // --------------------------------------------------
  // MASA INFORMATION - GUNCELLENDI (Bugünkü verileri kullan)
  // --------------------------------------------------
  const getMasaBilgi = useCallback((masa) => {
    if (!masa.adisyonId) return { acik: false };
    
    // YENİ: Sadece bugünkü adisyonları kontrol et
    const bugun = getTodayString();
    
    const anaAdisyon = bugunkuAdisyonlar.find(a => a.id === masa.adisyonId);
    if (!anaAdisyon) {
      // Eski adisyonları kontrol et (tarihsel veri için)
      const eskiAdisyon = adisyonlar.find(a => a.id === masa.adisyonId);
      if (eskiAdisyon && isBugunkuAdisyon(eskiAdisyon)) {
        // Bugüne ait ama kapalı olabilir
        const status = eskiAdisyon.status?.toUpperCase() || eskiAdisyon.durum?.toUpperCase() || "";
        const kapali = eskiAdisyon.kapali || status === "CLOSED" || status === "KAPALI";
        
        if (kapali) {
          return { acik: false };
        }
        
        const acilis = eskiAdisyon.acilisZamani ? new Date(eskiAdisyon.acilisZamani) : null;
        if (!acilis || isNaN(acilis.getTime())) return { acik: false };
        
        const simdi = new Date();
        const gecenDakika = Math.floor((simdi - acilis) / 60000);
        const acilisSaati = formatTime(acilis);
        
        // Tutarı hesapla
        let toplamTutar = parseFloat(eskiAdisyon.toplamTutar || 0) || 0;
        
        if (toplamTutar === 0 && eskiAdisyon.kalemler && Array.isArray(eskiAdisyon.kalemler)) {
          toplamTutar = eskiAdisyon.kalemler.reduce((sum, k) => {
            const birimFiyat = parseFloat(k.birimFiyat || k.fiyat || 0) || 0;
            const miktar = parseFloat(k.miktar || k.adet || 1) || 1;
            return sum + (birimFiyat * miktar);
          }, 0);
        }
        
        return {
          acik: true,
          gecenDakika,
          acilisSaati,
          toplamTutar,
          adisyon: eskiAdisyon,
          eskiAdisyon: true
        };
      }
      return { acik: false };
    }
    
    // Status kontrolü - DÜZELTİLDİ
    const status = anaAdisyon.status?.toUpperCase() || anaAdisyon.durum?.toUpperCase() || "";
    const kapali = anaAdisyon.kapali || status === "CLOSED" || status === "KAPALI";
    
    if (kapali) {
      return { acik: false };
    }
    
    const acilis = anaAdisyon.acilisZamani ? new Date(anaAdisyon.acilisZamani) : null;
    if (!acilis || isNaN(acilis.getTime())) return { acik: false };
    
    const simdi = new Date();
    const gecenDakika = Math.floor((simdi - acilis) / 60000);
    const acilisSaati = formatTime(acilis);
    
    // YENİ: Masa toplamını AnaEkran ile uyumlu şekilde al
    let toplamTutar = getMasaToplam(masa.no);
    
    if (toplamTutar === 0) {
      // Masa toplamı yoksa, BUGÜNKÜ açık adisyonları topla
      const masaBugunkuAdisyonlari = bugunkuAdisyonlar.filter(a => {
        const masaEslesti = 
          a.masaNo === `MASA ${masa.no}` || 
          a.masaNum === masa.no ||
          a.id === masa.adisyonId;
        
        const aStatus = a.status?.toUpperCase() || a.durum?.toUpperCase() || "";
        const aKapali = a.kapali || aStatus === "CLOSED" || aStatus === "KAPALI";
        
        return masaEslesti && !aKapali;
      });
      
      masaBugunkuAdisyonlari.forEach(ad => {
        let adToplam = parseFloat(ad.toplamTutar || 0) || 0;
        
        if (adToplam === 0 && ad.kalemler && Array.isArray(ad.kalemler)) {
          adToplam = ad.kalemler.reduce((sum, k) => {
            const birimFiyat = parseFloat(k.birimFiyat || k.fiyat || 0) || 0;
            const miktar = parseFloat(k.miktar || k.adet || 1) || 1;
            return sum + (birimFiyat * miktar);
          }, 0);
        }
        
        toplamTutar += adToplam;
      });
      
      // Kaydet
      localStorage.setItem(`mc_masa_toplam_${masa.no}`, toplamTutar.toFixed(2));
    }
    
    return {
      acik: true,
      gecenDakika,
      acilisSaati,
      toplamTutar,
      adisyon: anaAdisyon,
      eskiAdisyon: false
    };
  }, [adisyonlar, bugunkuAdisyonlar]);

  // Memoized masa bilgileri
  const masaBilgileri = useMemo(() => {
    const bilgiler = {};
    masalar.forEach(masa => {
      bilgiler[masa.no] = getMasaBilgi(masa);
    });
    return bilgiler;
  }, [masalar, getMasaBilgi]);

  // --------------------------------------------------
  // MASA OPERATIONS
  // --------------------------------------------------
  const handleAddMasa = useCallback(() => {
    // Gün aktif değilse uyarı ver
    if (!gunAktif) {
      alert('❌ Gün başlatılmamış! Önce günü başlatın.');
      return;
    }
    
    const existingNumbers = masalar.map(m => Number(m.no)).filter(n => !isNaN(n));
    const maxNo = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    const nextNo = (maxNo + 1).toString();
    const yeniMasa = {
      id: `masa_${nextNo}`,
      no: nextNo,
      adisyonId: null,
      durum: "BOŞ"
    };
    
    const yeniListe = [...masalar, yeniMasa];
    saveMasalar(yeniListe);
  }, [masalar, saveMasalar, gunAktif]);

  const handleDeleteMasa = useCallback(() => {
    const trimmed = silMasaNo.trim();
    if (!trimmed) return;
    
    const masaNo = trimmed;
    const target = masalar.find(m => m.no === masaNo);
    
    if (!target) {
      alert("Bu numarada bir masa yok.");
      return;
    }
    
    const bilgi = masaBilgileri[masaNo];
    if (bilgi.acik) {
      alert("Açık adisyonu olan masayı silemezsiniz.");
      return;
    }
    
    const yeniListe = masalar.filter(m => m.no !== masaNo);
    saveMasalar(yeniListe);
    setSilMasaNo("");
    
    // Seçili masa silindiyse seçimi temizle
    if (seciliMasa === masaNo) {
      setSeciliMasa(null);
    }
    
    // LocalStorage temizle
    localStorage.removeItem(`mc_masa_toplam_${masaNo}`);
  }, [masalar, silMasaNo, masaBilgileri, seciliMasa, saveMasalar]);

  // --------------------------------------------------
  // DRAG & DROP - DÜZELTİLDİ (MASA TAŞIMA SORUNU ÇÖZÜLDÜ)
  // --------------------------------------------------
  const handleDragStart = useCallback((e, masa) => {
    const bilgi = masaBilgileri[masa.no];
    if (!bilgi.acik) return;
    dragSourceMasaNoRef.current = masa.no;
    e.dataTransfer.setData('text/plain', masa.no);
  }, [masaBilgileri]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetMasa) => {
    e.preventDefault();
    
    const sourceNo = dragSourceMasaNoRef.current;
    dragSourceMasaNoRef.current = null;
    
    if (!sourceNo || sourceNo === targetMasa.no) return;
    
    const sourceMasa = masalar.find(m => m.no === sourceNo);
    if (!sourceMasa || !sourceMasa.adisyonId) {
      alert("Kaynak masada taşınacak açık adisyon yok.");
      return;
    }
    
    const targetBilgi = masaBilgileri[targetMasa.no];
    if (targetBilgi.acik) {
      alert("Hedef masada zaten açık adisyon var. Taşıyamazsınız.");
      return;
    }
    
    const adisyonId = sourceMasa.adisyonId;
    const sourceToplam = masaBilgileri[sourceNo]?.toplamTutar || 0;
    
    console.log('🔄 Masa taşıma başlıyor:', {
      sourceNo,
      targetNo: targetMasa.no,
      adisyonId,
      sourceToplam
    });
    
    // 1. ADISYONLARI GÜNCELLE (Masa numarasını değiştir)
    const updatedAdisyonlar = adisyonlar.map(ad => {
      // Ana adisyonu güncelle
      if (ad.id === adisyonId) {
        return {
          ...ad,
          masaNo: `MASA ${targetMasa.no}`,
          masaNum: targetMasa.no
        };
      }
      
      // Aynı masadaki diğer adisyonları da güncelle
      if ((ad.masaNo === `MASA ${sourceNo}` || ad.masaNum === sourceNo) && ad.id !== adisyonId) {
        return {
          ...ad,
          masaNo: `MASA ${targetMasa.no}`,
          masaNum: targetMasa.no
        };
      }
      
      return ad;
    });
    
    // Adisyonları kaydet
    saveAdisyonlar(updatedAdisyonlar);
    
    // 2. MASALARI GÜNCELLE - DÜZELTİLDİ
    const updatedMasalar = masalar.map(m => {
      // Kaynak masayı BOŞALT
      if (m.no === sourceNo) {
        return { 
          ...m, 
          adisyonId: null,
          durum: "BOŞ", // ✅ DÜZELTME
          toplamTutar: "0.00",
          guncellemeZamani: new Date().toISOString()
        };
      }
      
      // Hedef masaya adisyonId'yi ata ve DOLU yap
      if (m.no === targetMasa.no) {
        return { 
          ...m, 
          adisyonId: adisyonId,
          durum: "DOLU", // ✅ DÜZELTME
          toplamTutar: sourceToplam.toFixed(2),
          guncellemeZamani: new Date().toISOString()
        };
      }
      
      return m;
    });
    
    saveMasalar(updatedMasalar);
    
    // 3. LOCALSTORAGE'DAKİ TOPLAM TUTARLARI GÜNCELLE
    // Kaynak masa toplamını SIFIRLA
    localStorage.removeItem(`mc_masa_toplam_${sourceNo}`);
    
    // Hedef masa toplamını kaynak toplam yap
    localStorage.setItem(`mc_masa_toplam_${targetMasa.no}`, sourceToplam.toString());
    
    // Adisyon toplamlarını da güncelle
    const sourceAdisyonToplam = getAdisyonToplam(adisyonId);
    if (sourceAdisyonToplam > 0) {
      localStorage.setItem(`mc_adisyon_toplam_${adisyonId}`, sourceAdisyonToplam.toString());
    }
    
    // 4. TÜM DİĞER ADISYONLARI BUL VE GÜNCELLE
    const digerAdisyonlar = adisyonlar.filter(ad => 
      (ad.masaNo === `MASA ${sourceNo}` || ad.masaNum === sourceNo) && 
      ad.id !== adisyonId
    );
    
    digerAdisyonlar.forEach(ad => {
      const digerToplam = getAdisyonToplam(ad.id);
      if (digerToplam > 0) {
        localStorage.setItem(`mc_adisyon_toplam_${ad.id}`, digerToplam.toString());
      }
    });
    
    // 5. MASALAR SAYFASINI GÜNCELLE
    window.dispatchEvent(new Event('adisyonGuncellendi'));
    
    // Seçimi güncelle
    setSeciliMasa(targetMasa.no);
    
    // 6. MASAYI YENİDEN YÜKLE
    setTimeout(() => {
      loadData();
    }, 100);
    
    alert(`✅ Adisyon MASA ${sourceNo} → MASA ${targetMasa.no} taşındı.\nToplam: ${sourceToplam.toFixed(2)} TL`);
  }, [masalar, masaBilgileri, adisyonlar, saveMasalar, saveAdisyonlar, loadData]);

  // --------------------------------------------------
  // CLICK HANDLERS
  // --------------------------------------------------
  const handleSingleClick = useCallback((masa) => {
    setSeciliMasa(masa.no);
  }, []);

  const handleDoubleClick = useCallback((masa) => {
    // Gün aktif değilse uyarı ver
    if (!gunAktif) {
      alert('❌ Gün başlatılmamış! Önce günü başlatın.');
      return;
    }
    
    const bilgi = masaBilgileri[masa.no];
    let adisyonId = masa.adisyonId;
    
    if (!bilgi.acik) {
      adisyonId = "ad_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      
      const yeniAdisyon = {
        id: adisyonId,
        masaNo: `MASA ${masa.no}`,
        masaNum: masa.no,
        acilisZamani: new Date().toISOString(),
        kalemler: [],
        odemeler: [],
        indirim: 0,
        hesabaYazKayitlari: [],
        kapali: false,
        isSplit: false,
        parentAdisyonId: null,
        durum: "AÇIK",
        musteriAdi: null,
        toplamTutar: "0.00",
        guncellemeZamani: new Date().toISOString()
      };
      
      const yeniAdisyonList = [...adisyonlar, yeniAdisyon];
      saveAdisyonlar(yeniAdisyonList);
      
      const yeniMasaList = masalar.map(m =>
        m.no === masa.no ? { ...m, adisyonId: adisyonId, durum: "DOLU" } : m
      );
      saveMasalar(yeniMasaList);
      
      // Yeni adisyon için masa toplamını sıfırla
      localStorage.setItem(`mc_masa_toplam_${masa.no}`, "0");
      
      // Event tetikle
      window.dispatchEvent(new Event('adisyonGuncellendi'));
    }
    
    // Navigate
    if (typeof onOpenAdisyon === "function") {
      onOpenAdisyon({ masaId: masa.no, adisyonId });
    } else {
      navigate("/adisyondetay/" + masa.no);
    }
  }, [masalar, masaBilgileri, adisyonlar, onOpenAdisyon, navigate, saveMasalar, saveAdisyonlar, gunAktif]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div
      style={{
        background: RENK.arka,
        minHeight: "100vh",
        padding: "26px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 900,
              color: "#3a2a14",
              margin: 0,
              marginBottom: "5px",
            }}
          >
            Masalar
          </h1>
          
          {/* GÜN DURUMU BİLGİSİ */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            color: gunAktif ? "#27ae60" : "#e74c3c",
            fontWeight: 600,
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: gunAktif ? "#2ecc71" : "#e74c3c",
            }}></div>
            <span>{gunAktif ? 'Gün Aktif' : 'Gün Başlatılmamış'}</span>
            <span style={{ color: "#7f8c8d" }}>•</span>
            <span style={{ color: "#7f8c8d", fontWeight: 500 }}>Bugün: {bugunTarihi}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* GÜN BAŞLAT BUTONU (sadece gün aktif değilse) */}
          {!gunAktif && (
            <button
              onClick={() => {
                if (window.confirm('Günü başlatmak istiyor musunuz?')) {
                  localStorage.setItem('mycafe_gun_durumu', 'aktif');
                  localStorage.setItem('mycafe_gun_baslangic', new Date().toISOString());
                  localStorage.setItem('mycafe_gun_baslangic_kasa', '0');
                  setGunAktif(true);
                  window.dispatchEvent(new Event('gunDurumuDegisti'));
                  alert('✅ Gün başarıyla başlatıldı!');
                }
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                minWidth: "120px",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              🚀 Gün Başlat
            </button>
          )}
          
          {/* ADD TABLE */}
          <button
            onClick={handleAddMasa}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, rgba(245,208,133,0.95), rgba(228,184,110,0.9))",
              color: "#3a260f",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: "120px",
              transition: "transform 0.2s",
              opacity: gunAktif ? 1 : 0.5,
              cursor: gunAktif ? "pointer" : "not-allowed",
            }}
            onMouseOver={(e) => gunAktif && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => gunAktif && (e.currentTarget.style.transform = "scale(1)")}
            title={!gunAktif ? "Gün başlatılmamış" : "Yeni masa ekle"}
          >
            + Masa Ekle
          </button>

          {/* DELETE TABLE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(74,55,34,0.15)",
              padding: "6px 10px",
              borderRadius: "999px",
              opacity: gunAktif ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Masa Sil:</span>
            <input
              type="text"
              placeholder="No"
              value={silMasaNo}
              onChange={(e) => setSilMasaNo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDeleteMasa()}
              style={{
                width: "56px",
                padding: "4px 6px",
                borderRadius: "999px",
                border: "1px solid #b89a6a",
                outline: "none",
                fontSize: "13px",
                textAlign: "center",
                fontWeight: 600,
                background: gunAktif ? "#fff" : "#f5f5f5",
              }}
              disabled={!gunAktif}
            />
            <button
              onClick={handleDeleteMasa}
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                border: "none",
                cursor: gunAktif ? "pointer" : "not-allowed",
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                transition: "opacity 0.2s",
                opacity: gunAktif ? 1 : 0.5,
              }}
              onMouseOver={(e) => gunAktif && (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => gunAktif && (e.currentTarget.style.opacity = "1")}
            >
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* GÜN BİLGİSİ UYARISI */}
      {!gunAktif && (
        <div style={{
          background: "linear-gradient(135deg, #ffeaa7, #fab1a0)",
          padding: "12px 18px",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "2px solid #e74c3c",
        }}>
          <div style={{ fontSize: "24px" }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 700, color: "#d63031" }}>Gün başlatılmamış!</div>
            <div style={{ fontSize: "14px", color: "#636e72" }}>
              Masaları kullanmak için önce günü başlatın. "Gün Başlat" butonuna tıklayın.
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {masalar.length === 0 ? (
        <div
          style={{
            fontSize: "16px",
            color: "#7f8c8d",
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255,255,255,0.3)",
            borderRadius: "20px",
            marginBottom: "30px",
          }}
        >
          {gunAktif ? 
            'Henüz masa yok. Sağ üstten "+ Masa Ekle" ile masa oluşturabilirsiniz.' :
            'Gün başlatılmamış. Önce günü başlatın.'
          }
        </div>
      ) : (
        <>
          {/* BUGÜNKÜ DURUM BİLGİSİ */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "10px 15px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
            fontSize: "14px",
          }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <div>
                <span style={{ fontWeight: 600, color: "#3a2a14" }}>Toplam Masa:</span>
                <span style={{ marginLeft: "5px", fontWeight: 700 }}>{masalar.length}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#3a2a14" }}>Bugünkü Açık Adisyon:</span>
                <span style={{ marginLeft: "5px", fontWeight: 700, color: "#27ae60" }}>
                  {bugunkuAdisyonlar.length}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#3a2a14" }}>Bugünkü Tarih:</span>
                <span style={{ marginLeft: "5px", fontWeight: 700 }}>{bugunTarihi}</span>
              </div>
            </div>
            
            {bugunkuAdisyonlar.length === 0 && gunAktif && (
              <div style={{ 
                fontSize: "12px", 
                color: "#7f8c8d",
                fontStyle: "italic" 
              }}>
                Bugün henüz açık adisyon yok
              </div>
            )}
          </div>

          {/* TABLE GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {masalar.map((masa) => {
              const bilgi = masaBilgileri[masa.no];
              const acik = bilgi.acik;
              const isSelected = seciliMasa === masa.no;
              
              // Eski adisyon uyarısı (bugüne ait değilse)
              const eskiAdisyonUyarisi = bilgi.acik && bilgi.eskiAdisyon;
              
              return (
                <div
                  key={`${masa.no}_${masa.id}`}
                  draggable={acik && gunAktif}
                  onDragStart={(e) => handleDragStart(e, masa)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, masa)}
                  onClick={() => handleSingleClick(masa)}
                  onDoubleClick={() => handleDoubleClick(masa)}
                  style={{
                    background: RENK.kart,
                    color: RENK.kartYazi,
                    borderRadius: "26px",
                    height: "240px",
                    padding: "18px 16px",
                    cursor: gunAktif ? "pointer" : "not-allowed",
                    textAlign: "center",
                    boxShadow: isSelected
                      ? "0 0 0 3px #f5d085, 0 10px 18px rgba(0,0,0,0.35)"
                      : "0 10px 18px rgba(0,0,0,0.45)",
                    transition: "all 0.15s ease",
                    position: "relative",
                    overflow: "hidden",
                    opacity: isSelected ? 1 : 0.95,
                    border: eskiAdisyonUyarisi ? "2px dashed #e74c3c" : "none",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = isSelected ? 1 : 0.95}
                >
                  {/* ESKİ ADISYON UYARISI */}
                  {eskiAdisyonUyarisi && (
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#e74c3c",
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                    }}>
                      ESKİ
                    </div>
                  )}

                  {/* TABLE NUMBER */}
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      marginBottom: "10px",
                      color: RENK.altin,
                    }}
                  >
                    Masa {masa.no}
                  </div>

                  {/* ICON */}
                  <div
                    style={{
                      fontSize: "74px",
                      marginBottom: "10px",
                      color: acik ? RENK.yesil : RENK.altin,
                      textShadow: "0 5px 8px rgba(0,0,0,0.4)",
                      transition: "transform 0.3s",
                      opacity: gunAktif ? 1 : 0.7,
                    }}
                    onMouseOver={(e) => gunAktif && (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseOut={(e) => gunAktif && (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {acik ? "🔔" : "🪑"}
                  </div>

                  {/* TABLE STATUS */}
                  {!acik ? (
                    <div
                      style={{
                        fontSize: "22px",
                        opacity: 0.85,
                        marginTop: "10px",
                        fontWeight: 700,
                        color: "#b8b8b8",
                      }}
                    >
                      BOŞ
                    </div>
                  ) : (
                    <div>
                      {/* ESKİ ADISYON UYARISI MESAJI */}
                      {eskiAdisyonUyarisi && (
                        <div style={{
                          fontSize: "11px",
                          color: "#ff7675",
                          marginBottom: "5px",
                          fontWeight: "bold",
                          background: "rgba(231, 76, 60, 0.1)",
                          padding: "3px 8px",
                          borderRadius: "8px",
                        }}>
                          ⚠️ Önceki günden kaldı
                        </div>
                      )}
                      
                      {/* TIME INFO */}
                      <div
                        style={{
                          fontSize: "14px",
                          marginBottom: "8px",
                          opacity: 0.9,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0 5px",
                        }}
                      >
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>⏰</span>
                          <span>{bilgi.acilisSaati}</span>
                        </div>
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>⏱️</span>
                          <span>{formatSure(bilgi.gecenDakika)}</span>
                        </div>
                      </div>

                      {/* TOTAL AMOUNT - AnaEkran ile uyumlu */}
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 800,
                          color: RENK.altin,
                          marginTop: "5px",
                        }}
                      >
                        ₺ {(bilgi.toplamTutar || 0).toFixed(2)}
                      </div>
                      
                      {/* DRAG HINT */}
                      {acik && gunAktif && (
                        <div
                          style={{
                            fontSize: "11px",
                            opacity: 0.6,
                            marginTop: "8px",
                            fontWeight: 500,
                          }}
                        >
                          📍 Sürükleyerek taşıyabilirsiniz
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      
      {/* FOOTER INFO */}
      <div
        style={{
          marginTop: "30px",
          fontSize: "13px",
          color: "#7f8c8d",
          textAlign: "center",
          padding: "10px",
          borderTop: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div>
          Toplam {masalar.length} masa • 
          Bugün {bugunkuAdisyonlar.length} açık adisyon • 
          Gün: {gunAktif ? 'Aktif' : 'Başlatılmamış'}
        </div>
        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
          {gunAktif ? 
            'Yalnızca bugünkü adisyonlar gösteriliyor • Masa taşıma aktif' :
            'Gün başlatılmadan işlem yapılamaz'
          }
        </div>
      </div>
    </div>
  );
}