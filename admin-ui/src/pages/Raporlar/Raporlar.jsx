import React, { useState, useEffect } from "react";
import raporMotoruV2 from "@/services/raporMotoruV2";
import GenelOzet from "./GenelOzet/GenelOzet";
import KasaRaporu from "./KasaRaporu/KasaRaporu";
import GiderRaporlari from "./GiderRaporlari/GiderRaporlari";
import UrunRaporu from "./UrunRaporu/UrunRaporu";
import KategoriRaporu from "./KategoriRaporu/KategoriRaporu";
import MasaRaporu from "./MasaRaporu/MasaRaporu";
import BilardoRaporu from "./BilardoRaporu/BilardoRaporu";
import GunSonuRaporu from "./GunSonuRaporu/GunSonuRaporu";
import "./Raporlar.css";

const Raporlar = () => {
  const [filtre, setFiltre] = useState({
    baslangicTarihi: null,
    bitisTarihi: null,
    raporTuru: 'tum'
  });
  
  // TEK BİR raporlar state'i - isim çakışmasını önlemek için
  const [raporVerileri, setRaporVerileri] = useState({
    genelOzet: null,
    kasaRaporu: null,
    giderRaporu: null,
    urunRaporu: null,
    kategoriRaporu: null,
    masaRaporu: null,
    bilardoRaporu: null,
    gunSonuRaporu: null
  });
  
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  // Debug modunu aç
  useEffect(() => {
    if (raporMotoruV2.enableDebug) {
      raporMotoruV2.enableDebug();
    }
    tumRaporlariYukle();
  }, []);

  const tumRaporlariYukle = async () => {
    try {
      setYukleniyor(true);
      setHata(null);
      
      const tumRaporlar = await raporMotoruV2.tumRaporlar(
        filtre.baslangicTarihi,
        filtre.bitisTarihi
      );
      
      setRaporVerileri(tumRaporlar);
    } catch (err) {
      console.error('Rapor yükleme hatası:', err);
      setHata(err.message || 'Bilinmeyen hata');
    } finally {
      setYukleniyor(false);
    }
  };

  const tekRaporYukle = async (raporTuru) => {
    try {
      setYukleniyor(true);
      setHata(null);
      
      let raporData;
      switch (raporTuru) {
        case 'genel':
          raporData = await raporMotoruV2.genelOzet(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, genelOzet: raporData }));
          break;
        case 'kasa':
          raporData = await raporMotoruV2.kasaRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, kasaRaporu: raporData }));
          break;
        case 'gider':
          raporData = await raporMotoruV2.giderRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, giderRaporu: raporData }));
          break;
        case 'urun':
          raporData = await raporMotoruV2.urunRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, urunRaporu: raporData }));
          break;
        case 'kategori':
          raporData = await raporMotoruV2.kategoriRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, kategoriRaporu: raporData }));
          break;
        case 'masa':
          raporData = await raporMotoruV2.masaRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, masaRaporu: raporData }));
          break;
        case 'bilardo':
          raporData = await raporMotoruV2.bilardoRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
          setRaporVerileri(prev => ({ ...prev, bilardoRaporu: raporData }));
          break;
        case 'gunsonu':
          if (raporMotoruV2.gunSonuRaporu) {
            raporData = await raporMotoruV2.gunSonuRaporu(filtre.baslangicTarihi, filtre.bitisTarihi);
            setRaporVerileri(prev => ({ ...prev, gunSonuRaporu: raporData }));
          }
          break;
        default:
          console.warn('Bilinmeyen rapor türü:', raporTuru);
      }
    } catch (err) {
      console.error(`${raporTuru} raporu yükleme hatası:`, err);
      setHata(err.message || `${raporTuru} raporu yüklenemedi`);
    } finally {
      setYukleniyor(false);
    }
  };

  const handleFiltreDegisiklik = (yeniFiltre) => {
    setFiltre(yeniFiltre);
    if (yeniFiltre.raporTuru === 'tum') {
      tumRaporlariYukle();
    } else {
      tekRaporYukle(yeniFiltre.raporTuru);
    }
  };

  // Bugünkü tarih
  const bugun = new Date().toISOString().split('T')[0];
  const dun = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <div className="raporlar-container">
      {/* Başlık ve Kontroller */}
      <div className="rapor-baslik">
        <h1>📊 MyCafe Raporlama Sistemi</h1>
        <div className="rapor-kontroller">
          {/* Hızlı Tarih Butonları */}
          <div className="hizli-tarihler">
            <button 
              onClick={() => handleFiltreDegisiklik({...filtre, baslangicTarihi: bugun, bitisTarihi: bugun, raporTuru: 'tum'})}
              className="tarih-btn bugun"
            >
              Bugün
            </button>
            <button 
              onClick={() => handleFiltreDegisiklik({...filtre, baslangicTarihi: dun, bitisTarihi: dun, raporTuru: 'tum'})}
              className="tarih-btn dun"
            >
              Dün
            </button>
            <button 
              onClick={() => handleFiltreDegisiklik({...filtre, baslangicTarihi: null, bitisTarihi: null, raporTuru: 'tum'})}
              className="tarih-btn tum"
            >
              Tüm Zamanlar
            </button>
          </div>
          
          {/* Ana Filtreler */}
          <div className="filtreler">
            <div className="filtre-grubu">
              <label>Başlangıç Tarihi:</label>
              <input
                type="date"
                value={filtre.baslangicTarihi || ''}
                onChange={(e) => handleFiltreDegisiklik({
                  ...filtre,
                  baslangicTarihi: e.target.value || null,
                  raporTuru: filtre.raporTuru
                })}
                className="tarih-input"
              />
            </div>
            
            <div className="filtre-grubu">
              <label>Bitiş Tarihi:</label>
              <input
                type="date"
                value={filtre.bitisTarihi || ''}
                onChange={(e) => handleFiltreDegisiklik({
                  ...filtre,
                  bitisTarihi: e.target.value || null,
                  raporTuru: filtre.raporTuru
                })}
                className="tarih-input"
              />
            </div>
            
            <div className="filtre-grubu">
              <label>Rapor Türü:</label>
              <select
                value={filtre.raporTuru}
                onChange={(e) => handleFiltreDegisiklik({
                  ...filtre,
                  raporTuru: e.target.value
                })}
                className="rapor-select"
              >
                <option value="tum">Tüm Raporlar</option>
                <option value="genel">Genel Özet</option>
                <option value="kasa">Kasa Raporu</option>
                <option value="gider">Gider Raporları</option>
                <option value="urun">Ürün Raporu</option>
                <option value="kategori">Kategori Raporu</option>
                <option value="masa">Masa Raporu</option>
                <option value="bilardo">Bilardo Raporu</option>
                <option value="gunsonu">Gün Sonu Raporu</option>
              </select>
            </div>
            
            <button 
              onClick={tumRaporlariYukle} 
              disabled={yukleniyor}
              className="guncelle-btn"
            >
              {yukleniyor ? (
                <>
                  <span className="spinner"></span>
                  Yükleniyor...
                </>
              ) : '📊 Raporları Güncelle'}
            </button>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {hata && (
        <div className="hata-mesaji">
          <span className="hata-icon">⚠️</span>
          <div className="hata-icerik">
            <strong>Hata:</strong> {hata}
          </div>
          <button 
            onClick={() => setHata(null)}
            className="hata-kapat"
          >
            ×
          </button>
        </div>
      )}

      {/* Rapor Grid - Kartlar */}
      <div className="rapor-grid">
        {/* Genel Özet Kartı */}
        <div className="rapor-karti buyuk-kart">
          <div className="kart-baslik">
            <h3>📈 Genel Özet</h3>
            <span className="kart-tarih">
              {raporVerileri.genelOzet?.tarihAraligi?.start || bugun}
            </span>
          </div>
          
          {yukleniyor && !raporVerileri.genelOzet ? (
            <div className="yukleniyor">Yükleniyor...</div>
          ) : raporVerileri.genelOzet ? (
            <div className="ozet-icerik">
              <div className="ciro-grubu">
                <div className="ciro-item">
                  <span className="ciro-label">Toplam Ciro</span>
                  <span className="ciro-deger">
                    {raporVerileri.genelOzet.toplamCiro?.toFixed(2) || '0.00'} ₺
                  </span>
                </div>
                <div className="ciro-item">
                  <span className="ciro-label">Toplam Tahsilat</span>
                  <span className="ciro-deger">
                    {raporVerileri.genelOzet.toplamTahsilat?.toFixed(2) || '0.00'} ₺
                  </span>
                </div>
              </div>
              
              <div className="gider-grubu">
                <div className="gider-item">
                  <span className="gider-label">Toplam Gider</span>
                  <span className="gider-deger">
                    {raporVerileri.genelOzet.toplamGider?.toFixed(2) || '0.00'} ₺
                  </span>
                </div>
                <div className="gider-item">
                  <span className="gider-label">Net Kazanç</span>
                  <span className={`gider-deger ${(raporVerileri.genelOzet.netKazanc || 0) >= 0 ? 'kazanc' : 'zarar'}`}>
                    {raporVerileri.genelOzet.netKazanc?.toFixed(2) || '0.00'} ₺
                  </span>
                </div>
              </div>
              
              <div className="durum-grubu">
                <div className="durum-item">
                  <span className="durum-label">Gün Durumu</span>
                  <span className={`durum-deger ${raporVerileri.genelOzet.gunDurumu === 'acik' ? 'acik' : 'kapali'}`}>
                    {raporVerileri.genelOzet.gunDurumu === 'acik' ? '🔓 Açık' : '🔒 Kapalı'}
                  </span>
                </div>
                <div className="durum-item">
                  <span className="durum-label">Adisyon Sayısı</span>
                  <span className="durum-deger">{raporVerileri.genelOzet.adisyonSayisi || 0}</span>
                </div>
                <div className="durum-item">
                  <span className="durum-label">Açık Adisyon</span>
                  <span className="durum-deger">{raporVerileri.genelOzet.acikAdisyonSayisi || 0}</span>
                </div>
                <div className="durum-item">
                  <span className="durum-label">Aktif Masa</span>
                  <span className="durum-deger">{raporVerileri.genelOzet.aktifMasaSayisi || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="veri-yok">Veri bulunamadı</div>
          )}
        </div>

        {/* Diğer Rapor Kartları - Sadece Tüm Raporlar seçiliyse göster */}
        {(!filtre.raporTuru || filtre.raporTuru === 'tum') && (
          <>
            {/* Kasa Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>💰 Kasa Raporu</h3>
                <span className="kart-detay">
                  {raporVerileri.kasaRaporu?.hareketSayisi || 0} hareket
                </span>
              </div>
              
              {yukleniyor && !raporVerileri.kasaRaporu ? (
                <div className="yukleniyor">Yükleniyor...</div>
              ) : raporVerileri.kasaRaporu ? (
                <div className="kasa-icerik">
                  <div className="kasa-toplam">
                    <span className="toplam-label">Toplam Tahsilat</span>
                    <span className="toplam-deger">
                      {raporVerileri.kasaRaporu.toplamTahsilat?.toFixed(2) || '0.00'} ₺
                    </span>
                  </div>
                  
                  <div className="odeme-turleri">
                    <div className="odeme-item">
                      <span className="odeme-label">💵 Nakit</span>
                      <span className="odeme-deger">
                        {raporVerileri.kasaRaporu.odemeGruplari?.nakit?.toFixed(2) || '0.00'} ₺
                      </span>
                    </div>
                    <div className="odeme-item">
                      <span className="odeme-label">💳 Kart</span>
                      <span className="odeme-deger">
                        {raporVerileri.kasaRaporu.odemeGruplari?.kart?.toFixed(2) || '0.00'} ₺
                      </span>
                    </div>
                    <div className="odeme-item">
                      <span className="odeme-label">🏦 Havale/EFT</span>
                      <span className="odeme-deger">
                        {raporVerileri.kasaRaporu.odemeGruplari?.havale?.toFixed(2) || '0.00'} ₺
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'kasa'})}
                  >
                    Detayları Gör
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Gider Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>💸 Gider Raporları</h3>
                <span className="kart-detay">
                  {raporVerileri.giderRaporu?.giderSayisi || 0} gider
                </span>
              </div>
              
              {yukleniyor && !raporVerileri.giderRaporu ? (
                <div className="yukleniyor">Yükleniyor...</div>
              ) : raporVerileri.giderRaporu ? (
                <div className="gider-icerik">
                  <div className="gider-toplam">
                    <span className="toplam-label">Toplam Gider</span>
                    <span className="toplam-deger">
                      {raporVerileri.giderRaporu.toplamGider?.toFixed(2) || '0.00'} ₺
                    </span>
                  </div>
                  
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'gider'})}
                  >
                    Tüm Giderler
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Ürün Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>📦 Ürün Raporu</h3>
                <span className="kart-detay">
                  {raporVerileri.urunRaporu?.raporlananUrunSayisi || 0} ürün
                </span>
              </div>
              
              {yukleniyor && !raporVerileri.urunRaporu ? (
                <div className="yukleniyor">Yükleniyor...</div>
              ) : raporVerileri.urunRaporu ? (
                <div className="urun-icerik">
                  <div className="urun-toplam">
                    <span className="toplam-label">Toplam Ciro</span>
                    <span className="toplam-deger">
                      {raporVerileri.urunRaporu.toplamUrunCirosu?.toFixed(2) || '0.00'} ₺
                    </span>
                  </div>
                  
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'urun'})}
                  >
                    Ürün Detayları
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Masa Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>🍽️ Masa Raporu</h3>
              </div>
              {raporVerileri.masaRaporu ? (
                <div className="masa-icerik">
                  <div className="masa-sayi">
                    <span>{raporVerileri.masaRaporu.tumMasalar?.length || 0} aktif masa</span>
                  </div>
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'masa'})}
                  >
                    Masa Detayları
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Kategori Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>🏷️ Kategori Raporu</h3>
              </div>
              {raporVerileri.kategoriRaporu ? (
                <div className="kategori-icerik">
                  <div className="kategori-sayi">
                    <span>{raporVerileri.kategoriRaporu.kategoriSayisi || 0} kategori</span>
                  </div>
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'kategori'})}
                  >
                    Kategori Detayları
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Bilardo Raporu */}
            <div className="rapor-karti">
              <div className="kart-baslik">
                <h3>🎱 Bilardo Raporu</h3>
              </div>
              {raporVerileri.bilardoRaporu ? (
                <div className="bilardo-icerik">
                  <div className="bilardo-gelir">
                    <span>{raporVerileri.bilardoRaporu.toplamBilardoGeliri?.toFixed(2) || '0.00'} ₺ gelir</span>
                  </div>
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'bilardo'})}
                  >
                    Bilardo Detayları
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Veri bulunamadı</div>
              )}
            </div>

            {/* Gün Sonu Raporu */}
            <div className="rapor-karti gunsonu-karti">
              <div className="kart-baslik">
                <h3>📅 Gün Sonu Raporu</h3>
                <span className="kart-detay">
                  {raporVerileri.gunSonuRaporu?.toplamGunSayisi || 0} gün
                </span>
              </div>
              
              {yukleniyor && !raporVerileri.gunSonuRaporu ? (
                <div className="yukleniyor">Yükleniyor...</div>
              ) : raporVerileri.gunSonuRaporu ? (
                <div className="gunsonu-icerik">
                  <div className="gunsonu-toplam">
                    <span className="toplam-label">Ortalama Günlük Ciro</span>
                    <span className="toplam-deger">
                      {raporVerileri.gunSonuRaporu.gunlukOrtalamaCiro?.toFixed(2) || '0.00'} ₺
                    </span>
                  </div>
                  
                  <button 
                    className="detay-btn"
                    onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'gunsonu'})}
                  >
                    Tüm Gün Sonları
                  </button>
                </div>
              ) : (
                <div className="veri-yok">Gün sonu verisi bulunamadı</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Seçili rapor detayları */}
      {(filtre.raporTuru && filtre.raporTuru !== 'tum') && (
        <div className="detay-rapor">
          <div className="detay-baslik">
            <h3>
              {filtre.raporTuru === 'genel' && '📈 Genel Özet Detayları'}
              {filtre.raporTuru === 'kasa' && '💰 Kasa Raporu Detayları'}
              {filtre.raporTuru === 'gider' && '💸 Gider Raporları Detayları'}
              {filtre.raporTuru === 'urun' && '📦 Ürün Raporu Detayları'}
              {filtre.raporTuru === 'kategori' && '🏷️ Kategori Raporu Detayları'}
              {filtre.raporTuru === 'masa' && '🍽️ Masa Raporu Detayları'}
              {filtre.raporTuru === 'bilardo' && '🎱 Bilardo Raporu Detayları'}
              {filtre.raporTuru === 'gunsonu' && '📅 Gün Sonu Raporu Detayları'}
            </h3>
            <button 
              onClick={() => handleFiltreDegisiklik({...filtre, raporTuru: 'tum'})}
              className="kapat-detay-btn"
            >
              × Kapat
            </button>
          </div>
          
          <div className="detay-icerik">
            {filtre.raporTuru === 'genel' && <GenelOzet data={raporVerileri.genelOzet} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'kasa' && <KasaRaporu data={raporVerileri.kasaRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'gider' && <GiderRaporlari data={raporVerileri.giderRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'urun' && <UrunRaporu data={raporVerileri.urunRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'kategori' && <KategoriRaporu data={raporVerileri.kategoriRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'masa' && <MasaRaporu data={raporVerileri.masaRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'bilardo' && <BilardoRaporu data={raporVerileri.bilardoRaporu} yukleniyor={yukleniyor} />}
            {filtre.raporTuru === 'gunsonu' && <GunSonuRaporu data={raporVerileri.gunSonuRaporu} yukleniyor={yukleniyor} />}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="rapor-footer">
        <div className="footer-icerik">
          <span className="footer-url">localhost:5173/raporlar</span>
          <span className="footer-bilgi">
            {raporVerileri.genelOzet?.hesaplamaZamani ? 
              `Son güncelleme: ${new Date(raporVerileri.genelOzet.hesaplamaZamani).toLocaleTimeString('tr-TR')}` : 
              'MyCafe Raporlama Sistemi v2.0'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Raporlar;