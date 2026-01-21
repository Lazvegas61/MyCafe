/* ============================================================
   📄 DOSYA: Giderler.jsx (GÜNCEL - TAM SAYFA)
   📌 AMAÇ:
   MyCafe — Gider Takip Modülü
   - Yeni tasarım uygulandı
   - Resimdeki layout'a göre düzenlendi
   - mcFinansHavuzu entegrasyonu eklendi
============================================================ */

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Giderler.css";
import { kasaHareketiEkle } from "../../services/utils/kasaHareketleri";
import mcFinansHavuzu from "../../services/utils/mc_finans_havuzu";

export default function Giderler() {
  const [giderler, setGiderler] = useState([]);
  const [urunAdi, setUrunAdi] = useState("");
  const [tutar, setTutar] = useState("");
  const [miktar, setMiktar] = useState("");
  const [birim, setBirim] = useState("");
  const [not, setNot] = useState("");
  const [kategori, setKategori] = useState("");

  // Filtreler
  const [tarihBaslangic, setTarihBaslangic] = useState("");
  const [tarihBitis, setTarihBitis] = useState("");
  const [saatBaslangic, setSaatBaslangic] = useState("");
  const [saatBitis, setSaatBitis] = useState("");
  const [arama, setArama] = useState("");
  const [kategoriFiltre, setKategoriFiltre] = useState("");

  // -----------------------------------------
  //   LOCALSTORAGE YÜKLE
  // -----------------------------------------
  useEffect(() => {
    const kayitli = localStorage.getItem("mc_giderler");
    if (kayitli) {
      const parsed = JSON.parse(kayitli);
      const updated = parsed.map(g => ({
        ...g,
        kategori: g.kategori || "Diğer"
      }));
      setGiderler(updated);
      localStorage.setItem("mc_giderler", JSON.stringify(updated));
    }
  }, []);

  const kaydet = (yeniListe) => {
    localStorage.setItem("mc_giderler", JSON.stringify(yeniListe));
    setGiderler(yeniListe);
  };

  // -----------------------------------------
  //   GİDER EKLE (GÜNCELLENDİ - MODEL C + mcFinansHavuzu)
  // -----------------------------------------
  const ekle = () => {
    if (!urunAdi || !tutar || !miktar || !birim) {
      alert("Lütfen tüm zorunlu alanları doldurunuz!");
      return;
    }

    const numericTutar = parseFloat(tutar);
    const numericMiktar = parseFloat(miktar);
    const toplamTutar = numericTutar * numericMiktar;

    if (!toplamTutar || toplamTutar <= 0) {
      alert("Geçerli bir gider tutarı giriniz.");
      return;
    }

    // 1️⃣ GİDER KAYDI (ESKİ YAPI – KORUNUYOR)
    const yeniGider = {
      id: Date.now(),
      urunAdi,
      tutar: numericTutar,
      toplamTutar: toplamTutar, // RaporMotoruV2 için kritik alan
      miktar: numericMiktar,
      birim,
      not,
      kategori: kategori || "Diğer",
      tarih: new Date().toISOString(),
      type: "GIDER",
      islemTipi: "CIKIS" // Kasadan para çıkışı olduğunu belirtir
    };

    // 1. Kendi listesini güncelle
    const yeniListe = [yeniGider, ...giderler];
    setGiderler(yeniListe);
    localStorage.setItem("mc_giderler", JSON.stringify(yeniListe));

    // 2️⃣ KASA HAREKETİ (MODEL C – YENİ)
    kasaHareketiEkle({
      id: `kasa_gider_${Date.now()}`,
      tip: "GIDER",
      kaynak: "GIDER",
      tutar: -toplamTutar, // ❗ EKSİ
      tarih: yeniGider.tarih,
      aciklama: `${urunAdi} - ${miktar} ${birim}`
    });

    // 3️⃣ mcFinansHavuzu'na Kayıt (YENİ)
    mcFinansHavuzu.giderEklendigindeKaydet({
      id: yeniGider.id,
      urunAdi: yeniGider.urunAdi,
      kategori: yeniGider.kategori,
      tutar: yeniGider.toplamTutar,
      miktar: yeniGider.miktar,
      birim: yeniGider.birim,
      not: yeniGider.not,
      tarih: yeniGider.tarih
    });

    // 4. Global Uyarıcıları Tetikle (HATA ÇÖZÜMÜ)
    window.dispatchEvent(new StorageEvent("storage", { key: "mc_giderler" }));
    window.dispatchEvent(new CustomEvent("kasaGuncellendi"));
    window.dispatchEvent(new CustomEvent("giderEklendi", { detail: yeniGider }));

    // Formu temizle
    setUrunAdi(""); 
    setTutar(""); 
    setMiktar(""); 
    setBirim(""); 
    setNot(""); 
    setKategori("");
    alert("Gider başarıyla kaydedildi ve kasaya işlendi.");
  };

  // -----------------------------------------
  //   GİDER SİL
  // -----------------------------------------
  const sil = (id) => {
    if (!window.confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    
    const silinecekGider = giderler.find(g => g.id === id);
    const liste = giderler.filter(g => g.id !== id);
    
    // Finans havuzundan da sil
    if (silinecekGider) {
      mcFinansHavuzu.giderSilindigindeKaydet({
        id: silinecekGider.id,
        tutar: silinecekGider.toplamTutar
      });
    }
    
    kaydet(liste);
    alert("Gider silindi.");
  };

  // -----------------------------------------
  //   FİLTRELEME
  // -----------------------------------------
  const filtrelenmisGiderler = giderler.filter((g) => {
    const giderTarih = new Date(g.tarih);
    const giderSaat = giderTarih.getHours() * 60 + giderTarih.getMinutes();
    
    // Tarih filtresi
    let tarihUyum = true;
    if (tarihBaslangic) {
      const baslangic = new Date(tarihBaslangic);
      baslangic.setHours(0, 0, 0, 0);
      if (giderTarih < baslangic) tarihUyum = false;
    }
    if (tarihBitis) {
      const bitis = new Date(tarihBitis);
      bitis.setHours(23, 59, 59, 999);
      if (giderTarih > bitis) tarihUyum = false;
    }
    
    // Saat filtresi
    let saatUyum = true;
    if (saatBaslangic) {
      const [saat, dakika] = saatBaslangic.split(':').map(Number);
      const baslangicDakika = saat * 60 + dakika;
      if (giderSaat < baslangicDakika) saatUyum = false;
    }
    if (saatBitis) {
      const [saat, dakika] = saatBitis.split(':').map(Number);
      const bitisDakika = saat * 60 + dakika;
      if (giderSaat > bitisDakika) saatUyum = false;
    }
    
    // Arama filtresi
    const aramaUyum = !arama || 
      g.urunAdi.toLowerCase().includes(arama.toLowerCase()) ||
      g.not?.toLowerCase().includes(arama.toLowerCase()) ||
      g.kategori.toLowerCase().includes(arama.toLowerCase());
    
    // Kategori filtresi
    const kategoriUyum = !kategoriFiltre || g.kategori === kategoriFiltre;
    
    return tarihUyum && saatUyum && aramaUyum && kategoriUyum;
  });

  // Toplam hesaplamalar
  const toplamTutar = filtrelenmisGiderler.reduce((t, g) => t + Number(g.tutar), 0);
  const ortalamaTutar = filtrelenmisGiderler.length > 0 
    ? (toplamTutar / filtrelenmisGiderler.length).toFixed(2) 
    : 0;

  // Kategorilere göre analiz
  const kategoriAnaliz = filtrelenmisGiderler.reduce((acc, g) => {
    if (!acc[g.kategori]) {
      acc[g.kategori] = { toplam: 0, adet: 0 };
    }
    acc[g.kategori].toplam += Number(g.tutar);
    acc[g.kategori].adet += 1;
    return acc;
  }, {});

  // -----------------------------------------
  //   PDF EXPORT
  // -----------------------------------------
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    
    // Başlık
    doc.setFontSize(18);
    doc.text("GİDERLER RAPORU", 105, 15, { align: 'center' });
    
    // Filtre bilgisi
    doc.setFontSize(10);
    let filtrelBilgi = "Tüm Giderler";
    if (tarihBaslangic || tarihBitis) {
      filtrelBilgi += ` | Tarih: ${tarihBaslangic || "Başlangıç"} - ${tarihBitis || "Bitiş"}`;
    }
    doc.text(filtrelBilgi, 105, 25, { align: 'center' });
    
    const rows = filtrelenmisGiderler.map((g) => [
      formatDate(g.tarih),
      formatTime(g.tarih),
      g.kategori,
      g.urunAdi,
      Number(g.tutar).toFixed(2),
      g.miktar,
      g.birim,
      g.not || "",
    ]);

    doc.autoTable({
      startY: 35,
      head: [["Tarih", "Saat", "Kategori", "Ürün Adı", "Tutar (₺)", "Miktar", "Birim", "Not"]],
      body: rows,
      headStyles: { fillColor: [75, 46, 5] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 30 }
      }
    });

    // Toplam
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Toplam Tutar: ${toplamTutar.toFixed(2)} ₺ | Toplam Kayıt: ${filtrelenmisGiderler.length}`, 105, finalY, { align: 'center' });

    // Kategori analizi
    if (Object.keys(kategoriAnaliz).length > 0) {
      const kategoriY = finalY + 15;
      doc.setFontSize(14);
      doc.text("KATEGORİ ANALİZİ", 105, kategoriY, { align: 'center' });
      
      let yPos = kategoriY + 10;
      Object.entries(kategoriAnaliz).forEach(([kategori, data]) => {
        const yuzde = (data.toplam / toplamTutar * 100).toFixed(1);
        doc.setFontSize(10);
        doc.text(`${kategori}: ${data.adet} kayıt, ${data.toplam.toFixed(2)} ₺ (${yuzde}%)`, 14, yPos);
        yPos += 7;
      });
    }

    doc.save("Giderler_Raporu.pdf");
  };

  // -----------------------------------------
  //   FORMAT FONKSİYONLARI
  // -----------------------------------------
  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR");
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("tr-TR", { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  // -----------------------------------------
  //   KATEGORİLER
  // -----------------------------------------
  const kategoriler = [
    "Mutfak",
    "Temizlik",
    "Personel",
    "Kira",
    "Fatura",
    "Bakım",
    "TOPTANCI",
    "Diğer"
  ];

  // -----------------------------------------
  //   FİLTRE TEMİZLE
  // -----------------------------------------
  const temizleFiltreler = () => {
    setTarihBaslangic("");
    setTarihBitis("");
    setSaatBaslangic("");
    setSaatBitis("");
    setArama("");
    setKategoriFiltre("");
  };

  return (
    <div className="giderler-container">
      {/* BAŞLIK VE ROL */}
      <div className="page-header">
        <h1>GİDERLER</h1>
        <div className="role-badge">ADMIN</div>
      </div>

      {/* 2 KOLONLU ANA YAPI */}
      <div className="two-column-layout">
        {/* SOL KOLON - YENİ GİDER */}
        <div className="column form-column">
          <div className="column-header">
            <h2>YENİ GİDER EKLE</h2>
          </div>
          
          <div className="form-content">
            <div className="form-group">
              <label>Kategori *</label>
              <select 
                value={kategori} 
                onChange={(e) => setKategori(e.target.value)}
                className="form-input"
              >
                <option value="">Kategori Seçin</option>
                {kategoriler.map(kat => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ürün/Hizmet Adı *</label>
              <input
                type="text"
                value={urunAdi}
                onChange={(e) => setUrunAdi(e.target.value)}
                placeholder="Örn: Su Faturası, Temizlik Malzemesi"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tutar (₺) *</label>
                <input
                  type="number"
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Miktar *</label>
                <input
                  type="number"
                  value={miktar}
                  onChange={(e) => setMiktar(e.target.value)}
                  placeholder="1"
                  min="1"
                  step="1"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Birim *</label>
                <select 
                  value={birim} 
                  onChange={(e) => setBirim(e.target.value)}
                  className="form-input"
                >
                  <option value="">Birim Seç</option>
                  <option value="Adet">Adet</option>
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Litre">Litre</option>
                  <option value="Paket">Paket</option>
                  <option value="Koli">Koli</option>
                  <option value="Ay">Ay</option>
                  <option value="Saat">Saat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ödeme Tarihi</label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Açıklama / Not</label>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Ek açıklama giriniz..."
                rows="3"
                className="form-textarea"
              />
            </div>

            <button 
              onClick={ekle} 
              className="btn-add"
              disabled={!urunAdi || !tutar || !miktar || !birim}
            >
              + GİDER EKLE
            </button>
          </div>
        </div>

        {/* SAĞ KOLON - YENİ TASARIMA GÖRE DÜZENLENDİ */}
        <div className="column report-column">
          {/* FİLTRE PANELİ - ÜSTTE */}
          <div className="filter-panel">
            <div className="filter-header">
              <h3>FİLTRELEME</h3>
              <button 
                onClick={temizleFiltreler} 
                className="btn-clear"
              >
                Filtreleri Temizle
              </button>
            </div>
            
            <div className="filter-grid">
              <div className="filter-group">
                <label>Tarih Aralığı</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={tarihBaslangic}
                    onChange={(e) => setTarihBaslangic(e.target.value)}
                    className="filter-input"
                    placeholder="gg.aa.yyyy"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="date"
                    value={tarihBitis}
                    onChange={(e) => setTarihBitis(e.target.value)}
                    className="filter-input"
                    placeholder="gg.aa.yyyy"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Saat Aralığı</label>
                <div className="time-range">
                  <input
                    type="time"
                    value={saatBaslangic}
                    onChange={(e) => setSaatBaslangic(e.target.value)}
                    className="filter-input"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="time"
                    value={saatBitis}
                    onChange={(e) => setSaatBitis(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Kategori</label>
                <select 
                  value={kategoriFiltre} 
                  onChange={(e) => setKategoriFiltre(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Tüm Kategoriler</option>
                  {kategoriler.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Arama</label>
                <div className="search-with-clear">
                  <input
                    type="text"
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    placeholder="Ürün, açıklama veya kategori ara..."
                    className="filter-input"
                  />
                  {arama && (
                    <button 
                      onClick={() => setArama("")}
                      className="clear-search-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* İSTATİSTİK KARTLARI - YAN YANA */}
          <div className="stats-section">
            <div className="stats-cards">
              <div className="stat-card total">
                <div className="stat-content">
                  <div className="stat-label">TOPLAM GİDER</div>
                  <div className="stat-value">{toplamTutar.toFixed(2)} ₺</div>
                </div>
              </div>

              <div className="stat-card count">
                <div className="stat-content">
                  <div className="stat-label">KAYIT SAYISI</div>
                  <div className="stat-value">{filtrelenmisGiderler.length}</div>
                </div>
              </div>

              <div className="stat-card average">
                <div className="stat-content">
                  <div className="stat-label">ORTALAMA</div>
                  <div className="stat-value">{ortalamaTutar} ₺</div>
                </div>
              </div>
            </div>

            {/* PDF İNDİR BUTONU - İSTATİSTİKLERİN YANINDA */}
            <div className="pdf-button-container">
              <button onClick={exportPDF} className="btn-pdf">
                PDF İNDİR
              </button>
            </div>
          </div>

          {/* GİDER KAYITLARI BAŞLIĞI */}
          <div className="gider-list-header">
            <h3>GİDER KAYITLARI</h3>
            <div className="list-count">
              {filtrelenmisGiderler.length} kayıt
            </div>
          </div>

          {/* GİDER LİSTESİ - BÜYÜK */}
          <div className="gider-list-container">
            {filtrelenmisGiderler.length > 0 ? (
              <div className="gider-list">
                {filtrelenmisGiderler.map((g) => (
                  <div key={g.id} className="gider-card">
                    <div className="gider-header">
                      <div className="gider-kategori">{g.kategori}</div>
                      <div className="gider-tarih">
                        {formatDateTime(g.tarih)}
                      </div>
                      <button 
                        onClick={() => sil(g.id)} 
                        className="btn-delete"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="gider-body">
                      <div className="gider-urun">{g.urunAdi}</div>
                      <div className="gider-detay">
                        <span>{g.miktar} {g.birim}</span>
                        <span className="gider-not">{g.not || "Açıklama yok"}</span>
                      </div>
                    </div>
                    
                    <div className="gider-footer">
                      <div className="gider-tutar">{g.tutar.toFixed(2)} ₺</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list">
                {giderler.length === 0 
                  ? "Henüz gider kaydı bulunmuyor." 
                  : "Filtrelere uygun gider kaydı bulunamadı."}
              </div>
            )}
          </div>

          {/* KATEGORİ ANALİZİ */}
          {Object.keys(kategoriAnaliz).length > 0 && (
            <div className="category-analysis">
              <h4>KATEGORİ ANALİZİ</h4>
              <div className="category-chart">
                {Object.entries(kategoriAnaliz).map(([kategori, data]) => {
                  const yuzde = (data.toplam / toplamTutar * 100).toFixed(1);
                  return (
                    <div key={kategori} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{kategori}</span>
                        <span className="category-stats">
                          {data.adet} kayıt • {data.toplam.toFixed(2)} ₺
                        </span>
                      </div>
                      <div className="category-bar">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${yuzde}%` }}
                        ></div>
                        <span className="bar-percentage">{yuzde}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}