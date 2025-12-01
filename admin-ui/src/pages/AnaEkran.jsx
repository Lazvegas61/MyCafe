import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Premium renkler
const RENK = {
  zemin: "#e5cfa5",
  kart: "#f9edd7",
  kartYazi: "#4a3722",
  altin: "#f5d085",
  yesil: "#2ecc71",
  kirmizi: "#c0392b",
  griYazi: "#7f8c8d",
};

// LocalStorage okuyucu
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Geçerli tarih mi?
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

// Bugün mü?
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (!isValidDate(d)) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const formatTL = (val) => Number(val || 0).toFixed(2) + " ₺";

const AnaEkran = () => {
  const navigate = useNavigate();

  const [acikAdisyonlar, setAcikAdisyonlar] = useState([]);
  const [gunlukSatis, setGunlukSatis] = useState(0);
  const [gunlukHesabaYaz, setGunlukHesabaYaz] = useState(0);
  const [gunlukGider, setGunlukGider] = useState(0);
  const [aktifAdisyonSayisi, setAktifAdisyonSayisi] = useState(0);
  const [kritikStoklar, setKritikStoklar] = useState([]);

  // ------------------------------------------------------
  //   DASHBOARD VERİLERİNİ YÜKLE
  // ------------------------------------------------------
  const loadDashboard = useCallback(() => {
    const adisyonlar = readJSON("mc_adisyonlar", []);
    const masalar = readJSON("mc_masalar", []);
    const urunler = readJSON("mc_urunler", []);
    const borclar = readJSON("mc_borclar", []);
    const giderler = readJSON("mc_giderler", []);

    // ------ Açık Adisyonlar ------
    const acik = (adisyonlar || []).filter((a) => {
      if (!a) return false;

      // Kapalı işaretlenmiş adisyonları hariç tut
      if (a.kapali === true) return false;
      if (a.status && String(a.status).toUpperCase() === "CLOSED") return false;
      if (a.durum && String(a.durum).toUpperCase() === "KAPALI") return false;

      // Masalar tarafında bu adisyona bağlı en az bir masa olmak zorunda
      const masaBaglantisi = (masalar || []).find((m) => m.adisyonId === a.id);
      if (!masaBaglantisi) return false;

      return true;
    });

    const acikList = acik.map((a) => {
      let masaNo = a.masaNo;

      // Eğer adisyon üzerinde masaNo yoksa, masalar listesinden bul
      if (!masaNo) {
        const masa = (masalar || []).find((m) => m.adisyonId === a.id);
        if (masa) masaNo = masa.no;
      }

      // "MASA MASA 1" gibi bozuk verileri temizle
      if (typeof masaNo === "string") {
        masaNo = masaNo.replace(/MASA/gi, "").trim();
      }

      const satirToplam = (a.kalemler || []).reduce((t, k) => {
        const adet = Number(k.adet || 0);
        const fiyat =
          k.birimFiyat !== undefined ? Number(k.birimFiyat || 0) : Number(k.fiyat || 0);
        return t + adet * fiyat;
      }, 0);

      return {
        id: a.id,
        masaLabel: masaNo ? `Masa ${masaNo}` : "Masa ?",
        toplam: satirToplam,
      };
    });

    setAcikAdisyonlar(acikList);
    setAktifAdisyonSayisi(acikList.length);

    // ------ Günlük Satış (sadece GEÇERLİ tarih + BUGÜN + HESABA_YAZ hariç) ------
    let gs = 0;
    (adisyonlar || []).forEach((a) => {
      if (!a || !a.kapanisZamani) return;
      const d = new Date(a.kapanisZamani);
      if (!isValidDate(d)) return;
      if (!isToday(a.kapanisZamani)) return;

      (a.odemeler || []).forEach((o) => {
        if (!o) return;
        if (o.tip === "HESABA_YAZ") return;
        gs += Number(o.tutar || 0);
      });
    });
    setGunlukSatis(gs);

    // ------ Günlük Hesaba Yaz (sadece GEÇERLİ tarih + BUGÜN) ------
    let ghy = 0;
    (borclar || []).forEach((b) => {
      (b.hareketler || []).forEach((h) => {
        if (!h || h.tip !== "BORÇ EKLENDİ" || !h.tarih) return;
        const d = new Date(h.tarih);
        if (!isValidDate(d)) return;
        if (!isToday(h.tarih)) return;
        ghy += Number(h.tutar || 0);
      });
    });
    setGunlukHesabaYaz(ghy);

    // ------ Günlük Gider (sadece GEÇERLİ tarih + BUGÜN) ------
    let gg = 0;
    (giderler || []).forEach((g) => {
      if (!g || !g.tarih) return;
      const d = new Date(g.tarih);
      if (!isValidDate(d)) return;
      if (!isToday(g.tarih)) return;

      gg += Number(g.tutar || 0) * Number(g.miktar || 1);
    });
    setGunlukGider(gg);

    // ------ Kritik Stok ------
    const kritikList = (urunler || []).filter((u) => {
      const stok = Number(
        u.stokMiktar !== undefined ? u.stokMiktar : u.stok || 0
      );
      return stok <= Number(u.kritikStok || 0);
    });

    setKritikStoklar(kritikList);
  }, []);

  // ------------------------------------------------------
  //   MOUNT + 1 DAKİKA TIMER + EVENT LİSENER
  // ------------------------------------------------------
  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 60000);

    const handler = () => loadDashboard();
    window.addEventListener("mc_dashboard_update", handler);
    window.addEventListener("storage", handler);

    return () => {
      clearInterval(timer);
      window.removeEventListener("mc_dashboard_update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [loadDashboard]);

  // ======================================================
  //                     RENDER
  // ======================================================
  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #f9e3b4, #e5cfa5 50%, #d3b98b)",
        minHeight: "100vh",
        padding: "38px 48px",
        boxSizing: "border-box",
      }}
    >
      {/* ÜST BAŞLIK */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8e1b6, #e2b66a)",
          borderRadius: 26,
          padding: "28px 36px",
          marginBottom: 32,
          boxShadow: "0 14px 26px rgba(0,0,0,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "#4a3016",
              marginRight: 8,
            }}
          >
            MyCafe
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#6a4a27" }}>
            Premium Yönetim Paneli
          </span>
        </div>

        <button
          onClick={loadDashboard}
          style={{
            background: "linear-gradient(135deg, #4a3722, #2e1f12)",
            color: "#f9e3b4",
            border: "none",
            borderRadius: 999,
            padding: "14px 28px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 6px 14px rgba(0,0,0,0.45)",
          }}
        >
          ⟳ ŞİMDİ YENİLE
        </button>
      </div>

      {/* HIZLI MENÜ */}
      <div
        style={{
          background: "linear-gradient(145deg, #f4dfc1, #f0d2a6)",
          borderRadius: 24,
          padding: "24px 26px 32px",
          marginBottom: 32,
          boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: "#4a3016" }}>
          HIZLI MENÜ
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 22,
          }}
        >
          <QuickMenuCard label="Ürün Yönetimi" icon="📦" onClick={() => navigate("/urun-stok")} />
          <QuickMenuCard label="Raporlar" icon="📊" onClick={() => navigate("/raporlar")} />
          <QuickMenuCard label="Stok Yönetimi" icon="📈" onClick={() => navigate("/urun-stok")} />
          <QuickMenuCard label="Masalar" icon="🪑" onClick={() => navigate("/masalar")} />
        </div>
      </div>

      {/* GÜNÜN ÖZETİ */}
      <div
        style={{
          background: "linear-gradient(145deg, #f4dfc1, #f0d2a6)",
          borderRadius: 24,
          padding: "24px 26px",
          marginBottom: 32,
          boxShadow: "0 12px 22px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: "#4a3016" }}>
          GÜNÜN ÖZETİ
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <SummaryCard title="Günlük Satış" value={formatTL(gunlukSatis)} />
          <SummaryCard title="Günlük Hesaba Yaz" value={formatTL(gunlukHesabaYaz)} />
          <SummaryCard title="Günlük Gider" value={formatTL(gunlukGider)} />
          <SummaryCard title="Aktif Adisyon" value={aktifAdisyonSayisi} />
        </div>
      </div>

      {/* ALT 3 PANEL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 26,
        }}
      >
        {/* Açık adisyonlar */}
        <div
          style={{
            backgroundColor: RENK.kart,
            borderRadius: 26,
            padding: "28px",
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 18,
              color: "#4a3016",
            }}
          >
            AÇIK ADİSYONLAR
          </div>

          <div
            style={{
              backgroundColor: "#f5e6cf",
              borderRadius: 18,
              padding: "16px",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {acikAdisyonlar.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: RENK.griYazi,
                }}
              >
                Açık adisyon yok.
              </div>
            )}

            {acikAdisyonlar.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 8px",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#4a3016",
                }}
              >
                <div>{a.masaLabel}</div>
                <div>{formatTL(a.toplam)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Günlük gider */}
        <div
          style={{
            backgroundColor: RENK.kart,
            borderRadius: 26,
            padding: "28px",
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 14,
              color: "#4a3016",
            }}
          >
            GÜNLÜK GİDER
          </div>

          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: RENK.kirmizi,
            }}
          >
            {formatTL(gunlukGider)}
          </div>
          <div style={{ marginTop: 6, color: RENK.griYazi }}>(bugün)</div>
        </div>

        {/* Kritik stoklar */}
        <div
          style={{
            backgroundColor: RENK.kart,
            borderRadius: 26,
            padding: "28px",
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 18,
              color: "#4a3016",
            }}
          >
            KRİTİK STOKLAR
          </div>

          <div
            style={{
              backgroundColor: "#f5e6cf",
              borderRadius: 18,
              padding: "16px",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {kritikStoklar.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: RENK.griYazi,
                }}
              >
                Kritik stok yok.
              </div>
            )}

            {kritikStoklar.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 8px",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#4a3016",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: RENK.kirmizi, fontSize: 18 }}>▲</span>
                  {u.ad}
                </div>
                <div style={{ fontSize: 14 }}>Stok: {u.stokMiktar || u.stok}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ALT BİLEŞENLER
// ------------------------------------------------------
const QuickMenuCard = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: "#fdf5ea",
      borderRadius: 24,
      padding: "22px",
      fontSize: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(0,0,0,0.22)",
      color: "#4a3016",
      fontWeight: 700,
    }}
  >
    <div style={{ fontSize: 42 }}>{icon}</div>
    <div>{label}</div>
  </button>
);

const SummaryCard = ({ title, value }) => (
  <div
    style={{
      backgroundColor: "#fdf5ea",
      borderRadius: 18,
      padding: "18px 20px",
      boxShadow: "0 10px 18px rgba(0,0,0,0.22)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 700, color: "#4a3016" }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color: "#4a3016" }}>{value}</div>
  </div>
);

export default AnaEkran;
