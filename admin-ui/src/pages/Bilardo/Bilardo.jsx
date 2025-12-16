// admin-ui/src/pages/Bilardo/Bilardo.jsx
/* ------------------------------------------------------------
   📌 Bilardo.jsx — MODERN V13 (Görsel Tasarımlı)
   
   DEĞİŞİKLİKLER:
   1. Görseldeki gibi modern tasarım
   2. "Masaya Aktar" butonu güncellendi
   3. Çift tıklama ile adisyona gitme - DÜZELTİLDİ
   4. Toplam tutar gösterimi (ek ürünlerle)
   5. Premium bilardo ikonu
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // EKLE
import "./Bilardo.css";

export default function Bilardo() {
  const navigate = useNavigate(); // EKLE
  
  // ANA STATE'LER
  const [masalar, setMasalar] = useState([]);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  const [sureBittiPopup, setSureBittiPopup] = useState(null);
  
  // MODAL STATE'LERİ
  const [aktarimModal, setAktarimModal] = useState({
    acik: false,
    bilardoMasa: null,
    seciliMasa: null
  });
  
  // BİLARDO İKONU (Premium SVG)
  const BilardoIkon = ({ size = 48, className = "" }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={`bilardo-icon-svg ${className}`}
    >
      <rect x="4" y="12" width="40" height="24" rx="8" fill="#4A3722" stroke="#D4AF37" strokeWidth="3"/>
      <rect x="8" y="16" width="32" height="16" rx="4" fill="#2E7D32"/>
      <circle cx="15" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="24" cy="16" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="33" cy="20" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="18" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="30" cy="28" r="4" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="3" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1"/>
      <rect x="12" y="36" width="4" height="8" fill="#8B4513"/>
      <rect x="32" y="36" width="4" height="8" fill="#8B4513"/>
    </svg>
  );

  /* ============================================================
     📌 1. LOCALSTORAGE İŞLEMLERİ
  ============================================================ */
  
  useEffect(() => {
    const loadData = () => {
      // 1. Bilardo masalarını yükle
      const bilardoData = JSON.parse(localStorage.getItem("bilardo") || "[]");
      
      // Eğer bilardo masaları boşsa, oluştur
      if (bilardoData.length === 0) {
        const yeniMasalar = [];
        for (let i = 1; i <= 10; i++) {
          yeniMasalar.push({
            id: 100 + i, // 101-110
            no: `B${i}`,
            acik: false,
            durum: "KAPALI",
            sureTipi: null,
            acilisSaati: null,
            ucret: 0,
            aktifAdisyonId: null
          });
        }
        localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
        setMasalar(yeniMasalar);
      } else {
        setMasalar(bilardoData);
      }
      
      // 2. Ücret ayarlarını yükle
      const saved = JSON.parse(localStorage.getItem("bilardo_ucretleri"));
      if (saved) {
        setUcretAyarlari(saved);
      } else {
        const defaultAyarlar = {
          bilardo30dk: 80,
          bilardo1saat: 120,
          bilardoDakikaUcreti: 2
        };
        setUcretAyarlari(defaultAyarlar);
        localStorage.setItem("bilardo_ucretleri", JSON.stringify(defaultAyarlar));
      }
      
      // 3. Normal masaları yükle (aktarım için)
      const normalMasaData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
      const bosMasalar = normalMasaData.filter(m => {
        const durum = m.durum || "";
        return durum === "BOŞ" || !m.adisyonId;
      });
    };
    
    loadData();
    
    // Süre kontrolü için interval
    const sureInterval = setInterval(() => {
      kontrolSureBitti();
    }, 30000);
    
    // Veri güncelleme için interval
    const dataInterval = setInterval(loadData, 60000);
    
    return () => {
      clearInterval(sureInterval);
      clearInterval(dataInterval);
    };
  }, []);
  
  // LocalStorage'a kaydet
  const saveMasalar = (arr) => {
    setMasalar(arr);
    localStorage.setItem("bilardo", JSON.stringify(arr));
  };
  
  // Bilardo adisyonunu getir
  const getBilardoAdisyon = (adisyonId) => {
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    return adisyonlar.find(a => a.id === adisyonId) || null;
  };
  
  // Toplam tutarı hesapla (bilardo + ek ürünler)
  const toplamTutarHesapla = (masa) => {
    if (!masa.aktifAdisyonId) return masa.ucret || 0;
    
    const adisyon = getBilardoAdisyon(masa.aktifAdisyonId);
    if (!adisyon) return masa.ucret || 0;
    
    const bilardoUcret = adisyon.hesaplananUcret || 0;
    const ekUrunToplam = (adisyon.ekUrunler || []).reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
    
    return bilardoUcret + ekUrunToplam;
  };

  /* ============================================================
     📌 2. ÜCRET HESAPLAMA
  ============================================================ */
  
  const ucretHesapla = (sureTipi, dakika) => {
    if (!ucretAyarlari) return 0;
    
    const bilardo30dk = ucretAyarlari.bilardo30dk || ucretAyarlari.ilk40 || 80;
    const bilardo1saat = ucretAyarlari.bilardo1saat || ucretAyarlari.u60 || 120;
    const bilardoDakikaUcreti = ucretAyarlari.bilardoDakikaUcreti || ucretAyarlari.dk2 || 2;
    
    switch(sureTipi) {
      case "30dk":
        return bilardo30dk;
      case "1saat":
        return bilardo1saat;
      case "suresiz":
        if (dakika <= 30) {
          return bilardo30dk;
        } else {
          const ekDakika = dakika - 30;
          return bilardo30dk + (Math.ceil(ekDakika) * bilardoDakikaUcreti);
        }
      default:
        return 0;
    }
  };
  
  const dakikaHesapla = (acilisSaati) => {
    if (!acilisSaati) return 0;
    const now = Date.now();
    return Math.floor((now - acilisSaati) / 60000);
  };

  /* ============================================================
     📌 3. MASA İŞLEMLERİ - DÜZELTİLDİ
  ============================================================ */
  
  const masaEkle = () => {
    const yeniMasa = {
      id: Date.now(),
      no: `B${masalar.length + 1}`,
      acik: false,
      durum: "KAPALI",
      sureTipi: null,
      acilisSaati: null,
      ucret: 0,
      aktifAdisyonId: null
    };
    
    saveMasalar([...masalar, yeniMasa]);
  };
  
  const masaNoIleSil = () => {
    const masaNo = parseInt(silMasaNo.trim());
    if (isNaN(masaNo) || masaNo < 1) {
      alert("Geçerli bir masa numarası girin!");
      return;
    }
    
    const masaIndex = masaNo - 1;
    if (masaIndex < 0 || masaIndex >= masalar.length) {
      alert("Bu numarada bir masa yok!");
      return;
    }
    
    const masa = masalar[masaIndex];
    
    if (masa.durum === "ACIK" || masa.acik) {
      alert("Açık masa silinemez! Önce oyunu bitirin.");
      return;
    }
    
    // Eğer adisyon varsa sil
    if (masa.aktifAdisyonId) {
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const yeniAdisyonlar = adisyonlar.filter(a => a.id !== masa.aktifAdisyonId);
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(yeniAdisyonlar));
    }
    
    const filtered = masalar.filter((m, index) => index !== masaIndex);
    
    // Masa numaralarını yeniden düzenle
    const numberedMasalar = filtered.map((m, index) => ({
      ...m,
      no: `B${index + 1}`
    }));
    
    saveMasalar(numberedMasalar);
    setSilMasaNo("");
    
    alert(`Bilardo Masa ${masaNo} başarıyla silindi.`);
  };
  
  const masaAc = (masa, tip, index) => {
    // Yeni bilardo adisyonu oluştur
    const yeniAdisyon = {
      id: `bilardo_ad_${Date.now()}`,
      bilardoMasaId: masa.id,
      bilardoMasaNo: `BİLARDO ${index + 1}`,
      sureTipi: tip,
      acilisZamani: Date.now(),
      kapanisZamani: null,
      durum: "ACIK",
      gecenDakika: 0,
      hesaplananUcret: ucretHesapla(tip, 0),
      ekUrunler: [],
      odemeler: [],
      toplamOdenen: 0,
      not: ""
    };
    
    // Adisyonları kaydet
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    adisyonlar.push(yeniAdisyon);
    localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    
    // Masayı güncelle
    const updated = masalar.map((m, i) =>
      i === index
        ? {
            ...m,
            acik: true,
            durum: "ACIK",
            sureTipi: tip,
            acilisSaati: Date.now(),
            aktifAdisyonId: yeniAdisyon.id,
            ucret: ucretHesapla(tip, 0)
          }
        : m
    );
    
    saveMasalar(updated);
  };
  
  // ÇİFT TIKLAMA: Bilardo adisyonuna git - DÜZELTİLDİ
  const handleCardDoubleClick = (masa) => {
    if (!masa.aktifAdisyonId) {
      alert("Bu masa için henüz adisyon oluşturulmamış!");
      return;
    }
    
    // REACT ROUTER İLE yönlendir
    navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
  };
  
  // TEK TIKLAMA: Ödeme yap
  const handleCardClick = (masa, index) => {
    if (masa.acik) {
      // REACT ROUTER İLE yönlendir
      navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
    }
  };

  /* ============================================================
     📌 4. MASAYA AKTARIM
  ============================================================ */
  
  const masaAktarModalAc = (masa, index, e) => {
    e.stopPropagation(); // Kart tıklamasını engelle
    
    // Boş normal masaları yükle
    const normalMasaData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const bosMasalar = normalMasaData.filter(m => {
      const durum = m.durum || "";
      return durum === "BOŞ" || !m.adisyonId;
    });
    
    setAktarimModal({
      acik: true,
      bilardoMasa: { ...masa, index },
      seciliMasa: null,
      normalMasalar: bosMasalar
    });
  };
  
  const masaAktar = () => {
    const { bilardoMasa, seciliMasa } = aktarimModal;
    
    if (!bilardoMasa || !seciliMasa) {
      alert("Lütfen aktarılacak masa seçin!");
      return;
    }
    
    // Bilardo adisyonunu normal masaya aktar
    const adisyon = getBilardoAdisyon(bilardoMasa.aktifAdisyonId);
    if (!adisyon) {
      alert("Bilardo adisyonu bulunamadı!");
      return;
    }
    
    // Normal masayı güncelle
    const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const updatedMasalar = masalarData.map(m => {
      if (m.id === seciliMasa.id || m.no === seciliMasa.no) {
        return {
          ...m,
          durum: "DOLU",
          adisyonId: `bilardo_transfer_${Date.now()}`,
          toplamTutar: toplamTutarHesapla(bilardoMasa).toFixed(2),
          acilisZamani: new Date().toISOString(),
          musteriAdi: `Bilardo Masa ${bilardoMasa.index + 1} Transfer`,
          guncellemeZamani: new Date().toISOString()
        };
      }
      return m;
    });
    
    localStorage.setItem("mc_masalar", JSON.stringify(updatedMasalar));
    
    // Bilardo masasını kapat
    const updatedBilardoMasalar = masalar.map((m, i) => 
      i === bilardoMasa.index 
        ? { 
            ...m, 
            acik: false, 
            durum: "KAPALI", 
            sureTipi: null, 
            acilisSaati: null,
            ucret: 0,
            aktifAdisyonId: null
          }
        : m
    );
    
    saveMasalar(updatedBilardoMasalar);
    
    alert(`Bilardo adisyonu MASA ${seciliMasa.no}'ya başarıyla aktarıldı!`);
    setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null });
  };

  /* ============================================================
     📌 5. SÜRE TAKİBİ ve POPUP
  ============================================================ */
  
  const kontrolSureBitti = () => {
    const now = Date.now();
    let yeniPopup = null;
    
    masalar.forEach(masa => {
      if (masa.acik && masa.acilisSaati) {
        const gecenDakika = Math.floor((now - masa.acilisSaati) / 60000);
        
        if (masa.sureTipi === "30dk" && gecenDakika >= 30) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masalar.findIndex(m => m.id === masa.id) + 1,
            mesaj: "30 dakika süresi doldu!",
            timestamp: now
          };
        } else if (masa.sureTipi === "1saat" && gecenDakika >= 60) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masalar.findIndex(m => m.id === masa.id) + 1,
            mesaj: "1 saat süresi doldu!",
            timestamp: now
          };
        }
      }
    });
    
    if (yeniPopup && (!sureBittiPopup || sureBittiPopup.masaId !== yeniPopup.masaId)) {
      setSureBittiPopup(yeniPopup);
      
      setTimeout(() => {
        setSureBittiPopup(prev => 
          prev?.masaId === yeniPopup.masaId ? null : prev
        );
      }, 30000);
    }
  };
  
  const popupTiklandi = () => {
    if (!sureBittiPopup) return;
    
    setSureBittiPopup(null);
    
    const masaIndex = masalar.findIndex(m => m.id === sureBittiPopup.masaId);
    if (masaIndex !== -1) {
      const cardElement = document.querySelector(`[data-masa-id="${sureBittiPopup.masaId}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardElement.style.boxShadow = '0 0 0 3px #ff0000';
        setTimeout(() => {
          if (cardElement) cardElement.style.boxShadow = '';
        }, 2000);
      }
    }
  };

  /* ============================================================
     📌 6. EKRAN RENDER
  ============================================================ */
  
  return (
    <div className="bilardo-container">
      
      {/* SÜRE BİTTİ POPUP */}
      {sureBittiPopup && (
        <div className="bilardo-sure-bitti-popup" onClick={popupTiklandi}>
          <div className="bilardo-popup-baslik">
            <BilardoIkon size={24} /> ⏰ SÜRE DOLDU!
          </div>
          <div className="bilardo-popup-mesaj">
            BİLARDO {sureBittiPopup.masaNo}: {sureBittiPopup.mesaj}
          </div>
          <div className="bilardo-popup-not">
            Tıklayarak masaya gidin...
          </div>
        </div>
      )}
      
      {/* MODERN BAŞLIK ALANI */}
      <div className="bilardo-header">
        <div className="bilardo-title-section">
          <div className="bilardo-main-icon">
            <BilardoIkon size={40} />
          </div>
          <h1 className="bilardo-title">BİLARDO MASALARI</h1>
        </div>
        
        <div className="bilardo-actions">
          {/* MASA SİLME ALANI */}
          <div className="bilardo-silme-alani">
            <label>Masa Sil:</label>
            <input
              type="number"
              placeholder="No"
              value={silMasaNo}
              onChange={(e) => setSilMasaNo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && masaNoIleSil()}
              className="bilardo-silme-input"
              min="1"
            />
            <button onClick={masaNoIleSil} className="bilardo-silme-btn">
              Sil
            </button>
          </div>
          
          <button 
            className="bilardo-ayarlar-btn"
            onClick={() => navigate("/ayarlar?tab=bilardo_ucret")}
          >
            ⚙️ Ayarlar
          </button>
          
          <button className="masa-btn-ekle" onClick={masaEkle}>
            + Masa Ekle
          </button>
        </div>
      </div>
      
      {/* ÜCRET BİLGİSİ BANNER */}
      {ucretAyarlari && (
        <div className="bilardo-ucret-banner">
          <div className="bilardo-ucret-item">
            <span>30 Dakika</span>
            <strong>{ucretAyarlari.bilardo30dk || ucretAyarlari.ilk40 || 80}₺</strong>
            <small>30dk'dan önce kapanırsa da aynı</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>1 Saat</span>
            <strong>{ucretAyarlari.bilardo1saat || ucretAyarlari.u60 || 120}₺</strong>
            <small>Saatlik ücret</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>Süresiz</span>
            <strong>{ucretAyarlari.bilardo30dk || ucretAyarlari.ilk40 || 80}₺</strong>
            <small>+ {ucretAyarlari.bilardoDakikaUcreti || ucretAyarlari.dk2 || 2}₺/dk (30dk sonrası)</small>
          </div>
        </div>
      )}
      
      {/* MODERN MASA GRID */}
      <div className="bilardo-grid">
        {masalar.map((masa, index) => {
          const dakika = dakikaHesapla(masa.acilisSaati);
          const bilardoUcret = masa.acik ? ucretHesapla(masa.sureTipi, dakika) : masa.ucret || 0;
          const toplamTutar = toplamTutarHesapla(masa);
          const adisyon = masa.aktifAdisyonId ? getBilardoAdisyon(masa.aktifAdisyonId) : null;
          const ekUrunSayisi = adisyon ? (adisyon.ekUrunler || []).length : 0;
          
          return (
            <div 
              key={masa.id} 
              className={`bilardo-card ${masa.durum === "ACIK" ? "acik" : "kapali"}`}
              data-masa-id={masa.id}
              onClick={() => handleCardClick(masa, index)}
              onDoubleClick={() => handleCardDoubleClick(masa)}
              title={masa.acik ? "Çift tıkla: Adisyona git | Tek tıkla: Ödeme yap" : ""}
            >
              
              {/* KART BAŞLIĞI */}
              <div className="bilardo-card-header">
                <div className="bilardo-card-icon-title">
                  <div className="bilardo-card-icon">
                    <BilardoIkon size={32} />
                  </div>
                  <span className="bilardo-card-name">BİLARDO {masa.no || index + 1}</span>
                </div>
                <span className={`bilardo-card-durum ${masa.durum}`}>
                  {masa.durum === "ACIK" ? "AÇIK" : "KAPALI"}
                </span>
              </div>
              
              {/* TAHMİNİ ÜCRET */}
              <div className="bilardo-card-ucret">
                <div className="aciklama">
                  {masa.acik ? "TAHMİNİ ÜCRET" : "SON ÜCRET"}
                </div>
                <div className="tutar">{bilardoUcret}₺</div>
              </div>
              
              {/* TOPLAM TUTAR (Ek ürünler varsa) */}
              {toplamTutar > bilardoUcret && (
                <div className="bilardo-toplam-tutar">
                  <span>TOPLAM TUTAR (Ürünlerle):</span>
                  <span>{toplamTutar.toFixed(2)}₺</span>
                </div>
              )}
              
              {/* EK ÜRÜN BİLGİSİ */}
              {ekUrunSayisi > 0 && (
                <div style={{
                  margin: "10px 0",
                  padding: "8px 12px",
                  background: "#e8f5e9",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#2e7d32",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>📦 {ekUrunSayisi} ek ürün</span>
                  <span>+{(toplamTutar - bilardoUcret).toFixed(2)}₺</span>
                </div>
              )}
              
              {/* MASA AÇIK DEĞİLSE - SÜRE SEÇİMİ */}
              {!masa.acik ? (
                <div className="bilardo-sure-secim">
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "30dk", index); }}
                  >
                    <span>30 DAKİKA</span>
                    <span>{ucretAyarlari?.bilardo30dk || ucretAyarlari?.ilk40 || 80}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "1saat", index); }}
                  >
                    <span>1 SAAT</span>
                    <span>{ucretAyarlari?.bilardo1saat || ucretAyarlari?.u60 || 120}₺</span>
                  </button>
                  
                  <button
                    className="bilardo-sure-btn"
                    onClick={(e) => { e.stopPropagation(); masaAc(masa, "suresiz", index); }}
                  >
                    <span>SÜRESİZ</span>
                    <span>İlk 30dk: {ucretAyarlari?.bilardo30dk || ucretAyarlari?.ilk40 || 80}₺</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* AÇIK MASA BİLGİLERİ */}
                  <div className="bilardo-acik-masa-bilgi">
                    <div className="bilardo-bilgi-item">
                      <span>Açılış</span>
                      <strong>
                        {new Date(masa.acilisSaati).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </strong>
                    </div>
                    
                    <div className="bilardo-bilgi-item">
                      <span>Geçen Süre</span>
                      <strong>{dakika} dakika</strong>
                    </div>
                    
                    <div className="bilardo-bilgi-item">
                      <span>Seçilen</span>
                      <strong>
                        {masa.sureTipi === "30dk" ? "30 Dakika" : 
                         masa.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}
                      </strong>
                    </div>
                  </div>
                  
                  {/* ÜCRET AÇIKLAMASI */}
                  <div className="bilardo-ucret-aciklama">
                    {masa.sureTipi === "30dk" && `30 dakika ücreti: ${ucretAyarlari?.bilardo30dk || ucretAyarlari?.ilk40 || 80}₺`}
                    {masa.sureTipi === "1saat" && `1 saat ücreti: ${ucretAyarlari?.bilardo1saat || ucretAyarlari?.u60 || 120}₺`}
                    {masa.sureTipi === "suresiz" && 
                      `İlk 30dk: ${ucretAyarlari?.bilardo30dk || ucretAyarlari?.ilk40 || 80}₺ + Sonrası: ${ucretAyarlari?.bilardoDakikaUcreti || ucretAyarlari?.dk2 || 2}₺/dk`}
                  </div>
                  
                  {/* AKTARIM BUTONLARI */}
                  <div className="bilardo-aktarim-buttons">
                    <button
                      className="bilardo-oyun-bitir-btn"
                      onClick={(e) => { e.stopPropagation(); handleCardClick(masa, index); }}
                    >
                      💳 ÖDEME YAP
                    </button>
                    
                    <button
                      className="bilardo-masa-aktar-btn"
                      onClick={(e) => masaAktarModalAc(masa, index, e)}
                    >
                      ↪️ MASAYA AKTAR
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* AKTARIM MODAL */}
      {aktarimModal.acik && (
        <div className="bilardo-popup-overlay">
          <div className="bilardo-popup">
            <h3 className="bilardo-popup-title">Bilardo Adisyonunu Normal Masaya Aktar</h3>
            <p>Boş masalardan birini seçin:</p>
            
            <div className="bilardo-masa-listesi">
              {aktarimModal.normalMasalar && aktarimModal.normalMasalar.length > 0 ? (
                aktarimModal.normalMasalar.map(masa => (
                  <button
                    key={masa.id || masa.no}
                    className={`bilardo-masa-secim-btn ${aktarimModal.seciliMasa?.id === masa.id ? 'secili' : ''}`}
                    onClick={() => setAktarimModal({...aktarimModal, seciliMasa: masa})}
                  >
                    MASA {masa.no}
                  </button>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  color: '#c62828', 
                  gridColumn: '1 / -1',
                  fontSize: '16px'
                }}>
                  ⚠️ Boş masa bulunamadı!
                </div>
              )}
            </div>
            
            <div className="bilardo-modal-actions">
              <button 
                className="bilardo-modal-btn iptal"
                onClick={() => setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] })}
              >
                İptal
              </button>
              <button 
                className="bilardo-modal-btn onay"
                onClick={masaAktar}
                disabled={!aktarimModal.seciliMasa}
              >
                MASAYA AKTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}