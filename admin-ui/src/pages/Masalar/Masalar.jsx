import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// MyCafe Premium Tema Renkleri
const RENK = {
  arka: "#e5cfa5",      // Altın–Bej zemin
  kart: "#4a3722",      // Koyu kahve 3D kart
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

  // 🔄 TIMER: Her 1 dakikada bir yenile
  useEffect(() => {
    const interval = setInterval(() => {
      loadMasalar();
      setAdisyonlar(readJSON("mc_adisyonlar", []));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🟡 Belirli masanın durumunu hesapla (ANLIK FİYAT GÜNCELLEMESİ İÇİN DÜZELTİLDİ)
  const getMasaBilgi = (masa) => {
    if (!masa.adisyonId) return { acik: false };

    const ads = adisyonlar.find((a) => a.id === masa.adisyonId);
    if (!ads) return { acik: false };

    // Eğer status/durum alanı kapalıysa, kapalı say
    if (
      (ads.status && ads.status.toUpperCase() === "CLOSED") ||
      (ads.durum && ads.durum.toUpperCase() === "KAPALI")
    ) {
      return { acik: false };
    }

    const acilis = ads.acilisZamani ? new Date(ads.acilisZamani) : null;
    if (!acilis || isNaN(acilis.getTime())) return { acik: false };

    const simdi = new Date();
    const gecenDakika = Math.floor((simdi - acilis) / 60000);
    
    // YENİ: Açılış saatini formatla
    const acilisSaati = `${String(acilis.getHours()).padStart(2, '0')}:${String(acilis.getMinutes()).padStart(2, '0')}`;

    // Toplam tutarı hesapla (ana adisyon + tüm açık ayırma adisyonları)
    let toplamTutar = (ads.kalemler || []).reduce(
      (t, k) => t + Number(k.adet || 0) * Number(k.fiyat || 0),
      0
    );

    // YENİ: Aynı masadaki TÜM açık ayırma adisyonlarını bul ve toplama ekle
    const ayirmaAdisyonlari = adisyonlar.filter(a => {
      // Aynı masa numarasına sahip
      const isSameMasa = a.masaNo === masa.no || (a.masaNo && a.masaNo.toString() === masa.no.toString());
      // Farklı ID (ana adisyon değil)
      const isDifferentId = a.id !== masa.adisyonId;
      // Kapalı değil
      const isNotClosed = !(a.status && a.status.toUpperCase() === "CLOSED") &&
                         !(a.durum && a.durum.toUpperCase() === "KAPALI");
      
      return isSameMasa && isDifferentId && isNotClosed;
    });

    // Tüm ayırma adisyonlarını toplama ekle
    ayirmaAdisyonlari.forEach(ayir => {
      toplamTutar += (ayir.kalemler || []).reduce(
        (t, k) => t + Number(k.adet || 0) * Number(k.fiyat || 0),
        0
      );
    });

    return {
      acik: true,
      gecenDakika,
      acilisSaati,      // YENİ: Açılış saati
      toplamTutar,      // DÜZELTİLDİ: Tüm adisyonların toplamı
      adisyon: ads,
    };
  };

  // YENİ: Real-time güncelleme için useEffect
  useEffect(() => {
    const handleStorageChange = () => {
      loadMasalar();
      setAdisyonlar(readJSON("mc_adisyonlar", []));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adisyonUpdated', handleStorageChange);
    
    // Her 10 saniyede bir kontrol et (daha sık)
    const realTimeInterval = setInterval(handleStorageChange, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adisyonUpdated', handleStorageChange);
      clearInterval(realTimeInterval);
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
    };

    const yeniListe = [...list, yeniMasa];
    saveMasalar(yeniListe);
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
        return { ...m, adisyonId: null };
      }
      if (m.no === targetMasa.no) {
        return { ...m, adisyonId };
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
      };

      const yeniAdisyonList = [...adisyonlar, yeniAdisyon];
      saveAdisyonlar(yeniAdisyonList);

      const yeniMasaList = masalar.map((m) =>
        m.no === masa.no ? { ...m, adisyonId } : m
      );
      saveMasalar(yeniMasaList);
    }

    // 2) Adisyon ekranına git
    if (typeof onOpenAdisyon === "function") {
      // Eğer App.jsx props üzerinden yönetecekse
      onOpenAdisyon({ masaId: masa.no, adisyonId });
    } else {
      // Normal navigate ile
      navigate("/adisyon/" + adisyonId);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div
      style={{
        background: RENK.arka,
        minHeight: "100vh",
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

      {/* MASA GRID */}
      {masalar.length === 0 && (
        <div
          style={{
            fontSize: 16,
            color: "#7f8c8d",
            marginBottom: 16,
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

          return (
            <div
              key={masa.no}
              draggable={acik} // sadece açık masalar sürüklenebilir
              onDragStart={(e) => handleDragStart(e, masa)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, masa)}
              onClick={() => handleSingleClick(masa)}
              onDoubleClick={() => handleDoubleClick(masa)}
              style={{
                background: RENK.kart,
                color: RENK.kartYazi,
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
              }}
            >
              {/* MASA BAŞLIK */}
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  marginBottom: 10,
                  color: RENK.altin,
                }}
              >
                Masa {masa.no}
              </div>

              {/* İKON */}
              <div
                style={{
                  fontSize: 74,
                  marginBottom: 10,
                  color: RENK.altin,
                  textShadow: "0 5px 8px rgba(0,0,0,0.4)",
                }}
              >
                {acik ? "🔔" : "🪑"}
              </div>

              {/* AÇIK - KAPALI YAZI */}
              {!acik ? (
                <div
                  style={{
                    fontSize: 22,
                    opacity: 0.85,
                    marginTop: 10,
                    fontWeight: 700,
                  }}
                >
                  BOŞ
                </div>
              ) : (
                <div>
                  {/* YENİ: Açılış Saati ve Geçen Süre - YAN YANA */}
                  <div
                    style={{
                      fontSize: 14,
                      marginBottom: 8,
                      opacity: 0.9,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0 5px",
                    }}
                  >
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⏰</span>
                      <span>{bilgi.acilisSaati}</span>
                    </div>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⏱️</span>
                      <span>{formatSure(bilgi.gecenDakika)}</span>
                    </div>
                  </div>

                  {/* TOPLAM TUTAR */}
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: RENK.altin,
                    }}
                  >
                    ₺ {bilgi.toplamTutar.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}