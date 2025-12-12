import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Masalar.css";
import syncService, { SYNC_EVENTS } from "../../services/syncService";

export default function Masalar() {
  const [masalar, setMasalar] = useState([]);
  const [seciliMasa, setSeciliMasa] = useState(null);
  const [islemMesaji, setIslemMesaji] = useState("");
  const [aktifTab, setAktifTab] = useState("TÜMÜ");
  const [searchTerm, setSearchTerm] = useState("");

  // Masaları yükle
  useEffect(() => {
    const yukleMasalar = () => {
      const masalarData = syncService.oku("mc_masalar");
      console.log("🔄 Masalar yüklendi:", masalarData?.length || 0);
      setMasalar(Array.isArray(masalarData) ? masalarData : []);
    };

    yukleMasalar();

    // Senkronizasyon event'ini dinle
    const handleMasaGuncellendi = (eventData) => {
      console.log("📢 Masa güncellendi event'i yakalandı:", eventData);
      if (eventData.masaNo) {
        // Sadece ilgili masayı güncelle
        yukleMasalar();
      } else {
        // Genel güncelleme
        yukleMasalar();
      }
    };

    // Event listener'ları ekle
    syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
    window.addEventListener("storage", handleMasaGuncellendi);
    window.addEventListener("masaUpdated", handleMasaGuncellendi);

    // 30 saniyede bir otomatik senkronizasyon
    const interval = setInterval(() => {
      syncService.senkronizeMasalar();
    }, 30000);

    return () => {
      syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      window.removeEventListener("storage", handleMasaGuncellendi);
      window.removeEventListener("masaUpdated", handleMasaGuncellendi);
      clearInterval(interval);
    };
  }, []);

  // Masa tıklama
  const masaTikla = (masa) => {
    setSeciliMasa(masa);
    setIslemMesaji(`Masa ${masa.no} seçildi. Yönlendiriliyorsunuz...`);

    setTimeout(() => {
      // Bilardo masası kontrolü
      const masaStr = `MASA ${masa.no}`;
      const upper = masaStr.toUpperCase();
      if (upper.includes("BİLARDO") || upper.includes("BILARDO")) {
        window.location.href = `/bilardo/${masa.no}`;
      } else {
        window.location.href = `/adisyon/${masa.no}`;
      }
    }, 500);
  };

  // Masa filtreleme
  const filtreliMasalar = masalar.filter((masa) => {
    // Tab filtreleme
    if (aktifTab === "DOLU" && masa.durum !== "DOLU") return false;
    if (aktifTab === "BOŞ" && masa.durum !== "BOŞ") return false;

    // Arama filtreleme
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      return (
        masa.no.toString().includes(searchTerm) ||
        (masa.musteriAdi &&
          masa.musteriAdi.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Masa durumuna göre renk
  const masaRenk = (masa) => {
    if (masa.renk) return masa.renk;
    return masa.durum === "DOLU" ? "kırmızı" : "gri";
  };

  // Yeni müşteri ekle
  const [yeniMusteriModal, setYeniMusteriModal] = useState(false);
  const [yeniMusteriAd, setYeniMusteriAd] = useState("");
  const [yeniMusteriKisi, setYeniMusteriKisi] = useState(1);

  const yeniMusteriEkle = () => {
    if (!yeniMusteriAd.trim()) {
      setIslemMesaji("⚠️ Müşteri adı giriniz.");
      return;
    }

    const secili = seciliMasa;
    if (!secili) {
      setIslemMesaji("⚠️ Önce bir masa seçin.");
      return;
    }

    // Masa adisyonunu oluştur veya bul
    const adisyonlar = syncService.oku("mc_adisyonlar");
    let masaAdisyon = adisyonlar.find(
      a => a.masaNo === `MASA ${secili.no}` && !a.kapali && !a.isSplit
    );

    if (!masaAdisyon) {
      masaAdisyon = {
        id: Date.now().toString(),
        masaNo: `MASA ${secili.no}`,
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
      adisyonlar.push(masaAdisyon);
      syncService.yaz("mc_adisyonlar", adisyonlar);
    }

    // Masa bilgilerini güncelle
    const guncelMasalar = masalar.map(m => {
      if (m.no === secili.no) {
        return {
          ...m,
          musteriAdi: yeniMusteriAd,
          kisiSayisi: yeniMusteriKisi,
          acilisZamani: masaAdisyon.acilisZamani,
          durum: "DOLU",
          renk: "kırmızı",
          adisyonId: masaAdisyon.id
        };
      }
      return m;
    });

    syncService.yaz("mc_masalar", guncelMasalar);
    setMasalar(guncelMasalar);
    setYeniMusteriModal(false);
    setYeniMusteriAd("");
    setYeniMusteriKisi(1);
    setIslemMesaji(`✅ Masa ${secili.no} için müşteri eklendi: ${yeniMusteriAd}`);

    // Event tetikle
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
      masaNo: secili.no,
      masa: guncelMasalar.find(m => m.no === secili.no)
    });
  };

  // MasaKarti Component'i
  const MasaKarti = ({ masa, onClick }) => {
    const [toplamTutar, setToplamTutar] = useState("0.00");
    const [acilisZamani, setAcilisZamani] = useState(masa.acilisZamani || null);
    const [gecenSure, setGecenSure] = useState("00:00");
    const [musteriAdi, setMusteriAdi] = useState(masa.musteriAdi || "");
    
    // Masa toplamını ve açılış zamanını hesapla
    const hesaplaMasaBilgileri = () => {
      try {
        const adisyonlar = syncService.oku('mc_adisyonlar');
        
        // Ana adisyonu bul
        const anaAdisyon = adisyonlar.find(a => a.id === masa.adisyonId && !a.kapali);
        
        // Split adisyonu bul
        const splitAdisyon = masa.ayirId 
          ? adisyonlar.find(a => a.id === masa.ayirId && !a.kapali)
          : null;
        
        let toplam = 0;
        let yeniAcilisZamani = masa.acilisZamani;
        
        if (anaAdisyon) {
          if (anaAdisyon.kalemler) {
            toplam += anaAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
          }
          // AÇILIŞ ZAMANI: Ana adisyondan al
          if (anaAdisyon.acilisZamani && !yeniAcilisZamani) {
            yeniAcilisZamani = anaAdisyon.acilisZamani;
          }
        }
        
        if (splitAdisyon && splitAdisyon.kalemler) {
          toplam += splitAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        }
        
        return {
          toplam: toplam.toFixed(2),
          acilisZamani: yeniAcilisZamani,
          durum: toplam > 0 ? "DOLU" : "BOŞ"
        };
      } catch (error) {
        console.error("Masa bilgileri hesaplanırken hata:", error);
        return {
          toplam: "0.00",
          acilisZamani: masa.acilisZamani,
          durum: masa.durum
        };
      }
    };
    
    // Geçen süreyi hesapla
    const hesaplaGecenSure = () => {
      if (!acilisZamani) return "00:00";
      
      try {
        const acilis = new Date(acilisZamani);
        const simdi = new Date();
        const diffMs = simdi - acilis;
        const dakika = Math.floor(diffMs / 60000);
        const saat = Math.floor(dakika / 60);
        const kalanDakika = dakika % 60;
        const sSaat = String(saat).padStart(2, "0");
        const sDakika = String(kalanDakika).padStart(2, "0");
        
        return `${sSaat}:${sDakika}`;
      } catch {
        return "00:00";
      }
    };
    
    // İlk yükleme ve periyodik güncelleme
    useEffect(() => {
      const bilgiler = hesaplaMasaBilgileri();
      setToplamTutar(bilgiler.toplam);
      setAcilisZamani(bilgiler.acilisZamani);
      
      const sure = hesaplaGecenSure();
      setGecenSure(sure);
      
      // Müşteri adını güncelle
      setMusteriAdi(masa.musteriAdi || "");
      
      // Her dakika geçen süreyi güncelle
      const interval = setInterval(() => {
        if (acilisZamani && bilgiler.durum === "DOLU") {
          const sure = hesaplaGecenSure();
          setGecenSure(sure);
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }, [masa.no, masa.adisyonId, masa.ayirId, masa.musteriAdi, acilisZamani]);
    
    // Event dinleyicisi
    useEffect(() => {
      const handleMasaGuncellendi = (eventData) => {
        if (eventData.masaNo === Number(masa.no)) {
          console.log('🔄 Masa güncellendi, yeniden hesaplanıyor...');
          const bilgiler = hesaplaMasaBilgileri();
          setToplamTutar(bilgiler.toplam);
          setAcilisZamani(bilgiler.acilisZamani);
          
          if (eventData.masa?.musteriAdi !== undefined) {
            setMusteriAdi(eventData.masa.musteriAdi);
          }
          
          const sure = hesaplaGecenSure();
          setGecenSure(sure);
        }
      };
      
      syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      
      return () => {
        syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      };
    }, [masa.no]);
    
    return (
      <div 
        className={`masa-kart ${masa.durum === 'DOLU' ? 'dolu' : 'bos'} ${masaRenk(masa)}`}
        onClick={() => onClick(masa)}
      >
        <div className="masa-no">MASA {masa.no}</div>
        <div className="masa-durum">{masa.durum}</div>
        <div className="masa-tutar">{toplamTutar} TL</div>
        
        {/* AÇILIŞ ZAMANI ve GEÇEN SÜRE */}
        {acilisZamani && masa.durum === 'DOLU' && (
          <div className="masa-sure">
            <div className="masa-acilis">
              {new Date(acilisZamani).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="masa-gecen-sure">
              ⏱️ {gecenSure}
            </div>
          </div>
        )}
        
        <div className="masa-musteri">{musteriAdi}</div>
        <div className="masa-kisi">{masa.kisiSayisi ? `${masa.kisiSayisi} kişi` : ''}</div>
      </div>
    );
  };

  return (
    <div className="masalar-container">
      {/* ÜST BAR */}
      <div className="ust-bar">
        <div className="baslik">
          <h1>MASALAR</h1>
          <div className="masa-sayisi">
            Toplam: {masalar.length} | Dolu:{" "}
            {masalar.filter((m) => m.durum === "DOLU").length} | Boş:{" "}
            {masalar.filter((m) => m.durum === "BOŞ").length}
          </div>
        </div>

        {/* SAĞ ÜST KONTROLLER */}
        <div className="kontrol-panel">
          {/* ARAMA */}
          <div className="arama-alani">
            <input
              type="text"
              placeholder="Masa no veya müşteri adı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="arama-input"
            />
            <button className="arama-btn">🔍</button>
          </div>

          {/* SENKRONİZASYON BUTONU */}
          <button
            onClick={() => {
              const sonuc = syncService.senkronizeMasalar();
              setIslemMesaji(`✅ ${sonuc.length} masa senkronize edildi.`);
            }}
            className="senkron-btn"
          >
            🔄 Senkronize Et
          </button>

          {/* YENİ MÜŞTERİ BUTONU */}
          {seciliMasa && seciliMasa.durum === "BOŞ" && (
            <button
              onClick={() => setYeniMusteriModal(true)}
              className="yeni-musteri-btn"
            >
              👤 Müşteri Ekle
            </button>
          )}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {["TÜMÜ", "DOLU", "BOŞ"].map((tab) => (
          <button
            key={tab}
            onClick={() => setAktifTab(tab)}
            className={`tab-btn ${aktifTab === tab ? "aktif" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MASA GRID */}
      <div className="masa-grid">
        {filtreliMasalar.length === 0 ? (
          <div className="bos-masa-mesaji">
            {searchTerm
              ? `"${searchTerm}" için masa bulunamadı.`
              : aktifTab === "DOLU"
              ? "Dolu masa bulunmamaktadır."
              : aktifTab === "BOŞ"
              ? "Boş masa bulunmamaktadır."
              : "Henüz masa kaydı bulunmamaktadır."}
          </div>
        ) : (
          filtreliMasalar
            .sort((a, b) => Number(a.no) - Number(b.no))
            .map((masa) => (
              <MasaKarti key={masa.id || masa.no} masa={masa} onClick={masaTikla} />
            ))
        )}
      </div>

      {/* YENİ MÜŞTERİ MODAL */}
      {yeniMusteriModal && seciliMasa && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Masa {seciliMasa.no} - Yeni Müşteri</h3>
            
            <div className="modal-input-group">
              <label>Müşteri Adı</label>
              <input
                type="text"
                value={yeniMusteriAd}
                onChange={(e) => setYeniMusteriAd(e.target.value)}
                placeholder="Müşteri adı giriniz"
                className="modal-input"
                autoFocus
              />
            </div>
            
            <div className="modal-input-group">
              <label>Kişi Sayısı</label>
              <input
                type="number"
                value={yeniMusteriKisi}
                onChange={(e) => setYeniMusteriKisi(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                className="modal-input"
              />
            </div>
            
            <div className="modal-buttons">
              <button
                onClick={yeniMusteriEkle}
                className="modal-btn-ok"
              >
                📝 Kaydet ve Masa Aç
              </button>
              <button
                onClick={() => {
                  setYeniMusteriModal(false);
                  setYeniMusteriAd("");
                  setYeniMusteriKisi(1);
                }}
                className="modal-btn-cancel"
              >
                ❌ İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İŞLEM MESAJI */}
      {islemMesaji && (
        <div className={`islem-mesaji ${islemMesaji.includes("⚠️") ? "hata" : "basari"}`}>
          {islemMesaji}
        </div>
      )}

      {/* SEÇİLİ MASA BİLGİSİ */}
      {seciliMasa && !yeniMusteriModal && (
        <div className="secili-masa-bilgi">
          <h3>Masa {seciliMasa.no}</h3>
          <p><strong>Durum:</strong> {seciliMasa.durum}</p>
          <p><strong>Müşteri:</strong> {seciliMasa.musteriAdi || "Belirtilmemiş"}</p>
          <p><strong>Kişi Sayısı:</strong> {seciliMasa.kisiSayisi || "Belirtilmemiş"}</p>
          
          {seciliMasa.acilisZamani && (
            <p>
              <strong>Açılış:</strong>{" "}
              {new Date(seciliMasa.acilisZamani).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          
          <div className="secili-masa-buttons">
            <button
              onClick={() => {
                if (seciliMasa.durum === "BOŞ") {
                  setYeniMusteriModal(true);
                } else {
                  masaTikla(seciliMasa);
                }
              }}
              className="masa-ac-btn"
            >
              {seciliMasa.durum === "BOŞ" ? "📝 Masa Aç" : "📋 Adisyona Git"}
            </button>
            <button
              onClick={() => setSeciliMasa(null)}
              className="masa-kapat-btn"
            >
              ❌ Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}