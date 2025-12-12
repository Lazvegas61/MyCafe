// Masalar.jsx - SYNC SERVICE EVENT LISTENER EKLENDİ

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// SYNC SERVICE IMPORT EKLENDİ
import syncService, { SYNC_EVENTS } from "../../services/syncService"; // YOLU DÜZELTİN

// MyCafe Premium Tema Renkleri
const RENK = {
  arka: "#e5cfa5",
  kart: "#4a3722",
  kartYazi: "#ffffff",
  altin: "#f5d085",
  yesil: "#2ecc71",
  kirmizi: "#c0392b",
};

// --------------------------------------------------
// LocalStorage Helper
// --------------------------------------------------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// MASA OBJESİNİ NORMALİZE ET (id / no garanti olsun)
const normalizeMasalar = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((m, index) => {
    const no = m.no ?? m.id ?? index + 1;
    return {
      ...m,
      id: m.id ?? no,
      no,
      durum: m.durum || "BOŞ",
      renk: m.renk || "gri",
      toplamTutar: m.toplamTutar || "0.00",
      musteriAdi: m.musteriAdi || null,
      kisiSayisi: m.kisiSayisi || null,
      acilisZamani: m.acilisZamani || null,
      adisyonId: m.adisyonId || null,
      ayirId: m.ayirId || null
    };
  });
};

// Zaman formatı (mm:ss)
const formatSure = (dakika) => {
  const h = Math.floor(dakika / 60);
  const m = dakika % 60;

  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
};

export default function Masalar({ onOpenAdisyon }) {
  const navigate = useNavigate();

  // MASALAR
  const [masalar, setMasalar] = useState(() => {
    const raw = readJSON("mc_masalar", []);
    const norm = normalizeMasalar(raw);
    localStorage.setItem("mc_masalar", JSON.stringify(norm));
    return norm;
  });

  // ADİSYONLAR
  const [adisyonlar, setAdisyonlar] = useState(() =>
    readJSON("mc_adisyonlar", [])
  );

  const [seciliMasa, setSeciliMasa] = useState(null);

  // Masa sil girişi (sadece numara)
  const [silMasaNo, setSilMasaNo] = useState("");

  // Drag & drop için kaynak masa
  const dragSourceMasaNoRef = useRef(null);

  // --------------------------------------------------
  // YARDIMCI FONKSİYONLAR
  // --------------------------------------------------
  const loadMasalar = () => {
    console.log('🔄 Masalar yeniden yükleniyor...');
    const raw = readJSON("mc_masalar", []);
    const norm = normalizeMasalar(raw);
    localStorage.setItem("mc_masalar", JSON.stringify(norm));
    setMasalar(norm);
  };

  const saveMasalar = (list) => {
    const norm = normalizeMasalar(list);
    setMasalar(norm);
    localStorage.setItem("mc_masalar", JSON.stringify(norm));
  };

  const saveAdisyonlar = (list) => {
    setAdisyonlar(list);
    localStorage.setItem("mc_adisyonlar", JSON.stringify(list));
  };

  // 🟡 Belirli masanın durumunu hesapla
  const getMasaBilgi = (masa) => {
    if (!masa.adisyonId) return { acik: false };

    const ads = adisyonlar.find((a) => a.id === masa.adisyonId);
    if (!ads) return { acik: false };

    // Eğer status/durum alanı kapalıysa, kapalı say
    if (
      (ads.status && ads.status.toUpperCase() === "CLOSED") ||
      (ads.durum && ads.durum.toUpperCase() === "KAPALI") ||
      ads.kapali === true
    ) {
      return { acik: false };
    }

    const acilis = ads.acilisZamani ? new Date(ads.acilisZamani) : null;
    if (!acilis || isNaN(acilis.getTime())) return { acik: false };

    const simdi = new Date();
    const gecenDakika = Math.floor((simdi - acilis) / 60000);

    const toplamTutar = (ads.kalemler || []).reduce(
      (t, k) => t + Number(k.adet || 0) * Number(k.fiyat || 0),
      0
    );

    return {
      acik: true,
      gecenDakika,
      toplamTutar,
      adisyon: ads,
    };
  };

  // --------------------------------------------------
  // SYNC SERVICE EVENT LISTENERS - YENİ EKLENDİ
  // --------------------------------------------------
  useEffect(() => {
    const loadMasalar = () => {
      console.log('🔄 Masalar yeniden yükleniyor...');
      const raw = readJSON("mc_masalar", []);
      const norm = normalizeMasalar(raw);
      localStorage.setItem("mc_masalar", JSON.stringify(norm));
      setMasalar(norm);
    };

    const loadAdisyonlar = () => {
      setAdisyonlar(readJSON("mc_adisyonlar", []));
    };

    // İlk yükleme
    loadMasalar();
    loadAdisyonlar();

    // 🔴 SYNC SERVICE EVENT'LERİNİ DİNLE
    const handleMasaGuncellendi = (eventData) => {
      console.log("📢 SYNC EVENT: Masa güncellendi", eventData);
      // Masaları yeniden yükle
      loadMasalar();
    };

    const handleStorageChange = () => {
      console.log("📢 STORAGE EVENT: Veri değişti");
      loadMasalar();
      loadAdisyonlar();
    };

    // Event listener'ları ekle
    if (syncService) {
      syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      console.log('✅ SYNC EVENT listener eklendi');
    }
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("masaUpdated", handleMasaGuncellendi);

    // 🔄 TIMER: Her 30 saniyede bir yenile
    const interval = setInterval(() => {
      loadMasalar();
      loadAdisyonlar();
    }, 30000);

    return () => {
      // Event listener'ları temizle
      if (syncService) {
        syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, handleMasaGuncellendi);
      }
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("masaUpdated", handleMasaGuncellendi);
      clearInterval(interval);
    };
  }, []);

  // --------------------------------------------------
  // MASA EKLE / SİL
  // --------------------------------------------------

  // 🟢 Masa Ekle — MASA 1, MASA 2, ...
  const handleAddMasa = () => {
    const list = normalizeMasalar(masalar || []);

    const maxNo =
      list.length > 0 ? Math.max(...list.map((m) => Number(m.no) || 0)) : 0;

    const nextNo = maxNo + 1;

    const yeniMasa = {
      id: nextNo,
      no: nextNo,
      adisyonId: null,
      durum: "BOŞ",
      renk: "gri",
      toplamTutar: "0.00",
      musteriAdi: null,
      kisiSayisi: null,
      acilisZamani: null
    };

    const yeniListe = [...list, yeniMasa];
    saveMasalar(yeniListe);
    
    // SYNC EVENT TETİKLE
    if (syncService) {
      syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: nextNo,
        masa: yeniMasa
      });
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  // 🔴 Masa Sil — inputa sadece numara girilecek
  const handleDeleteMasa = () => {
    const trimmed = silMasaNo.trim();
    if (!trimmed) return;

    const masaNo = Number(trimmed);
    if (isNaN(masaNo)) {
      alert("Sadece masa numarası girin. Örn: 5");
      return;
    }

    const list = normalizeMasalar(masalar || []);
    const target = list.find((m) => Number(m.no) === masaNo);

    if (!target) {
      alert("Bu numarada bir masa yok.");
      return;
    }

    const bilgi = getMasaBilgi(target);
    if (bilgi.acik) {
      alert("Açık adisyonu olan masa silinemez.");
      return;
    }

    const yeniListe = list.filter((m) => Number(m.no) !== masaNo);
    saveMasalar(yeniListe);
    setSilMasaNo("");
    
    // SYNC EVENT TETİKLE
    window.dispatchEvent(new Event('storage'));
  };

  // --------------------------------------------------
  // DRAG & DROP — MASA TAŞIMA
  // --------------------------------------------------
  const handleDragStart = (e, masa) => {
    const bilgi = getMasaBilgi(masa);
    if (!bilgi.acik) return; // sadece açık masalar taşınabilir
    dragSourceMasaNoRef.current = masa.no;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetMasa) => {
    e.preventDefault();

    const sourceNo = dragSourceMasaNoRef.current;
    dragSourceMasaNoRef.current = null;

    if (!sourceNo || sourceNo === targetMasa.no) return;

    const sourceMasa = masalar.find((m) => m.no === sourceNo);
    if (!sourceMasa || !sourceMasa.adisyonId) {
      alert("Kaynak masada taşınacak açık adisyon yok.");
      return;
    }

    const targetBilgi = getMasaBilgi(targetMasa);
    if (targetBilgi.acik) {
      alert("Hedef masada zaten açık adisyon var. Taşıyamazsın.");
      return;
    }

    const adisyonId = sourceMasa.adisyonId;

    // Masalar üzerinde taşıma
    const yeniMasalar = masalar.map((m) => {
      if (m.no === sourceNo) {
        return { ...m, adisyonId: null, durum: "BOŞ", renk: "gri", toplamTutar: "0.00" };
      }
      if (m.no === targetMasa.no) {
        return { ...m, adisyonId, durum: "DOLU", renk: "kırmızı" };
      }
      return m;
    });
    saveMasalar(yeniMasalar);

    // Adisyonun masa numarasını güncelle
    const yeniAdisyonlar = adisyonlar.map((a) =>
      a.id === adisyonId
        ? {
            ...a,
            masaNo: targetMasa.no,
          }
        : a
    );
    saveAdisyonlar(yeniAdisyonlar);

    // SYNC EVENT TETİKLE
    if (syncService) {
      syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: sourceNo,
        masa: yeniMasalar.find(m => m.no === sourceNo)
      });
      syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: targetMasa.no,
        masa: yeniMasalar.find(m => m.no === targetMasa.no)
      });
    }
    
    window.dispatchEvent(new Event('storage'));
    
    alert(`Adisyon MASA ${sourceNo} → MASA ${targetMasa.no} taşındı.`);
  };

  // --------------------------------------------------
  // TIKLAMA DAVRANIŞLARI
  // --------------------------------------------------

  // 🟠 Tek tık = sadece seçme
  const handleSingleClick = (masa) => {
    setSeciliMasa(masa.no);
  };

  // 🟢 Çift tık = sadece tıklanan masaya adisyon
  const handleDoubleClick = (masa) => {
    const bilgi = getMasaBilgi(masa);

    // 1) Eğer masa boş ise => yeni adisyon oluştur
    let adisyonId = masa.adisyonId;

    if (!bilgi.acik) {
      adisyonId = "ad_" + Date.now();

      const yeniAdisyon = {
        id: adisyonId,
        masaNo: masa.no,
        acilisZamani: new Date().toISOString(),
        kalemler: [],
        status: "OPEN",
        durum: "AÇIK",
        kapali: false
      };

      const yeniAdisyonList = [...adisyonlar, yeniAdisyon];
      saveAdisyonlar(yeniAdisyonList);

      const yeniMasaList = masalar.map((m) =>
        m.no === masa.no ? { ...m, adisyonId, durum: "DOLU", renk: "kırmızı" } : m
      );
      saveMasalar(yeniMasaList);
      
      // SYNC EVENT TETİKLE
      if (syncService) {
        syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
          masaNo: masa.no,
          masa: yeniMasaList.find(m => m.no === masa.no)
        });
      }
      
      window.dispatchEvent(new Event('storage'));
    }

    // 2) Adisyon ekranına git
    if (typeof onOpenAdisyon === "function") {
      onOpenAdisyon({ masaId: masa.no, adisyonId });
    } else {
      navigate("/adisyon/" + masa.no);
    }
  };

  // --------------------------------------------------
  // MASA DURUMU GÖSTERİMİ
  // --------------------------------------------------
  const getMasaDurumu = (masa) => {
    if (masa.durum && masa.durum !== "") {
      return masa.durum;
    }
    
    const bilgi = getMasaBilgi(masa);
    return bilgi.acik ? "DOLU" : "BOŞ";
  };

  const getMasaRengi = (masa) => {
    if (masa.renk && masa.renk !== "") {
      return masa.renk === "kırmızı" ? RENK.kirmizi : RENK.yesil;
    }
    
    const bilgi = getMasaBilgi(masa);
    return bilgi.acik ? RENK.kirmizi : RENK.yesil;
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div
      style={{
        background: RENK.arka,
        minHeight: "100%",
        padding: 26,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* ÜST BAR: Başlık + Masa Ekle / Sil */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: "#3a2a14",
            textAlign: "left",
            margin: 0,
          }}
        >
          Masalar
        </h1>

        {/* Sağ üstte masa ekle / sil paneli */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* SENKRONİZASYON BUTONU */}
          <button
            onClick={() => {
              if (syncService && syncService.senkronizeMasalar) {
                const result = syncService.senkronizeMasalar();
                alert(`${result.length} masa senkronize edildi.`);
              } else {
                window.dispatchEvent(new Event('storage'));
                alert('Masalar yenilendi.');
              }
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #3498db, #2980b9)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: 120,
            }}
          >
            🔄 Yenile
          </button>

          {/* MASA EKLE */}
          <button
            onClick={handleAddMasa}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, rgba(245,208,133,0.95), rgba(228,184,110,0.9))",
              color: "#3a260f",
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              minWidth: 120,
            }}
          >
            + Masa Ekle
          </button>

          {/* MASA SİL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(74,55,34,0.15)",
              padding: "6px 10px",
              borderRadius: 999,
            }}
          >
            <span style={{ fontSize: 13 }}>Masa Sil:</span>
            <input
              type="text"
              placeholder="No"
              value={silMasaNo}
              onChange={(e) => setSilMasaNo(e.target.value)}
              style={{
                width: 56,
                padding: "4px 6px",
                borderRadius: 999,
                border: "1px solid #b89a6a",
                outline: "none",
                fontSize: 13,
              }}
            />
            <button
              onClick={handleDeleteMasa}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background:
                  "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* DURUM GÖSTERGESİ */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 20,
          background: "rgba(255,255,255,0.7)",
          padding: "10px 20px",
          borderRadius: 12,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, background: RENK.kirmizi, borderRadius: 4 }}></div>
          <span>Dolu: {masalar.filter(m => getMasaDurumu(m) === "DOLU").length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, background: RENK.yesil, borderRadius: 4 }}></div>
          <span>Boş: {masalar.filter(m => getMasaDurumu(m) === "BOŞ").length}</span>
        </div>
        <div>
          <span>Toplam: {masalar.length} masa</span>
        </div>
      </div>

      {/* MASA GRID */}
      {masalar.length === 0 && (
        <div
          style={{
            fontSize: 16,
            color: "#7f8c8d",
            marginBottom: 16,
            textAlign: "center",
            padding: "40px",
            background: "rgba(255,255,255,0.5)",
            borderRadius: 12,
          }}
        >
          Henüz masa yok. Sağ üstten "+ Masa Ekle" ile masa oluşturabilirsiniz.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 24,
        }}
      >
        {masalar.map((masa) => {
          const bilgi = getMasaBilgi(masa);
          const acik = bilgi.acik;
          const masaDurumu = getMasaDurumu(masa);
          const masaRengi = getMasaRengi(masa);

          return (
            <div
              key={masa.no}
              draggable={acik}
              onDragStart={(e) => handleDragStart(e, masa)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, masa)}
              onClick={() => handleSingleClick(masa)}
              onDoubleClick={() => handleDoubleClick(masa)}
              style={{
                background: masaRengi,
                color: "#fff",
                borderRadius: 26,
                height: 240,
                padding: "18px 16px",
                cursor: "pointer",
                textAlign: "center",
                boxShadow:
                  seciliMasa === masa.no
                    ? "0 0 0 3px #f5d085, 0 10px 18px rgba(0,0,0,0.35)"
                    : "0 10px 18px rgba(0,0,0,0.45)",
                transition: "all 0.15s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* MASA BAŞLIK */}
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  marginBottom: 10,
                  color: "#fff",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                Masa {masa.no}
              </div>

              {/* İKON */}
              <div
                style={{
                  fontSize: 74,
                  marginBottom: 10,
                  color: "#fff",
                  textShadow: "0 5px 8px rgba(0,0,0,0.4)",
                }}
              >
                {acik ? "🔔" : "🪑"}
              </div>

              {/* DURUM YAZISI */}
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginTop: 10,
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {masaDurumu}
              </div>

              {/* EK BİLGİLER (DOLU İSE) */}
              {acik && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    background: "rgba(0,0,0,0.2)",
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  <div>Süre: {formatSure(bilgi.gecenDakika)}</div>
                  <div style={{ fontWeight: 800, marginTop: 4 }}>
                    ₺ {bilgi.toplamTutar.toFixed(2)}
                  </div>
                </div>
              )}

              {/* MÜŞTERİ ADI (Varsa) */}
              {masa.musteriAdi && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 0,
                    right: 0,
                    fontSize: 12,
                    opacity: 0.9,
                    padding: "0 10px",
                  }}
                >
                  {masa.musteriAdi}
                </div>
              )}

              {/* DRAG İNDİKATÖRÜ (Sadece Dolu Masalar) */}
              {acik && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontSize: 20,
                    opacity: 0.7,
                  }}
                  title="Sürükleyerek taşıyabilirsiniz"
                >
                  ↕️
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}