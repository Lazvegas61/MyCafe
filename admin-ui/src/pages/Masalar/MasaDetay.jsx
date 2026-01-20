/* ------------------------------------------------------------
   📌 MasaDetay.jsx - GELİŞTİRİLMİŞ VERSİYON
   - Premium Altın-Kahve teması korundu
   - Toplam hesaplama sistemi optimize edildi (cache kaldırıldı)
   - Masa boşaltma kararı Masalar.jsx'e devredildi
   - Hata yönetimi iyileştirildi
   - Kod temizliği ve performans optimizasyonu
------------------------------------------------------------- */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

// ------------------------------
// UTILITY FONKSİYONLAR
// ------------------------------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    console.error(`Error reading ${key} from localStorage`);
    return fallback;
  }
};

const writeJSON = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

const formatSaat = (dateString) => {
  if (!dateString) return "--:--";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "--:--";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "--:--";
  }
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
  try {
    const bas = new Date(acilis);
    const simdi = new Date();
    return Math.floor((simdi - bas) / 60000);
  } catch {
    return 0;
  }
};

const formatPara = (value) => {
  const num = parseFloat(value || 0);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// TEK GERÇEK KAYNAK - Cache kullanmadan doğrudan hesapla
const hesaplaAdisyonToplam = (adisyon) => {
  if (!adisyon || !Array.isArray(adisyon.kalemler)) return 0;
  
  return adisyon.kalemler.reduce((sum, k) => {
    const adet = Number(k.adet || 1);
    const fiyat = Number(k.birimFiyat || k.fiyat || 0);
    return sum + adet * fiyat;
  }, 0);
};

// ------------------------------
// ANA BİLEŞEN
// ------------------------------
export default function MasaDetay() {
  const { masaNo } = useParams();
  const navigate = useNavigate();
  
  const [masa, setMasa] = useState(null);
  const [adisyon, setAdisyon] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());
  const [kapanisMesaji, setKapanisMesaji] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------
  // MASA BULMA (String/Number uyumlu)
  // ------------------------------
  const findMasaByNo = useCallback((masalar, targetNo) => {
    return masalar.find(m => 
      String(m.no) === String(targetNo) || 
      String(m.id) === String(targetNo) ||
      String(m.masaNum) === String(targetNo)
    );
  }, []);

  // ------------------------------
  // VERİ YÜKLEME - Optimize Edilmiş
  // ------------------------------
  const loadData = useCallback(() => {
    setIsLoading(true);
    console.log('🔄 Masa detay yükleniyor:', masaNo);
    
    const masalar = readJSON("mc_masalar", []);
    const ads = readJSON("mc_adisyonlar", []);
    
    // MASA BUL
    const mevcutMasa = findMasaByNo(masalar, masaNo);
    
    if (!mevcutMasa) {
      console.log('⚠️ Masa bulunamadı:', masaNo);
      setMasa(null);
      setAdisyon(null);
      setIsLoading(false);
      return;
    }
    
    console.log('✅ Masa bulundu:', mevcutMasa);
    setMasa(mevcutMasa);
    
    // MASA BOŞSA veya adisyonId yoksa
    const isMasaBos = mevcutMasa.durum?.toUpperCase() === "BOŞ" || !mevcutMasa.adisyonId;
    if (isMasaBos) {
      console.log('ℹ️ Masa boş, adisyon yok');
      setAdisyon(null);
      setIsLoading(false);
      return;
    }
    
    // AÇIK ADISYON BUL
    const acikAdisyon = ads.find(a => {
      if (a.id !== mevcutMasa.adisyonId) return false;
      
      const durum = (a.status || a.durum || "").toUpperCase();
      return !["CLOSED", "KAPALI", "KAPANDI", "CLOSED"].includes(durum);
    });
    
    if (!acikAdisyon) {
      console.log('⚠️ Açık adisyon bulunamadı');
      // MASA BOŞALTMA KARARI VERMEYİZ - Sadece UI'da göster
      setAdisyon(null);
      setIsLoading(false);
      return;
    }
    
    console.log('✅ Açık adisyon bulundu:', acikAdisyon.id);
    setAdisyon(acikAdisyon);
    setIsLoading(false);
    
  }, [masaNo, findMasaByNo]);

  // ------------------------------
  // REAL-TIME UPDATES
  // ------------------------------
  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      setSimdi(Date.now());
      // Her 30 saniyede bir veri yenile
    }, 30000);
    
    const handleStorageChange = () => {
      console.log('📦 Storage değişikliği algılandı, veri yenileniyor');
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adisyonGuncellendi', handleStorageChange);
    window.addEventListener('masaDurumGuncellendi', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonGuncellendi', handleStorageChange);
      window.removeEventListener('masaDurumGuncellendi', handleStorageChange);
    };
  }, [loadData]);

  // ------------------------------
  // TOPLAM TUTAR - Memoized
  // ------------------------------
  const toplamTutar = useMemo(() => {
    return hesaplaAdisyonToplam(adisyon);
  }, [adisyon]);

  // ------------------------------
  // MASA KAPATMA - GÜVENLİ VERSİYON
  // ------------------------------
  const masaKapat = () => {
    if (!adisyon || !masa) {
      alert("Masa bilgisi bulunamadı.");
      return;
    }
    
    const onayMesaji = `Masa ${masaNo} kapatılsın mı?\n\nToplam: ${formatPara(toplamTutar)} TL\nKalem sayısı: ${(adisyon.kalemler || []).length}`;
    
    if (!window.confirm(onayMesaji)) {
      return;
    }
    
    console.log('🔴 MASA KAPATMA BAŞLIYOR:', { masaNo, adisyonId: adisyon.id });
    
    try {
      // 1. ADISYONU KAPAT
      const ads = readJSON("mc_adisyonlar", []);
      const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
      
      if (adisyonIndex === -1) {
        throw new Error("Adisyon bulunamadı!");
      }
      
      const now = new Date().toISOString();
      
      // Adisyonu güncelle (SADECE KAPAT)
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
      
      // 2. MASA BOŞALTMA İSTEĞİ GÖNDER (Karar Masalar.jsx'e bırakılsın)
      // Custom event ile Masalar.jsx'e sinyal gönder
      window.dispatchEvent(new CustomEvent('masaKapatildi', {
        detail: {
          masaNo: masaNo,
          adisyonId: adisyon.id,
          toplamTutar: toplamTutar,
          zaman: now
        }
      }));
      
      // 3. KASA HAREKETİ KAYDET (OPSİYONEL)
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
      
      // 4. BAŞARI MESAJI VE YÖNLENDİRME
      setKapanisMesaji(`✅ Masa ${masaNo} başarıyla kapatıldı! Toplam: ${formatPara(toplamTutar)} TL`);
      
      // UI'yı güncelle (local state)
      setAdisyon(guncelAdisyon);
      
      // 5. DİĞER COMPONENT'LERE HABER VER
      window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
      
      // 6. 2 SANİYE SONRA MASALARA YÖNLENDİR
      setTimeout(() => {
        navigate("/masalar");
      }, 2000);
      
    } catch (error) {
      console.error('❌ Masa kapatma hatası:', error);
      alert(`Masa kapatılamadı: ${error.message}`);
    }
  };

  // ------------------------------
  // KALEM SİLME - Optimize Edilmiş
  // ------------------------------
  const kalemSil = (kalemId) => {
    if (!adisyon || !kalemId) return;
    
    const kalem = adisyon.kalemler?.find(k => k.id === kalemId);
    if (!kalem) return;
    
    const onayMesaji = `"${kalem.urunAd || 'Ürün'}" kalemi silinsin mi?\nBirim: ₺${formatPara(kalem.birimFiyat || kalem.fiyat)}\nAdet: ${kalem.adet || 1}`;
    
    if (!window.confirm(onayMesaji)) return;
    
    try {
      const yeniKalemler = (adisyon.kalemler || []).filter(k => k.id !== kalemId);
      const guncelAdisyon = { 
        ...adisyon, 
        kalemler: yeniKalemler,
        guncellemeZamani: new Date().toISOString()
      };
      
      // Adisyonu güncelle
      const ads = readJSON("mc_adisyonlar", []);
      const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
      
      if (adisyonIndex !== -1) {
        ads[adisyonIndex] = guncelAdisyon;
        writeJSON("mc_adisyonlar", ads);
        
        // State'i güncelle
        setAdisyon(guncelAdisyon);
        
        // Diğer component'lere haber ver
        window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
        
        alert("✅ Kalem başarıyla silindi.");
      }
    } catch (error) {
      console.error('❌ Kalem silme hatası:', error);
      alert("Kalem silinirken bir hata oluştu.");
    }
  };

  // ------------------------------
  // ADET DEĞİŞTİR
  // ------------------------------
  const adetDegistir = (kalemId, artir = true) => {
    if (!adisyon) return;
    
    try {
      const yeniKalemler = (adisyon.kalemler || []).map(k => {
        if (k.id !== kalemId) return k;
        
        const mevcutAdet = k.adet || 1;
        const yeniAdet = artir ? mevcutAdet + 1 : Math.max(1, mevcutAdet - 1);
        const birimFiyat = k.birimFiyat || k.fiyat || 0;
        
        return {
          ...k,
          adet: yeniAdet,
          toplam: yeniAdet * birimFiyat
        };
      });
      
      const guncelAdisyon = { 
        ...adisyon, 
        kalemler: yeniKalemler,
        guncellemeZamani: new Date().toISOString()
      };
      
      // Adisyonu güncelle
      const ads = readJSON("mc_adisyonlar", []);
      const adisyonIndex = ads.findIndex(a => a.id === adisyon.id);
      
      if (adisyonIndex !== -1) {
        ads[adisyonIndex] = guncelAdisyon;
        writeJSON("mc_adisyonlar", ads);
        
        // State'i güncelle
        setAdisyon(guncelAdisyon);
        
        // Diğer component'lere haber ver
        window.dispatchEvent(new CustomEvent('adisyonGuncellendi'));
      }
    } catch (error) {
      console.error('❌ Adet değiştirme hatası:', error);
    }
  };

  // ------------------------------
  // RENDER - YÜKLENİYOR DURUMU
  // ------------------------------
  if (isLoading) {
    return (
      <div style={{
        background: RENK.arka,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px"
      }}>
        <div style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#4a3722"
        }}>
          Yükleniyor...
        </div>
        <div style={{
          width: "50px",
          height: "50px",
          border: `4px solid ${RENK.altin}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ------------------------------
  // RENDER - MASA BOŞSA
  // ------------------------------
  const isMasaBos = !masa || masa.durum?.toUpperCase() === "BOŞ" || !adisyon;
  
  if (isMasaBos) {
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
        {/* HEADER */}
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
              padding: "12px 24px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, rgba(245,208,133,0.95), rgba(228,184,110,0.9))",
              color: "#3a260f",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: "140px",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ← Masalara Dön
          </button>
        </div>

        {/* BOŞ MASA KARTI */}
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

  // ------------------------------
  // RENDER - MASA DOLUYSA
  // ------------------------------
  const gecenSüre = gecenDakika(adisyon.acilisZamani);
  const acilisSaati = formatSaat(adisyon.acilisZamani);

  return (
    <div style={{
      background: RENK.arka,
      minHeight: "100vh",
      padding: "26px",
      boxSizing: "border-box",
    }}>
      {/* HEADER */}
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
              padding: "12px 24px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #27ae60, #229954)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: "160px",
              transition: "all 0.2s",
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
              padding: "12px 24px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, rgba(245,208,133,0.95), rgba(228,184,110,0.9))",
              color: "#3a260f",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: "140px",
              transition: "all 0.2s",
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
          padding: "15px",
          borderRadius: "10px",
          background: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: "bold",
          animation: "fadeIn 0.5s"
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
        margin: "0 auto",
        '@media (max-width: 900px)': {
          gridTemplateColumns: "1fr"
        }
      }}>
        {/* SOL KOLON: MASA BİLGİLERİ */}
        <div>
          {/* MASA KARTI */}
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
                  fontWeight: "bold",
                  background: "rgba(46, 204, 113, 0.1)",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}>
                  AÇIK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: ADISYON DETAY */}
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
                padding: "8px 16px",
                borderRadius: "20px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
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
                  <div style={{ fontSize: "14px", marginTop: "10px" }}>
                    Ürün eklemek için Masalar sayfasına dönün
                  </div>
                </div>
              ) : (
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{
                      background: "#4a3722",
                      color: "#ffffff",
                      position: "sticky",
                      top: 0
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
                          background: index % 2 === 0 ? "#fffdf7" : "#fff7e6",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#fff0d9"}
                        onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fffdf7" : "#fff7e6"}
                      >
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600" }}>{kalem.urunAd || "Ürün"}</div>
                          {kalem.not && (
                            <div style={{
                              fontSize: "12px",
                              color: "#7f8c8d",
                              fontStyle: "italic",
                              marginTop: "4px"
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
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                border: "1px solid #d0b48c",
                                background: "#fbe9e7",
                                cursor: "pointer",
                                fontSize: "16px",
                                lineHeight: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = "#ffcdd2"}
                              onMouseOut={(e) => e.currentTarget.style.background = "#fbe9e7"}
                            >
                              -
                            </button>
                            
                            <span style={{
                              fontWeight: "bold",
                              minWidth: "30px",
                              textAlign: "center",
                              fontSize: "16px"
                            }}>
                              {kalem.adet || 1}
                            </span>
                            
                            <button
                              onClick={() => adetDegistir(kalem.id, true)}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                border: "1px solid #d0b48c",
                                background: "#e8f5e9",
                                cursor: "pointer",
                                fontSize: "16px",
                                lineHeight: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = "#c8e6c9"}
                              onMouseOut={(e) => e.currentTarget.style.background = "#e8f5e9"}
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
                            <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                              ₺ {formatPara((kalem.adet || 1) * (kalem.birimFiyat || kalem.fiyat || 0))}
                            </span>
                            
                            <button
                              onClick={() => kalemSil(kalem.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "none",
                                background: RENK.kirmizi,
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
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
                <span style={{ color: RENK.altin, fontSize: "18px" }}>
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
          Adisyon ID: {adisyon.id.substring(0, 16)}... • Son güncelleme: {formatSaat(adisyon.guncellemeZamani)}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}