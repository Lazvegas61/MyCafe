import React, { useState, useEffect } from "react";
import "./GunSonuDetay.css";

const GunSonuDetay = () => {
  const [expandedMasa, setExpandedMasa] = useState(null);
  const [gunDetay, setGunDetay] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // URL'den ID al (demo amaçlı sabit)
  const gunId = 1;

  useEffect(() => {
    // API çağrısı
    const fetchGunDetay = async () => {
      setYukleniyor(true);
      try {
        // const response = await fetch(`/api/gun-sonu/${gunId}`);
        // const data = await response.json();
        // setGunDetay(data);
        
        // DEMO DATA
        setTimeout(() => {
          setGunDetay(demoGunDetay);
          setYukleniyor(false);
        }, 1000);
      } catch (error) {
        console.error('Veri çekme hatası:', error);
        setYukleniyor(false);
      }
    };

    fetchGunDetay();
  }, [gunId]);

  const toggleExpand = (id) => {
    setExpandedMasa(expandedMasa === id ? null : id);
  };

  // Demo Data
  const demoGunDetay = {
    id: 1,
    tarih: "20 Nisan 2024",
    gunAdi: "Cumartesi",
    acilis: "08:15",
    kapanis: "23:45",
    kapanisYapan: "Admin",
    toplamCiro: 12450,
    nakit: 6450,
    kart: 4800,
    hesabaYaz: 1200,
    gider: 6750,
    netKar: 5700,
    oncekiGunKar: 4650,
    oncekiHaftaOrtalama: 4120,
    masaHareketleri: [
      {
        id: 1,
        masa: "5",
        acilis: "08:20",
        kapanis: "09:45",
        sure: "01:25",
        urunTutari: 110,
        bilardo: 0,
        indirim: 0,
        toplam: 110,
        odeme: "Nakit + Kredi",
        urunler: [
          { ad: "Çay", adet: 2, birim: 2, tutar: 4 },
          { ad: "Tost", adet: 1, birim: 15, tutar: 15 },
          { ad: "Su", adet: 1, birim: 3, tutar: 3 }
        ]
      },
      {
        id: 2,
        masa: "Bilardo 2",
        acilis: "15:30",
        kapanis: "17:00",
        sure: "01:30",
        urunTutari: 0,
        bilardo: 140,
        indirim: 10,
        toplam: 130,
        odeme: "Hesaba Yaz",
        urunler: []
      },
      {
        id: 3,
        masa: "7",
        acilis: "10:00",
        kapanis: "11:30",
        sure: "01:30",
        urunTutari: 40,
        bilardo: 0,
        indirim: 0,
        toplam: 40,
        odeme: "Nakit",
        urunler: [
          { ad: "Oralet", adet: 2, birim: 3, tutar: 6 },
          { ad: "Çay", adet: 1, birim: 2, tutar: 2 }
        ]
      }
    ],
    odemeHareketleri: [
      { saat: "09:45", masa: "5", tur: "Tahsilat", yontem: "Nakit", tutar: 80, kullanici: "Garson" },
      { saat: "11:30", masa: "7", tur: "Tahsilat", yontem: "Nakit", tutar: 40, kullanici: "Garson" },
      { saat: "17:00", masa: "Bilardo 2", tur: "Hesaba Yaz", yontem: "Borç", tutar: 130, kullanici: "Admin" }
    ],
    hesabaYazDetay: [
      { musteri: "Ahmet Y.", masa: "7", tutar: 30, tarih: "20.04.2024", durum: "Açık" },
      { musteri: "Mehmet K.", masa: "Bilardo 2", tutar: 130, tarih: "20.04.2024", durum: "Açık" }
    ],
    giderDetay: [
      { saat: "14:30", gider: "Elektrik Faturası", tur: "Fatura", tutar: 400, kullanici: "Admin" },
      { saat: "16:00", gider: "Personel Yemek", tur: "Nakit", tutar: 200, kullanici: "Kasa" },
      { saat: "18:45", gider: "Temizlik Malzemesi", tur: "Kredi Kartı", tutar: 75, kullanici: "Admin" }
    ],
    sistemLoglari: [
      "10:05 – Masa 7 taşındı (Garson)",
      "12:30 – Bilardo ücreti güncellendi (Admin)",
      "16:40 – Bilardo süresi uzatıldı (Admin)",
      "21:15 – Kampanya uygulandı (Garson)",
      "23:45 – Gün sonu kapatıldı (Admin)"
    ]
  };

  // Yardımcı fonksiyonlar
  const karDegisim = gunDetay ? ((gunDetay.netKar - gunDetay.oncekiGunKar) / gunDetay.oncekiGunKar * 100).toFixed(1) : 0;
  const haftalikDegisim = gunDetay ? ((gunDetay.netKar - gunDetay.oncekiHaftaOrtalama) / gunDetay.oncekiHaftaOrtalama * 100).toFixed(1) : 0;

  if (yukleniyor) {
    return (
      <div className="gun-sonu-detay-container">
        <div className="loading-state" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner" style={{ width: '60px', height: '60px', border: '4px solid rgba(212, 175, 55, 0.3)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
          <div className="loading-text">Gün sonu detayları yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!gunDetay) {
    return (
      <div className="gun-sonu-detay-container">
        <div className="gun-sonu-empty" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="empty-icon">❌</div>
          <div className="empty-text">Gün sonu detayı bulunamadı</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gun-sonu-detay-container">
      {/* HEADER */}
      <div className="gun-sonu-header">
        <div>
          <h2>Gün Sonu Detayı</h2>
          <span>{gunDetay.tarih} - {gunDetay.gunAdi}</span>
        </div>
        <div className="gun-sonu-meta">
          <div>Açılış: <strong>{gunDetay.acilis}</strong></div>
          <div>Kapanış: <strong>{gunDetay.kapanis}</strong></div>
          <div>Kapanışı Yapan: <strong>{gunDetay.kapanisYapan}</strong></div>
        </div>
      </div>

      {/* BUTON GRUBU */}
      <div className="btn-group">
        <button className="btn btn-primary" onClick={() => window.print()}>
          <i className="fas fa-print"></i> Yazdır
        </button>
        <button className="btn btn-secondary" onClick={() => console.log('PDF Export')}>
          <i className="fas fa-file-pdf"></i> PDF Olarak Kaydet
        </button>
        <button className="btn btn-secondary" onClick={() => console.log('Excel Export')}>
          <i className="fas fa-file-excel"></i> Excel'e Aktar
        </button>
        <button className="btn btn-tertiary" onClick={() => window.history.back()}>
          <i className="fas fa-arrow-left"></i> Geri Dön
        </button>
      </div>

      {/* ÖZET KARTLARI */}
      <div className="ozet-kartlari">
        <div className="ozet-kart">
          <div className="label">Toplam Ciro</div>
          <div className="deger">{gunDetay.toplamCiro.toLocaleString()} ₺</div>
          <div className="degisim artis">
            <i className="fas fa-arrow-up"></i> %15.2 artış
          </div>
        </div>
        <div className="ozet-kart">
          <div className="label">Net Kar</div>
          <div className="deger">{gunDetay.netKar.toLocaleString()} ₺</div>
          <div className={`degisim ${karDegisim >= 0 ? 'artis' : 'azalis'}`}>
            {karDegisim >= 0 ? <i className="fas fa-arrow-up"></i> : <i className="fas fa-arrow-down"></i>}
            %{Math.abs(karDegisim)} {karDegisim >= 0 ? 'artış' : 'azalış'}
          </div>
        </div>
        <div className="ozet-kart">
          <div className="label">Giderler</div>
          <div className="deger">{gunDetay.gider.toLocaleString()} ₺</div>
          <div className="degisim azalis">
            <i className="fas fa-arrow-down"></i> %8 azalma
          </div>
        </div>
        <div className="ozet-kart">
          <div className="label">Ort. Masa Süresi</div>
          <div className="deger">1:25</div>
          <div className="degisim artis">
            <i className="fas fa-arrow-up"></i> +10 dk
          </div>
        </div>
      </div>

      {/* GRAFİKLER */}
      <div className="grafik-container">
        <div className="grafik-card">
          <h4><i className="fas fa-chart-pie"></i> Ödeme Dağılımı</h4>
          <div className="grafik-placeholder">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
              <div>Nakit: %52 | Kart: %38 | Hesap: %10</div>
            </div>
          </div>
        </div>
        <div className="grafik-card">
          <h4><i className="fas fa-chart-line"></i> Günlük Performans</h4>
          <div className="grafik-placeholder">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📈</div>
              <div>Günlük kar trend grafiği</div>
            </div>
          </div>
        </div>
      </div>

      {/* KARŞILAŞTIRMA */}
      <div className="karsilastirma-panel">
        <div className="karsilastirma-kutu">
          <h4>Önceki Güne Göre</h4>
          <div className="karsilastirma-deger">
            {karDegisim >= 0 ? '+' : ''}{karDegisim}%
          </div>
          <div style={{ color: karDegisim >= 0 ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: '600' }}>
            {karDegisim >= 0 ? '📈 Artış' : '📉 Azalış'}
          </div>
        </div>
        <div className="karsilastirma-kutu">
          <h4>Haftalık Ortalamaya Göre</h4>
          <div className="karsilastirma-deger">
            {haftalikDegisim >= 0 ? '+' : ''}{haftalikDegisim}%
          </div>
          <div style={{ color: haftalikDegisim >= 0 ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: '600' }}>
            {haftalikDegisim >= 0 ? '🎯 Üzerinde' : '⚠️ Altında'}
          </div>
        </div>
        <div className="karsilastirma-kutu">
          <h4>Masa Başına Ortalama</h4>
          <div className="karsilastirma-deger">
            {(gunDetay.netKar / gunDetay.masaHareketleri.length).toFixed(0)} ₺
          </div>
          <div style={{ color: '#3498db', fontSize: '14px', fontWeight: '600' }}>
            {gunDetay.masaHareketleri.length} aktif masa
          </div>
        </div>
      </div>

      {/* MASA OTURUM DETAYLARI */}
      <div className="card">
        <h3><i className="fas fa-chair"></i> Masa Oturum Detayları</h3>
        <table className="detay-table">
          <thead>
            <tr>
              <th>Masa</th>
              <th>Açılış</th>
              <th>Kapanış</th>
              <th>Süre</th>
              <th>Ürün</th>
              <th>Bilardo</th>
              <th>İndirim</th>
              <th>Toplam</th>
              <th>Ödeme</th>
            </tr>
          </thead>
          <tbody>
            {gunDetay.masaHareketleri.map((m) => (
              <React.Fragment key={m.id}>
                <tr className="clickable" onClick={() => toggleExpand(m.id)}>
                  <td><strong>{m.masa}</strong></td>
                  <td>{m.acilis}</td>
                  <td>{m.kapanis}</td>
                  <td>{m.sure}</td>
                  <td>{m.urunTutari} ₺</td>
                  <td>{m.bilardo} ₺</td>
                  <td style={{ color: '#e74c3c' }}>-{m.indirim} ₺</td>
                  <td><strong>{m.toplam} ₺</strong></td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: m.odeme === 'Nakit' ? 'rgba(46, 204, 113, 0.15)' : 
                                 m.odeme === 'Hesaba Yaz' ? 'rgba(231, 76, 60, 0.15)' : 
                                 'rgba(52, 152, 219, 0.15)',
                      color: m.odeme === 'Nakit' ? '#2ecc71' : 
                             m.odeme === 'Hesaba Yaz' ? '#e74c3c' : 
                             '#3498db',
                      border: m.odeme === 'Nakit' ? '1px solid rgba(46, 204, 113, 0.3)' : 
                              m.odeme === 'Hesaba Yaz' ? '1px solid rgba(231, 76, 60, 0.3)' : 
                              '1px solid rgba(52, 152, 219, 0.3)'
                    }}>
                      {m.odeme}
                    </span>
                  </td>
                </tr>
                {expandedMasa === m.id && (
                  <tr className="expand-row">
                    <td colSpan="9">
                      <div className="expand-content">
                        <strong><i className="fas fa-list"></i> Ürün Detayları</strong>
                        {m.urunler.length === 0 ? (
                          <div className="empty">Bu masada ürün satışı yapılmamıştır.</div>
                        ) : (
                          <ul>
                            {m.urunler.map((u, i) => (
                              <li key={i}>
                                <span>{u.ad} × {u.adet}</span>
                                <span className="urun-adet">{u.birim} ₺/adet</span>
                                <span className="urun-tutar">{u.tutar} ₺</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ÖDEME HAREKETLERİ */}
      <div className="card">
        <h3><i className="fas fa-money-bill-wave"></i> Ödeme Hareketleri</h3>
        <table className="detay-table">
          <thead>
            <tr>
              <th>Saat</th>
              <th>Masa</th>
              <th>Tür</th>
              <th>Yöntem</th>
              <th>Tutar</th>
              <th>Kullanıcı</th>
            </tr>
          </thead>
          <tbody>
            {gunDetay.odemeHareketleri.map((o, i) => (
              <tr key={i}>
                <td>{o.saat}</td>
                <td>{o.masa}</td>
                <td>{o.tur}</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: o.yontem === 'Nakit' ? 'rgba(46, 204, 113, 0.15)' : 
                               o.yontem === 'Borç' ? 'rgba(231, 76, 60, 0.15)' : 
                               'rgba(52, 152, 219, 0.15)',
                    color: o.yontem === 'Nakit' ? '#2ecc71' : 
                           o.yontem === 'Borç' ? '#e74c3c' : 
                           '#3498db'
                  }}>
                    {o.yontem}
                  </span>
                </td>
                <td><strong>{o.tutar} ₺</strong></td>
                <td>{o.kullanici}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HESABA YAZ DETAY */}
      <div className="card">
        <h3><i className="fas fa-file-invoice-dollar"></i> Hesaba Yaz (Borç) Detayları</h3>
        <table className="detay-table">
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Masa</th>
              <th>Tutar</th>
              <th>Tarih</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {gunDetay.hesabaYazDetay.map((h, i) => (
              <tr key={i}>
                <td><strong>{h.musteri}</strong></td>
                <td>{h.masa}</td>
                <td><strong>{h.tutar} ₺</strong></td>
                <td>{h.tarih}</td>
                <td>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: h.durum === 'Açık' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                    color: h.durum === 'Açık' ? '#e74c3c' : '#2ecc71',
                    border: h.durum === 'Açık' ? '1px solid rgba(231, 76, 60, 0.3)' : '1px solid rgba(46, 204, 113, 0.3)'
                  }}>
                    {h.durum}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GİDER DETAY */}
      <div className="card">
        <h3><i className="fas fa-receipt"></i> Gider Detayları</h3>
        <table className="detay-table">
          <thead>
            <tr>
              <th>Saat</th>
              <th>Gider</th>
              <th>Tür</th>
              <th>Tutar</th>
              <th>Kullanıcı</th>
            </tr>
          </thead>
          <tbody>
            {gunDetay.giderDetay.map((g, i) => (
              <tr key={i}>
                <td>{g.saat}</td>
                <td>{g.gider}</td>
                <td>{g.tur}</td>
                <td style={{ color: '#e74c3c', fontWeight: '700' }}>-{g.tutar} ₺</td>
                <td>{g.kullanici}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700' }}>Toplam Gider:</td>
              <td style={{ color: '#e74c3c', fontWeight: '800', fontSize: '16px' }}>-{gunDetay.gider} ₺</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* SİSTEM LOG */}
      <div className="card">
        <h3><i className="fas fa-history"></i> Sistem Olayları</h3>
        <ul className="log-list">
          {gunDetay.sistemLoglari.map((log, i) => {
            const [saat, aciklama] = log.split(' – ');
            return (
              <li key={i}>
                <span className="log-saat">{saat}</span>
                <span className="log-aciklama">{aciklama}</span>
                <span className="log-kullanici">
                  {aciklama.includes('(Admin)') ? 'Admin' : 
                   aciklama.includes('(Garson)') ? 'Garson' : 
                   aciklama.includes('(Kasa)') ? 'Kasa' : 'Sistem'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* NOTLAR */}
      <div className="card">
        <h3><i className="fas fa-sticky-note"></i> Gün Sonu Notları</h3>
        <div style={{ color: '#b8a98c', fontSize: '14px', lineHeight: '1.6', padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px' }}>
          <p>• Cumartesi günü yoğun geçti, personel fazla mesai yaptı.</p>
          <p>• Elektrik faturası ödemesi yapıldı.</p>
          <p>• 2 adet yeni müşteri hesaba yazdı, takip edilecek.</p>
          <p>• Bilardo masalarında %20 doluluk oranı ile normalin üzerinde.</p>
        </div>
      </div>
    </div>
  );
};

export default GunSonuDetay;
