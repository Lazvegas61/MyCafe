import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  GENEL ÖZET - FİNAL MİMARİ
  ------------------------
  - TEK KAYNAK: mc_finans_havuzu
  - PURE hesaplama
  - HESABA_YAZ ciroya girmez (bilgi amaçlı gösterilir)
  - TAM SAYFA GÖRÜNÜM
*/

const GenelOzet = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [finansVerileri, setFinansVerileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const navigate = useNavigate();

  /* ------------------ RAPOR MENÜSÜ ------------------ */
  const raporlar = [
    {
      id: "kasa",
      ad: "Kasa Raporu",
      path: "/raporlar/kasa",
      icon: "💰",
      aciklama: "Gelir, gider ve net kasa hareketleri"
    },
    {
      id: "bilardo",
      ad: "Bilardo Raporu",
      path: "/raporlar/bilardo",
      icon: "🎱",
      aciklama: "Bilardo masalarına ait gelirler"
    },
    {
      id: "urun",
      ad: "Ürün Raporu",
      path: "/raporlar/urun",
      icon: "🍕",
      aciklama: "Ürün bazlı satış performansı"
    },
    {
      id: "kategori",
      ad: "Kategori Raporu",
      path: "/raporlar/kategori",
      icon: "📊",
      aciklama: "Kategori bazlı satış dağılımı"
    },
    {
      id: "masa",
      ad: "Masa Raporu",
      path: "/raporlar/masa",
      icon: "🍽️",
      aciklama: "Masa bazlı ciro analizi"
    },
    {
      id: "gider",
      ad: "Gider Raporu",
      path: "/raporlar/gider",
      icon: "💸",
      aciklama: "Gider kalemleri ve toplam gider"
    }
  ];

  /* ------------------ VERİ OKU (TEK KAYNAK) ------------------ */
  useEffect(() => {
    const havuz = JSON.parse(localStorage.getItem("mc_finans_havuzu") || "[]");
    setFinansVerileri(havuz);
    setYukleniyor(false);
    console.log(`📊 Finans havuzunda ${havuz.length} kayıt yüklendi`);
  }, []);

  /* ------------------ TARİH FİLTRELEME ------------------ */
  const filtrelenmisVeriler = useMemo(() => {
    if (!baslangic && !bitis) return finansVerileri;
    
    return finansVerileri.filter(kayit => {
      const tarihStr = kayit.tarih ? new Date(kayit.tarih).toISOString().split('T')[0] : "";
      if (baslangic && tarihStr < baslangic) return false;
      if (bitis && tarihStr > bitis) return false;
      return true;
    });
  }, [finansVerileri, baslangic, bitis]);

  /* ------------------ PURE HESAPLAMALAR ------------------ */

  // Toplam GELİR (ciro) - HESABA_YAZ hariç
  const toplamGelir = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru !== "HESABA_YAZ")
      .reduce((s, k) => s + Number(k.tutar || 0), 0);
  }, [filtrelenmisVeriler]);

  // Toplam GİDER
  const toplamGider = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GIDER")
      .reduce((s, k) => s + Number(k.tutar || 0), 0);
  }, [filtrelenmisVeriler]);

  // Toplam İNDİRİM
  const toplamIndirim = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "INDIRIM")
      .reduce((s, k) => s + Number(k.tutar || 0), 0);
  }, [filtrelenmisVeriler]);

  // 🔥 HESABA YAZ (BİLGİ AMAÇLI – CİROYA GİRMEZ)
  const toplamHesabaYaz = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru === "HESABA_YAZ")
      .reduce((s, k) => s + Number(k.tutar || 0), 0);
  }, [filtrelenmisVeriler]);

  // Net Kasa
  const netKasa = toplamGelir - toplamGider;

  // Kâr Marjı
  const karMarji = useMemo(() => {
    if (toplamGelir === 0) return 0;
    return ((netKasa / toplamGelir) * 100).toFixed(1);
  }, [toplamGelir, netKasa]);

  /* ------------------ ÖDEME TÜRLERİ ANALİZİ ------------------ */
  const odemeTuruDagilimi = useMemo(() => {
    const dagilim = {};
    filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru && k.odemeTuru !== "HESABA_YAZ")
      .forEach(kayit => {
        const tur = kayit.odemeTuru || "DIĞER";
        if (!dagilim[tur]) {
          dagilim[tur] = { toplam: 0, sayi: 0 };
        }
        dagilim[tur].toplam += Number(kayit.tutar || 0);
        dagilim[tur].sayi += 1;
      });
    return dagilim;
  }, [filtrelenmisVeriler]);

  /* ------------------ GİDER KATEGORİLERİ ------------------ */
  const giderKategorileri = useMemo(() => {
    const kategoriler = {};
    filtrelenmisVeriler
      .filter(k => k.tur === "GIDER")
      .forEach(kayit => {
        const kategori = kayit.kategori || "GENEL";
        if (!kategoriler[kategori]) {
          kategoriler[kategori] = { toplam: 0, sayi: 0 };
        }
        kategoriler[kategori].toplam += Number(kayit.tutar || 0);
        kategoriler[kategori].sayi += 1;
      });
    return kategoriler;
  }, [filtrelenmisVeriler]);

  /* ------------------ ADİSYON ANALİZİ ------------------ */
  const adisyonAnalizi = useMemo(() => {
    const gelirAdisyonlari = filtrelenmisVeriler.filter(
      k => k.tur === "GELIR" && 
           k.odemeTuru !== "HESABA_YAZ" && 
           (k.kaynak === "ADISYON" || k.kaynak === "BİLARDO")
    );
    
    const toplamTutar = gelirAdisyonlari.reduce((s, k) => s + Number(k.tutar || 0), 0);
    const sayi = gelirAdisyonlari.length;
    const ortalama = sayi > 0 ? toplamTutar / sayi : 0;
    
    return { sayi, ortalama, toplamTutar };
  }, [filtrelenmisVeriler]);

  /* ------------------ BİLARDO GELİRİ ------------------ */
  const bilardoGeliri = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.kaynak === "BİLARDO" && k.odemeTuru !== "HESABA_YAZ")
      .reduce((s, k) => s + Number(k.tutar || 0), 0);
  }, [filtrelenmisVeriler]);

  /* ------------------ YÜKLENİYOR DURUMU ------------------ */
  if (yukleniyor) {
    return (
      <div style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f9fa",
        zIndex: 1000
      }}>
        <div style={{ 
          textAlign: "center", 
          color: "#666",
          padding: 40
        }}>
          <div style={{ fontSize: 24, marginBottom: 20, fontWeight: "bold", color: "#7a3e06" }}>
            📊 Genel Özet Hazırlanıyor...
          </div>
          <div style={{ fontSize: 16, marginBottom: 30 }}>
            Finans havuzu verileri analiz ediliyor.
          </div>
          <div style={{
            width: 200,
            height: 4,
            background: "#e0e0e0",
            borderRadius: 2,
            margin: "0 auto",
            overflow: "hidden"
          }}>
            <div style={{
              width: "60%",
              height: "100%",
              background: "#3498db",
              animation: "loading 1.5s infinite ease-in-out"
            }}></div>
          </div>
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 32, 
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      boxSizing: "border-box"
    }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 24
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0, 
              color: "#7a3e06", 
              fontSize: "2.4rem",
              fontWeight: "bold"
            }}>
              📊 Genel Özet (Final Mimari)
            </h2>
            <p style={{ 
              marginTop: 10, 
              color: "#666", 
              fontSize: 17,
              lineHeight: 1.5
            }}>
              TEK kaynak: <strong>mc_finans_havuzu</strong> | 
              <span style={{ 
                background: "#3498db", 
                color: "white",
                padding: "4px 12px",
                borderRadius: 20,
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "bold"
              }}>
                {finansVerileri.length} kayıt
              </span>
              {baslangic || bitis ? (
                <span style={{ 
                  background: "#2ecc71", 
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: 20,
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: "bold"
                }}>
                  {filtrelenmisVeriler.length} filtrelendi
                </span>
              ) : null}
            </p>
          </div>
          
          <div style={{ 
            textAlign: "right",
            fontSize: 15,
            color: "#666"
          }}>
            <div style={{ 
              fontWeight: "bold",
              fontSize: 18,
              color: "#7a3e06"
            }}>
              {new Date().toLocaleDateString("tr-TR", { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div style={{ marginTop: 4 }}>
              Saat: {new Date().toLocaleTimeString("tr-TR")}
            </div>
          </div>
        </div>
      </div>

      {/* FİLTRE */}
      <div style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        gap: 24,
        marginBottom: 32,
        alignItems: "flex-end",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 15,
            fontWeight: "600",
            color: "#7a3e06"
          }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            style={{ 
              padding: "12px 16px", 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              width: "100%",
              fontSize: 15,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 15,
            fontWeight: "600",
            color: "#7a3e06"
          }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            style={{ 
              padding: "12px 16px", 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              width: "100%",
              fontSize: 15,
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: 12,
          alignItems: "center"
        }}>
          <button
            onClick={() => {
              setBaslangic("");
              setBitis("");
            }}
            style={{
              padding: "12px 24px",
              background: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: "600",
              color: "#666",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#e9ecef";
              e.currentTarget.style.borderColor = "#7a3e06";
              e.currentTarget.style.color = "#7a3e06";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#f8f9fa";
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.color = "#666";
            }}
          >
            ✨ Filtreyi Temizle
          </button>
        </div>
      </div>

      {/* TARİH BİLGİSİ */}
      <div
        style={{
          background: "#f5e7d0",
          padding: 16,
          borderRadius: 10,
          marginBottom: 32,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 500
        }}
      >
        <strong>{baslangic && bitis ? `${baslangic} - ${bitis}` : "Tüm zamanlar"}</strong> tarih aralığına ait veriler görüntülenmektedir.
        {baslangic || bitis ? ` (${filtrelenmisVeriler.length} kayıt)` : ""}
      </div>

      {/* TEMEL METRİKLER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginBottom: 40
        }}
      >
        <OzetKart
          baslik="Toplam Ciro"
          deger={toplamGelir}
          renk="#2ecc71"
          icon="💰"
          aciklama="Hesaba Yaz hariç"
        />
        <OzetKart
          baslik="Net Kasa"
          deger={netKasa}
          renk={netKasa >= 0 ? "#3498db" : "#e74c3c"}
          icon={netKasa >= 0 ? "📈" : "📉"}
          aciklama={`%${karMarji} kâr marjı`}
        />
        <OzetKart
          baslik="Toplam Gider"
          deger={toplamGider}
          renk="#e74c3c"
          icon="💸"
          aciklama={`${Object.keys(giderKategorileri).length} kategori`}
        />
        <OzetKart
          baslik="Toplam İndirim"
          deger={toplamIndirim}
          renk="#9b59b6"
          icon="🎁"
          aciklama="Müşteri indirimleri"
        />
        <OzetKart
          baslik="Bilardo Geliri"
          deger={bilardoGeliri}
          renk="#1abc9c"
          icon="🎱"
          aciklama="Sadece bilardo gelirleri"
        />
        <OzetKart
          baslik="Hesaba Yaz (Bilgi)"
          deger={toplamHesabaYaz}
          renk="#e67e22"
          icon="📝"
          aciklama="Ciroya dahil değildir"
        />
        <OzetKart
          baslik="Adisyon Sayısı"
          deger={adisyonAnalizi.sayi}
          renk="#34495e"
          icon="🍽️"
          aciklama={`Ortalama: ${adisyonAnalizi.ortalama.toFixed(1)} ₺`}
        />
        <OzetKart
          baslik="Açık Adisyon"
          deger={toplamHesabaYaz}
          renk="#d35400"
          icon="📋"
          aciklama="Kapanmamış borçlar"
        />
      </div>

      {/* ÖDEME TÜRLERİ DAĞILIMI */}
      {Object.keys(odemeTuruDagilimi).length > 0 && (
        <div style={{
          background: "#fff",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          marginBottom: 40
        }}>
          <h3 style={{ 
            margin: "0 0 24px 0", 
            color: "#7a3e06",
            fontSize: "1.8rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            💳 Ödeme Türleri Dağılımı
            <span style={{ 
              fontSize: 14, 
              background: "#f8f9fa",
              color: "#666",
              padding: "6px 12px",
              borderRadius: 20,
              fontWeight: "500"
            }}>
              {Object.keys(odemeTuruDagilimi).length} ödeme türü
            </span>
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20
          }}>
            {Object.entries(odemeTuruDagilimi).map(([tur, veri]) => {
              const yuzde = toplamGelir > 0 ? ((veri.toplam / toplamGelir) * 100).toFixed(1) : 0;
              const odemeRenkleri = {
                NAKIT: "#2ecc71",
                KART: "#3498db",
                HAVALE: "#9b59b6",
                BILARDO: "#1abc9c",
                POS: "#3498db",
                NAKİT: "#2ecc71"
              };
              
              const odemeIconlari = {
                NAKIT: "💵",
                KART: "💳",
                HAVALE: "🏦",
                BILARDO: "🎱",
                POS: "💳",
                NAKİT: "💵"
              };
              
              return (
                <div key={tur} style={{
                  padding: 20,
                  background: "#f8f9fa",
                  borderRadius: 10,
                  borderLeft: `4px solid ${odemeRenkleri[tur] || "#95a5a6"}`,
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12
                  }}>
                    <span style={{ fontSize: 24 }}>{odemeIconlari[tur] || "💰"}</span>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: "600",
                      color: "#555"
                    }}>
                      {tur === "NAKIT" ? "Nakit" : 
                       tur === "KART" ? "Kredi Kartı" : 
                       tur === "HAVALE" ? "Havale" : 
                       tur === "BILARDO" ? "Bilardo" : 
                       tur === "POS" ? "POS" : tur}
                    </div>
                    <div style={{
                      marginLeft: "auto",
                      fontSize: 13,
                      background: (odemeRenkleri[tur] || "#95a5a6") + "20",
                      color: odemeRenkleri[tur] || "#95a5a6",
                      padding: "3px 8px",
                      borderRadius: 12,
                      fontWeight: "bold"
                    }}>
                      {veri.sayi} işlem
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 22, 
                    fontWeight: "bold", 
                    color: odemeRenkleri[tur] || "#95a5a6",
                    marginBottom: 8
                  }}>
                    {veri.toplam.toLocaleString("tr-TR")} ₺
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#777",
                    fontWeight: "500"
                  }}>
                    %{yuzde} pay | Ort: {(veri.toplam / veri.sayi).toFixed(1)} ₺
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GİDER KATEGORİLERİ */}
      {Object.keys(giderKategorileri).length > 0 && (
        <div style={{
          background: "#fff",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          marginBottom: 40
        }}>
          <h3 style={{ 
            margin: "0 0 24px 0", 
            color: "#7a3e06",
            fontSize: "1.8rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            💸 Gider Kategorileri
            <span style={{ 
              fontSize: 14, 
              background: "#f8f9fa",
              color: "#666",
              padding: "6px 12px",
              borderRadius: 20,
              fontWeight: "500"
            }}>
              {Object.keys(giderKategorileri).length} kategori
            </span>
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20
          }}>
            {Object.entries(giderKategorileri).map(([kategori, veri]) => {
              const yuzde = toplamGider > 0 ? ((veri.toplam / toplamGider) * 100).toFixed(1) : 0;
              return (
                <div key={kategori} style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #fff9f9 0%, #ffffff 100%)",
                  borderRadius: 10,
                  border: "1px solid #ffebee",
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(231, 76, 60, 0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: "600",
                    color: "#e74c3c",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <span>📋</span>
                    {kategori}
                    <div style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      background: "#e74c3c20",
                      color: "#e74c3c",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontWeight: "bold"
                    }}>
                      {veri.sayi} adet
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 22, 
                    fontWeight: "bold", 
                    color: "#e74c3c"
                  }}>
                    {veri.toplam.toLocaleString("tr-TR")} ₺
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#777",
                    marginTop: 8
                  }}>
                    Giderlerin %{yuzde}'u | Ort: {(veri.toplam / veri.sayi).toFixed(1)} ₺
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAYLI RAPORLAR PANOSU */}
      <div style={{
        background: "#fff",
        padding: 28,
        borderRadius: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        marginBottom: 40
      }}>
        <h3 style={{ 
          margin: "0 0 28px 0", 
          color: "#7a3e06",
          fontSize: "1.8rem",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          📋 DETAYLI RAPORLAR
          <span style={{ 
            fontSize: 14, 
            background: "#f8f9fa",
            color: "#666",
            padding: "6px 12px",
            borderRadius: 20,
            fontWeight: "500"
          }}>
            Tüm raporlar bu özetten beslenir
          </span>
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24
        }}>
          {raporlar.map(r => (
            <div
              key={r.id}
              onClick={() => navigate(r.path)}
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                padding: 24,
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "1px solid #eaeaea"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center",
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  fontSize: 32,
                  color: "#7a3e06"
                }}>
                  {r.icon}
                </div>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: 18,
                    color: "#4b2e05",
                    fontWeight: "bold"
                  }}>
                    {r.ad}
                  </h4>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#7f8c8d",
                    marginTop: 4
                  }}>
                    Detaylı analiz
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: 14, 
                color: "#666",
                lineHeight: 1.6,
                marginBottom: 16
              }}>
                {r.aciklama}
              </div>
              <div style={{ 
                fontSize: 13, 
                color: "#7a3e06",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                Raporu aç →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MİMARİ BİLGİ */}
      <div style={{
        background: "#fff9e6",
        padding: 24,
        borderRadius: 12,
        marginBottom: 40,
        border: "1px solid #ffeaa7",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -10,
          right: -10,
          fontSize: 48,
          opacity: 0.1,
          color: "#7a3e06",
          transform: "rotate(15deg)"
        }}>
          ⚡
        </div>
        
        <h3 style={{ 
          margin: "0 0 16px 0", 
          color: "#7a3e06",
          fontSize: "1.5rem",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          🏗️ Mimari Bilgiler
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          fontSize: 14,
          lineHeight: 1.6
        }}>
          <div>
            <div style={{ fontWeight: "bold", color: "#7a3e06", marginBottom: 6 }}>
              ✅ TEK KAYNAK
            </div>
            <div style={{ color: "#666" }}>
              • Tüm veriler <strong>mc_finans_havuzu</strong>'dan okunur<br/>
              • Veri çakışması mümkün değil<br/>
              • Yeni hesaplama yok - sadece toplama
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: "bold", color: "#7a3e06", marginBottom: 6 }}>
              📊 HESABA YAZ (BİLGİ)
            </div>
            <div style={{ color: "#666" }}>
              • Finansal borçtur<br/>
              • Ciroya <strong>DAHİL DEĞİLDİR</strong><br/>
              • Yönetim bilgisi olarak gösterilir
            </div>
          </div>
          
          <div>
            <div style={{ fontWeight: "bold", color: "#7a3e06", marginBottom: 6 }}>
              🔄 FİLTRELEME
            </div>
            <div style={{ color: "#666" }}>
              • Tarih bazlı filtreleme<br/>
              • Tüm metrikler otomatik güncellenir<br/>
              • Gerçek zamanlı hesaplama
            </div>
          </div>
        </div>
        
        <div style={{
          marginTop: 20,
          padding: 12,
          background: "#f8f9fa",
          borderRadius: 8,
          fontSize: 13,
          color: "#666",
          textAlign: "center"
        }}>
          <strong>Toplam Kayıt:</strong> {finansVerileri.length} | 
          <strong> Filtrelenmiş:</strong> {filtrelenmisVeriler.length} | 
          <strong> Son Güncelleme:</strong> {new Date().toLocaleTimeString("tr-TR")}
        </div>
      </div>
    </div>
  );
};

export default GenelOzet;

/* ------------------ ÖZET KART BİLEŞENİ ------------------ */

const OzetKart = ({ baslik, deger, renk, icon, aciklama }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${renk}`,
        transition: "all 0.3s",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
      }}
    >
      {icon && (
        <div style={{
          position: "absolute",
          top: 20,
          right: 20,
          fontSize: 36,
          opacity: 0.1,
          color: renk
        }}>
          {icon}
        </div>
      )}
      
      <div style={{ 
        fontSize: 16, 
        color: "#555", 
        marginBottom: 12,
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        {baslik}
      </div>
      
      <div
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: renk,
          marginBottom: aciklama ? 6 : 0
        }}
      >
        {typeof deger === "number"
          ? deger.toLocaleString("tr-TR") + " ₺"
          : deger}
      </div>
      
      {aciklama && (
        <div style={{ 
          fontSize: 13, 
          color: "#777",
          fontWeight: "500",
          marginTop: 4
        }}>
          {aciklama}
        </div>
      )}
    </div>
  );
};