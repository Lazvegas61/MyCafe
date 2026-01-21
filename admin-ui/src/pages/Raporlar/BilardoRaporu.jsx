import React, { useEffect, useState, useMemo } from "react";

/*
  BİLARDO RAPORU - YENİ SİSTEME UYGUN
  ------------------------------------
  - Veri Kaynağı: bilardo_adisyonlar (ANA KAYNAK)
  - Tüm kapalı bilardo adisyonlarını gösterir
  - Gün bazlı filtreleme
  - Yeni mimariye uygun veri okuma
  - TAM SAYFA GÖRÜNÜM
*/

// ✅ YENİ: Normalizasyon fonksiyonları
const tarihToGunId = (tarih) => {
  if (!tarih) return "";
  try {
    if (typeof tarih === 'number') return new Date(tarih).toISOString().split('T')[0];
    if (typeof tarih === 'string') {
      if (tarih.includes('T')) return tarih.split('T')[0];
      if (!isNaN(Number(tarih))) return new Date(Number(tarih)).toISOString().split('T')[0];
      return tarih; // Zaten YYYY-MM-DD formatında
    }
    return "";
  } catch {
    return "";
  }
};

// ✅ YENİ: Adisyon toplamını hesapla
const getAdisyonToplam = (adisyon) => {
  if (adisyon.toplamTutar) return Number(adisyon.toplamTutar);
  
  if (adisyon.kalemler && Array.isArray(adisyon.kalemler)) {
    return adisyon.kalemler.reduce((sum, kalem) => {
      return sum + (Number(kalem.birimFiyat || 0) * Number(kalem.adet || 1));
    }, 0);
  }
  
  return 0;
};

// ✅ YENİ: Adisyon tarihini bul
const getAdisyonTarihi = (adisyon) => {
  // Öncelik sırası: kapanış → açılış → bugün
  if (adisyon.kapanisZamani) {
    return new Date(adisyon.kapanisZamani);
  }
  if (adisyon.acilisZamani) {
    return new Date(adisyon.acilisZamani);
  }
  if (adisyon.gunId) {
    return new Date(adisyon.gunId);
  }
  if (adisyon.gunld) {
    return new Date(adisyon.gunld);
  }
  return new Date();
};

export default function BilardoRaporu() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [bilardoVar, setBilardoVar] = useState(false);
  const [gunDurumlari, setGunDurumlari] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ YENİ: Gün durumlarını yükle
  useEffect(() => {
    try {
      // Gün durumlarını yükle
      const durumlar = JSON.parse(localStorage.getItem("mc_gun_durumlari") || "[]");
      setGunDurumlari(durumlar);
    } catch (error) {
      console.error("Gün durumları yükleme hatası:", error);
    }
  }, []);

  // ✅ YENİ: Filtreleme fonksiyonu
  const filtreleBilardoAdisyonlar = () => {
    try {
      console.log("🔍 BilardoRaporu: Veriler yükleniyor...");
      
      // 1. Bilardo adisyonlarını yükle
      const bilardoAdisyonlarStr = localStorage.getItem("bilardo_adisyonlar") || "[]";
      const tumBilardoAdisyonlar = JSON.parse(bilardoAdisyonlarStr);
      
      console.log(`📊 Toplam bilardo adisyonu: ${tumBilardoAdisyonlar.length}`);
      
      // 2. Sadece KAPALI adisyonları al (yeni mimariye göre)
      const kapaliBilardoAdisyonlar = tumBilardoAdisyonlar.filter(adisyon => {
        return adisyon.kapali === true || adisyon.status === "CLOSED";
      });
      
      console.log(`📊 Kapalı bilardo adisyonu: ${kapaliBilardoAdisyonlar.length}`);
      
      // 3. Tarih filtresi uygula
      const filtrelenmis = kapaliBilardoAdisyonlar.filter(adisyon => {
        const tarih = getAdisyonTarihi(adisyon);
        const tarihStr = tarihToGunId(tarih);
        
        if (!tarihStr) return false;
        if (from && tarihStr < from) return false;
        if (to && tarihStr > to) return false;
        
        return true;
      });
      
      console.log(`📊 Filtrelenmiş bilardo adisyonu: ${filtrelenmis.length}`);
      
      // 4. Toplam hesapla
      const toplamTutar = filtrelenmis.reduce((sum, adisyon) => {
        return sum + getAdisyonToplam(adisyon);
      }, 0);
      
      // 5. State'i güncelle
      setListe(filtrelenmis);
      setToplam(toplamTutar);
      setBilardoVar(filtrelenmis.length > 0);
      setLoading(false);
      
      console.log("✅ BilardoRaporu: Veriler güncellendi", {
        adet: filtrelenmis.length,
        toplam: toplamTutar
      });
      
    } catch (error) {
      console.error("❌ BilardoRaporu hatası:", error);
      setLoading(false);
      setBilardoVar(false);
    }
  };

  useEffect(() => {
    filtreleBilardoAdisyonlar();
  }, [from, to]);

  // ✅ YENİ: Gün kapatılmış mı kontrolü
  const gunKapaliMi = (tarihStr) => {
    if (!tarihStr) return false;
    
    const gun = gunDurumlari.find(
      g => tarihToGunId(g.tarih) === tarihStr || g.gunId === tarihStr
    );
    
    return gun && (gun.durum === "KAPALI" || gun.status === "CLOSED");
  };

  // ✅ YENİ: Adisyon detaylarını formatla
  const formatAdisyonDetay = (adisyon) => {
    const tarih = getAdisyonTarihi(adisyon);
    const toplam = getAdisyonToplam(adisyon);
    const masaTipi = adisyon.masaTipi || "Bilardo Masa";
    const sure = adisyon.sure || adisyon.sureDk || "-";
    
    return {
      tarih: tarih.toLocaleString("tr-TR"),
      masaTipi,
      sure: sure === "suresiz" ? "Süresiz" : `${sure} dk`,
      toplam,
      kalemler: adisyon.kalemler || [],
      not: adisyon.not || ""
    };
  };

  // ✅ YENİ: Yenileme butonu
  const handleYenile = () => {
    setLoading(true);
    setTimeout(() => {
      filtreleBilardoAdisyonlar();
    }, 300);
  };

  if (loading) {
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
          <div style={{ fontSize: 24, marginBottom: 20, fontWeight: "bold", color: "#006064" }}>
            🎱 Bilardo Raporu Hazırlanıyor...
          </div>
          <div style={{ fontSize: 16, marginBottom: 30 }}>
            Bilardo adisyon verileri okunuyor.
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
              color: "#006064", 
              fontSize: "2.4rem",
              fontWeight: "bold"
            }}>
              🎱 Bilardo Gelir Raporu
            </h2>
            <p style={{ 
              marginTop: 10, 
              color: "#666", 
              fontSize: 17,
              lineHeight: 1.5
            }}>
              Kapalı bilardo adisyonları ve detaylı gelir analizi |
              <span style={{ 
                background: "#3498db", 
                color: "white",
                padding: "4px 12px",
                borderRadius: 20,
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "bold"
              }}>
                {liste.length} kayıt
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
              color: "#006064"
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

      {/* FİLTRE VE KONTROLLER */}
      <div style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        gap: 24,
        alignItems: "flex-end",
        marginBottom: 32,
        flexWrap: "wrap"
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 15,
            fontWeight: "600",
            color: "#006064"
          }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
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
            color: "#006064"
          }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
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
            onClick={handleYenile}
            style={{
              padding: "12px 24px",
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
          >
            🔄 Verileri Yenile
          </button>

          <button
            onClick={() => { setFrom(""); setTo(""); }}
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
              e.currentTarget.style.borderColor = "#006064";
              e.currentTarget.style.color = "#006064";
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

      {/* BİLGİ PANELİ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 24,
        marginBottom: 40
      }}>
        <OzetKart
          baslik="Toplam Bilardo Geliri"
          deger={toplam.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
          icon="💰"
          altBilgi={`${liste.length} adet kapalı adisyon`}
        />
        
        <OzetKart
          baslik="Kapalı Bilardo Adisyonları"
          deger={liste.length.toString() + " adet"}
          renk="#3498db"
          icon="🎱"
          altBilgi={`Son kayıt: ${liste.length > 0 ? 
            new Date(getAdisyonTarihi(liste[0])).toLocaleDateString("tr-TR") : 
            "Kayıt yok"}`}
        />
        
        <OzetKart
          baslik="Ortalama Adisyon Tutarı"
          deger={liste.length > 0 
            ? (toplam / liste.length).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺"
            : "0.00 ₺"
          }
          renk="#9b59b6"
          icon="📊"
          altBilgi={liste.length > 0 ? 
            `Min: ${Math.min(...liste.map(a => getAdisyonToplam(a))).toLocaleString("tr-TR")} ₺ | ` +
            `Max: ${Math.max(...liste.map(a => getAdisyonToplam(a))).toLocaleString("tr-TR")} ₺` : 
            "Hesaplanamadı"}
        />
      </div>

      {/* UYARI MESAJI */}
      {!bilardoVar && (
        <div style={{
          background: "#fff3cd",
          border: "2px solid #ffeaa7",
          color: "#856404",
          padding: 24,
          borderRadius: 12,
          marginBottom: 32,
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(255, 193, 7, 0.2)"
        }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>
            ⚠️ Bilardo raporu oluşturulamadı
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.6 }}>
            {from || to 
              ? "Seçilen tarih aralığında kapalı bilardo adisyonu bulunmuyor."
              : "Henüz kapalı bilardo adisyonu bulunmuyor."
            }
          </div>
          <div style={{ 
            fontSize: 14, 
            color: "#666", 
            marginTop: 16,
            padding: 12,
            background: "rgba(255,255,255,0.5)",
            borderRadius: 8
          }}>
            Bilardo adisyonları kapatıldığında burada görünecektir.
            <br />
            Tarih filtresini değiştirerek daha geniş bir aralık seçebilirsiniz.
          </div>
        </div>
      )}

      {/* TABLO */}
      {bilardoVar && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: 40
        }}>
          <div style={{
            background: "linear-gradient(90deg, #e8f4f8 0%, #d4edf8 100%)",
            padding: 22,
            borderBottom: "1px solid #ddd"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#006064",
                fontSize: "1.6rem",
                fontWeight: "bold"
              }}>
                📋 BİLARDO ADİSYON DETAYLARI
              </h3>
              <div style={{ 
                fontSize: 16, 
                color: "#006064", 
                background: "rgba(255,255,255,0.8)",
                padding: "8px 16px",
                borderRadius: 20,
                fontWeight: "600"
              }}>
                {liste.length} adet kayıt
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Tüm kapalı bilardo adisyonları ve detayları
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1200 
            }}>
              <thead style={{ background: "#f0f9ff" }}>
                <tr>
                  <Th style={{ width: "15%" }}>Tarih</Th>
                  <Th style={{ width: "15%" }}>Masa Tipi</Th>
                  <Th style={{ width: "10%" }}>Süre</Th>
                  <Th style={{ width: "25%" }}>Kalemler</Th>
                  <Th style={{ width: "15%" }} align="right">Tutar</Th>
                  <Th style={{ width: "10%" }}>Gün Durumu</Th>
                  <Th style={{ width: "10%" }}>Not</Th>
                </tr>
              </thead>

              <tbody>
                {liste.map((adisyon, i) => {
                  const detay = formatAdisyonDetay(adisyon);
                  const tarihStr = tarihToGunId(getAdisyonTarihi(adisyon));
                  const kapali = gunKapaliMi(tarihStr);
                  const tarihObj = getAdisyonTarihi(adisyon);
                  
                  return (
                    <tr
                      key={adisyon.id || i}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#f7fbff",
                        borderBottom: "1px solid #eee",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#e3f2fd";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f7fbff";
                      }}
                    >
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15,
                          color: "#006064"
                        }}>
                          {tarihObj.toLocaleDateString("tr-TR")}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "#666",
                          marginTop: 4
                        }}>
                          {tarihObj.toLocaleTimeString("tr-TR", {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: 15,
                          marginBottom: 6
                        }}>{detay.masaTipi}</div>
                        {adisyon.masaId && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#666",
                            background: "#f0f0f0",
                            padding: "3px 8px",
                            borderRadius: 4,
                            display: "inline-block"
                          }}>
                            Masa ID: {adisyon.masaId}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <span style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "#e0f7fa",
                          color: "#006064",
                          fontSize: 14,
                          fontWeight: "bold",
                          display: "inline-block",
                          minWidth: 80,
                          textAlign: "center"
                        }}>
                          {detay.sure}
                        </span>
                      </Td>
                      <Td>
                        {detay.kalemler.length > 0 ? (
                          <div style={{ fontSize: 14 }}>
                            {detay.kalemler.slice(0, 3).map((kalem, idx) => (
                              <div key={idx} style={{ 
                                marginBottom: 6,
                                padding: "6px 10px",
                                background: idx % 2 === 0 ? "#f8f9fa" : "#ffffff",
                                borderRadius: 6,
                                borderLeft: "3px solid #3498db"
                              }}>
                                <div style={{ 
                                  fontWeight: "500", 
                                  color: "#333",
                                  marginBottom: 2
                                }}>
                                  {kalem.urunAdi || kalem.ad || "Ürün"}
                                </div>
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  fontSize: 13,
                                  color: "#666"
                                }}>
                                  <span>
                                    {kalem.adet || 1} adet × 
                                    {Number(kalem.birimFiyat || 0).toLocaleString("tr-TR")} ₺
                                  </span>
                                  <span style={{ fontWeight: "bold" }}>
                                    = {(Number(kalem.adet || 1) * Number(kalem.birimFiyat || 0)).toLocaleString("tr-TR")} ₺
                                  </span>
                                </div>
                              </div>
                            ))}
                            {detay.kalemler.length > 3 && (
                              <div style={{ 
                                color: "#666", 
                                fontStyle: "italic",
                                fontSize: 13,
                                padding: "8px",
                                background: "#f8f9fa",
                                borderRadius: 6,
                                textAlign: "center"
                              }}>
                                +{detay.kalemler.length - 3} kalem daha...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ 
                            color: "#999", 
                            fontSize: 14,
                            fontStyle: "italic"
                          }}>
                            Kalem bilgisi yok
                          </span>
                        )}
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 18,
                        color: "#2ecc71"
                      }}>
                        <div>{detay.toplam.toLocaleString("tr-TR")} ₺</div>
                        {detay.kalemler.length > 0 && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#666",
                            marginTop: 4
                          }}>
                            {detay.kalemler.length} kalem
                          </div>
                        )}
                      </Td>
                      <Td>
                        <span style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          background: kapali ? "#d4edda" : "#fff3cd",
                          color: kapali ? "#155724" : "#856404",
                          fontWeight: "bold",
                          display: "inline-block",
                          width: "100%",
                          textAlign: "center",
                          border: kapali ? "1px solid #c3e6cb" : "1px solid #ffeeba"
                        }}>
                          {kapali ? "✅ KAPALI" : "⚠️ AÇIK"}
                        </span>
                      </Td>
                      <Td>
                        {detay.not ? (
                          <div style={{ 
                            fontSize: 13, 
                            color: "#666",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            padding: "6px",
                            border: "1px dashed #ddd",
                            borderRadius: 6
                          }}
                          title={detay.not}>
                            📝 {detay.not.substring(0, 20)}...
                          </div>
                        ) : (
                          <span style={{ 
                            color: "#999", 
                            fontSize: 13,
                            fontStyle: "italic"
                          }}>
                            Not yok
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* TABLO ALT ÖZET */}
          <div style={{
            padding: 20,
            background: "#f8f9fa",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>Gösterilen:</strong> {liste.length} adet kapalı bilardo adisyonu
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>En yüksek tutar:</strong> {
                liste.length > 0 ? 
                Math.max(...liste.map(a => getAdisyonToplam(a))).toLocaleString("tr-TR") + " ₺" : 
                "0.00 ₺"
              }
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              <strong>En düşük tutar:</strong> {
                liste.length > 0 ? 
                Math.min(...liste.map(a => getAdisyonToplam(a))).toLocaleString("tr-TR") + " ₺" : 
                "0.00 ₺"
              }
            </div>
          </div>
        </div>
      )}

      {/* EK ANALİZ */}
      {liste.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          padding: 28,
          marginBottom: 40
        }}>
          <h3 style={{ 
            margin: "0 0 24px 0", 
            color: "#006064",
            fontSize: "1.6rem",
            fontWeight: "bold"
          }}>
            📈 BİLARDO GELİR ANALİZİ
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20
          }}>
            <div style={{
              padding: 20,
              background: "#f8f9fa",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                Günlük Ortalama Gelir
              </div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#3498db" }}>
                {(() => {
                  const gunler = [...new Set(liste.map(a => tarihToGunId(getAdisyonTarihi(a))))];
                  return gunler.length > 0 ? 
                    (toplam / gunler.length).toLocaleString("tr-TR", { 
                      minimumFractionDigits: 2 
                    }) + " ₺" : 
                    "0.00 ₺";
                })()}
              </div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 8 }}>
                {(() => {
                  const gunler = [...new Set(liste.map(a => tarihToGunId(getAdisyonTarihi(a))))];
                  return `${gunler.length} farklı gün`;
                })()}
              </div>
            </div>
            
            <div style={{
              padding: 20,
              background: "#f8f9fa",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                En Yoğun Gün
              </div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#9b59b6" }}>
                {(() => {
                  const gunMap = {};
                  liste.forEach(adisyon => {
                    const gun = tarihToGunId(getAdisyonTarihi(adisyon));
                    if (!gunMap[gun]) gunMap[gun] = 0;
                    gunMap[gun] += getAdisyonToplam(adisyon);
                  });
                  
                  const enYogunGun = Object.entries(gunMap).sort((a, b) => b[1] - a[1])[0];
                  return enYogunGun ? 
                    enYogunGun[1].toLocaleString("tr-TR") + " ₺" : 
                    "0.00 ₺";
                })()}
              </div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 8 }}>
                {(() => {
                  const gunMap = {};
                  liste.forEach(adisyon => {
                    const gun = tarihToGunId(getAdisyonTarihi(adisyon));
                    if (!gunMap[gun]) gunMap[gun] = 0;
                    gunMap[gun] += getAdisyonToplam(adisyon);
                  });
                  
                  const enYogunGun = Object.entries(gunMap).sort((a, b) => b[1] - a[1])[0];
                  return enYogunGun ? 
                    `Tarih: ${enYogunGun[0]}` : 
                    "Bilgi yok";
                })()}
              </div>
            </div>
            
            <div style={{
              padding: 20,
              background: "#f8f9fa",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                Kapatılan Gün Sayısı
              </div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#e67e22" }}>
                {gunDurumlari.filter(g => g.durum === "KAPALI" || g.status === "CLOSED").length}
              </div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 8 }}>
                Toplam {gunDurumlari.length} gün durumu kaydı
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 48, 
        paddingTop: 32, 
        borderTop: "2px solid #eee",
        fontSize: 15, 
        color: "#555",
        background: "#fff",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32
        }}>
          <div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: "bold",
              color: "#006064",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "2px solid #b2ebf2"
            }}>
              📋 RAPOR BİLGİLERİ
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <strong>Veri Kaynağı:</strong> bilardo_adisyonlar<br />
              <strong>Gösterilen:</strong> Sadece kapalı bilardo adisyonları<br />
              <strong>Filtre:</strong> {from && to ? `${from} - ${to}` : "Tüm tarihler"}<br />
              <strong>Son güncelleme:</strong> {new Date().toLocaleString("tr-TR")}
            </div>
          </div>
          
          <div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: "bold",
              color: "#006064",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "2px solid #b2ebf2"
            }}>
              📊 İSTATİSTİKLER
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Toplam Gelir:</span>
                <span style={{ 
                  color: "#2ecc71", 
                  fontWeight: "bold"
                }}>
                  {toplam.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Adisyon Sayısı:</span>
                <span style={{ fontWeight: "bold" }}>
                  {liste.length} adet
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Ortalama Tutar:</span>
                <span style={{ fontWeight: "bold" }}>
                  {liste.length > 0 ? 
                    (toplam / liste.length).toLocaleString("tr-TR", { 
                      minimumFractionDigits: 2 
                    }) + " ₺" : 
                    "0.00 ₺"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: 32,
          padding: 20,
          background: "#f0f9ff",
          borderRadius: 8,
          fontSize: 14,
          color: "#006064",
          borderLeft: "4px solid #3498db"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12,
            marginBottom: 8
          }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <strong>Bilardo Raporu Hakkında</strong>
          </div>
          <div style={{ color: "#006064", fontSize: 13, lineHeight: 1.6 }}>
            Bu rapor sadece kapatılmış bilardo adisyonlarını gösterir. 
            Adisyon kapatıldığında otomatik olarak bu listeye eklenir. 
            Tarih filtresi ile belirli dönemlerdeki bilardo gelirlerini analiz edebilirsiniz.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk, icon, altBilgi }) => (
  <div style={{
    background: "#fff",
    padding: 28,
    borderRadius: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    borderLeft: `6px solid ${renk}`,
    transition: "all 0.3s",
    position: "relative",
    overflow: "hidden"
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
  }}>
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
    <div style={{ 
      fontSize: 32, 
      fontWeight: "bold", 
      color: renk,
      marginBottom: 8
    }}>
      {deger}
    </div>
    {altBilgi && (
      <div style={{ 
        fontSize: 13, 
        color: "#777", 
        marginTop: 8,
        paddingTop: 12,
        borderTop: "1px solid #eee"
      }}>
        {altBilgi}
      </div>
    )}
  </div>
);

const Th = ({ children, align, style }) => (
  <th style={{
    padding: "18px 24px",
    textAlign: align || "left",
    borderBottom: "2px solid #006064",
    fontSize: 15,
    fontWeight: "bold",
    color: "#006064",
    background: "#f0f9ff",
    whiteSpace: "nowrap",
    ...style
  }}>
    {children}
  </th>
);

const Td = ({ children, align, style }) => (
  <td style={{
    padding: "18px 24px",
    textAlign: align || "left",
    borderBottom: "1px solid #eee",
    fontSize: 15,
    verticalAlign: "top",
    ...style
  }}>
    {children}
  </td>
);