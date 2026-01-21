import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import mcFinansHavuzu from "../../services/utils/mc_finans_havuzu";

/*
  GENEL ÖZET RAPORU - MERKEZİ FİNANS HAVUZU İLE
  ---------------------------------------------
  - mc_finans_havuzu'dan TEK KAYNAKTAN beslenir
  - Tüm diğer raporların ÜST KÜMESİ'dir
  - YENİ HESAPLAMA YOK, sadece toplama/gruplama
  - TAM SAYFA GÖRÜNÜM
*/

export default function GenelOzet() {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [finansVerileri, setFinansVerileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [giderler, setGiderler] = useState([]);
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

  /* ------------------ TÜM VERİLERİ OKU ------------------ */
  useEffect(() => {
    console.log("🔄 Genel Özet: Veriler yükleniyor...");
    
    // 1. Finans havuzunu oku
    const guncelFinansVerileri = mcFinansHavuzu.getFinansHavuzu();
    console.log(`📊 Finans havuzunda ${guncelFinansVerileri.length} kayıt var`);
    
    // 2. Giderleri oku
    const giderlerData = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
    
    setFinansVerileri(guncelFinansVerileri);
    setGiderler(giderlerData);
    setYukleniyor(false);
    
  }, []);

  /* ------------------ FİLTRELENMİŞ VERİLER ------------------ */
  const filtrelenmisVeriler = useMemo(() => {
    if (!baslangic && !bitis) {
      return finansVerileri;
    }
    
    return mcFinansHavuzu.tariheGoreFiltrele(baslangic, bitis);
  }, [finansVerileri, baslangic, bitis]);

  /* ------------------ TEMEL METRİKLER ------------------ */
  const toplamGelir = useMemo(() => {
    return mcFinansHavuzu.toplamGelirHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const toplamGider = useMemo(() => {
    return mcFinansHavuzu.toplamGiderHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const toplamHesabaYaz = useMemo(() => {
    return mcFinansHavuzu.toplamHesabaYazHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const netKasa = toplamGelir - toplamGider;

  /* ------------------ ÖDEME TÜRÜ DAĞILIMI ------------------ */
  const odemeTuruGruplari = useMemo(() => {
    return mcFinansHavuzu.odemeTuruBazliToplamlar(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  /* ------------------ BİLARDO GELİRİ ------------------ */
  const bilardoGeliri = useMemo(() => {
    const bilardoKayitlar = filtrelenmisVeriler.filter(
      k => k.kaynak === "BİLARDO" && k.tur === "GELIR"
    );
    
    return bilardoKayitlar.reduce((toplam, kayit) => 
      toplam + Number(kayit.tutar || 0), 0
    );
  }, [filtrelenmisVeriler]);

  /* ------------------ ADİSYON SAYISI ------------------ */
  const adisyonSayisi = useMemo(() => {
    return filtrelenmisVeriler.filter(
      k => (k.kaynak === "ADISYON" || k.kaynak === "BİLARDO") && k.tur === "GELIR"
    ).length;
  }, [filtrelenmisVeriler]);

  /* ------------------ ORTALAMA ADİSYON TUTARI ------------------ */
  const ortalamaAdisyonTutari = useMemo(() => {
    const gelirKayitlari = filtrelenmisVeriler.filter(
      k => k.tur === "GELIR" && (k.kaynak === "ADISYON" || k.kaynak === "BİLARDO")
    );
    
    if (gelirKayitlari.length === 0) return 0;
    
    const toplam = gelirKayitlari.reduce((sum, k) => sum + Number(k.tutar || 0), 0);
    return toplam / gelirKayitlari.length;
  }, [filtrelenmisVeriler]);

  /* ------------------ GİDER DAĞILIMI ------------------ */
  const giderDagilimi = useMemo(() => {
    const giderKayitlari = filtrelenmisVeriler.filter(k => k.tur === "GIDER");
    const gruplar = {};
    
    giderKayitlari.forEach(kayit => {
      const kategori = kayit.kategori || "GENEL";
      if (!gruplar[kategori]) {
        gruplar[kategori] = { toplam: 0, sayi: 0 };
      }
      gruplar[kategori].toplam += Number(kayit.tutar || 0);
      gruplar[kategori].sayi += 1;
    });
    
    return gruplar;
  }, [filtrelenmisVeriler]);

  /* ------------------ KÂR MARJI ------------------ */
  const karMarjiYuzdesi = useMemo(() => {
    if (toplamGelir === 0) return 0;
    return ((netKasa / toplamGelir) * 100).toFixed(1);
  }, [toplamGelir, netKasa]);

  /* ------------------ VERİ AKTARMA ------------------ */
  const handleVeriAktar = () => {
    if (window.confirm("Tüm eski adisyon ve giderler finans havuzuna aktarılacak. Devam edilsin mi?")) {
      const aktarilan = mcFinansHavuzu.tumAdisyonlariFinansHavuzunaAktar();
      alert(`✅ ${aktarilan} kayıt finans havuzuna aktarıldı. Sayfa yenileniyor...`);
      window.location.reload();
    }
  };

  /* ------------------ FİLTRELENMİŞ GİDERLER ------------------ */
  const filtrelenmisGiderler = useMemo(() => {
    return giderler.filter(gider => {
      const tarihStr = gider.tarih ? new Date(gider.tarih).toISOString().split('T')[0] : "";
      
      if (baslangic && tarihStr < baslangic) return false;
      if (bitis && tarihStr > bitis) return false;
      
      return true;
    });
  }, [giderler, baslangic, bitis]);

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
              📊 Raporlar – Genel Özet
            </h2>
            <p style={{ 
              marginTop: 10, 
              color: "#666", 
              fontSize: 17,
              lineHeight: 1.5
            }}>
              mc_finans_havuzu tek kaynak | Tüm raporların özeti
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
        
        {/* YÖNETİM BUTONU */}
        <div style={{ 
          display: "flex", 
          gap: 12, 
          marginTop: 16
        }}>
          <button
            onClick={handleVeriAktar}
            style={{
              padding: "12px 20px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 3px 6px rgba(52, 152, 219, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 10px rgba(52, 152, 219, 0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 6px rgba(52, 152, 219, 0.3)";
            }}
            title="Eski verileri finans havuzuna ekler"
          >
            🔄 Veri Aktar
          </button>
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
      </div>

      {/* TEMEL METRİKLER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 24,
          marginBottom: 40
        }}
      >
        <OzetKart
          baslik="Toplam Ciro"
          deger={toplamGelir}
          renk="#2ecc71"
          para
          icon="💰"
        />
        <OzetKart
          baslik="Net Kasa"
          deger={netKasa}
          renk={netKasa >= 0 ? "#3498db" : "#e74c3c"}
          para
          icon={netKasa >= 0 ? "📈" : "📉"}
        />
        <OzetKart
          baslik="Açık Borç"
          deger={toplamHesabaYaz}
          renk="#e67e22"
          para
          icon="📝"
        />
        <OzetKart
          baslik="Bilardo Geliri"
          deger={bilardoGeliri}
          renk="#1abc9c"
          para
          icon="🎱"
        />
        <OzetKart
          baslik="Toplam Gider"
          deger={toplamGider}
          renk="#e74c3c"
          para
          icon="💸"
        />
        <OzetKart
          baslik="Ort. Adisyon"
          deger={ortalamaAdisyonTutari}
          renk="#9b59b6"
          para
          icon="🍽️"
        />
      </div>

      {/* RAPORLAR ÖZET PANOSU */}
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

      {/* ÖDEME TÜRLERİ ÖZETİ */}
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
          fontWeight: "bold"
        }}>
          💳 ÖDEME TÜRLERİ ÖZETİ
        </h3>
        
        {Object.values(odemeTuruGruplari).some(grup => grup.toplam > 0) ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20
          }}>
            {Object.entries(odemeTuruGruplari)
              .filter(([tur, grup]) => grup.toplam > 0)
              .map(([tur, grup]) => {
                const odemeRenkleri = {
                  NAKIT: "#2ecc71",
                  KART: "#3498db",
                  HAVALE: "#9b59b6",
                  HESABA_YAZ: "#e67e22",
                  BILARDO: "#1abc9c"
                };
                
                const odemeIconlari = {
                  NAKIT: "💵",
                  KART: "💳",
                  HAVALE: "🏦",
                  HESABA_YAZ: "📝",
                  BILARDO: "🎱"
                };
                
                const yuzde = toplamGelir > 0 ? ((grup.toplam / toplamGelir) * 100).toFixed(1) : 0;
                
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
                         tur === "KART" ? "K.Kartı" : 
                         tur === "HAVALE" ? "Havale" : 
                         tur === "HESABA_YAZ" ? "Hesaba Yaz" : 
                         tur === "BILARDO" ? "Bilardo" : tur}
                      </div>
                      <div style={{
                        marginLeft: "auto",
                        fontSize: 13,
                        background: odemeRenkleri[tur] + "20",
                        color: odemeRenkleri[tur],
                        padding: "3px 8px",
                        borderRadius: 12,
                        fontWeight: "bold"
                      }}>
                        {grup.sayi} adet
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 22, 
                      fontWeight: "bold", 
                      color: odemeRenkleri[tur],
                      marginBottom: 8
                    }}>
                      {grup.toplam.toLocaleString("tr-TR")} ₺
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: "#777",
                      fontWeight: "500"
                    }}>
                      %{yuzde} pay
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ 
            padding: 40, 
            textAlign: "center", 
            color: "#999", 
            fontStyle: "italic",
            background: "#f9f9f9",
            borderRadius: 12
          }}>
            <div style={{ fontSize: 20, marginBottom: 16 }}>
              💡 Ödeme türü verisi bulunamadı
            </div>
            <div style={{ fontSize: 15, color: "#666" }}>
              "Veri Aktar" butonunu kullanın veya yeni adisyonlar kapatın.
            </div>
          </div>
        )}
      </div>

      {/* GİDER DAĞILIMI */}
      {Object.keys(giderDagilimi).length > 0 && (
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
            fontWeight: "bold"
          }}>
            💸 GİDER DAĞILIMI
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20
          }}>
            {Object.entries(giderDagilimi).map(([kategori, veri]) => (
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
                  Giderlerin %{toplamGider > 0 ? ((veri.toplam / toplamGider) * 100).toFixed(1) : 0}'u
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞEN ------------------ */

function OzetKart({ baslik, deger, renk, para, icon }) {
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
          color: renk
        }}
      >
        {typeof deger === "number"
          ? para
            ? deger.toLocaleString("tr-TR") + " ₺"
            : deger.toFixed(1).toLocaleString("tr-TR")
          : deger}
      </div>
    </div>
  );
}
