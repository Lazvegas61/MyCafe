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

// YENİ: Adisyon toplamını al - TÜM ADİSYONLARI KONTROL ET
const getAdisyonToplam = (adisyonId) => {
  try {
    const key = `mc_adisyon_toplam_${adisyonId}`;
    const toplam = localStorage.getItem(key);
    return toplam ? parseFloat(toplam) : 0;
  } catch {
    return 0;
  }
};

// YENİ: Masa toplamını al
const getMasaToplam = (masaNo) => {
  try {
    const key = `mc_masa_toplam_${masaNo}`;
    const toplam = localStorage.getItem(key);
    return toplam ? parseFloat(toplam) : 0;
  } catch {
    return 0;
  }
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
  const [seciliMasa, setSeciliMasa] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  
  // REFS
  const dragSourceMasaNoRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // --------------------------------------------------
  // DATA MANAGEMENT
  // --------------------------------------------------
  const loadData = useCallback(() => {
    const now = Date.now();
    // 500ms'den daha sık güncelleme yapma
    if (now - lastUpdateRef.current < 500) return;
    
    lastUpdateRef.current = now;
    
    const rawMasalar = readJSON("mc_masalar", []);
    const rawAdisyonlar = readJSON("mc_adisyonlar", []);
    
    // Masaları güncelle (normalizasyon korunuyor)
    setMasalar(prev => {
      // Yeni masaları ekle veya güncelle
      const updated = rawMasalar.map((rawMasa, index) => {
        const existing = prev.find(m => m.no === rawMasa.no);
        if (existing) {
          // Var olan masayı koru, sadece adisyonId güncelle
          return { ...existing, adisyonId: rawMasa.adisyonId || existing.adisyonId };
        }
        // Yeni masa için normalize et
        return normalizeMasa(rawMasa, index);
      });
      return updated;
    });
    
    setAdisyonlar(rawAdisyonlar);
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
  // REAL-TIME UPDATES - DÜZELTİLDİ
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
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonGuncellendi', handleStorageChange);
      window.removeEventListener('odemelerGuncellendi', handleStorageChange);
    };
  }, [loadData]);

  // --------------------------------------------------
  // MASA INFORMATION - BASİTLEŞTİRİLDİ
  // --------------------------------------------------
  const getMasaBilgi = useCallback((masa) => {
    if (!masa.adisyonId) return { acik: false };
    
    const anaAdisyon = adisyonlar.find(a => a.id === masa.adisyonId);
    if (!anaAdisyon) return { acik: false };
    
    // Status kontrolü
    const status = anaAdisyon.status?.toUpperCase() || anaAdisyon.durum?.toUpperCase() || "";
    if (status === "CLOSED" || status === "KAPALI") {
      return { acik: false };
    }
    
    const acilis = anaAdisyon.acilisZamani ? new Date(anaAdisyon.acilisZamani) : null;
    if (!acilis || isNaN(acilis.getTime())) return { acik: false };
    
    const simdi = new Date();
    const gecenDakika = Math.floor((simdi - acilis) / 60000);
    const acilisSaati = formatTime(acilis);
    
    // YENİ: Önce masa toplamını kontrol et, yoksa adisyon toplamlarını topla
    let toplamTutar = getMasaToplam(masa.no);
    
    if (toplamTutar === 0) {
      // Masa toplamı yoksa, adisyon toplamlarını hesapla
      toplamTutar = getAdisyonToplam(masa.adisyonId);
      
      // Aynı masadaki açık ayırma adisyonlarını bul
      const ayirmaAdisyonlari = adisyonlar.filter(a => {
        const isSameMasa = a.masaNo?.toString() === masa.no.toString() || 
                          a.masaNum?.toString() === masa.no.toString();
        const isDifferentId = a.id !== masa.adisyonId;
        const aStatus = a.status?.toUpperCase() || a.durum?.toUpperCase() || "";
        const isOpen = aStatus !== "CLOSED" && aStatus !== "KAPALI";
        
        return isSameMasa && isDifferentId && isOpen;
      });
      
      // Ayırma adisyonlarının toplamını da ekle
      ayirmaAdisyonlari.forEach(ad => {
        toplamTutar += getAdisyonToplam(ad.id);
      });
    }
    
    return {
      acik: true,
      gecenDakika,
      acilisSaati,
      toplamTutar,
      adisyon: anaAdisyon,
      ayirmaSayisi: 0, // Basitleştirdik
    };
  }, [adisyonlar]);

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
    const existingNumbers = masalar.map(m => Number(m.no)).filter(n => !isNaN(n));
    const maxNo = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    const nextNo = (maxNo + 1).toString();
    const yeniMasa = {
      id: `masa_${nextNo}`,
      no: nextNo,
      adisyonId: null,
    };
    
    const yeniListe = [...masalar, yeniMasa];
    saveMasalar(yeniListe);
  }, [masalar, saveMasalar]);

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
    
    // 1. ADİSYONLARI GÜNCELLE (Masa numarasını değiştir)
    const updatedAdisyonlar = adisyonlar.map(ad => {
      // Ana adisyonu güncelle
      if (ad.id === adisyonId) {
        return {
          ...ad,
          masaNo: `MASA ${targetMasa.no}`,
          masaNum: targetMasa.no
        };
      }
      
      // Aynı masadaki ayırma adisyonlarını da güncelle
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
    
    // 2. MASALARI GÜNCELLE
    const updatedMasalar = masalar.map(m => {
      // Kaynak masayı boşalt
      if (m.no === sourceNo) {
        return { ...m, adisyonId: null };
      }
      
      // Hedef masaya adisyonId'yi ata
      if (m.no === targetMasa.no) {
        return { ...m, adisyonId };
      }
      
      return m;
    });
    
    saveMasalar(updatedMasalar);
    
    // 3. LOCALSTORAGE'DAKİ TOPLAM TUTARLARI GÜNCELLE
    // Kaynak masa toplamını hedef masaya taşı
    localStorage.setItem(`mc_masa_toplam_${targetMasa.no}`, sourceToplam.toString());
    
    // Kaynak masa toplamını temizle
    localStorage.removeItem(`mc_masa_toplam_${sourceNo}`);
    
    // Adisyon toplamlarını da güncelle (masa numarası değişti)
    const sourceAdisyonToplam = getAdisyonToplam(adisyonId);
    localStorage.setItem(`mc_adisyon_toplam_${adisyonId}`, sourceAdisyonToplam.toString());
    
    // 4. TÜM AYIRMA ADİSYONLARINI BUL VE GÜNCELLE
    const ayirmaAdisyonlari = adisyonlar.filter(ad => 
      (ad.masaNo === `MASA ${sourceNo}` || ad.masaNum === sourceNo) && 
      ad.id !== adisyonId
    );
    
    ayirmaAdisyonlari.forEach(ad => {
      const ayirmaToplam = getAdisyonToplam(ad.id);
      localStorage.setItem(`mc_adisyon_toplam_${ad.id}`, ayirmaToplam.toString());
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
        m.no === masa.no ? { ...m, adisyonId } : m
      );
      saveMasalar(yeniMasaList);
      
      // Yeni adisyon için masa toplamını sıfırla
      localStorage.setItem(`mc_masa_toplam_${masa.no}`, "0");
    }
    
    // Navigate
    if (typeof onOpenAdisyon === "function") {
      onOpenAdisyon({ masaId: masa.no, adisyonId });
    } else {
      navigate("/adisyon/" + adisyonId);
    }
  }, [masalar, masaBilgileri, adisyonlar, onOpenAdisyon, navigate, saveMasalar, saveAdisyonlar]);

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
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 900,
            color: "#3a2a14",
            margin: 0,
          }}
        >
          Masalar
        </h1>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
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
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
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
              }}
            />
            <button
              onClick={handleDeleteMasa}
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
            >
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {masalar.length === 0 && (
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
          Henüz masa yok. Sağ üstten "+ Masa Ekle" ile masa oluşturabilirsiniz.
        </div>
      )}

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
          
          return (
            <div
              key={`${masa.no}_${masa.id}`}
              draggable={acik}
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
                cursor: "pointer",
                textAlign: "center",
                boxShadow: isSelected
                  ? "0 0 0 3px #f5d085, 0 10px 18px rgba(0,0,0,0.35)"
                  : "0 10px 18px rgba(0,0,0,0.45)",
                transition: "all 0.15s ease",
                position: "relative",
                overflow: "hidden",
                opacity: isSelected ? 1 : 0.95,
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
              onMouseOut={(e) => e.currentTarget.style.opacity = isSelected ? 1 : 0.95}
            >
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
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
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

                  {/* TOTAL AMOUNT - DİREKT LOCALSTORAGE'DAN */}
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: RENK.altin,
                      marginTop: "5px",
                    }}
                  >
                    ₺ {bilgi.toplamTutar.toFixed(2)}
                  </div>
                  
                  {/* DRAG HINT */}
                  {acik && (
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
        Toplam {masalar.length} masa • {masalar.filter(m => masaBilgileri[m.no]?.acik).length} açık adisyon
        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
          Tutarlar anlık güncellenir • Masa taşıma aktif
        </div>
      </div>
    </div>
  );
}