/* ------------------------------------------------------------
   📌 BİRLEŞTİRİLMİŞ MasaDetay.jsx - FINAL
   - Masa kartı ve masa detayı birleştirildi
   - Tasarım DEĞİŞTİRİLMEDİ (Premium Altın-Kahve teması korundu)
   - Bilardo kodları TAMAMEN TEMİZLENDİ
   - Mantıksal hatalar düzeltildi
   - Masalar.jsx ile tam uyumlu
------------------------------------------------------------- */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

// MyCafe Premium Tema Renkleri (TASARIM DEĞİŞMEDİ)
const RENK = {
  arka: "#e5cfa5",
  kart: "#4a3722",
  kartYazi: "#ffffff",
  altin: "#f5d085",
  yesil: "#2ecc71",
  kirmizi: "#c0392b",
  turuncu: "#e67e22",
};

// ------------------------------
// UTILITY FONKSİYONLAR
// ------------------------------
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

const formatSaat = (dateString) => {
  if (!dateString) return "--:--";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const formatSure = (dakika) => {
  if (!dakika || dakika <= 0) return "0 dk";
  const h = Math.floor(dakika / 60);
  const m = dakika % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
};

const gecenDakika = (acilis) => {
  if (!acilis) return 0;
  const bas = new Date(acilis);
  const simdi = new Date();
  return Math.floor((simdi - bas) / 60000);
};

const formatPara = (value) => {
  const num = parseFloat(value || 0);
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// TOPLAM HESAPLAMA - Masalar.jsx ile UYUMLU
const hesaplaAdisyonToplam = (adisyon) => {
  if (!adisyon) return 0;
  
  // 1. Önce localStorage'dan kontrol et
  const storedKey = `mc_adisyon_toplam_${adisyon.id}`;
  const storedTotal = localStorage.getItem(storedKey);
  if (storedTotal) {
    return parseFloat(storedTotal) || 0;
  }
  
  // 2. Yoksa kalemlerden hesapla
  let toplam = 0;
  if (Array.isArray(adisyon.kalemler)) {
    toplam = adisyon.kalemler.reduce((sum, k) => {
      const adet = Number(k.adet || 0);
      const fiyat = Number(k.birimFiyat || k.fiyat || 0);
      return sum + adet * fiyat;
    }, 0);
  }
  
  // 3. Kaydet (sonraki çağrılarda hızlı erişim için)
  localStorage.setItem(storedKey, toplam.toFixed(2));
  return toplam;
};

// ------------------------------
// ANA BİLEŞEN
// ------------------------------
export default function MasaDetay() {
  const { masaNo } = useParams();
  const navigate = useNavigate();
  
  // STATE
  const [masa, setMasa] = useState(null);
  const [adisyon, setAdisyon] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());
  const [kapanisMesaji, setKapanisMesaji] = useState("");

  // ------------------------------
  // MASA + ADİSYON YÜKLEME - DÜZELTİLDİ
  // ------------------------------
  const loadData = useCallback(() => {
    console.log('🔄 Masa detay yükleniyor:', masaNo);
    
    const masalar = readJSON("mc_masalar", []);
    const ads = readJSON("mc_adisyonlar", []);
    
    // MASA BUL - String/Number uyumlu
    let mevcutMasa = null;
    
    // 1. Önce no ile eşleşen masa ara
    mevcutMasa = masalar.find(m => 
      String(m.no) === String(masaNo) || 
      m.id === masaNo ||
      m.masaNum === masaNo
    );
    
    // 2. Bulunamazsa index ile ara
    if (!mevcutMasa) {
      const index = masalar.findIndex(m => String(m.no) === String(masaNo));
      if (index !== -1) {
        mevcutMasa = masalar[index];
      }
    }
    
    setMasa(mevcutMasa || null);
    
    if (!mevcutMasa) {
      console.log('⚠️ Masa bulunamadı:', masaNo);
      setAdisyon(null);
      return;
    }
    
    console.log('✅ Masa bulundu:', mevcutMasa);
    
    // MASA BOŞSA adisyon yok
    if (mevcutMasa.durum?.toUpperCase() === "BOŞ" || !mevcutMasa.adisyonId) {
      setAdisyon(null);
      return;
    }
    
    // AÇIK ADİSYON BUL
    const acikAdisyon = ads.find(a => 
      a.id === mevcutMasa.adisyonId &&
      !["CLOSED", "KAPALI", "KAPALI"].includes((a.status || a.durum || "").toUpperCase())
    );
    
    if (!acikAdisyon) {
      console.log('⚠️ Açık adisyon bulunamadı, masa boş gösterilecek');
      // Masa durumunu güncelle (BOŞ yap)
      const updatedMasalar = masalar.map(m => 
        m.no === mevcutMasa.no ? { ...m, durum: "BOŞ", adisyonId: null } : m
      );
      writeJSON("mc_masalar", updatedMasalar);
      setMasa({ ...mevcutMasa, durum: "BOŞ", adisyonId: null });
      setAdisyon(null);
      return;
    }
    
    console.log('✅ Açık adisyon bulundu:', acikAdisyon.id);
    setAdisyon(acikAdisyon);
    
  }, [masaNo]);

  // ------------------------------
  // REAL-TIME UPDATES
  // ------------------------------
  useEffect(() => {
    loadData();
    
    // Her 10 saniyede bir güncelle
    const interval = setInterval(() => {
      setSimdi(Date.now());
      loadData();
    }, 10000);
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adisyonGuncellendi', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonGuncellendi', handleStorageChange);
    };
  }, [loadData]);

  // ------------------------------
  // MASA KAPATMA - TAM DÜZELTİLDİ
  // ------------------------------
  const masaKapat = () => {
    if (!adisyon || !masa) {
      alert("Masa bilgisi bulunamadı.");
      return;
    }
    
    if (!window.confirm(`Masa ${masaNo} kapatılsın mı?\nToplam: ${formatPara(hesaplaAdisyonToplam(adisyon))} TL`)) {
      return;
    }
    
    console.log('🔴 MASA KAPATMA BAŞLIYOR:', { masaNo, adisyonId: adisyon.id });
    
    // 1. ADİSYONLARI GÜNCELLE
    const ads = readJSON("mc_adisyonlar", []);
    const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
    
    if (adisyonIndex === -1) {
      alert("Adisyon bulunamadı!");
      return;
    }
    
    const toplamTutar = hesaplaAdisyonToplam(adisyon);
    const now = new Date().toISOString();
    
    // Adisyonu KAPALI yap
    const guncelAdisyon = {
      ...ads[adisyonIndex],
      status: "CLOSED",
      durum: "KAPALI",
      kapanisZamani: now,
      toplamTutar: toplamTutar.toFixed(2),
      guncellemeZamani: now
    };
    
    ads[adisyonIndex] = guncelAdisyon;
    writeJSON("mc_adisyonlar", ads);
    console.log('✅ Adisyon kapatıldı:', guncelAdisyon.id);
    
    // 2. MASALARI GÜNCELLE - EN KRİTİK KISIM!
    const masalar = readJSON("mc_masalar", []);
    const masaIndex = masalar.findIndex(m => String(m.no) === String(masaNo));
    
    if (masaIndex === -1) {
      console.error('❌ Masa bulunamadı:', masaNo);
      alert("Masa bulunamadı!");
      return;
    }
    
    // Masayı BOŞ yap ve tüm alanları temizle
    masalar[masaIndex] = {
      ...masalar[masaIndex],
      durum: "BOŞ", // ✅ BU ÇOK ÖNEMLİ!
      adisyonId: null,
      toplamTutar: "0.00",
      acilisZamani: null,
      kapanisZamani: now,
      guncellemeZamani: now,
      renk: "gri",
      musteriAdi: null,
      kisiSayisi: null
    };
    
    writeJSON("mc_masalar", masalar);
    console.log('✅ Masa boşaltıldı:', masaNo);
    
    // 3. LOCALSTORAGE TOPLAMLARINI TEMİZLE
    const masaToplamKey = `mc_masa_toplam_${masaNo}`;
    const adisyonToplamKey = `mc_adisyon_toplam_${adisyon.id}`;
    
    localStorage.removeItem(masaToplamKey);
    localStorage.removeItem(adisyonToplamKey);
    console.log('🗑️ Toplam temizlendi:', masaToplamKey, adisyonToplamKey);
    
    // 4. KASA HAREKETİ KAYDET (OPSİYONEL)
    try {
      const kasalar = readJSON("mc_kasalar", []);
      const kasaHareketi = {
        id: Date.now().toString(),
        tarih: now,
        masaNo: masaNo,
        adisyonId: adisyon.id,
        aciklama: `Masa ${masaNo} Kapatıldı`,
        giren: toplamTutar,
        cikan: 0,
        bakiye: 0,
        tip: "MASA_KAPATMA"
      };
      kasalar.push(kasaHareketi);
      writeJSON("mc_kasalar", kasalar);
      console.log('💰 Kasa hareketi kaydedildi');
    } catch (error) {
      console.warn('⚠️ Kasa kaydedilemedi:', error);
    }
    
    // 5. EVENT'LERİ TETİKLE (Masalar.jsx'in güncellenmesi için)
    window.dispatchEvent(new StorageEvent('storage', {
      key: "mc_masalar",
      newValue: JSON.stringify(masalar)
    }));
    
    window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
    window.dispatchEvent(new CustomEvent('odemelerGuncellendi'));
    
    // 6. BAŞARI MESAJI
    setKapanisMesaji(`✅ Masa ${masaNo} başarıyla kapatıldı! Toplam: ${formatPara(toplamTutar)} TL`);
    
    // 7. 2 SANİYE SONRA MASALARA YÖNLENDİR
    setTimeout(() => {
      navigate("/masalar");
    }, 2000);
  };

  // ------------------------------
  // KALEM SİLME
  // ------------------------------
  const kalemSil = (kalemId) => {
    if (!adisyon || !window.confirm("Bu kalemi silmek istediğinize emin misiniz?")) {
      return;
    }
    
    const yeniKalemler = (adisyon.kalemler || []).filter(k => k.id !== kalemId);
    const guncelAdisyon = { ...adisyon, kalemler: yeniKalemler };
    
    // Adisyonu güncelle
    const ads = readJSON("mc_adisyonlar", []);
    const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
    
    if (adisyonIndex !== -1) {
      ads[adisyonIndex] = guncelAdisyon;
      writeJSON("mc_adisyonlar", ads);
      setAdisyon(guncelAdisyon);
      
      // Toplam tutarı güncelle
      const yeniToplam = hesaplaAdisyonToplam(guncelAdisyon);
      localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, yeniToplam.toString());
      localStorage.setItem(`mc_masa_toplam_${masaNo}`, yeniToplam.toString());
      
      // Event tetikle
      window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
      
      alert("Kalem silindi.");
    }
  };

  // ------------------------------
  // ADET ARTIR/AZALT
  // ------------------------------
  const adetDegistir = (kalemId, artir = true) => {
    if (!adisyon) return;
    
    const yeniKalemler = (adisyon.kalemler || []).map(k => {
      if (k.id !== kalemId) return k;
      
      const yeniAdet = artir ? (k.adet || 1) + 1 : Math.max(1, (k.adet || 1) - 1);
      return {
        ...k,
        adet: yeniAdet,
        toplam: yeniAdet * (k.birimFiyat || k.fiyat || 0)
      };
    });
    
    const guncelAdisyon = { ...adisyon, kalemler: yeniKalemler };
    
    // Adisyonu güncelle
    const ads = readJSON("mc_adisyonlar", []);
    const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
    
    if (adisyonIndex !== -1) {
      ads[adisyonIndex] = guncelAdisyon;
      writeJSON("mc_adisyonlar", ads);
      setAdisyon(guncelAdisyon);
      
      // Toplam tutarı güncelle
      const yeniToplam = hesaplaAdisyonToplam(guncelAdisyon);
      localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, yeniToplam.toString());
      localStorage.setItem(`mc_masa_toplam_${masaNo}`, yeniToplam.toString());
      
      // Event tetikle
      window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
    }
  };

  // ------------------------------
  // RENDER - MASALAR.JSX TASARIMI KORUNDU
  // ------------------------------
  
  // MASA BOŞSA - MASALAR.JSX STİLİNDE GÖSTER
  if (!masa || masa.durum?.toUpperCase() === "BOŞ" || !adisyon) {
    return (
      <div style={{
        background: RENK.arka,
        minHeight: "100vh",
        padding: "26px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* MASALAR.JSX HEADER STİLİ */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          width: "100%",
          maxWidth: "800px"
        }}>
          <h1 style={{
            fontSize: "40px",
            fontWeight: 900,
            color: "#3a2a14",
            margin: 0,
          }}>
            Masa {masaNo}
          </h1>
          
          <button
            onClick={() => navigate("/masalar")}
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
            ← Masalara Dön
          </button>
        </div>

        {/* BOŞ MASA KARTI - MASALAR.JSX STİLİNDE */}
        <div style={{
          background: RENK.kart,
          color: RENK.kartYazi,
          borderRadius: "26px",
          width: "100%",
          maxWidth: "400px",
          height: "300px",
          padding: "30px",
          textAlign: "center",
          boxShadow: "0 10px 18px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px"
        }}>
          {/* MASA NUMARASI */}
          <div style={{
            fontSize: "36px",
            fontWeight: 900,
            color: RENK.altin,
          }}>
            Masa {masaNo}
          </div>

          {/* İKON */}
          <div style={{
            fontSize: "90px",
            color: RENK.altin,
            textShadow: "0 5px 8px rgba(0,0,0,0.4)",
          }}>
            🪑
          </div>

          {/* DURUM */}
          <div style={{
            fontSize: "28px",
            opacity: 0.85,
            fontWeight: 700,
            color: "#b8b8b8",
          }}>
            BOŞ
          </div>
          
          {/* AÇIKLAMA */}
          <div style={{
            fontSize: "16px",
            color: "#a0a0a0",
            marginTop: "10px",
            textAlign: "center",
            lineHeight: "1.4"
          }}>
            Bu masa şu anda boş.<br />
            Yeni adisyon açmak için Masalar sayfasından<br />
            bu masaya çift tıklayın.
          </div>
        </div>
        
        {/* FOOTER */}
        <div style={{
          marginTop: "30px",
          fontSize: "13px",
          color: "#7f8c8d",
          textAlign: "center",
          padding: "10px",
        }}>
          <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
            Adisyon eklemek için Masalar sayfasına dönün
          </div>
        </div>
      </div>
    );
  }

  // MASA DOLUYSA - DETAYLI GÖSTERİM
  const toplamTutar = hesaplaAdisyonToplam(adisyon);
  const gecenSüre = gecenDakika(adisyon.acilisZamani);
  const acilisSaati = formatSaat(adisyon.acilisZamani);

  return (
    <div style={{
      background: RENK.arka,
      minHeight: "100vh",
      padding: "26px",
      boxSizing: "border-box",
    }}>
      {/* HEADER - MASALAR.JSX STİLİ */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <h1 style={{
          fontSize: "40px",
          fontWeight: 900,
          color: "#3a2a14",
          margin: 0,
        }}>
          Masa {masaNo} Detay
        </h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          {/* MASAYI KAPAT BUTONU */}
          <button
            onClick={masaKapat}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #27ae60, #229954)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: "140px",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ✕ MASAYI KAPAT
          </button>

          {/* MASALARA DÖN */}
          <button
            onClick={() => navigate("/masalar")}
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
            ← Masalara Dön
          </button>
        </div>
      </div>

      {/* KAPANIŞ MESAJI */}
      {kapanisMesaji && (
        <div style={{
          marginBottom: "20px",
          padding: "12px",
          borderRadius: "10px",
          background: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: "bold"
        }}>
          {kapanisMesaji}
        </div>
      )}

      {/* ANA İÇERİK - 2 KOLONLU */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* SOL KOLON: MASA BİLGİLERİ ve ÖZET */}
        <div>
          {/* MASA KARTI - MASALAR.JSX STİLİNDE (DOLU) */}
          <div style={{
            background: RENK.kart,
            color: RENK.kartYazi,
            borderRadius: "26px",
            height: "280px",
            padding: "18px 16px",
            textAlign: "center",
            boxShadow: "0 10px 18px rgba(0,0,0,0.45)",
            position: "relative",
            overflow: "hidden",
            marginBottom: "24px"
          }}>
            {/* MASA NUMARASI */}
            <div style={{
              fontSize: "26px",
              fontWeight: 900,
              marginBottom: "10px",
              color: RENK.altin,
            }}>
              Masa {masa.no}
            </div>

            {/* İKON */}
            <div style={{
              fontSize: "74px",
              marginBottom: "10px",
              color: RENK.yesil,
              textShadow: "0 5px 8px rgba(0,0,0,0.4)",
            }}>
              🔔
            </div>

            {/* ZAMAN BİLGİLERİ */}
            <div style={{
              fontSize: "14px",
              marginBottom: "8px",
              opacity: 0.9,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 5px",
            }}>
              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⏰</span>
                <span>Açılış: {acilisSaati}</span>
              </div>
              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⏱️</span>
                <span>{formatSure(gecenSüre)}</span>
              </div>
            </div>

            {/* TOPLAM TUTAR */}
            <div style={{
              fontSize: "28px",
              fontWeight: 800,
              color: RENK.altin,
              marginTop: "15px",
            }}>
              ₺ {formatPara(toplamTutar)}
            </div>
            
            {/* KALEM SAYISI */}
            <div style={{
              fontSize: "14px",
              opacity: 0.7,
              marginTop: "8px",
            }}>
              {(adisyon.kalemler || []).length} adet ürün
            </div>
          </div>

          {/* MÜŞTERİ BİLGİLERİ */}
          <div style={{
            background: "#fff7e6",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{
              color: "#4a3722",
              marginTop: 0,
              marginBottom: "15px",
              borderBottom: "2px solid #f5d085",
              paddingBottom: "8px"
            }}>
              Müşteri Bilgileri
            </h3>
            
            <div style={{
              display: "grid",
              gap: "10px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span style={{ fontWeight: "600" }}>Müşteri Adı:</span>
                <span>{adisyon.musteriAdi || "Kayıtlı Değil"}</span>
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span style={{ fontWeight: "600" }}>Adisyon ID:</span>
                <span style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  background: "#f0f0f0",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {adisyon.id.substring(0, 12)}...
                </span>
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span style={{ fontWeight: "600" }}>Durum:</span>
                <span style={{
                  color: RENK.yesil,
                  fontWeight: "bold"
                }}>
                  AÇIK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: ADİSYON DETAY */}
        <div>
          <div style={{
            background: "#fff7e6",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            height: "100%"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{
                color: "#4a3722",
                margin: 0
              }}>
                Adisyon Kalemleri
              </h3>
              
              <div style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#4a3722",
                background: "#f5d085",
                padding: "6px 12px",
                borderRadius: "20px"
              }}>
                ₺ {formatPara(toplamTutar)}
              </div>
            </div>
            
            {/* KALEM LİSTESİ */}
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              borderRadius: "8px",
              border: "1px solid #e5cfa5"
            }}>
              {(adisyon.kalemler || []).length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#a0a0a0",
                  fontSize: "16px"
                }}>
                  🛒 Adisyonda henüz ürün yok
                </div>
              ) : (
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{
                      background: "#4a3722",
                      color: "#ffffff"
                    }}>
                      <th style={{ padding: "12px", textAlign: "left", width: "40%" }}>Ürün</th>
                      <th style={{ padding: "12px", textAlign: "center", width: "20%" }}>Adet</th>
                      <th style={{ padding: "12px", textAlign: "right", width: "20%" }}>Birim</th>
                      <th style={{ padding: "12px", textAlign: "right", width: "20%" }}>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adisyon.kalemler || []).map((kalem, index) => (
                      <tr 
                        key={kalem.id || index}
                        style={{
                          borderBottom: "1px solid #e5cfa5",
                          background: index % 2 === 0 ? "#fffdf7" : "#fff7e6"
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600" }}>{kalem.urunAd || "Ürün"}</div>
                          {kalem.not && (
                            <div style={{
                              fontSize: "12px",
                              color: "#7f8c8d",
                              fontStyle: "italic",
                              marginTop: "2px"
                            }}>
                              📝 {kalem.not}
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                          }}>
                            <button
                              onClick={() => adetDegistir(kalem.id, false)}
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                border: "1px solid #d0b48c",
                                background: "#fbe9e7",
                                cursor: "pointer",
                                fontSize: "16px",
                                lineHeight: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              -
                            </button>
                            
                            <span style={{
                              fontWeight: "bold",
                              minWidth: "30px",
                              textAlign: "center"
                            }}>
                              {kalem.adet || 1}
                            </span>
                            
                            <button
                              onClick={() => adetDegistir(kalem.id, true)}
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                border: "1px solid #d0b48c",
                                background: "#e8f5e9",
                                cursor: "pointer",
                                fontSize: "16px",
                                lineHeight: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          ₺ {formatPara(kalem.birimFiyat || kalem.fiyat || 0)}
                        </td>
                        
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px"
                          }}>
                            <span style={{ fontWeight: "bold" }}>
                              ₺ {formatPara(kalem.toplam || 0)}
                            </span>
                            
                            <button
                              onClick={() => kalemSil(kalem.id)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "none",
                                background: RENK.kirmizi,
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}
                              title="Sil"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* TOPLAM ÖZET */}
            <div style={{
              marginTop: "20px",
              padding: "15px",
              background: "#4a3722",
              color: "#ffffff",
              borderRadius: "10px",
              display: "grid",
              gap: "8px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px"
              }}>
                <span>Toplam Kalem:</span>
                <span>{(adisyon.kalemler || []).length} adet</span>
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: "bold",
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "8px",
                marginTop: "8px"
              }}>
                <span>GENEL TOPLAM:</span>
                <span style={{ color: RENK.altin }}>
                  ₺ {formatPara(toplamTutar)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BİLGİ */}
      <div style={{
        marginTop: "30px",
        fontSize: "13px",
        color: "#7f8c8d",
        textAlign: "center",
        padding: "10px",
        borderTop: "1px solid rgba(0,0,0,0.1)",
      }}>
        Masa {masaNo} • Açılış: {acilisSaati} • Geçen Süre: {formatSure(gecenSüre)}
        <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
          Adisyon ID: {adisyon.id.substring(0, 16)}...
        </div>
      </div>
    </div>
  );
}