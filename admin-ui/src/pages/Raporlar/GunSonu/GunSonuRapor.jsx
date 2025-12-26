import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GunSonuRapor.css";

const GunSonuRapor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunDetay, setGunDetay] = useState(null);
  const [gunDurum, setGunDurum] = useState("devam");

  // Veriyi yükle
  useEffect(() => {
    const fetchGunSonuDetay = async () => {
      setYukleniyor(true);
      try {
        setTimeout(() => {
          const gunVerisi = {
            id: id || "GS20240420001",
            tarih: "20 Nisan 2024",
            gunNo: "Gün #145",
            acilis: "08:15",
            kapanis: "23:45",
            kapanisYapan: "Ahmet Yılmaz",
            durum: "tamamlandı",
            vardiya: "Sabah",
            masaHareketleri: [
              { masa: "5", acilis: "08:20", kapanis: "09:45", sure: "01:25", nakit: 80, kart: 20, hesabaYaz: 30 },
              { masa: "7", acilis: "10:00", kapanis: "11:30", sure: "01:30", nakit: 20, kart: 10, hesabaYaz: 10 },
              { masa: "12", acilis: "12:15", kapanis: "14:00", sure: "01:45", nakit: 10, kart: 15, hesabaYaz: 20 },
              { masa: "Bilardo 2", acilis: "15:30", kapanis: "17:00", sure: "01:30", nakit: 80, kart: 50, hesabaYaz: 10 },
              { masa: "3", acilis: "18:00", kapanis: "19:30", sure: "01:30", nakit: 45, kart: 25, hesabaYaz: 15 },
              { masa: "8", acilis: "20:15", kapanis: "21:45", sure: "01:30", nakit: 60, kart: 40, hesabaYaz: 5 },
              { masa: "Bilardo 5", acilis: "16:30", kapanis: "18:00", sure: "01:30", nakit: 120, kart: 0, hesabaYaz: 0 },
              { masa: "10", acilis: "14:45", kapanis: "16:15", sure: "01:30", nakit: 35, kart: 25, hesabaYaz: 8 },
              { masa: "15", acilis: "11:00", kapanis: "12:30", sure: "01:30", nakit: 28, kart: 12, hesabaYaz: 7 },
              { masa: "22", acilis: "19:00", kapanis: "20:30", sure: "01:30", nakit: 95, kart: 55, hesabaYaz: 25 }
            ],
            giderler: [
              { ad: "Personel Yemek", tutar: 200, kategori: "personel" },
              { ad: "Temizlik Malzemesi", tutar: 75, kategori: "temizlik" },
              { ad: "Elektrik Faturası", tutar: 400, kategori: "fatura" },
              { ad: "Su Faturası", tutar: 120, kategori: "fatura" },
              { ad: "Doğalgaz", tutar: 350, kategori: "fatura" },
              { ad: "Kira", tutar: 5000, kategori: "kira" }
            ],
            urunSatislari: [
              { urun: "Çay", adet: 50, birim: 2, tutar: 100, maliyetsiz: true, kategori: "içecek" },
              { urun: "Oralet", adet: 30, birim: 3, tutar: 90, maliyetsiz: true, kategori: "içecek" },
              { urun: "Tost", adet: 12, birim: 15, tutar: 180, maliyetsiz: false, kategori: "yiyecek" },
              { urun: "Nescafe", adet: 25, birim: 8, tutar: 200, maliyetsiz: false, kategori: "içecek" },
              { urun: "Su", adet: 40, birim: 3, tutar: 120, maliyetsiz: true, kategori: "içecek" },
              { urun: "Kola", adet: 18, birim: 7, tutar: 126, maliyetsiz: false, kategori: "içecek" },
              { urun: "Ayran", adet: 22, birim: 5, tutar: 110, maliyetsiz: false, kategori: "içecek" },
              { urun: "Limonata", adet: 15, birim: 10, tutar: 150, maliyetsiz: false, kategori: "içecek" }
            ],
            kasalar: [
              { ad: "Ana Kasa", acilis: 1500, kapanis: 2500, fark: 1000 },
              { ad: "Yan Kasa", acilis: 500, kapanis: 800, fark: 300 }
            ],
            ozet: {
              toplamNakit: 645,
              toplamKart: 480,
              toplamHesap: 120,
              toplamGider: 675,
              netKar: 570,
              toplamCiro: 1245,
              brutKar: 1245,
              tahsilEdilmeyen: 120
            }
          };
          
          setGunDetay(gunVerisi);
          setGunDurum(gunVerisi.durum);
          setYukleniyor(false);
        }, 800);
      } catch (error) {
        console.error('Gün sonu detayı yüklenemedi:', error);
        setYukleniyor(false);
      }
    };

    fetchGunSonuDetay();
  }, [id]);

  // Hesaplamalar
  const toplamMasaNakit = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.nakit, 0) || 0;
  const toplamMasaKart = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.kart, 0) || 0;
  const toplamMasaHesap = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.hesabaYaz, 0) || 0;
  const toplamUrunSatis = gunDetay?.urunSatislari.reduce((sum, u) => sum + u.tutar, 0) || 0;
  const toplamKasaFark = gunDetay?.kasalar.reduce((sum, k) => sum + k.fark, 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF raporu oluşturuluyor...');
  };

  const handleExportExcel = () => {
    const data = {
      gunDetay,
      hesaplamalar: {
        toplamMasaNakit,
        toplamMasaKart,
        toplamMasaHesap,
        toplamUrunSatis,
        toplamKasaFark
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gun-sonu-raporu-${gunDetay?.id || 'rapor'}.json`;
    a.click();
    
    alert('Excel dosyası indiriliyor...');
  };

  const handleBack = () => {
    navigate('/raporlar');
  };

  const handleGunSonlandir = () => {
    if (window.confirm('Günü sonlandırmak istediğinize emin misiniz?')) {
      alert('Gün sonlandırıldı! Rapor hazırlanıyor...');
      window.location.reload();
    }
  };

  const handleDetayliRapor = () => {
    navigate(`/raporlar/gun-sonu-detay/${id}`);
  };

  if (yukleniyor) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Gün sonu raporu yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!gunDetay) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="error-state">
          <div className="error-icon">📊</div>
          <div className="error-text">Gün sonu raporu bulunamadı</div>
          <button 
            onClick={handleBack}
            className="btn btn-primary"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gun-sonu-rapor-container">
      {/* ÜST BİLGİ - GÜN DURUMU */}
      <div className="gun-durum-banner">
        <div className="durum-bilgisi">
          <span className={`durum-badge ${gunDurum}`}>
            <i className={`fas fa-${gunDurum === 'tamamlandı' ? 'check-circle' : 'play-circle'}`}></i>
            {gunDurum === 'tamamlandı' ? 'Gün Tamamlandı' : 'Gün Devam Ediyor'}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-calendar-day"></i> {gunDetay.gunNo}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-user-clock"></i> Vardiya: {gunDetay.vardiya}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-clock"></i> {gunDetay.acilis} - {gunDetay.kapanis}
          </span>
        </div>
        
        <div className="gun-aksiyonlar">
          {gunDurum !== 'tamamlandı' && (
            <button className="btn btn-warning" onClick={handleGunSonlandir}>
              <i className="fas fa-stop-circle"></i> Günü Sonlandır
            </button>
          )}
        </div>
      </div>

      {/* ANA BAŞLIK */}
      <div className="rapor-header">
        <div className="rapor-title-area">
          <h1>
            <i className="fas fa-file-invoice-dollar"></i>
            Gün Sonu Raporu
          </h1>
          <div className="rapor-meta">
            <div className="rapor-id">
              <i className="fas fa-hashtag"></i> Rapor ID: <strong>{gunDetay.id}</strong>
            </div>
            <div className="rapor-tarih">
              <i className="fas fa-calendar-alt"></i> {gunDetay.tarih}
            </div>
            <div className="rapor-kapanis">
              <i className="fas fa-user-check"></i> Kapanış: {gunDetay.kapanisYapan}
            </div>
          </div>
        </div>

        <div className="rapor-aksiyonlar">
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Geri
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="fas fa-print"></i> Yazdır
            </button>
            <button className="btn btn-danger" onClick={handleExportPDF}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button className="btn btn-success" onClick={handleExportExcel}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
          </div>
        </div>
      </div>

      {/* FİNANSAL ÖZET */}
      <div className="finansal-ozet-full">
        <h2><i className="fas fa-chart-bar"></i> Finansal Özet</h2>
        <div className="finansal-grid-full">
          <div className="finansal-item-full gelir">
            <div className="finansal-icon">
              <i className="fas fa-cash-register"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Toplam Ciro</div>
              <div className="finansal-deger">{gunDetay.ozet.toplamCiro} TL</div>
              <div className="finansal-detay">Brüt Gelir</div>
            </div>
          </div>
          
          <div className="finansal-item-full nakit">
            <div className="finansal-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Nakit</div>
              <div className="finansal-deger">{gunDetay.ozet.toplamNakit} TL</div>
              <div className="finansal-detay">
                {((gunDetay.ozet.toplamNakit / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full kart">
            <div className="finansal-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Kart</div>
              <div className="finansal-deger">{gunDetay.ozet.toplamKart} TL</div>
              <div className="finansal-detay">
                {((gunDetay.ozet.toplamKart / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full gider">
            <div className="finansal-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Giderler</div>
              <div className="finansal-deger">-{gunDetay.ozet.toplamGider} TL</div>
              <div className="finansal-detay">Toplam Masraf</div>
            </div>
          </div>
          
          <div className="finansal-item-full net">
            <div className="finansal-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Net Kâr</div>
              <div className="finansal-deger">{gunDetay.ozet.netKar} TL</div>
              <div className="finansal-detay">
                Kar Marjı: {((gunDetay.ozet.netKar / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="finansal-item-full tahsilat">
            <div className="finansal-icon">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="finansal-content">
              <div className="finansal-label">Tahsil Edilmeyen</div>
              <div className="finansal-deger">{gunDetay.ozet.tahsilEdilmeyen} TL</div>
              <div className="finansal-detay">Hesaba Yazılan</div>
            </div>
          </div>
        </div>
      </div>

      {/* ANA İÇERİK - 3 KOLON */}
      <div className="rapor-ana-icerik-full">
        {/* SOL KOLON - MASA HAREKETLERİ */}
        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full">
            <h3><i className="fas fa-chair"></i> Masa Hareketleri</h3>
            <div className="table-responsive-full">
              <table className="rapor-tablosu-full">
                <thead>
                  <tr>
                    <th>Masa</th>
                    <th>Zaman</th>
                    <th>Süre</th>
                    <th>Nakit</th>
                    <th>Kart</th>
                    <th>Hesap</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {gunDetay.masaHareketleri.map((masa, index) => (
                    <tr key={index}>
                      <td>
                        <div className="masa-bilgi-full">
                          <div className="masa-no-full">{masa.masa}</div>
                          <div className="masa-tip-full">
                            {masa.masa.includes('Bilardo') ? 'Bilardo' : 'Normal'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="masa-saat-full">
                          {masa.acilis} - {masa.kapanis}
                        </div>
                      </td>
                      <td>{masa.sure}</td>
                      <td>{masa.nakit} TL</td>
                      <td>{masa.kart} TL</td>
                      <td>{masa.hesabaYaz} TL</td>
                      <td><strong>{masa.nakit + masa.kart + masa.hesabaYaz} TL</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="toplam-satir-full">
                    <td colSpan="3">TOPLAM</td>
                    <td><strong>{toplamMasaNakit} TL</strong></td>
                    <td><strong>{toplamMasaKart} TL</strong></td>
                    <td><strong>{toplamMasaHesap} TL</strong></td>
                    <td><strong>{toplamMasaNakit + toplamMasaKart + toplamMasaHesap} TL</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ORTA KOLON - ÜRÜN SATIŞLARI */}
        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full">
            <h3><i className="fas fa-shopping-cart"></i> Ürün Satışları</h3>
            <div className="urun-listesi-full">
              {gunDetay.urunSatislari.map((urun, index) => (
                <div key={index} className="urun-item-full">
                  <div className="urun-bilgi-full">
                    <div className="urun-ad-full">
                      {urun.urun}
                      {urun.maliyetsiz && (
                        <span className="maliyetsiz-badge-full">M</span>
                      )}
                    </div>
                    <div className="urun-detay-full">
                      {urun.adet} adet × {urun.birim} TL
                      <span className="urun-kategori-full">{urun.kategori}</span>
                    </div>
                  </div>
                  <div className="urun-tutar-full">{urun.tutar} TL</div>
                </div>
              ))}
              <div className="urun-toplam-full">
                <div className="urun-ad-full">Toplam Satış</div>
                <div className="urun-tutar-full">{toplamUrunSatis} TL</div>
              </div>
            </div>
          </div>

          <div className="rapor-bolum-full">
            <h3><i className="fas fa-safe"></i> Kasa Durumu</h3>
            <div className="kasa-listesi-full">
              {gunDetay.kasalar.map((kasa, index) => (
                <div key={index} className="kasa-item-full">
                  <div className="kasa-ad-full">{kasa.ad}</div>
                  <div className="kasa-degerler-full">
                    <div className="kasa-deger-full">
                      <span className="label">Açılış:</span>
                      <span className="value">{kasa.acilis} TL</span>
                    </div>
                    <div className="kasa-deger-full">
                      <span className="label">Kapanış:</span>
                      <span className="value">{kasa.kapanis} TL</span>
                    </div>
                    <div className="kasa-deger-full">
                      <span className="label">Fark:</span>
                      <span className={`value ${kasa.fark >= 0 ? 'pozitif' : 'negatif'}`}>
                        {kasa.fark >= 0 ? '+' : ''}{kasa.fark} TL
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="kasa-toplam-full">
                <div className="kasa-ad-full">Toplam Kasa Farkı</div>
                <div className="kasa-fark-total-full">
                  <span className={toplamKasaFark >= 0 ? 'pozitif' : 'negatif'}>
                    {toplamKasaFark >= 0 ? '+' : ''}{toplamKasaFark} TL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON - GİDERLER VE DETAY */}
        <div className="rapor-kolon-full">
          <div className="rapor-bolum-full">
            <h3><i className="fas fa-receipt"></i> Günlük Giderler</h3>
            <div className="gider-listesi-full">
              {gunDetay.giderler.map((gider, index) => (
                <div key={index} className="gider-item-full">
                  <div className="gider-ad-full">
                    <i className="fas fa-minus-circle"></i>
                    {gider.ad}
                    <span className="gider-kategori-full">{gider.kategori}</span>
                  </div>
                  <div className="gider-tutar-full">-{gider.tutar} TL</div>
                </div>
              ))}
              <div className="gider-toplam-full">
                <div className="gider-ad-full">Toplam Gider</div>
                <div className="gider-tutar-full">-{gunDetay.ozet.toplamGider} TL</div>
              </div>
            </div>
          </div>

          <div className="rapor-bolum-full">
            <h3><i className="fas fa-chart-pie"></i> Hızlı İstatistikler</h3>
            <div className="istatistik-grid-full">
              <div className="istatistik-item-full">
                <div className="istatistik-icon">
                  <i className="fas fa-chair"></i>
                </div>
                <div className="istatistik-content">
                  <div className="istatistik-deger">{gunDetay.masaHareketleri.length}</div>
                  <div className="istatistik-label">Aktif Masa</div>
                </div>
              </div>
              
              <div className="istatistik-item-full">
                <div className="istatistik-icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className="istatistik-content">
                  <div className="istatistik-deger">{gunDetay.urunSatislari.length}</div>
                  <div className="istatistik-label">Ürün Çeşidi</div>
                </div>
              </div>
              
              <div className="istatistik-item-full">
                <div className="istatistik-icon">
                  <i className="fas fa-receipt"></i>
                </div>
                <div className="istatistik-content">
                  <div className="istatistik-deger">{gunDetay.giderler.length}</div>
                  <div className="istatistik-label">Gider Kalemi</div>
                </div>
              </div>
              
              <div className="istatistik-item-full">
                <div className="istatistik-icon">
                  <i className="fas fa-coins"></i>
                </div>
                <div className="istatistik-content">
                  <div className="istatistik-deger">{gunDetay.ozet.netKar > 0 ? '👍' : '👎'}</div>
                  <div className="istatistik-label">Kar Durumu</div>
                </div>
              </div>
            </div>

            <div className="ortalama-istatistikler-full">
              <h4><i className="fas fa-calculator"></i> Ortalamalar</h4>
              <div className="ortalama-listesi-full">
                <div className="ortalama-item-full">
                  <span className="ortalama-label">Masa Başı Ort.</span>
                  <span className="ortalama-deger">
                    {(gunDetay.ozet.toplamCiro / gunDetay.masaHareketleri.length).toFixed(0)} TL
                  </span>
                </div>
                <div className="ortalama-item-full">
                  <span className="ortalama-label">Ürün Başı Ort.</span>
                  <span className="ortalama-deger">
                    {(toplamUrunSatis / gunDetay.urunSatislari.length).toFixed(0)} TL
                  </span>
                </div>
                <div className="ortalama-item-full">
                  <span className="ortalama-label">Kar Marjı</span>
                  <span className={`ortalama-deger ${gunDetay.ozet.netKar > 0 ? 'pozitif' : 'negatif'}`}>
                    {((gunDetay.ozet.netKar / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALT BİLGİ */}
      <div className="rapor-alt-bilgi-full">
        <div className="rapor-notlar-full">
          <div className="not-item-full">
            <i className="fas fa-info-circle"></i>
            <span>Bu rapor otomatik olarak oluşturulmuştur.</span>
          </div>
          <div className="not-item-full">
            <i className="fas fa-shield-alt"></i>
            <span>Rapor ID: {gunDetay.id} • Kapanış Yapan: {gunDetay.kapanisYapan}</span>
          </div>
        </div>
        
        <div className="rapor-tarih-full">
          <div>
            <i className="fas fa-calendar"></i>
            Oluşturulma: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>

      {/* ALT AKSiYON BUTONLARI */}
      <div className="alt-aksiyonlar-full">
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="fas fa-list"></i> Rapor Listesi
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <i className="fas fa-print"></i> Raporu Yazdır
        </button>
        <button className="btn btn-danger" onClick={handleExportPDF}>
          <i className="fas fa-download"></i> PDF Olarak İndir
        </button>
        <button className="btn btn-success" onClick={handleExportExcel}>
          <i className="fas fa-file-export"></i> Excel'e Aktar
        </button>
      </div>
    </div>
  );
};

export default GunSonuRapor;