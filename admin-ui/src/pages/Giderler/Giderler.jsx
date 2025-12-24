/* ============================================================
   📄 DOSYA: Giderler.jsx (GÜNCELLENMİŞ)
   📌 AMAÇ:
   MyCafe — Gider Takip Modülü
   - Dairesel grafik (pie chart) ile en çok gider kalemleri
   - Grafikten tıklayarak detaylı filtreleme
   - Premium MyCafe tasarımı
============================================================ */

import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "./Giderler.css"; // Yeni CSS dosyası

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
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Grafik için state
  const [chartData, setChartData] = useState([]);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const canvasRef = useRef(null);

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

  // Grafik verilerini hesapla
  useEffect(() => {
    const urunAnaliz = filtrelenmisGiderler.reduce((acc, g) => {
      if (!acc[g.urunAdi]) {
        acc[g.urunAdi] = { 
          toplam: 0, 
          adet: 0,
          kategori: g.kategori,
          renk: getRandomColor()
        };
      }
      acc[g.urunAdi].toplam += Number(g.tutar);
      acc[g.urunAdi].adet += 1;
      return acc;
    }, {});

    // En yüksek giderlere göre sırala (max 8 ürün)
    const sorted = Object.entries(urunAnaliz)
      .sort((a, b) => b[1].toplam - a[1].toplam)
      .slice(0, 8)
      .map(([urunAdi, data], index) => ({
        urunAdi,
        ...data,
        yuzde: 0
      }));

    // Toplamı hesapla ve yüzdeleri güncelle
    const toplam = sorted.reduce((sum, item) => sum + item.toplam, 0);
    const updated = sorted.map(item => ({
      ...item,
      yuzde: toplam > 0 ? (item.toplam / toplam * 100) : 0
    }));

    setChartData(updated);
  }, [giderler, tarihBaslangic, tarihBitis, saatBaslangic, saatBitis, arama, kategoriFiltre]);

  // Dairesel grafik çiz
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Canvas'ı temizle
    ctx.clearRect(0, 0, width, height);

    // Grafik başlığı
    ctx.fillStyle = '#5a3921';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EN ÇOK GİDER YAPILAN ÜRÜNLER', centerX, 20);

    // Grafik çiz
    let startAngle = 0;
    
    chartData.forEach((item, index) => {
      const sliceAngle = (item.yuzde / 100) * 2 * Math.PI;
      
      // Dilimi çiz
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      // Renk (hover durumunda daha açık)
      const isHovered = hoveredSlice === index;
      ctx.fillStyle = isHovered ? lightenColor(item.renk, 30) : item.renk;
      ctx.fill();
      
      // Kenar çizgisi
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      startAngle += sliceAngle;
    });

    // Orta daire (boşluk için)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8f3e9';
    ctx.fill();
    ctx.strokeStyle = '#e6d6c1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orta yazı (hover durumunda)
    if (hoveredSlice !== null) {
      const hoveredItem = chartData[hoveredSlice];
      ctx.fillStyle = '#5a3921';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(hoveredItem.urunAdi, centerX, centerY - 10);
      
      ctx.font = '14px Arial';
      ctx.fillText(`${hoveredItem.toplam.toFixed(2)} ₺`, centerX, centerY + 15);
      ctx.fillText(`(${hoveredItem.yuzde.toFixed(1)}%)`, centerX, centerY + 35);
    } else {
      ctx.fillStyle = '#8b4513';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${chartData.length} Ürün`, centerX, centerY - 10);
      
      const toplamTutar = chartData.reduce((sum, item) => sum + item.toplam, 0);
      ctx.font = '16px Arial';
      ctx.fillText(`${toplamTutar.toFixed(2)} ₺`, centerX, centerY + 15);
      ctx.font = '12px Arial';
      ctx.fillText('Toplam', centerX, centerY + 35);
    }

  }, [chartData, hoveredSlice]);

  // Renk üretme fonksiyonu
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
      '#118AB2', '#EF476F', '#073B4C', '#7209B7',
      '#F15BB5', '#9B5DE5', '#00BBF9', '#00F5D4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Rengi açıklaştırma fonksiyonu
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (
      0x1000000 + 
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  };

  // Canvas tıklama olayı
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    
    // Tıklanan noktanın merkeze uzaklığı
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    if (distance <= radius && distance >= radius * 0.4) {
      // Açı hesapla
      let angle = Math.atan2(y - centerY, x - centerX);
      if (angle < 0) angle += 2 * Math.PI;
      
      // Hangi dilime denk geldiğini bul
      let startAngle = 0;
      for (let i = 0; i < chartData.length; i++) {
        const sliceAngle = (chartData[i].yuzde / 100) * 2 * Math.PI;
        if (angle >= startAngle && angle < startAngle + sliceAngle) {
          // Bu ürüne ait giderleri filtrele
          const selectedUrun = chartData[i].urunAdi;
          setSelectedProduct(selectedUrun);
          setArama(selectedUrun); // Arama kutusuna yaz
          break;
        }
        startAngle += sliceAngle;
      }
    }
  };

  // Canvas hover olayı
  const handleCanvasHover = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    if (distance <= radius && distance >= radius * 0.4) {
      let angle = Math.atan2(y - centerY, x - centerX);
      if (angle < 0) angle += 2 * Math.PI;
      
      let startAngle = 0;
      for (let i = 0; i < chartData.length; i++) {
        const sliceAngle = (chartData[i].yuzde / 100) * 2 * Math.PI;
        if (angle >= startAngle && angle < startAngle + sliceAngle) {
          setHoveredSlice(i);
          return;
        }
        startAngle += sliceAngle;
      }
    } else {
      setHoveredSlice(null);
    }
  };

  const kaydet = (yeniListe) => {
    localStorage.setItem("mc_giderler", JSON.stringify(yeniListe));
    setGiderler(yeniListe);
  };

  // -----------------------------------------
  //   TARİH VE SAAT FORMATLARI
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
  //   GİDER EKLE
  // -----------------------------------------
  const ekle = () => {
    if (!urunAdi || !tutar || !miktar || !birim) {
      alert("Zorunlu alanları doldurunuz!");
      return;
    }

    const yeni = {
      id: Date.now(),
      urunAdi,
      tutar: Number(tutar),
      miktar: Number(miktar),
      birim,
      not,
      kategori: kategori || "Diğer",
      tarih: new Date().toISOString(),
    };

    const liste = [...giderler, yeni];
    kaydet(liste);

    // Formu temizle
    setUrunAdi("");
    setTutar("");
    setMiktar("");
    setBirim("");
    setNot("");
    setKategori("");
    
    alert("Gider başarıyla eklendi!");
  };

  // -----------------------------------------
  //   GİDER SİL
  // -----------------------------------------
  const sil = (id) => {
    if (!window.confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    
    const liste = giderler.filter(g => g.id !== id);
    kaydet(liste);
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

    doc.save("Giderler_Raporu.pdf");
  };

  // -----------------------------------------
  //   EXCEL EXPORT
  // -----------------------------------------
  const exportExcel = () => {
    const data = filtrelenmisGiderler.map((g) => ({
      Tarih: formatDate(g.tarih),
      Saat: formatTime(g.tarih),
      Kategori: g.kategori,
      "Ürün Adı": g.urunAdi,
      "Tutar (₺)": Number(g.tutar).toFixed(2),
      Miktar: g.miktar,
      Birim: g.birim,
      Not: g.not || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Giderler");
    
    // İstatistikler sayfası
    const statsData = [
      ["TOPLAM İSTATİSTİKLER", ""],
      ["Toplam Tutar", `${toplamTutar.toFixed(2)} ₺`],
      ["Kayıt Sayısı", filtrelenmisGiderler.length],
      ["Ortalama Tutar", `${ortalamaTutar} ₺`],
      ["", ""],
      ["KATEGORİ ANALİZİ", ""],
      ["Kategori", "Toplam Tutar", "Kayıt Sayısı"]
    ];
    
    Object.entries(kategoriAnaliz).forEach(([kategori, data]) => {
      statsData.push([kategori, `${data.toplam.toFixed(2)} ₺`, data.adet]);
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws2, "İstatistikler");
    
    XLSX.writeFile(wb, "Giderler_Rapor.xlsx");
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
    setSelectedProduct(null);
  };

  // Seçili ürün temizle
  const temizleSeciliUrun = () => {
    setSelectedProduct(null);
    setArama("");
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

            {/* DAİRESEL GRAFİK */}
            {chartData.length > 0 && (
              <div className="chart-section">
                <h3>GİDER DAĞILIMI</h3>
                <div className="chart-container">
                  <canvas 
                    ref={canvasRef} 
                    width={350}
                    height={350}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasHover}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="pie-chart"
                  />
                </div>
                
                {/* Grafik Açıklamaları */}
                <div className="chart-legend">
                  {chartData.map((item, index) => (
                    <div 
                      key={index} 
                      className="legend-item"
                      onClick={() => {
                        setSelectedProduct(item.urunAdi);
                        setArama(item.urunAdi);
                      }}
                      onMouseEnter={() => setHoveredSlice(index)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="legend-color" style={{ backgroundColor: item.renk }} />
                      <div className="legend-info">
                        <div className="legend-name">{item.urunAdi}</div>
                        <div className="legend-details">
                          {item.toplam.toFixed(2)} ₺ • {item.adet} kayıt • {item.yuzde.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seçili Ürün Bilgisi */}
                {selectedProduct && (
                  <div className="selected-product-info">
                    <div className="selected-header">
                      <h4>📋 {selectedProduct}</h4>
                      <button 
                        onClick={temizleSeciliUrun}
                        className="btn-clear-small"
                      >
                        ✕ Temizle
                      </button>
                    </div>
                    <p className="selected-note">
                      Bu ürüne ait {filtrelenmisGiderler.filter(g => g.urunAdi === selectedProduct).length} gider kaydı bulunuyor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ KOLON - RAPOR VE FİLTRE */}
        <div className="column report-column">
          {/* FİLTRE PANELİ */}
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
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="date"
                    value={tarihBitis}
                    onChange={(e) => setTarihBitis(e.target.value)}
                    className="filter-input"
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
                      onClick={() => {
                        setArama("");
                        setSelectedProduct(null);
                      }}
                      className="clear-search-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Seçili Ürün Gösterimi */}
            {selectedProduct && (
              <div className="selected-product-filter">
                <span className="selected-label">Seçili Ürün:</span>
                <span className="selected-value">{selectedProduct}</span>
                <button 
                  onClick={temizleSeciliUrun}
                  className="btn-remove-selection"
                >
                  Kaldır
                </button>
              </div>
            )}
          </div>

          {/* İSTATİSTİK KARTLARI */}
          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">TOPLAM GİDER</div>
                <div className="stat-value">{toplamTutar.toFixed(2)} ₺</div>
              </div>
            </div>

            <div className="stat-card count">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">KAYIT SAYISI</div>
                <div className="stat-value">{filtrelenmisGiderler.length}</div>
              </div>
            </div>

            <div className="stat-card average">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">ORTALAMA</div>
                <div className="stat-value">{ortalamaTutar} ₺</div>
              </div>
            </div>
          </div>

          {/* RAPOR BUTONLARI */}
          <div className="report-buttons">
            <button onClick={exportPDF} className="btn-report pdf">
              📄 PDF Rapor İndir
            </button>
            <button onClick={exportExcel} className="btn-report excel">
              📊 Excel Rapor İndir
            </button>
          </div>

          {/* GİDER LİSTESİ */}
          <div className="gider-list-container">
            <div className="list-header">
              <h3>GİDER KAYITLARI</h3>
              <div className="list-summary">
                {filtrelenmisGiderler.length} kayıt listeleniyor
                {selectedProduct && ` (${selectedProduct} için)`}
              </div>
            </div>

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
    </div>
  );
}