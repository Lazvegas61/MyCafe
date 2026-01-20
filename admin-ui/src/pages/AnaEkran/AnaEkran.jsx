import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AnaEkran.css";

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

const formatTL = (val) => Number(val || 0).toFixed(2) + " ₺";
const bugunStr = () => new Date().toISOString().split("T")[0];

const AnaEkran = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    gunlukGelir: 0,
    gunlukGider: 0,
    netKasa: 0,
    acikAdisyonlar: [],
    kritikStoklar: [],
    gunlukGiderler: [],
    sonYenileme: new Date(),
  });

  // ======================================================
  //                     VERİ OKUMA (MODEL C - KİLİTLENDİ)
  // ======================================================
  const okuDashboard = () => {
    // 1. Finans havuzundan okuma (SADECE finansal veriler için)
    const havuzStr = localStorage.getItem("mc_finans_havuzu");
    const havuz = havuzStr ? JSON.parse(havuzStr) : [];
    
    // 2. Stoklardan okuma
    const stoklarStr = localStorage.getItem("mc_stoklar");
    const stoklar = stoklarStr ? JSON.parse(stoklarStr) : [];

    // 3. AÇIK ADİSYONLAR - YALNIZCA mc_adisyonlar kaynağından (MODEL C KURALI)
    const adisyonlarStr = localStorage.getItem("mc_adisyonlar");
    const adisyonlar = adisyonlarStr ? JSON.parse(adisyonlarStr) : [];
    
    // 4. Bugünkü tarih
    const bugun = bugunStr();

    // 5. Günlük finans hesapları
    const gunlukIslemler = havuz.filter(item => 
      item.tarih && item.tarih.startsWith && item.tarih.startsWith(bugun)
    );
    
    const gunlukGelir = gunlukIslemler
      .filter(item => item.tur === "GELIR")
      .reduce((toplam, item) => toplam + (item.tutar || 0), 0);
    
    const gunlukGider = gunlukIslemler
      .filter(item => item.tur === "GIDER")
      .reduce((toplam, item) => toplam + (item.tutar || 0), 0);
    
    const netKasa = gunlukGelir - gunlukGider;

    // 6. AÇIK ADİSYONLAR (MODEL C) - KESİN VE TEK İSİMLİ ALAN
    const acikAdisyonlar = adisyonlar
      .filter(item => item.status === "OPEN") // SADECE bu kritere göre
      .map(item => ({
        id: item.id,
        masaNo: item.masaNo || 0,
        // 💎 KESİN KURAL: toplamTutar kullan (tüm sistemde tek isim)
        toplam: item.toplamTutar || 0 // FAZ C - ADIM 1.5: Tam kilitlendi
      }));

    // 7. Kritik stoklar
    const kritikStoklar = stoklar
      .filter(urun => urun.miktar <= (urun.kritik || 5))
      .map(urun => ({
        id: urun.id,
        ad: urun.ad,
        stok: urun.miktar
      }));

    // 8. Günlük gider listesi
    const gunlukGiderler = gunlukIslemler
      .filter(item => item.tur === "GIDER")
      .map(item => ({
        id: item.id,
        aciklama: item.aciklama || "Gider",
        tutar: item.tutar || 0
      }));

    setDashboard({
      gunlukGelir,
      gunlukGider,
      netKasa,
      acikAdisyonlar, // Artık sadece adisyonlar'dan geliyor ve kesin alanla
      kritikStoklar,
      gunlukGiderler,
      sonYenileme: new Date()
    });
  };

  // ======================================================
  //                     HİBRİT EFFECT
  // ======================================================
  useEffect(() => {
    // İlk yükleme
    okuDashboard();

    // ✅ HİBRİT SİSTEM: Anlık Event Dinleme
    window.addEventListener("finansDegisti", okuDashboard);
    window.addEventListener("adisyonDegisti", okuDashboard); // Adisyon değişikliklerini de dinle

    // ✅ HİBRİT SİSTEM: 1 dakikalık polling
    const interval = setInterval(okuDashboard, 60000);

    // ✅ HİBRİT SİSTEM: Temizleme (memory leak önleme)
    return () => {
      window.removeEventListener("finansDegisti", okuDashboard);
      window.removeEventListener("adisyonDegisti", okuDashboard);
      clearInterval(interval);
    };
  }, []);

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
            Premium Yönetim Paneli (Hibrit - MODEL C)
          </span>
        </div>
        
        {/* Son yenileme bilgisi */}
        <div style={{ fontSize: 14, color: "#7f5539" }}>
          Son yenileme: {dashboard.sonYenileme.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
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
          <QuickMenuCard label="Raporlar" icon="📊" onClick={() => {}} />
          <QuickMenuCard label="Stok Yönetimi" icon="📈" onClick={() => navigate("/urun-stok")} />
          <QuickMenuCard label="Masalar" icon="🪑" onClick={() => navigate("/masalar")} />
        </div>
      </div>

      {/* GÜNLÜK FİNANS ÖZETİ */}
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
          GÜNLÜK FİNANS ÖZETİ
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <SummaryCard 
            title="Günlük Gelir" 
            value={formatTL(dashboard.gunlukGelir)}
            color="#27ae60"
          />
          <SummaryCard 
            title="Günlük Gider" 
            value={formatTL(dashboard.gunlukGider)}
            color="#c0392b"
          />
          <SummaryCard 
            title="Net Kasa" 
            value={formatTL(dashboard.netKasa)}
            color={dashboard.netKasa >= 0 ? "#27ae60" : "#c0392b"}
          />
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
        {/* Açık adisyonlar - MODEL C Uyumlu ve KESİN */}
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
            AÇIK ADİSYONLAR (MODEL C)
            <span style={{ fontSize: 14, marginLeft: 8, color: RENK.griYazi }}>
              ({dashboard.acikAdisyonlar.length} adet)
            </span>
            <div style={{ fontSize: 12, color: "#7f5539", fontWeight: 400, marginTop: 4 }}>
              💎 KESİN KAYNAK: mc_adisyonlar (status="OPEN")<br/>
              💎 KESİN ALAN: toplamTutar
            </div>
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
            {dashboard.acikAdisyonlar.length === 0 && (
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

            {dashboard.acikAdisyonlar.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "#fff3dc",
                  borderRadius: 12,
                  fontWeight: 700,
                  color: "#4a3016",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Masa {a.masaNo}</span>
                <span>{formatTL(a.toplam)}</span>
              </div>
            ))}
          </div>
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
            <span style={{ fontSize: 14, marginLeft: 8, color: RENK.griYazi }}>
              ({dashboard.kritikStoklar.length} adet)
            </span>
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
            {dashboard.kritikStoklar.length === 0 && (
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

            {dashboard.kritikStoklar.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "#fdecea",
                  borderRadius: 12,
                  fontWeight: 700,
                  color: RENK.kirmizi,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{u.ad}</span>
                <span>{u.stok} adet</span>
              </div>
            ))}
          </div>
        </div>

        {/* Günlük gider listesi */}
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
            GÜNLÜK GİDER LİSTESİ
            <span style={{ fontSize: 14, marginLeft: 8, color: RENK.griYazi }}>
              ({dashboard.gunlukGiderler.length} adet)
            </span>
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
            {dashboard.gunlukGiderler.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: RENK.griYazi,
                }}
              >
                Bugün gider yok.
              </div>
            )}

            {dashboard.gunlukGiderler.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "#fdecea",
                  borderRadius: 12,
                  fontWeight: 700,
                  color: RENK.kirmizi,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {g.aciklama}
                </span>
                <span>{formatTL(g.tutar)}</span>
              </div>
            ))}
            
            {dashboard.gunlukGiderler.length > 0 && (
              <div
                style={{
                  padding: "12px",
                  marginTop: 8,
                  background: "#e74c3c",
                  borderRadius: 12,
                  fontWeight: 900,
                  color: "white",
                  textAlign: "center",
                }}
              >
                TOPLAM GİDER: {formatTL(dashboard.gunlukGider)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HİBRİT SİSTEM BİLGİ */}
      <div
        style={{
          marginTop: 32,
          padding: "16px",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: 12,
          textAlign: "center",
          fontSize: 14,
          color: "#7f5539",
        }}
      >
        💎 <strong>MODEL C KİLİTLENDİ:</strong> Açık adisyonlar → mc_adisyonlar (status="OPEN") | Tutar → toplamTutar
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
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 14px 24px rgba(0,0,0,0.3)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.22)";
    }}
  >
    <div style={{ fontSize: 42 }}>{icon}</div>
    <div>{label}</div>
  </button>
);

const SummaryCard = ({ title, value, color = "#4a3016" }) => (
  <div
    style={{
      backgroundColor: "#fdf5ea",
      borderRadius: 18,
      padding: "18px 20px",
      boxShadow: "0 10px 18px rgba(0,0,0,0.22)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.22)";
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 700, color: "#4a3016" }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
  </div>
);

export default AnaEkran;