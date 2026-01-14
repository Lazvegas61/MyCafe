import React, { useEffect, useMemo, useState } from "react";
import "./Adisyon.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

// SYNC SERVICE IMPORT - EKLENDİ
import syncService from "../../services/syncService";

// LocalStorage key'leri
const MASA_KEY = "mc_masalar";
const ADISYON_KEY = "mc_adisyonlar";
const URUN_KEY = "mc_urunler";
const MUSTERI_KEY = "mc_musteriler";
const BORC_KEY = "mc_borclar";

export default function Adisyon() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    
    // --------------------------------------------------
    // GENEL STATE
    // --------------------------------------------------
    const [masaNo, setMasaNo] = useState("MASA 1");
    const [gercekMasaNo, setGercekMasaNo] = useState("1"); // Gerçek masa numarası (1, 2, 3, ...)
    const [adisyon, setAdisyon] = useState(null); // YENİ ADİSYON
    const [gecenSure, setGecenSure] = useState("00:00");
    const [indirimInput, setIndirimInput] = useState("");
    const [indirim, setIndirim] = useState(0);
    const [toplam, setToplam] = useState(0);
    const [kalan, setKalan] = useState(0);
    const [aktifOdemeTipi, setAktifOdemeTipi] = useState("NAKIT");
    const [odemeInput, setOdemeInput] = useState("");
    const [kapanisMesaji, setKapanisMesaji] = useState("");

    // MENÜ
    const [urunler, setUrunler] = useState([]);
    const [aktifKategori, setAktifKategori] = useState("");
    const [seciliUrun, setSeciliUrun] = useState(null);
    const [adetPanelAcik, setAdetPanelAcik] = useState(false);
    const [adet, setAdet] = useState(1);
    
    // ÜRÜN ARAMA - YENİ EKLENDİ
    const [urunArama, setUrunArama] = useState("");

    // SİPARİŞ YEMEK alanı
    const [siparisYemekFiyat, setSiparisYemekFiyat] = useState("");
    const [siparisYemekNot, setSiparisYemekNot] = useState("");

    // MÜŞTERİ / HESABA YAZ
    const [musteriler, setMusteriler] = useState([]);
    const [seciliMusteriId, setSeciliMusteriId] = useState(null);
    const [yeniMusteriAdSoyad, setYeniMusteriAdSoyad] = useState("");
    const [yeniMusteriTelefon, setYeniMusteriTelefon] = useState("");
    const [yeniMusteriNot, setYeniMusteriNot] = useState("");
    const [borcTutarInput, setBorcTutarInput] = useState("");
    const [hesabaYazModu, setHesabaYazModu] = useState(false);
    const [hesabaYazSonrasiMasaDon, setHesabaYazSonrasiMasaDon] = useState(false);

    // ÖDEME SÖZÜ POPUP
    const [odemeSozuPopup, setOdemeSozuPopup] = useState(null);

    // --------------------------------------------------
    // ÇOKLU HESABI AYIR (MULTIPLE SPLIT BILL) STATE'LERİ
    // --------------------------------------------------
    const [splitAdisyonlar, setSplitAdisyonlar] = useState([]); // ESKİ ADİSYONLAR (KİLİTLİ)
    const [splitAciklamaInput, setSplitAciklamaInput] = useState(""); // Yeni split için açıklama
    const [splitTutarInput, setSplitTutarInput] = useState(""); // Yeni split için manuel tutar girişi
    const [splitOranInput, setSplitOranInput] = useState(""); // Yeni split için oran girişi

    // --------------------------------------------------
    // SYNC SERVICE KONTROLÜ - YENİ EKLENDİ
    // --------------------------------------------------
    const [syncServiceReady, setSyncServiceReady] = useState(false);

    // --------------------------------------------------
    // BİLARDO MASASI ÖZEL DURUMU
    // --------------------------------------------------
    const [isBilardo, setIsBilardo] = useState(false);
    const [bilardoBaslangicSaat, setBilardoBaslangicSaat] = useState(null);
    const [bilardoSure, setBilardoSure] = useState("00:00");
    const [bilardoUcret, setBilardoUcret] = useState(0); // BİLARDO ÜCRETİ

    // --------------------------------------------------
    // BİLARDO TRANSFER DETAYLARI İÇİN YENİ STATE'LER
    // --------------------------------------------------
    const [bilardoTransferDetaylari, setBilardoTransferDetaylari] = useState(null);
    const [bilardoEkUrunler, setBilardoEkUrunler] = useState([]);

    // --------------------------------------------------
    // AUTH KONTROLÜ
    // --------------------------------------------------
    useEffect(() => {
        if (!loading && !user) {
            console.warn('⚠️ [AUTH] Adisyon sayfasına erişim reddedildi - Kullanıcı yok');
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    if (!user) {
        return <div>Yetkiniz yok. Yönlendiriliyorsunuz...</div>;
    }

    useEffect(() => {
        // SyncService kontrolü
        if (window.syncService && typeof window.syncService.masaBul === 'function') {
            setSyncServiceReady(true);
            console.log('✅ SyncService hazır');
        } else if (syncService && typeof syncService.masaBul === 'function') {
            window.syncService = syncService;
            setSyncServiceReady(true);
            console.log('✅ SyncService import edildi ve hazır');
        } else {
            console.warn('⚠️ SyncService hazır değil');
        }
    }, []);

    // --------------------------------------------------
    // LOCALSTORAGE YARDIMCI FONKSİYONLARI
    // --------------------------------------------------
    const okuJSON = (key, defaultValue) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return defaultValue;
            return JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    };

    const yazJSON = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // GERÇEK MASA NO'YU BUL - DÜZELTİLDİ
    const gercekMasaNoBul = (masaLabel) => {
        if (!masaLabel) return "1";

        console.log('🔍 Masa label analizi:', masaLabel);

        // "MASA 1" formatından sadece sayıyı al
        let bulunanNo = "1";

        if (typeof masaLabel === 'string') {
            // Eğer adisyon ID'si ise, adisyondan masa numarasını bul
            if (masaLabel.startsWith('ad_')) {
                const adisyonlar = okuJSON(ADISYON_KEY, []);
                const adisyon = adisyonlar.find(a => a.id === masaLabel);
                if (adisyon) {
                    // Adisyondan masa numarasını al
                    const adisyonMasaNo = adisyon.masaNum ||
                        (adisyon.masaNo ? adisyon.masaNo.replace('MASA ', '') : "1");
                    bulunanNo = adisyonMasaNo;
                    console.log('📌 Adisyon ID\'sinden masa bulundu:', { adisyonId: masaLabel, masaNo: bulunanNo });
                }
            } else {
                // Normal masa etiketinden sayıyı çıkar
                const numMatch = masaLabel.match(/\d+/);
                bulunanNo = numMatch ? numMatch[0] : "1";
            }
        } else if (typeof masaLabel === 'number') {
            bulunanNo = String(masaLabel);
        }

        // Bulunan no'nun geçerli bir masa olup olmadığını kontrol et
        const masalar = okuJSON(MASA_KEY, []);

        // Önce no ile eşleşen masa ara
        let masa = masalar.find(m =>
            m.no === bulunanNo ||
            m.id === Number(bulunanNo) ||
            m.masaNo === `MASA ${bulunanNo}` ||
            m.masaNum === bulunanNo
        );

        if (masa) {
            console.log('✅ Masa bulundu:', { aranan: bulunanNo, bulunan: masa.no });
            return masa.no;
        }

        // Eğer masa bulunamazsa, masaları kontrol et ve boş masa bul
        for (let i = 1; i <= 30; i++) {
            const masa = masalar.find(m => m.no === String(i) || m.id === i);
            if (masa && masa.durum === "BOŞ") {
                console.log('🔄 Boş masa bulundu:', i);
                return String(i);
            }
        }

        console.log('⚠️ Masa bulunamadı, varsayılan 1 kullanılıyor');
        return "1"; // Fallback
    };

    const odemeTipiLabel = (tip) => {
        switch (tip) {
            case "NAKIT":
                return "Nakit";
            case "KART":
                return "Kredi Kartı";
            case "HAVALE":
                return "Havale / EFT";
            case "HESABA_YAZ":
                return "Hesaba Yaz";
            default:
                return tip;
        }
    };

    // BİLARDO MASASI KONTROLÜ - GÜNCELLENDİ
    const isBilardoMasa = (masaStr) => {
        if (!masaStr) return false;

        // Eğer sayı ise string'e çevir
        const str = typeof masaStr === 'number' ? String(masaStr) : masaStr;

        const upper = str.toUpperCase();

        // "BİLARDO" içeren veya "B" ile başlayan masa numaraları
        // Ancak sadece "B" değil, "B1", "B2", "B3" gibi olmalı
        const isBilardoPrefix = upper.startsWith("B") && upper.length > 1;
        const containsBilardo = upper.includes("BİLARDO") || upper.includes("BILARDO");

        return containsBilardo || isBilardoPrefix;
    };

    // --------------------------------------------------
    // URL'DEN MASA NUMARASINI AL ve GERÇEK MASA NO'YU BUL - DÜZELTİLDİ
    // --------------------------------------------------
    useEffect(() => {
        const path = window.location.pathname; // /adisyon/ad_1765649913244
        const parts = path.split("/");
        const urlParam = parts[2] || "1";

        console.log('🔍 URL Analizi:', { path, parts, urlParam });

        // URL parametresini analiz et
        if (urlParam.startsWith('ad_')) {
            // Bu bir adisyon ID'si
            const adisyonlar = okuJSON(ADISYON_KEY, []);
            const adisyon = adisyonlar.find(a => a.id === urlParam);

            if (adisyon) {
                // Adisyondan masa numarasını al
                const masaLabel = adisyon.masaNo || adisyon.masaNum || "MASA 1";
                setMasaNo(masaLabel);

                // Gerçek masa numarasını bul
                const gercekNo = gercekMasaNoBul(urlParam); // Adisyon ID'sini gönder
                setGercekMasaNo(gercekNo);

                // Bilardo kontrolü
                const bilardoMi = isBilardoMasa(gercekNo);
                setIsBilardo(bilardoMi);

                console.log('✅ Adisyondan masa bulundu:', {
                    adisyonId: urlParam,
                    masaLabel,
                    gercekMasaNo: gercekNo,
                    isBilardo: bilardoMi
                });
            } else {
                // Adisyon bulunamazsa varsayılan değer
                setMasaNo("MASA 1");
                setGercekMasaNo("1");
                setIsBilardo(false);
                console.log('⚠️ Adisyon bulunamadı, varsayılan masa kullanılıyor');
            }
        } else {
            // Normal masa numarası (1, 2, 3, ... veya B1, B2)
            let masaLabel = `MASA ${urlParam}`;

            // Eğer bilardo masasıysa (B ile başlıyorsa)
            if (urlParam.startsWith('B') || urlParam.startsWith('b')) {
                masaLabel = `BİLARDO ${urlParam.toUpperCase()}`;
                setIsBilardo(true);
            } else {
                setIsBilardo(false);
            }

            setMasaNo(masaLabel);

            // Gerçek masa numarasını bul
            const gercekNo = gercekMasaNoBul(masaLabel);
            setGercekMasaNo(gercekNo);

            console.log('📌 Normal masa numarası:', {
                masaLabel,
                gercekMasaNo: gercekNo,
                isBilardo: isBilardoMasa(gercekNo)
            });
        }
    }, []);

    // --------------------------------------------------
    // ADİSYON YÜKLE (Yeni ve Eski) - ÇOKLU SPLIT İÇİN DÜZELTİLDİ
    // --------------------------------------------------
    useEffect(() => {
        if (!masaNo || !gercekMasaNo) return;

        console.log('🔄 Adisyon yükleniyor:', { masaNo, gercekMasaNo, isBilardo });

        // Bilardo masası için özel console log
        if (isBilardo) {
            console.log('🎱 Bilardo masası tespit edildi:', gercekMasaNo);

            // Masalar sayfasını güncelle (bilardo için)
            setTimeout(() => {
                if (window.syncService && window.syncService.senkronizeMasalar) {
                    console.log('🔄 Bilardo masaları için senkronizasyon yapılıyor...');
                    window.syncService.senkronizeMasalar();
                }
            }, 500);
        }

        const adisyonlar = okuJSON(ADISYON_KEY, []);

        // 1. Aktif Yeni Adisyonu Bul/Oluştur
        let yeniAdisyon = adisyonlar.find(
            (a) =>
                (a.masaNo === masaNo || a.masaNum === gercekMasaNo ||
                    (isBilardo && a.masaNo?.includes("BİLARDO"))) &&
                !a.kapali &&
                !a.isSplit
        );

        if (!yeniAdisyon) {
            yeniAdisyon = {
                id: `ad_${Date.now().toString()}`,
                masaNo: masaNo,
                masaNum: gercekMasaNo, // GERÇEK MASA NUMARASINI KAYDET
                acilisZamani: new Date().toISOString(),
                kapanisZamani: null,
                kalemler: [],
                odemeler: [],
                indirim: 0,
                hesabaYazKayitlari: [],
                kapali: false,
                isSplit: false, // Yeni adisyon
                parentAdisyonId: null,
                durum: "AÇIK",
                musteriAdi: null,
                toplamTutar: "0.00",
                guncellemeZamani: new Date().toISOString(),
                isBilardo: isBilardo // Bilardo masası mı?
            };

            // BİLARDO MASASI İSE BAŞLANGIÇ SAATİNİ KAYDET
            if (isBilardo) {
                const baslangic = new Date().toISOString();
                yeniAdisyon.bilardoBaslangic = baslangic;
                setBilardoBaslangicSaat(baslangic);

                // BİLARDO ÜCRETİNİ LOCALSTORAGE'DAN AL
                const bilardoUcreti = localStorage.getItem('mc_bilardo_ucret') || '0';
                setBilardoUcret(Number(bilardoUcreti));

                console.log('💰 Bilardo ücreti yüklendi:', bilardoUcreti);
            }

            adisyonlar.push(yeniAdisyon);
            yazJSON(ADISYON_KEY, adisyonlar);

            // SYNC SERVICE: Yeni adisyon için masa aç - GERÇEK MASA NO İLE
            if (syncServiceReady && window.syncService.masaAc) {
                console.log('🔄 SyncService.masaAc çağrılıyor:', { gercekMasaNo, adisyonId: yeniAdisyon.id, isBilardo });
                window.syncService.masaAc(gercekMasaNo, yeniAdisyon.id, null, isBilardo);
            }
        }

        // BİLARDO BAŞLANGIÇ SAATİNİ AYARLA
        if (isBilardo && yeniAdisyon && yeniAdisyon.bilardoBaslangic) {
            setBilardoBaslangicSaat(yeniAdisyon.bilardoBaslangic);

            // BİLARDO ÜCRETİNİ LOCALSTORAGE'DAN AL (eğer henüz yüklenmediyse)
            if (bilardoUcret === 0) {
                const bilardoUcreti = localStorage.getItem('mc_bilardo_ucret') || '0';
                setBilardoUcret(Number(bilardoUcreti));
                console.log('💰 Bilardo ücreti yüklendi:', bilardoUcreti);
            }
        }

        // BİLARDO TRANSFER DETAYLARINI KONTROL ET
        if (yeniAdisyon && yeniAdisyon.bilardoTransfer) {
            console.log('🎱 Bilardo transfer edilmiş adisyon tespit edildi:', yeniAdisyon);

            const transferDetaylari = {
                bilardoUcreti: yeniAdisyon.bilardoUcreti || 0,
                bilardoEkUrunToplam: yeniAdisyon.bilardoEkUrunToplam || 0,
                bilardoMasaNo: yeniAdisyon.bilardoMasaNo || '',
                bilardoSureTipi: yeniAdisyon.bilardoSureTipi || '',
                bilardoGecenDakika: yeniAdisyon.bilardoGecenDakika || 0,
                bilardoAcilisZamani: yeniAdisyon.bilardoAcilisZamani || null,
                transferTarihi: yeniAdisyon.transferTarihi || null
            };

            setBilardoTransferDetaylari(transferDetaylari);

            // BİLARDO EK ÜRÜNLERİ BUL
            const bilardoEkUrunler = (yeniAdisyon.kalemler || []).filter(k =>
                (k.tur === "EKTRA" || k.tur === "URUN") && k.bilardoTransfer === true
            );

            setBilardoEkUrunler(bilardoEkUrunler);

            console.log('📊 Bilardo transfer detayları yüklendi:', transferDetaylari);
        } else {
            // Bilardo transfer değilse state'leri temizle
            setBilardoTransferDetaylari(null);
            setBilardoEkUrunler([]);
        }

        setAdisyon(yeniAdisyon);

        // 2. Eski (Split) Adisyonları Bul (ÇOKLU SPLIT)
        const eskiAdisyonlar = adisyonlar.filter(
            (a) =>
                (a.masaNo === masaNo || a.masaNum === gercekMasaNo ||
                    (isBilardo && a.masaNo?.includes("BİLARDO"))) &&
                !a.kapali &&
                a.isSplit
        );
        setSplitAdisyonlar(eskiAdisyonlar || []);

        console.log('✅ Adisyon yüklendi:', {
            yeniAdisyonId: yeniAdisyon.id,
            splitAdisyonSayisi: eskiAdisyonlar.length,
            isBilardo,
            bilardoTransfer: yeniAdisyon.bilardoTransfer || false
        });
    }, [masaNo, gercekMasaNo, syncServiceReady, isBilardo]);

    // --------------------------------------------------
    // GEÇEN SÜRE HESAPLA (YENİ adisyon üzerinden)
    // --------------------------------------------------
    useEffect(() => {
        if (!adisyon || !adisyon.acilisZamani) return;

        const hesapla = () => {
            const acilis = new Date(adisyon.acilisZamani);
            const simdi = new Date();
            const diffMs = simdi - acilis;
            const dakika = Math.floor(diffMs / 60000);
            const saat = Math.floor(dakika / 60);
            const kalanDakika = dakika % 60;
            const sSaat = String(saat).padStart(2, "0");
            const sDakika = String(kalanDakika).padStart(2, "0");
            setGecenSure(`${sSaat}:${sDakika}`);

            // BİLARDO SÜRESİNİ HESAPLA
            if (isBilardo && bilardoBaslangicSaat) {
                const bilardoBaslangic = new Date(bilardoBaslangicSaat);
                const bilardoDiffMs = simdi - bilardoBaslangic;
                const bilardoDakika = Math.floor(bilardoDiffMs / 60000);
                const bilardoSaat = Math.floor(bilardoDakika / 60);
                const bilardoKalanDakika = bilardoDakika % 60;
                const sBilardoSaat = String(bilardoSaat).padStart(2, "0");
                const sBilardoDakika = String(bilardoKalanDakika).padStart(2, "0");
                setBilardoSure(`${sBilardoSaat}:${sBilardoDakika}`);

                // BİLARDO SÜRE BİTİMİ KONTROLÜ
                const bilardoSuresiDakika = Number(localStorage.getItem('mc_bilardo_suresi') || '60');
                if (bilardoDakika >= bilardoSuresiDakika) {
                    // Süre doldu, otomatik olarak bilardo ücretini ekle
                    otomatikBilardoUcretiEkle();
                }
            }
        };

        hesapla();
        const timer = setInterval(hesapla, 60000);
        return () => clearInterval(timer);
    }, [adisyon?.acilisZamani, isBilardo, bilardoBaslangicSaat]);

    // --------------------------------------------------
    // OTOMATİK BİLARDO ÜCRETİ EKLEME
    // --------------------------------------------------
    const otomatikBilardoUcretiEkle = () => {
        if (!isBilardo || !adisyon || bilardoUcret <= 0) return;

        // Eğer zaten bilardo ücreti eklenmişse tekrar ekleme
        const bilardoUcretiEkliMi = adisyon.kalemler.some(k =>
            k.urunAd === "BİLARDO ÜCRETİ" || k.urunAd.includes("BİLARDO")
        );

        if (bilardoUcretiEkliMi) return;

        console.log('⏰ Bilardo süresi doldu, ücret ekleniyor:', bilardoUcret);

        const yeniKalem = {
            id: `bilardo_${Date.now().toString()}`,
            urunId: "bilardo_ucret",
            urunAd: "BİLARDO ÜCRETİ",
            adet: 1,
            birimFiyat: bilardoUcret,
            toplam: bilardoUcret,
            isBilardo: true
        };

        const mevcutKalemler = [...(adisyon.kalemler || [])];
        mevcutKalemler.push(yeniKalem);

        const guncel = { ...adisyon, kalemler: mevcutKalemler };
        setAdisyon(guncel);
        guncelAdisyonLocal(guncel);

        // Masa güncelle
        guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);

        alert(`Bilardo süresi doldu! ${bilardoUcret} TL bilardo ücreti eklendi.`);
    };

    // --------------------------------------------------
    // MÜŞTERİ / BORÇ VERİLERİNİ YÜKLE - DÜZELTİLDİ: Müşterileri yükle
    // --------------------------------------------------
    useEffect(() => {
        const mList = okuJSON(MUSTERI_KEY, []);
        setMusteriler(Array.isArray(mList) ? mList : []);
    }, []);

    // --------------------------------------------------
    // HESABA YAZ MODU AÇ/KAPA - YENİ EKLENDİ
    // --------------------------------------------------
    useEffect(() => {
        // Hesaba Yaz butonuna tıklandığında modu aç
        if (aktifOdemeTipi === "HESABA_YAZ" && !hesabaYazModu) {
            console.log("🟢 HESABA_YAZ modu açılıyor!");
            setHesabaYazModu(true);
            setBorcTutarInput(String(kalan || 0)); // Varsayılan tutar = kalan
        }
    }, [aktifOdemeTipi, hesabaYazModu, kalan]);

    // --------------------------------------------------
    // ÖDEME SÖZÜ POPUP KONTROLÜ
    // --------------------------------------------------
    useEffect(() => {
        const kontrolEt = () => {
            const borclar = okuJSON(BORC_KEY, []);
            const musteriler = okuJSON(MUSTERI_KEY, []);

            const bugun = new Date();

            // Bugün veya geçmişte ödeme sözü verilen borçları kontrol et
            const hatirlatilacakBorclar = borclar.filter(b => {
                if (!b.odemeSozu || b.hatirlatildi) return false;

                const odemeSozuTarihi = new Date(b.odemeSozu);
                return odemeSozuTarihi <= bugun;
            });

            if (hatirlatilacakBorclar.length > 0) {
                const ilkBorc = hatirlatilacakBorclar[0];
                const musteri = musteriler.find(m => m.id === ilkBorc.musteriId);

                setOdemeSozuPopup({
                    borcId: ilkBorc.id,
                    musteriAd: musteri?.adSoyad || "Bilinmeyen Müşteri",
                    odemeSozu: new Date(ilkBorc.odemeSozu).toLocaleDateString('tr-TR'),
                    tutar: ilkBorc.tutar
                });
            }
        };

        // İlk kontrol
        kontrolEt();

        // Her 30 saniyede bir kontrol et
        const interval = setInterval(kontrolEt, 30000);

        return () => clearInterval(interval);
    }, []);

    // --------------------------------------------------
    // ADİSYON TOPLAM ve KALAN HESABI - ÇOKLU SPLIT İÇİN GÜNCELLENDİ
    // --------------------------------------------------
    useEffect(() => {
        // 1. YENİ adisyon toplamları
        const yeniSatirToplam = (adisyon?.kalemler || []).reduce(
            (sum, k) => sum + (Number(k.toplam) || 0),
            0
        );

        // BİLARDO ÜCRETİ EKLEME (EĞER HENÜZ EKLENMEDİYSE VE BİLARDO MASASI İSE)
        if (isBilardo && bilardoUcret > 0 && adisyon) {
            const bilardoUcretiEkliMi = adisyon.kalemler.some(k =>
                k.urunAd === "BİLARDO ÜCRETİ" || k.urunAd.includes("BİLARDO")
            );

            if (!bilardoUcretiEkliMi) {
                console.log('💰 Bilardo ücreti hesaplanıyor:', bilardoUcret);
            }
        }

        const yeniOdemelerToplam = (adisyon?.odemeler || []).reduce(
            (sum, o) => sum + (Number(o.tutar) || 0),
            0
        );
        const yeniIndirim = indirim || 0;

        // 2. ESKİ adisyonlar toplamları (ÇOKLU SPLIT)
        const eskiToplamlar = splitAdisyonlar.map(split => {
            return (split?.kalemler || []).reduce(
                (sum, k) => sum + (Number(k.toplam) || 0),
                0
            );
        });
        
        const eskiToplam = eskiToplamlar.reduce((sum, tutar) => sum + tutar, 0);

        // 3. TOPLAM değerler (YENİ + TÜM ESKİ SPLIT'LER)
        const toplamSatir = yeniSatirToplam + eskiToplam;
        const toplamOdemeler = yeniOdemelerToplam; // Sadece yeni adisyondaki ödemeler
        const toplamKalan = Math.max(toplamSatir - yeniIndirim - toplamOdemeler, 0);

        // ANA panelde gösterilecek toplam
        setToplam(toplamSatir);
        setKalan(toplamKalan);

        console.log('💰 Toplam Hesaplandı:', {
            toplamSatir,
            toplamKalan,
            yeniSatirToplam,
            eskiToplam,
            bilardoUcret,
            splitSayisi: splitAdisyonlar.length
        });

        // =============================
        // YENİ EKLENEN KOD: TOPLAM TUTARI MASALAR SAYFASI İÇİN KAYDET
        // =============================
        if (adisyon?.id && gercekMasaNo) {
            try {
                // 1. Ana adisyon toplamını localStorage'a kaydet
                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, yeniSatirToplam.toString());

                // 2. Split adisyonlar varsa, her birinin toplamını kaydet
                splitAdisyonlar.forEach((split, index) => {
                    const splitToplam = (split.kalemler || []).reduce(
                        (sum, k) => sum + (Number(k.toplam) || 0),
                        0
                    );
                    localStorage.setItem(`mc_adisyon_toplam_${split.id}`, splitToplam.toString());
                });

                // 3. Masa için toplam tutarı kaydet (ana + tüm split'ler)
                const masaToplamTutar = toplamSatir;
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());

                // 4. Masalar sayfasını güncellemek için event gönder
                window.dispatchEvent(new CustomEvent('adisyonGuncellendi', {
                    detail: {
                        masaNo: gercekMasaNo,
                        toplamTutar: masaToplamTutar,
                        adisyonId: adisyon.id,
                        splitAdisyonSayisi: splitAdisyonlar.length,
                        isBilardo: isBilardo
                    }
                }));

                console.log('✅ Toplam tutar kaydedildi:', {
                    masaNo: gercekMasaNo,
                    toplamTutar: masaToplamTutar,
                    adisyonId: adisyon.id,
                    splitSayisi: splitAdisyonlar.length,
                    isBilardo: isBilardo
                });

            } catch (error) {
                console.error('❌ Toplam tutar kaydedilemedi:', error);
            }
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================

    }, [adisyon, splitAdisyonlar, indirim, isBilardo, bilardoUcret]);

    // --------------------------------------------------
    // MENÜ ÜRÜNLERİNİ YÜKLE ve SIRALA
    // --------------------------------------------------
    useEffect(() => {
        const list = okuJSON(URUN_KEY, []);

        const fixed = (Array.isArray(list) ? list : []).map(u => ({
            ...u,
            kategori: u.kategori || u.categoryName || u.kategoriAd || u.Kategori || "GENEL",
            ad: u.ad || u.name || u.UrunAdi || "",
            satis: Number(u.satis || u.salePrice || u.Fiyat || 0)
        }));

        // KATEGORİLERE GÖRE GRUPLAMA ve ALFABETİK SIRALAMA
        const kategorilereGoreGrupla = () => {
            const gruplu = {};

            // Önce kategorilere göre grupla
            fixed.forEach((u) => {
                if (!gruplu[u.kategori]) {
                    gruplu[u.kategori] = [];
                }
                gruplu[u.kategori].push(u);
            });

            // Her kategori içindeki ürünleri alfabetik sırala
            Object.keys(gruplu).forEach(kategori => {
                gruplu[kategori].sort((a, b) =>
                    a.ad.localeCompare(b.ad, 'tr')
                );
            });

            return gruplu;
        };

        const grupluUrunler = kategorilereGoreGrupla();

        // Gruplu veriyi düzleştir (sıralı şekilde)
        const siraliUrunler = [];

        // Kategorileri alfabetik sırala
        const siraliKategoriler = Object.keys(grupluUrunler).sort((a, b) =>
            a.localeCompare(b, 'tr')
        );

        // Her kategori için ürünleri ekle
        siraliKategoriler.forEach(kategori => {
            siraliUrunler.push(...grupluUrunler[kategori]);
        });

        // BİLARDO MASASI İSE "BİLARDO" KATEGORİSİNDEKİ ÜRÜNLERİ ÖNE ÇIKAR
        if (isBilardo) {
            // Bilardo kategorisindeki ürünleri öne al
            siraliUrunler.sort((a, b) => {
                const aIsBilardo = a.kategori.toUpperCase().includes("BİLARDO") || a.kategori.toUpperCase().includes("BILARDO");
                const bIsBilardo = b.kategori.toUpperCase().includes("BİLARDO") || b.kategori.toUpperCase().includes("BILARDO");

                if (aIsBilardo && !bIsBilardo) return -1;
                if (!aIsBilardo && bIsBilardo) return 1;
                return 0;
            });
        }

        setUrunler(siraliUrunler);
    }, [adisyon, isBilardo]);

    const kategoriler = useMemo(() => {
        const set = new Set();
        urunler.forEach((u) => {
            if (u.kategori) set.add(u.kategori);
        });
        set.add("SİPARİŞ YEMEK");
        const arr = Array.from(set);
        return arr.sort((a, b) => a.localeCompare(b, "tr"));
    }, [urunler]);

    useEffect(() => {
        if (!aktifKategori && kategoriler.length > 0) {
            setAktifKategori(kategoriler[0]);
        }
    }, [kategoriler, aktifKategori]);

    // --------------------------------------------------
    // ARANAN ÜRÜNLERİ FİLTRELE - TÜM KATEGORİLERDE ARAMA
    // --------------------------------------------------
    const filtreliUrunler = useMemo(() => {
        // Tüm kategorilerde arama yap
        if (urunArama.trim() !== "") {
            const aramaTerimi = urunArama.toLowerCase();
            
            // Tüm ürünlerde arama yap
            let tumUrunlerArama = urunler.filter((u) =>
                u.ad.toLowerCase().includes(aramaTerimi)
            );
            
            // SİPARİŞ YEMEK özel durumu
            if (aramaTerimi.includes("sipariş") || aramaTerimi.includes("yemek")) {
                tumUrunlerArama.unshift({
                    id: "siparis-yemek",
                    ad: "SİPARİŞ YEMEK",
                    kategori: "SİPARİŞ YEMEK",
                    satis: 0
                });
            }
            
            return tumUrunlerArama;
        }
        
        // Arama yoksa, aktif kategorideki ürünleri göster
        if (!aktifKategori) return [];
        
        if (aktifKategori === "SİPARİŞ YEMEK") {
            return [
                {
                    id: "siparis-yemek",
                    ad: "SİPARİŞ YEMEK",
                    kategori: "SİPARİŞ YEMEK",
                    satis: 0
                },
            ];
        }
        
        // Aktif kategorideki ürünleri göster
        return urunler.filter((u) => u.kategori === aktifKategori);
    }, [urunler, aktifKategori, urunArama]);

    // --------------------------------------------------
    // ADET PANEL EKLE FONKSİYONU - EKLENDİ
    // --------------------------------------------------
    const adetPanelEkle = () => {
        if (!adisyon || !seciliUrun) return;

        if (seciliUrun.id === "siparis-yemek") {
            const fiyat = Number(siparisYemekFiyat);
            if (!fiyat || fiyat <= 0) {
                alert("Geçerli bir fiyat giriniz.");
                return;
            }

            const yeniKalem = {
                id: `kalem_${Date.now().toString()}`,
                urunId: "siparis-yemek",
                urunAd: "SİPARİŞ YEMEK",
                adet: adet,
                birimFiyat: fiyat,
                toplam: fiyat * adet,
                not: siparisYemekNot
            };

            const mevcutKalemler = [...(adisyon.kalemler || [])];
            mevcutKalemler.push(yeniKalem);

            const guncel = { ...adisyon, kalemler: mevcutKalemler };
            setAdisyon(guncel);
            guncelAdisyonLocal(guncel);

            // Masa güncelle - Bilardo kontrolü ile
            guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);

            // =============================
            // YENİ EKLENEN KOD: Sipariş yemek eklendiğinde masalar sayfasını güncelle
            // =============================
            if (gercekMasaNo && adisyon.id) {
                setTimeout(() => {
                    const toplamTutar = (guncel.kalemler || []).reduce(
                        (sum, k) => sum + (Number(k.toplam) || 0),
                        0
                    );
                    const eskiToplam = splitAdisyonlar.reduce(
                        (sum, split) => sum + ((split?.kalemler || []).reduce(
                            (s, k) => s + (Number(k.toplam) || 0),
                            0
                        )),
                        0
                    );
                    const masaToplamTutar = toplamTutar + eskiToplam;

                    localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                    localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                    window.dispatchEvent(new Event('adisyonGuncellendi'));
                }, 100);
            }
            // =============================
            // YENİ EKLENEN KOD SONU
            // =============================
        }

        setAdetPanelAcik(false);
        setSeciliUrun(null);
        setSiparisYemekFiyat("");
        setSiparisYemekNot("");
    };

    // --------------------------------------------------
    // ADİSYONA ÜRÜN EKLEME - SYNC SERVICE ENTEGRASYONLU
    // --------------------------------------------------
    const guncelAdisyonLocal = (yeniAdisyon) => {
        const adisyonlar = okuJSON(ADISYON_KEY, []);
        const idx = adisyonlar.findIndex((a) => a.id === yeniAdisyon.id);
        if (idx === -1) {
            adisyonlar.push(yeniAdisyon);
        } else {
            adisyonlar[idx] = yeniAdisyon;
        }
        yazJSON(ADISYON_KEY, adisyonlar);

        // =============================
        // YENİ EKLENEN KOD: Kalem eklendiğinde masalar sayfasını güncelle
        // =============================
        if (yeniAdisyon?.id && gercekMasaNo) {
            // Toplam tutarı hesapla
            const toplamTutar = (yeniAdisyon.kalemler || []).reduce(
                (sum, k) => sum + (Number(k.toplam) || 0),
                0
            );

            // Eski adisyon toplamını da ekle
            const eskiToplam = splitAdisyonlar.reduce(
                (sum, split) => sum + ((split?.kalemler || []).reduce(
                    (s, k) => s + (Number(k.toplam) || 0),
                    0
                )),
                0
            );

            const masaToplamTutar = toplamTutar + eskiToplam;

            // LocalStorage'a kaydet
            localStorage.setItem(`mc_adisyon_toplam_${yeniAdisyon.id}`, toplamTutar.toString());
            localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());

            // Masalar sayfasını güncelle
            window.dispatchEvent(new Event('adisyonGuncellendi'));
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    const uruneTiklandi = (urun) => {
        // Sadece YENİ adisyona ürün ekleyebiliriz
        if (!adisyon) {
            alert("Adisyon bulunamadı.");
            return;
        }

        if (urun.kategori === "SİPARİŞ YEMEK") {
            setSeciliUrun(urun);
            setSiparisYemekFiyat("");
            setSiparisYemekNot("");
            setAdet(1);
            setAdetPanelAcik(true);
            return;
        }

        // SYNC SERVICE ile kalem ekleme
        if (syncServiceReady && window.syncService.kalemEkleVeToplamGuncelle) {
            console.log('➕ SyncService ile kalem ekleniyor:', urun.ad);
            console.log('📌 Masa Bilgisi:', { gercekMasaNo, adisyonId: adisyon.id, isBilardo });

            const kalemData = {
                urunId: urun.id,
                urunAdi: urun.ad,
                birimFiyat: Number(urun.satis || 0),
                miktar: 1,
                isBilardo: isBilardo
            };

            // TOPLAM TUTARI HESAPLA VE GÖNDER
            const mevcutKalemler = [...(adisyon.kalemler || [])];
            const index = mevcutKalemler.findIndex(
                (k) => k.urunId === urun.id && Number(k.birimFiyat) === Number(urun.satis || 0)
            );

            let yeniToplam = 0;
            if (index === -1) {
                yeniToplam = Number(urun.satis || 0);
            } else {
                const kalem = { ...mevcutKalemler[index] };
                yeniToplam = (kalem.adet + 1) * kalem.birimFiyat;
            }

            const success = window.syncService.kalemEkleVeToplamGuncelle(
                adisyon.id,
                kalemData,
                yeniToplam,
                isBilardo, // Bilardo bilgisini gönder
                gercekMasaNo // Gerçek masa numarasını da gönder
            );

            if (success) {
                console.log('✅ SyncService ile kalem eklendi');
                // Adisyonu güncelle
                setTimeout(() => {
                    const adisyonlar = okuJSON(ADISYON_KEY, []);
                    const updatedAdisyon = adisyonlar.find(a => a.id === adisyon.id);
                    if (updatedAdisyon) {
                        setAdisyon(updatedAdisyon);
                    }
                }, 100);
                return;
            } else {
                console.warn('⚠️ SyncService kalem ekleme başarısız, manuel ekleniyor');
            }
        }

        // MANUEL ekleme (fallback)
        const mevcutKalemler = [...(adisyon.kalemler || [])];
        const index = mevcutKalemler.findIndex(
            (k) =>
                k.urunId === urun.id &&
                Number(k.birimFiyat) === Number(urun.satis || 0)
        );

        if (index === -1) {
            const yeniKalem = {
                id: Date.now().toString(),
                urunId: urun.id,
                urunAd: urun.ad,
                adet: 1,
                birimFiyat: Number(urun.satis || 0),
                toplam: Number(urun.satis || 0),
                isBilardo: isBilardo // Bilardo ürünü mü?
            };
            mevcutKalemler.push(yeniKalem);
        } else {
            const kalem = { ...mevcutKalemler[index] };
            kalem.adet += 1;
            kalem.toplam = kalem.adet * kalem.birimFiyat;
            mevcutKalemler[index] = kalem;
        }

        const guncel = { ...adisyon, kalemler: mevcutKalemler };
        setAdisyon(guncel);
        guncelAdisyonLocal(guncel);

        // Masa güncellemesini yap - GERÇEK MASA NO İLE
        console.log('🔄 Manuel masa güncellemesi:', { gercekMasaNo, adisyonId: adisyon.id, isBilardo });
        guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);
    };

    // MASA BİLGİSİNİ GÜNCELLEYEN FONKSİYON - SYNC SERVICE ENTEGRASYONLU (GÜNCELLENDİ)
    const guncelMasaLocal = (masaNum, anaAdisyonId, splitAdisyonList, isBilardoMasa = false) => {
        // GERÇEK MASA NO'YU KULLAN
        const gercekMasaNoToUse = masaNum;

        console.log('🔄 Masa güncelleniyor:', {
            gercekMasaNo: gercekMasaNoToUse,
            anaAdisyonId,
            splitAdisyonSayisi: splitAdisyonList.length,
            isBilardo: isBilardoMasa,
            currentGercekMasaNo: gercekMasaNo // State'deki değer
        });

        // Toplam tutarı hesapla
        const yeniToplam = (adisyon?.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        const eskiToplam = splitAdisyonList.reduce(
            (sum, split) => sum + ((split?.kalemler || []).reduce(
                (s, k) => s + (Number(k.toplam) || 0),
                0
            )),
            0
        );
        const toplamTutar = yeniToplam + eskiToplam;

        console.log('💰 Toplam Tutar Hesaplandı:', { yeniToplam, eskiToplam, toplamTutar: toplamTutar.toFixed(2) });

        // SYNC SERVICE KULLAN - NORMALIZE ET
        if (syncServiceReady && window.syncService.guncelMasa) {
            console.log('🔄 SyncService ile masa güncelleniyor:', gercekMasaNoToUse);

            // SyncService'e toplam tutarı da gönder
            window.syncService.guncelMasa(gercekMasaNoToUse, anaAdisyonId, splitAdisyonList, toplamTutar.toFixed(2), isBilardoMasa);
            return;
        }

        // FALLBACK: Manuel güncelleme - DETAYLI MASALAR GÜNCELLEMESİ
        let masalar = okuJSON(MASA_KEY, []);

        // Bilardo masaları için farklı filtreleme
        let masaIdx = -1;
        if (isBilardoMasa) {
            // Bilardo masası için "BİLARDO" veya "B" ile başlayan masa ara
            masaIdx = masalar.findIndex((m) =>
                m.no === gercekMasaNoToUse ||
                m.masaNo?.toUpperCase().includes("BİLARDO") ||
                m.masaNo?.toUpperCase().startsWith("B") ||
                m.masaNum?.toUpperCase().includes("B")
            );
        } else {
            // Normal masa için sayısal masa ara
            const masaNoNum = Number(gercekMasaNoToUse);
            masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);
        }

        if (masaIdx !== -1) {
            const masaAdi = isBilardoMasa ? `BİLARDO ${gercekMasaNoToUse}` : `MASA ${gercekMasaNoToUse}`;

            // Split adisyon ID'lerini topla
            const splitAdisyonIds = splitAdisyonList.map(split => split.id).filter(Boolean);
            
            masalar[masaIdx] = {
                ...masalar[masaIdx],
                masaNo: masaAdi,
                masaNum: gercekMasaNoToUse,
                adisyonId: anaAdisyonId,
                splitAdisyonIds: splitAdisyonIds.length > 0 ? splitAdisyonIds : null,
                splitAdisyonSayisi: splitAdisyonList.length,
                toplamTutar: toplamTutar.toFixed(2), // MASALAR SAYFASINDA GÖRÜNECEK TUTAR
                durum: "DOLU", // DOLU OLARAK İŞARETLE
                renk: "red", // KIRMIZI RENK
                acilisZamani: adisyon?.acilisZamani || new Date().toISOString(),
                guncellemeZamani: new Date().toISOString(),
                isBilardo: isBilardoMasa // Bilardo masası mı?
            };
            yazJSON(MASA_KEY, masalar);

            // Storage event'ini tetikle - MASALAR SAYFASININ GÜNCELLENMESİ İÇİN
            window.dispatchEvent(new StorageEvent('storage', {
                key: MASA_KEY,
                newValue: JSON.stringify(masalar)
            }));

            console.log('✅ Manuel masa güncelleme başarılı - Toplam Tutar:', toplamTutar.toFixed(2));
        }
    };

    // --------------------------------------------------
    // SATIR SİLME ve ADET ARTIR/AZALT
    // --------------------------------------------------
    const satirSil = (kalemId) => {
        if (!adisyon) return;
        if (!window.confirm("Bu satırı silmek istediğinize emin misiniz?")) return;

        const yeniKalemler = (adisyon.kalemler || []).filter(
            (k) => k.id !== kalemId
        );
        const guncel = { ...adisyon, kalemler: yeniKalemler };
        setAdisyon(guncel);
        guncelAdisyonLocal(guncel);

        // Masa güncellemesini yap - GERÇEK MASA NO İLE
        guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);

        // =============================
        // YENİ EKLENEN KOD: Satır silindiğinde masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncel.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    const adetArtir = (kalemId) => {
        if (!adisyon) return;

        const yeniKalemler = (adisyon.kalemler || []).map((k) => {
            if (k.id !== kalemId) return k;
            const yeniAdet = Number(k.adet || 0) + 1;
            return {
                ...k,
                adet: yeniAdet,
                toplam: yeniAdet * Number(k.birimFiyat || 0),
            };
        });
        const guncel = { ...adisyon, kalemler: yeniKalemler };

        setAdisyon(guncel);
        guncelAdisyonLocal(guncel);

        // Masa güncellemesini yap - GERÇEK MASA NO İLE
        guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);

        // =============================
        // YENİ EKLENEN KOD: Adet artırıldığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncel.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    const adetAzalt = (kalemId) => {
        if (!adisyon) return;

        const mevcutKalemler = adisyon.kalemler || [];
        const yeniKalemler = mevcutKalemler
            .map((k) => {
                if (k.id !== kalemId) return k;
                const yeniAdet = Number(k.adet || 0) - 1;
                if (yeniAdet <= 0) {
                    return null;
                }
                return {
                    ...k,
                    adet: yeniAdet,
                    toplam: yeniAdet * Number(k.birimFiyat || 0),
                };
            })
            .filter(Boolean);

        const guncel = { ...adisyon, kalemler: yeniKalemler };
        setAdisyon(guncel);
        guncelAdisyonLocal(guncel);

        // Masa güncellemesini yap - GERÇEK MASA NO İLE
        guncelMasaLocal(gercekMasaNo, adisyon.id, splitAdisyonlar, isBilardo);

        // =============================
        // YENİ EKLENEN KOD: Adet azaltıldığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncel.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // İNDİRİM - DÜZELTİLDİ (SADECE YENİ ADİSYON)
    // --------------------------------------------------
    const indirimEnter = (e) => {
        if (e.key !== "Enter") return;

        const val = Number(indirimInput);
        if (isNaN(val) || val < 0) {
            alert("Geçerli bir indirim tutarı giriniz.");
            return;
        }

        // İndirim sadece YENİ adisyona uygulanır
        const guncel = { ...adisyon, indirim: val };
        setAdisyon(guncel);
        setIndirim(val);
        guncelAdisyonLocal(guncel);

        setIndirimInput(""); // Input'u temizle

        // =============================
        // YENİ EKLENEN KOD: İndirim uygulandığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncel.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // ÖDEME SİLME (SADECE YENİ ADİSYON)
    // --------------------------------------------------
    const odemeSil = (odemeId) => {
        if (!adisyon) return;
        if (!window.confirm("Bu ödemeyi silmek istediğinize emin misiniz?")) return;

        const yeniOdemeler = (adisyon.odemeler || []).filter((o) => o.id !== odemeId);
        const yeniAdisyon = {
            ...adisyon,
            odemeler: yeniOdemeler,
        };

        setAdisyon(yeniAdisyon);
        guncelAdisyonLocal(yeniAdisyon);

        // =============================
        // YENİ EKLENEN KOD: Ödeme silindiğinde masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (yeniAdisyon.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // İNDİRİM SIFIRLAMA - DÜZELTİLDİ
    // --------------------------------------------------
    const indirimSifirla = () => {
        const guncel = { ...adisyon, indirim: 0 };
        setAdisyon(guncel);
        setIndirim(0);
        setIndirimInput("");
        guncelAdisyonLocal(guncel);

        // =============================
        // YENİ EKLENEN KOD: İndirim sıfırlandığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncel.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // HESABA YAZ ÖZETİ (Secili müşteri için) - GÜNCELLENDİ
    // --------------------------------------------------
    const mevcutBorcOzet = useMemo(() => {
        if (!seciliMusteriId) return { toplamBorc: 0, toplamOdeme: 0, kalan: 0 };
        const borclar = okuJSON(BORC_KEY, []);
        const musteriBorclari = borclar.filter((b) => b.musteriId === seciliMusteriId);

        const toplamBorc = musteriBorclari.reduce((sum, b) =>
            sum + (b.hareketler?.filter(h => h.tip === "BORÇ EKLENDİ").reduce((s, h) => s + (h.tutar || 0), 0) || 0)
            , 0);

        const toplamOdeme = musteriBorclari.reduce((sum, b) =>
            sum + (b.hareketler?.filter(h => h.tip === "ÖDEME ALINDI").reduce((s, h) => s + (h.tutar || 0), 0) || 0)
            , 0);

        return {
            toplamBorc: toplamBorc,
            toplamOdeme: toplamOdeme,
            kalan: toplamBorc - toplamOdeme,
        };
    }, [seciliMusteriId, hesabaYazModu, borcTutarInput]);

    // --------------------------------------------------
    // ÖDEME EKLEME - GÜNCELLENDİ (Hesaba Yaz kontrolü düzeltildi)
    // --------------------------------------------------
    const odemeEkle = () => {
        // Ödeme her zaman YENİ adisyona eklenir
        if (!adisyon) return;

        // Eğer Hesaba Yaz modu açıksa, bu fonksiyon çağrılmamalı
        if (aktifOdemeTipi === "HESABA_YAZ" && hesabaYazModu) {
            console.log("🟢 HESABA_YAZ modu zaten açık, odemeEkle çağrılmamalı!");
            return;
        }

        let tutar = Number(odemeInput);
        if (!tutar || tutar <= 0) {
            // Ödeme input boşsa, kalan tutarın tamamını öde
            tutar = kalan;
        }

        if (tutar <= 0) {
            alert("Ödeme yapılacak tutar yok.");
            return;
        }

        const yeniOdeme = {
            id: Date.now().toString(),
            tip: aktifOdemeTipi,
            tutar,
        };

        const yeniAdisyon = {
            ...adisyon,
            odemeler: [...(adisyon.odemeler || []), yeniOdeme],
        };

        setAdisyon(yeniAdisyon);
        guncelAdisyonLocal(yeniAdisyon);
        setOdemeInput("");

        // =============================
        // YENİ EKLENEN KOD: Ödeme eklendiğinde masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (yeniAdisyon.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // HESABA YAZ KAYDET (SADECE YENİ ADİSYON) - GÜNCELLENDİ
    // --------------------------------------------------
    const hesabaYazKaydet = () => {
        if (!adisyon) return;

        let borcTutar = Number(borcTutarInput);
        if (!borcTutar || borcTutar <= 0) {
            alert("Borç tutarı giriniz.");
            return;
        }

        // TUTAR KONTROLÜ: Girilen tutar kalan tutardan fazla olamaz
        if (borcTutar > kalan) {
            alert(`Borç tutarı kalan tutardan (${kalan.toFixed(2)} TL) fazla olamaz!`);
            return;
        }

        let guncelMusteriler = [...musteriler];
        let musteriId = seciliMusteriId;

        // YENİ MÜŞTERİ KONTROLÜ - DÜZELTİLDİ
        if (!musteriId) {
            if (!yeniMusteriAdSoyad.trim()) {
                alert("Yeni müşteri için Ad Soyad giriniz.");
                return;
            }

            if (!yeniMusteriTelefon.trim()) {
                alert("Yeni müşteri için Telefon numarası giriniz.");
                return;
            }

            // Telefon numarası benzersiz kontrolü
            const existingCustomer = guncelMusteriler.find(c =>
                c.telefon === yeniMusteriTelefon.trim()
            );

            if (existingCustomer) {
                alert("Bu telefon numarası zaten kayıtlı!");
                // Otomatik olarak mevcut müşteriyi seç
                setSeciliMusteriId(existingCustomer.id);
                musteriId = existingCustomer.id;
            } else {
                const yeniId = `cust_${Date.now().toString()}`;
                const yeniMusteri = {
                    id: yeniId,
                    adSoyad: yeniMusteriAdSoyad.trim(),
                    telefon: yeniMusteriTelefon.trim(),
                    not: yeniMusteriNot.trim(),
                    created_at: new Date().toISOString(),
                    total_debt: borcTutar
                };
                guncelMusteriler.push(yeniMusteri);
                musteriId = yeniId;
                setSeciliMusteriId(yeniId);
            }
        }

        // ADİSYON_KEY'E DE MÜŞTERİ ID'SİNİ KAYDET (ÖNEMLİ!)
        const adisyonlar = okuJSON(ADISYON_KEY, []);
        const adisyonIndex = adisyonlar.findIndex(a => a.id === adisyon.id);

        if (adisyonIndex !== -1) {
            // Adisyona müşteri ID'sini ve borç bilgisini ekle
            adisyonlar[adisyonIndex] = {
                ...adisyonlar[adisyonIndex],
                musteriId: musteriId,
                hesabaYazilanTutar: borcTutar,
                musteriAdi: musteriId ?
                    (guncelMusteriler.find(m => m.id === musteriId)?.adSoyad || "Yeni Müşteri")
                    : yeniMusteriAdSoyad.trim(),
                tarih: new Date().toISOString() // Tarihi de kaydet
            };
            yazJSON(ADISYON_KEY, adisyonlar);
        }

        // BORÇ KAYDI OLUŞTUR
        const borclar = okuJSON(BORC_KEY, []);
        const yeniBorc = {
            id: `borc_${Date.now().toString()}`,
            musteriId,
            masaNo: isBilardo ? `BİLARDO ${gercekMasaNo}` : `MASA ${gercekMasaNo}`,
            masaNum: gercekMasaNo, // GERÇEK MASA NUMARASINI KAYDET
            adisyonId: adisyon.id, // Yeni adisyon ID'si
            tutar: borcTutar,
            acilisZamani: new Date().toISOString(),
            kapanisZamani: null,
            odemeSozu: null,
            hatirlatildi: false,
            hareketler: [
                {
                    tip: "BORÇ EKLENDİ",
                    tutar: borcTutar,
                    tarih: new Date().toISOString(),
                    aciklama: `Hesaba Yaz - ${isBilardo ? 'Bilardo' : 'Masa'} ${gercekMasaNo} (Adisyon: ${adisyon.id})`,
                },
            ],
            remainingAmount: borcTutar, // Kalan ödenecek tutar
            isCollected: false,
            collectedAmount: 0,
            urunler: adisyon?.kalemler || [] // ADİSYON İÇERİĞİNİ KAYDET (ÖNEMLİ!)
        };
        borclar.push(yeniBorc);
        yazJSON(BORC_KEY, borclar);

        // ÖDEME KAYDI OLUŞTUR (Sadece adisyon içinde)
        const yeniOdeme = {
            id: `hy_${Date.now().toString()}`,
            tip: "HESABA_YAZ",
            tutar: borcTutar,
        };

        const guncelAdisyon = {
            ...adisyon,
            hesabaYazKayitlari: [
                ...(adisyon.hesabaYazKayitlari || []),
                { borcId: yeniBorc.id, musteriId },
            ],
            odemeler: [...(adisyon.odemeler || []), yeniOdeme],
        };

        setAdisyon(guncelAdisyon);
        guncelAdisyonLocal(guncelAdisyon);

        // MÜŞTERİYİ GÜNCELLE
        if (musteriId) {
            const updatedCustomers = guncelMusteriler.map(c => {
                if (c.id === musteriId) {
                    return {
                        ...c,
                        total_debt: (c.total_debt || 0) + borcTutar,
                        debt: (c.debt || 0) + borcTutar
                    };
                }
                return c;
            });

            yazJSON(MUSTERI_KEY, updatedCustomers);
            setMusteriler(updatedCustomers);
        }

        alert(`Borç kaydedildi! ${borcTutar.toFixed(2)} TL müşteri hesabına yazıldı.\nAdisyon kapatılmadı - kalan: ${(kalan - borcTutar).toFixed(2)} TL`);

        // HESABA YAZ MODUNU KAPAT
        setHesabaYazModu(false);
        setAktifOdemeTipi("NAKIT"); // Ödeme tipini sıfırla
        setHesabaYazSonrasiMasaDon(true);

        // FORM ALANLARINI TEMİZLE
        setSeciliMusteriId(null);
        setYeniMusteriAdSoyad("");
        setYeniMusteriTelefon("");
        setYeniMusteriNot("");
        setBorcTutarInput("");

        // MÜŞTERİ İŞLEMLERİ SAYFASINI GÜNCELLE
        setTimeout(() => {
            window.dispatchEvent(new Event('musteriBorclariGuncellendi'));
        }, 100);

        // =============================
        // YENİ EKLENEN KOD: Hesaba yaz kaydedildiğinde masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo && adisyon.id) {
            setTimeout(() => {
                const toplamTutar = (guncelAdisyon.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const masaToplamTutar = toplamTutar + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${adisyon.id}`, toplamTutar.toString());
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // HESABA YAZ İPTAL - YENİ EKLENDİ
    // --------------------------------------------------
    const hesabaYazIptal = () => {
        setHesabaYazModu(false);
        setAktifOdemeTipi("NAKIT"); // Ödeme tipini sıfırla
        setSeciliMusteriId(null);
        setYeniMusteriAdSoyad("");
        setYeniMusteriTelefon("");
        setYeniMusteriNot("");
        setBorcTutarInput("");
        console.log("🔴 HESABA_YAZ modu iptal edildi!");
    };

    // --------------------------------------------------
    // ÇOKLU HESABI AYIR (ÇOKLU SPLIT BILL) - YENİ MANTIK
    // --------------------------------------------------
    const hesabiAyir = () => {
        // Eğer adisyon boşsa, hiçbir şey yapma
        if (!adisyon || (adisyon.kalemler || []).length === 0) {
            alert("Adisyonda ürün yok!");
            return;
        }

        // Açıklama kontrolü
        if (!splitAciklamaInput.trim()) {
            alert("Lütfen hesap ayırma işlemi için bir açıklama giriniz (Örn: 'Kişi1', 'Çocuklar', 'Özel Hesap' vb.)");
            return;
        }

        // Mevcut adisyonu ESKİ adisyon olarak kaydet (KİLİTLİ)
        const eskiAdisyon = {
            ...adisyon,
            id: adisyon.id,
            isSplit: true, // Artık ESKİ adisyon
            durum: "KİLİTLİ",
            splitAciklama: splitAciklamaInput.trim(), // Açıklama kaydet
            splitTarihi: new Date().toISOString(),
            splitIndex: splitAdisyonlar.length // Hangi sırada ayrıldığını kaydet
        };

        // YENİ bir adisyon oluştur
        const yeniAdisyon = {
            id: `ad_${Date.now().toString()}`,
            masaNo: isBilardo ? `BİLARDO ${gercekMasaNo}` : `MASA ${gercekMasaNo}`,
            masaNum: gercekMasaNo, // GERÇEK MASA NUMARASINI KAYDET
            acilisZamani: new Date().toISOString(),
            kapanisZamani: null,
            kalemler: [], // Boş başlar
            odemeler: [], // Ödeme geçmişi sıfırlanır
            indirim: 0,
            hesabaYazKayitlari: [],
            kapali: false,
            isSplit: false, // Yeni adisyon
            parentAdisyonId: eskiAdisyon.id, // Eski adisyonun ID'sini referans alır
            durum: "AÇIK",
            isBilardo: isBilardo // Bilardo masası mı?
        };

        // 1. Eski adisyonu split listesine ekle
        const yeniSplitList = [...splitAdisyonlar, eskiAdisyon];
        setSplitAdisyonlar(yeniSplitList);

        // 2. Yeni adisyonu aktif adisyon olarak ayarla
        setAdisyon(yeniAdisyon);
        setIndirim(0); // Yeni adisyon için indirimi sıfırla
        setIndirimInput("");
        setSplitAciklamaInput(""); // Açıklama alanını temizle
        setSplitTutarInput(""); // Tutar alanını temizle
        setSplitOranInput(""); // Oran alanını temizle

        // 3. LocalStorage'ı güncelle
        let adisyonlar = okuJSON(ADISYON_KEY, []);

        // Eski adisyonu güncelle
        const eskiIdx = adisyonlar.findIndex(a => a.id === eskiAdisyon.id);
        if (eskiIdx !== -1) {
            adisyonlar[eskiIdx] = eskiAdisyon;
        }

        // Yeni adisyonu ekle
        adisyonlar.push(yeniAdisyon);
        yazJSON(ADISYON_KEY, adisyonlar);

        // 4. Masa kaydını güncelle - GERÇEK MASA NO İLE
        guncelMasaLocal(gercekMasaNo, yeniAdisyon.id, yeniSplitList, isBilardo);

        // =============================
        // YENİ EKLENEN KOD: Hesap ayrıldığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo) {
            setTimeout(() => {
                const yeniToplam = (yeniAdisyon.kalemler || []).reduce(
                    (sum, k) => sum + (Number(k.toplam) || 0),
                    0
                );
                const eskiToplamlar = yeniSplitList.map(split => 
                    (split.kalemler || []).reduce(
                        (sum, k) => sum + (Number(k.toplam) || 0),
                        0
                    )
                );
                const eskiToplam = eskiToplamlar.reduce((sum, tutar) => sum + tutar, 0);
                const masaToplamTutar = yeniToplam + eskiToplam;

                localStorage.setItem(`mc_adisyon_toplam_${yeniAdisyon.id}`, yeniToplam.toString());
                
                // Tüm split adisyonların toplamını kaydet
                yeniSplitList.forEach((split, index) => {
                    const splitToplam = (split.kalemler || []).reduce(
                        (sum, k) => sum + (Number(k.toplam) || 0),
                        0
                    );
                    localStorage.setItem(`mc_adisyon_toplam_${split.id}`, splitToplam.toString());
                });
                
                localStorage.setItem(`mc_masa_toplam_${gercekMasaNo}`, masaToplamTutar.toString());
                window.dispatchEvent(new Event('adisyonGuncellendi'));
                
                alert(`✅ Hesap başarıyla ayrıldı!\nAçıklama: "${splitAciklamaInput.trim()}"\nToplam ${yeniSplitList.length} adet ayrılmış hesap mevcut.`);
            }, 100);
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // SPLİT ADİSYON SİLME
    // --------------------------------------------------
    const splitAdisyonSil = (splitId) => {
        if (!window.confirm("Bu ayrılmış hesabı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            return;
        }

        const yeniSplitList = splitAdisyonlar.filter(split => split.id !== splitId);
        setSplitAdisyonlar(yeniSplitList);

        // LocalStorage'dan da sil
        const adisyonlar = okuJSON(ADISYON_KEY, []);
        const guncelAdisyonlar = adisyonlar.filter(a => a.id !== splitId);
        yazJSON(ADISYON_KEY, guncelAdisyonlar);

        // Masa kaydını güncelle
        guncelMasaLocal(gercekMasaNo, adisyon.id, yeniSplitList, isBilardo);

        alert("Ayrılmış hesap silindi.");
    };

    // --------------------------------------------------
    // ÖDEME SÖZÜ POPUP KAPAT
    // --------------------------------------------------
    const odemeSozuPopupKapat = () => {
        if (!odemeSozuPopup) return;

        // Borç kaydını güncelle - hatırlatıldı olarak işaretle
        const borclar = okuJSON(BORC_KEY, []);
        const borcIndex = borclar.findIndex(b => b.id === odemeSozuPopup.borcId);

        if (borcIndex !== -1) {
            borclar[borcIndex] = {
                ...borclar[borcIndex],
                hatirlatildi: true,
                guncellemeZamani: new Date().toISOString()
            };
            yazJSON(BORC_KEY, borclar);
        }

        setOdemeSozuPopup(null);

        // =============================
        // YENİ EKLENEN KOD: Popup kapatıldığında masalar sayfasını güncelle
        // =============================
        if (gercekMasaNo) {
            window.dispatchEvent(new Event('adisyonGuncellendi'));
        }
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================
    };

    // --------------------------------------------------
    // ÖDEME SÖZÜ POPUP DETAYA GİT
    // --------------------------------------------------
    const odemeSozuPopupDetayaGit = () => {
        if (!odemeSozuPopup) return;

        // Borç detay sayfasına yönlendir
        navigate(`/borc-detay?id=${odemeSozuPopup.borcId}`);
    };

    // --------------------------------------------------
    // ADİSYON KAPAT - SYNC SERVICE ENTEGRASYONLU (ÇOKLU SPLIT İÇİN GÜNCELLENDİ)
    // --------------------------------------------------
    const adisyonKapat = () => {
        console.log('🟡 [DEBUG] adisyonKapat fonksiyonu çağrıldı');
        console.log('🟡 [DEBUG] Kullanıcı:', user?.username);
        
        // Kullanıcı kontrolü
        if (!user) {
            console.error('❌ [AUTH] Adisyon kapatma sırasında kullanıcı oturumu kapalı');
            alert("Oturumunuz kapandı. Lütfen tekrar giriş yapın.");
            navigate("/login");
            return;
        }
        
        // Kalan tutar kontrolü
        if (kalan > 0.01) {
            alert("Kalan tutar ödenmeden adisyon kapatılamaz.");
            return;
        }

        console.log('🔴 MASAYI KAPAT tıklandı - adisyonId:', adisyon?.id, 'gercekMasaNo:', gercekMasaNo, 'isBilardo:', isBilardo);

        // BİLARDO MASASI İÇİN ÖZEL KONTROL
        if (isBilardo) {
            console.log('🎱 Bilardo masası kapatılıyor:', gercekMasaNo);

            // Bilardo masası için ekstra temizlik
            const bilardoMasalar = okuJSON("mc_bilardo_masalar", []);
            const bilardoMasaIndex = bilardoMasalar.findIndex(m =>
                m.no === gercekMasaNo || m.masaNum === gercekMasaNo
            );

            if (bilardoMasaIndex !== -1) {
                bilardoMasalar[bilardoMasaIndex] = {
                    ...bilardoMasalar[bilardoMasaIndex],
                    durum: "BOŞ",
                    adisyonId: null,
                    toplamTutar: "0.00",
                    guncellemeZamani: new Date().toISOString()
                };
                yazJSON("mc_bilardo_masalar", bilardoMasalar);
                console.log('✅ Bilardo masası temizlendi:', gercekMasaNo);
            }
        }

        // =============================
        // YENİ EKLENDİ: Tüm önbellek temizliği
        // =============================
        const temizlemeListesi = [];
        if (adisyon?.id) temizlemeListesi.push(`mc_adisyon_toplam_${adisyon.id}`);
        
        // Tüm split adisyonların toplamlarını temizle
        splitAdisyonlar.forEach((split, index) => {
            if (split?.id) temizlemeListesi.push(`mc_adisyon_toplam_${split.id}`);
        });
        
        if (gercekMasaNo) temizlemeListesi.push(`mc_masa_toplam_${gercekMasaNo}`);

        temizlemeListesi.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Temizlendi: ${key}`);
        });
        // =============================
        // YENİ EKLENEN KOD SONU
        // =============================

        // 1. ADİSYONLARI KAPAT ÖNCE
        // ------------------------------------------------
        const updatedAdisyonlar = okuJSON(ADISYON_KEY, []);

        // YENİ adisyonu kapat
        let guncelYeniAdisyon = null;
        if (adisyon) {
            const yeniIdx = updatedAdisyonlar.findIndex((a) => a.id === adisyon.id);
            if (yeniIdx !== -1) {
                guncelYeniAdisyon = {
                    ...adisyon,
                    kapali: true,
                    kapanisZamani: new Date().toISOString(),
                    durum: "KAPALI",
                    toplamTutar: toplam.toFixed(2), // Toplam tutarı kaydet
                };
                updatedAdisyonlar[yeniIdx] = guncelYeniAdisyon;
                setAdisyon(guncelYeniAdisyon);
            }
        }

        // ESKİ adisyonları kapat (tüm split'ler)
        const guncelEskiAdisyonlar = [];
        splitAdisyonlar.forEach((split) => {
            const eskiIdx = updatedAdisyonlar.findIndex((a) => a.id === split.id);
            if (eskiIdx !== -1) {
                const guncelEskiAdisyon = {
                    ...split,
                    kapali: true,
                    kapanisZamani: new Date().toISOString(),
                    durum: "KAPALI",
                };
                updatedAdisyonlar[eskiIdx] = guncelEskiAdisyon;
                guncelEskiAdisyonlar.push(guncelEskiAdisyon);
            }
        });
        
        setSplitAdisyonlar(guncelEskiAdisyonlar);

        yazJSON(ADISYON_KEY, updatedAdisyonlar);
        console.log('✅ Adisyonlar kapatıldı');

        // 2. SYNC SERVICE İLE MASA TEMİZLEME
        // ------------------------------------------------
        let syncSuccess = false;

        // SYNC SERVICE KULLAN - TÜM MASAYI TEMİZLE
        if (syncServiceReady && window.syncService.masaBosalt) {
            console.log('🔄 SyncService.masaBosalt çağrılıyor:', gercekMasaNo);

            // GERÇEK MASA NUMARASINI KULLAN
            syncSuccess = window.syncService.masaBosalt(gercekMasaNo, isBilardo);

            if (syncSuccess) {
                console.log('✅ SyncService ile masa temizlendi');
            } else {
                console.error('❌ SyncService masa temizleme başarısız, manuel deneniyor');
            }
        }

        // FALLBACK: Manuel temizleme
        if (!syncSuccess) {
            console.log('🔧 Manuel masa güncelleme yapılıyor');

            const masalar = okuJSON(MASA_KEY, []);
            let masaIdx = -1;

            if (isBilardo) {
                // Bilardo masası için "BİLARDO" veya "B" ile başlayan masa ara
                masaIdx = masalar.findIndex(m =>
                    m.no === gercekMasaNo ||
                    m.masaNo?.toUpperCase().includes("BİLARDO") ||
                    m.masaNo?.toUpperCase().startsWith("B") ||
                    m.masaNum?.toUpperCase().includes("B")
                );
            } else {
                // Normal masa için sayısal masa ara
                const masaNoNum = Number(gercekMasaNo);
                masaIdx = masalar.findIndex(m => Number(m.no) === masaNoNum);
            }

            if (masaIdx !== -1) {
                // Toplam tutarı hesapla
                const yeniToplam = (adisyon?.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
                const eskiToplam = splitAdisyonlar.reduce(
                    (sum, split) => sum + ((split?.kalemler || []).reduce(
                        (s, k) => s + (Number(k.toplam) || 0),
                        0
                    )),
                    0
                );
                const toplamTutar = yeniToplam + eskiToplam;

                const masaAdi = isBilardo ? `BİLARDO ${gercekMasaNo}` : `MASA ${gercekMasaNo}`;

                masalar[masaIdx] = {
                    ...masalar[masaIdx],
                    masaNo: masaAdi,
                    masaNum: gercekMasaNo,
                    adisyonId: null,
                    splitAdisyonIds: null,
                    splitAdisyonSayisi: 0,
                    toplamTutar: toplamTutar.toFixed(2),
                    acilisZamani: null,
                    kapanisZamani: new Date().toISOString(),
                    durum: "BOŞ",
                    renk: "gri",
                    musteriAdi: null,
                    kisiSayisi: null,
                    guncellemeZamani: new Date().toISOString(),
                    sonAdisyonToplam: toplamTutar.toFixed(2),
                    isBilardo: isBilardo
                };
                yazJSON(MASA_KEY, masalar);

                // Storage event'ini tetikle
                window.dispatchEvent(new StorageEvent('storage', {
                    key: MASA_KEY,
                    newValue: JSON.stringify(masalar)
                }));

                syncSuccess = true;
                console.log('✅ Manuel masa güncelleme başarılı - Toplam Tutar:', toplamTutar.toFixed(2));
            } else {
                console.error('❌ Masa bulunamadı:', gercekMasaNo);
                alert('Masa bulunamadı!');
                return;
            }
        }

        if (!syncSuccess) {
            console.error('❌ Masa temizlenemedi!');
            alert('Masa temizlenirken bir hata oluştu!');
            return;
        }

        // 3. KASA HAREKETİ KAYDET (İSTEĞE BAĞLI)
        // ------------------------------------------------
        try {
            const kasalar = okuJSON("mc_kasalar", []);
            const masaAdi = isBilardo ? `Bilardo ${gercekMasaNo}` : `Masa ${gercekMasaNo}`;
            const kasaHareketi = {
                id: Date.now().toString(),
                tarih: new Date().toISOString(),
                masaNo: gercekMasaNo,
                masaAdi: masaAdi,
                adisyonId: adisyon?.id,
                aciklama: `${masaAdi} Kapatıldı (${splitAdisyonlar.length} ayrılmış hesap ile)`,
                giren: toplam,
                cikan: 0,
                bakiye: 0,
                tip: "MASA_KAPATMA",
                isBilardo: isBilardo,
                personel: user?.adSoyad || user?.username || "Bilinmiyor" // ✅ Kullanıcı bilgisini kaydet
            };
            kasalar.push(kasaHareketi);
            yazJSON("mc_kasalar", kasalar);
            console.log('💰 Kasa hareketi kaydedildi, personel:', user?.adSoyad);
        } catch (error) {
            console.warn('⚠️ Kasa hareketi kaydedilemedi:', error);
        }

        // 4. BAŞARI MESAJI VE YÖNLENDİRME
        // ------------------------------------------------
        const masaAdi = isBilardo ? `Bilardo ${gercekMasaNo}` : `Masa ${gercekMasaNo}`;
        setKapanisMesaji(
            `✅ ${masaAdi} başarıyla kapatıldı! Toplam: ${toplam.toFixed(2)} TL\n${splitAdisyonlar.length} adet ayrılmış hesap ile birlikte kapatıldı.\nAnaEkran'a yönlendiriliyorsunuz...`
        );

        // 5. MASALAR SAYFASINDA GÜNCELLEME İÇİN EK SENKRONİZASYON
        setTimeout(() => {
            if (window.syncService && window.syncService.senkronizeMasalar) {
                console.log('🔄 Masalar sayfası için senkronizasyon yapılıyor...');
                window.syncService.senkronizeMasalar();
            }

            // Masalar sayfasını güncellemek için son bir event gönder
            window.dispatchEvent(new Event('adisyonGuncellendi'));

            // ✅ ANA DEĞİŞİKLİK: AnaEkran'a yönlendir
            console.log('📍 [DEBUG] adisyonKapat: AnaEkran\'a yönlendiriliyor');
            console.log('📍 [DEBUG] Kullanıcı bilgisi:', user?.username);
            
            // Kısa bir gecikme
            setTimeout(() => {
                try {
                    navigate("/ana");
                } catch (error) {
                    console.error('❌ [DEBUG] navigate hatası, fallback kullanılıyor:', error);
                    // Fallback
                    window.location.href = "/ana";
                }
            }, 1500);
        }, 500);
    };

    // --------------------------------------------------
    // MASAYA DÖN - GÜNCELLENDİ: AnaEkran'a yönlendir
    // --------------------------------------------------
    const masayaDon = () => {
        console.log('🟡 [DEBUG] masayaDon fonksiyonu çağrıldı');
        console.log('🟡 [DEBUG] Kullanıcı:', user?.username);
        
        // Önce kullanıcı kontrolü yap
        if (!user) {
            console.error('❌ [AUTH] Kullanıcı oturumu kapalı, login sayfasına yönlendiriliyor');
            navigate("/login");
            return;
        }
        
        const params = new URLSearchParams();
        if (hesabaYazSonrasiMasaDon) {
            params.append("highlight", gercekMasaNo);
            setHesabaYazSonrasiMasaDon(false);
        }

        const query = params.toString();
        
        try {
            if (isBilardo) {
                const url = query ? `/bilardo?${query}` : "/bilardo";
                console.log('📍 [DEBUG] Bilardo sayfasına yönlendiriliyor');
                navigate(url);
            } else {
                // ✅ DEĞİŞİKLİK: Masalar yerine AnaEkran'a yönlendir
                const url = query ? `/ana?${query}` : "/ana";
                console.log('📍 [DEBUG] AnaEkran\'a yönlendiriliyor');
                navigate(url);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Yönlendirme hatası:', error);
            
            // Fallback: Sayfayı yenile
            if (isBilardo) {
                window.location.href = "/bilardo";
            } else {
                window.location.href = "/ana";
            }
        }
    };

    // --------------------------------------------------
    // BİLARDO ÜCRETİ GÖSTERİMİ
    // --------------------------------------------------
    const bilardoUcretiGoster = () => {
        if (!isBilardo || bilardoUcret <= 0) return null;

        return (
            <div style={{
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "6px",
                background: "#fff3cd",
                color: "#856404",
                fontSize: "14px",
                textAlign: "center",
                border: "1px solid #ffeaa7",
                fontWeight: "bold"
            }}>
                🎱 Bilardo Ücreti: {bilardoUcret.toFixed(2)} TL
            </div>
        );
    };

    // --------------------------------------------------
    // BİLARDO TRANSFER ÖZETİ GÖSTERİMİ
    // --------------------------------------------------
    const bilardoTransferOzetiGoster = () => {
        if (!bilardoTransferDetaylari || !adisyon) return null;

        const bilardoUcreti = bilardoTransferDetaylari.bilardoUcreti || 0;
        const bilardoEkUrunToplam = bilardoTransferDetaylari.bilardoEkUrunToplam || 0;

        return (
            <div style={{
                marginBottom: "15px",
                padding: "12px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
                border: "2px solid #4caf50",
                color: "#1b5e20",
                boxShadow: "0 2px 8px rgba(76, 175, 80, 0.2)"
            }}>
                <div style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    marginBottom: "10px",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                }}>
                    <span style={{ fontSize: "20px" }}>🎱</span>
                    BİLARDO MASASINDAN TRANSFER EDİLDİ
                    <span style={{ fontSize: "20px" }}>🎱</span>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "14px"
                }}>
                    <div>
                        <div style={{ fontWeight: "500", color: "#2e7d32" }}>Kaynak Masa:</div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                            {bilardoTransferDetaylari.bilardoMasaNo}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontWeight: "500", color: "#2e7d32" }}>Süre Tipi:</div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                            {bilardoTransferDetaylari.bilardoSureTipi === "30dk" ? "30 Dakika" :
                                bilardoTransferDetaylari.bilardoSureTipi === "1saat" ? "1 Saat" :
                                    bilardoTransferDetaylari.bilardoSureTipi === "suresiz" ? "Süresiz" :
                                        bilardoTransferDetaylari.bilardoSureTipi}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontWeight: "500", color: "#2e7d32" }}>Geçen Süre:</div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                            {bilardoTransferDetaylari.bilardoGecenDakika} dakika
                        </div>
                    </div>

                    <div>
                        <div style={{ fontWeight: "500", color: "#2e7d32" }}>Transfer Tarihi:</div>
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                            {bilardoTransferDetaylari.transferTarihi ?
                                new Date(bilardoTransferDetaylari.transferTarihi).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) :
                                "Bilinmiyor"}
                        </div>
                    </div>
                </div>

                {/* BİLARDO ÜCRETİ VE EK ÜRÜNLER ÖZETİ */}
                <div style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "2px dashed #4caf50"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        fontSize: "15px"
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "18px" }}>🎱</span>
                            <span style={{ fontWeight: "bold" }}>BİLARDO ÜCRETİ:</span>
                        </span>
                        <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1b5e20" }}>
                            {bilardoUcreti.toFixed(2)} ₺
                        </span>
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "15px"
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "18px" }}>📦</span>
                            <span style={{ fontWeight: "bold" }}>Ek Ürünler:</span>
                            <span style={{ fontSize: "13px", color: "#666" }}>
                                ({bilardoEkUrunler.length} adet)
                            </span>
                        </span>
                        <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1b5e20" }}>
                            {bilardoEkUrunToplam.toFixed(2)} ₺
                        </span>
                    </div>

                    {/* TOPLAM TRANSFER TUTARI */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid #a5d6a7",
                        fontSize: "16px",
                        fontWeight: "bold"
                    }}>
                        <span>TOPLAM TRANSFER:</span>
                        <span style={{ fontSize: "18px", color: "#1b5e20" }}>
                            {(bilardoUcreti + bilardoEkUrunToplam).toFixed(2)} ₺
                        </span>
                    </div>
                </div>

                {/* EK ÜRÜN DETAYLARI (isteğe bağlı) */}
                {bilardoEkUrunler.length > 0 && (
                    <div style={{
                        marginTop: "10px",
                        padding: "8px",
                        background: "#f1f8e9",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#555"
                    }}>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>📦 Ek Ürün Detayları:</div>
                        {bilardoEkUrunler.slice(0, 3).map((urun, index) => (
                            <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{urun.urunAdi || urun.ad}</span>
                                <span>{urun.toplam ? urun.toplam.toFixed(2) : "0.00"} ₺</span>
                            </div>
                        ))}
                        {bilardoEkUrunler.length > 3 && (
                            <div style={{ textAlign: "center", fontStyle: "italic", marginTop: "4px" }}>
                                + {bilardoEkUrunler.length - 3} daha fazla ürün...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // --------------------------------------------------
    // SPLIT ADİSYONLARIN TOPLAM TUTARINI HESAPLA
    // --------------------------------------------------
    const splitToplamTutari = useMemo(() => {
        return splitAdisyonlar.reduce((total, split) => {
            const splitToplam = (split?.kalemler || []).reduce(
                (sum, k) => sum + (Number(k.toplam) || 0),
                0
            );
            return total + splitToplam;
        }, 0);
    }, [splitAdisyonlar]);

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------
    if (!adisyon) {
        return <div>Adisyon yükleniyor...</div>;
    }

    // YENİ adisyon ve ESKİ adisyon toplamları
    const yeniToplam = (adisyon?.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
    const toplamTutar = yeniToplam + splitToplamTutari;

    // Yapılan ödemeler toplamı (SADECE YENİ ADİSYONDAN)
    const yapilanOdemeler = (adisyon?.odemeler || []).reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                background: "#f5e7d0",
                color: "#4b2e05",
                padding: "12px",
                boxSizing: "border-box",
                gap: "12px",
            }}
        >
            {/* SÜTUN 1: SOL PANEL – ÖDEMELER */}
            <div
                style={{
                    flex: "0 0 23%",
                    background: "#fdf4e4",
                    borderRadius: "12px",
                    padding: "12px",
                    boxSizing: "border-box",
                    boxShadow: "0 0 14px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    <div
                        style={{
                            fontWeight: "bold",
                            fontSize: "22px",
                            marginBottom: "10px",
                            textAlign: "center",
                            letterSpacing: "1px",
                        }}
                    >
                        ÖDEMELER
                    </div>

                    {/* MASA BİLGİSİ */}
                    <div style={{
                        marginBottom: "10px",
                        padding: "8px",
                        borderRadius: "6px",
                        background: isBilardo ? "#e8f5e9" : "#e8f4fc",
                        color: isBilardo ? "#1e8449" : "#1a5fb4",
                        fontSize: "14px",
                        textAlign: "center",
                        border: isBilardo ? "2px solid #27ae60" : "2px solid #1a5fb4",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px"
                    }}>
                        {isBilardo ? `🎱 BİLARDO ${gercekMasaNo}` : `🍽️ MASA ${gercekMasaNo}`}
                        <span style={{
                            fontSize: "12px",
                            background: isBilardo ? "#27ae60" : "#1a5fb4",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            marginLeft: "5px"
                        }}>
                            {gecenSure}
                        </span>
                    </div>

                    {/* BİLARDO TRANSFER ÖZETİ */}
                    {bilardoTransferOzetiGoster()}

                    {/* BİLARDO SÜRESİ VE ÜCRETİ */}
                    {isBilardo && (
                        <>
                            {bilardoBaslangicSaat && (
                                <div style={{
                                    marginBottom: "10px",
                                    padding: "5px",
                                    borderRadius: "6px",
                                    background: "#fff3cd",
                                    color: "#856404",
                                    fontSize: "12px",
                                    textAlign: "center",
                                    border: "1px solid #ffeaa7",
                                    fontWeight: "bold"
                                }}>
                                    🎱 Bilardo Süresi: {bilardoSure}
                                </div>
                            )}

                            {bilardoUcretiGoster()}
                        </>
                    )}


                    {/* ÖDEME LİSTESİ (SADECE YENİ ADİSYON) */}
                    <div
                        style={{
                            minHeight: "100px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            border: "1px solid #ecd3a5",
                            borderRadius: "8px",
                            padding: "8px",
                            marginBottom: "10px",
                            background: "#fff",
                        }}
                    >
                        {(adisyon.odemeler || []).length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "#a0a0a0",
                                    padding: "10px",
                                }}
                            >
                                Henüz ödeme yok.
                            </div>
                        ) : (
                            (adisyon.odemeler || []).map((o) => (
                                <div
                                    key={o.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderBottom: "1px dashed #f4e0c2",
                                        padding: "4px 0",
                                    }}
                                >
                                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                                        {odemeTipiLabel(o.tip)}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                                            {Number(o.tutar || 0).toFixed(2)} TL
                                        </span>
                                        <button
                                            onClick={() => odemeSil(o.id)}
                                            style={{
                                                marginLeft: "8px",
                                                padding: "0 4px",
                                                border: "none",
                                                background: "transparent",
                                                color: "red",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* TOPLAM / KALAN ALANI */}
                    <div
                        style={{
                            marginTop: "10px",
                            padding: "10px",
                            borderRadius: "8px",
                            background: "#e8d8c3",
                            border: "1px solid #bfa37d",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                            }}
                        >
                            <span style={{ fontWeight: "500" }}>YENİ Adisyon:</span>
                            <span style={{ fontWeight: "bold" }}>
                                {yeniToplam.toFixed(2)} TL
                            </span>
                        </div>

                        {/* ÇOKLU SPLIT ADİSYONLAR SATIRI - KOYU MAVİ */}
                        {splitAdisyonlar.length > 0 && (
                            <div
                                style={{
                                    marginBottom: "8px",
                                    padding: "8px",
                                    background: "#e8f4fc",
                                    borderRadius: "6px",
                                    border: "1px solid #1a5fb4"
                                }}
                            >
                                <div style={{ 
                                    fontWeight: "bold", 
                                    marginBottom: "6px",
                                    color: "#1a5fb4",
                                    fontSize: "15px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <span>AYRILMIŞ HESAPLAR:</span>
                                    <span style={{ fontSize: "14px", background: "#1a5fb4", color: "white", padding: "2px 6px", borderRadius: "10px" }}>
                                        {splitAdisyonlar.length} ADET
                                    </span>
                                </div>
                                
                                {splitAdisyonlar.map((split, index) => {
                                    const splitToplam = (split?.kalemler || []).reduce(
                                        (sum, k) => sum + (Number(k.toplam) || 0),
                                        0
                                    );
                                    
                                    return (
                                        <div key={split.id} style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "4px",
                                            padding: "4px",
                                            background: index % 2 === 0 ? "#f0f8ff" : "transparent",
                                            borderRadius: "4px"
                                        }}>
                                            <div style={{ fontSize: "13px" }}>
                                                <span style={{ fontWeight: "500" }}>
                                                    {index + 1}. {split.splitAciklama || "Ayrılmış Hesap"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <span style={{ fontWeight: "bold", color: "#1a5fb4", fontSize: "14px" }}>
                                                    {splitToplam.toFixed(2)} TL
                                                </span>
                                                <button
                                                    onClick={() => splitAdisyonSil(split.id)}
                                                    style={{
                                                        padding: "2px 6px",
                                                        border: "none",
                                                        background: "transparent",
                                                        color: "red",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        opacity: 0.7
                                                    }}
                                                    title="Bu ayrılmış hesabı sil"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: "8px",
                                    paddingTop: "8px",
                                    borderTop: "1px dashed #1a5fb4",
                                    fontWeight: "bold"
                                }}>
                                    <span>Split Toplam:</span>
                                    <span style={{ color: "#1a5fb4", fontSize: "15px" }}>
                                        {splitToplamTutari.toFixed(2)} TL
                                    </span>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                color: "red",
                            }}
                        >
                            <span style={{ fontWeight: "500" }}>İndirim:</span>
                            <span style={{ fontWeight: "bold" }}>
                                -{indirim.toFixed(2)} TL
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                            }}
                        >
                            <span style={{ fontWeight: "500" }}>Ödenen:</span>
                            <span style={{ fontWeight: "bold", color: "green" }}>
                                {yapilanOdemeler.toFixed(2)} TL
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                borderTop: "1px solid #bfa37d",
                                paddingTop: "6px",
                                marginTop: "6px",
                            }}
                        >
                            <span style={{ fontWeight: "bold" }}>TOPLAM:</span>
                            <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                                {toplamTutar.toFixed(2)} TL
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderTop: "1px solid #bfa37d",
                                paddingTop: "6px",
                                marginTop: "6px",
                            }}
                        >
                            <span
                                style={{ fontWeight: "bold", fontSize: "18px", color: "darkred" }}
                            >
                                KALAN
                            </span>
                            <span
                                style={{ fontWeight: "bold", fontSize: "18px", color: "darkred" }}
                            >
                                {kalan.toFixed(2)} TL
                            </span>
                        </div>
                    </div>

                    {/* ÖDEME TİPİ SEÇİMİ - GÜNCELLENDİ: HESABA_YAZ seçildiğinde işlem yapma */}
                    <div
                        style={{
                            marginTop: "14px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                        }}
                    >
                        {[
                            { tip: "NAKIT", etiket: "Nakit" },
                            { tip: "KART", etiket: "K.Kartı" },
                            { tip: "HAVALE", etiket: "Havale" },
                            { tip: "HESABA_YAZ", etiket: "Hesaba Yaz" },
                        ].map((o) => (
                            <button
                                key={o.tip}
                                onClick={() => {
                                    setAktifOdemeTipi(o.tip);
                                    if (o.tip === "HESABA_YAZ") {
                                        console.log("🟢 HESABA_YAZ seçildi, mod açılıyor!");
                                        setHesabaYazModu(true);
                                        setBorcTutarInput(String(kalan || 0));
                                    } else {
                                        // Diğer ödeme tiplerinde Hesaba Yaz modunu kapat
                                        if (hesabaYazModu) {
                                            setHesabaYazModu(false);
                                        }
                                    }
                                }}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "20px",
                                    border:
                                        aktifOdemeTipi === o.tip
                                            ? "2px solid #c57f3e"
                                            : "1px solid #bfa37d",
                                    background: aktifOdemeTipi === o.tip
                                        ? (o.tip === "HESABA_YAZ" ? "#2980b9" : "#f7d9a8")
                                        : "#ffffff",
                                    cursor: "pointer",
                                    fontSize: "15px",
                                    fontWeight: "500",
                                    color: aktifOdemeTipi === o.tip && o.tip === "HESABA_YAZ" ? "white" : "inherit",
                                }}
                            >
                                {o.etiket}
                            </button>
                        ))}
                    </div>

                    {/* HESABA YAZ MODU DEĞİLSE NORMAL ÖDEME ALANLARI */}
                    {!hesabaYazModu && aktifOdemeTipi !== "HESABA_YAZ" && (
                        <>
                            {/* ÖDEME TUTARI */}
                            <div style={{ marginTop: "10px" }}>
                                <label>Tutar</label>
                                <input
                                    type="number"
                                    value={odemeInput}
                                    onChange={(e) => setOdemeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") odemeEkle();
                                    }}
                                    placeholder={kalan.toFixed(2)}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "1px solid #bfa37d",
                                        marginTop: "4px",
                                        fontSize: "15px",
                                    }}
                                />
                            </div>
                            <button
                                onClick={odemeEkle}
                                style={{
                                    marginTop: "10px",
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "#4b2e05",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                }}
                            >
                                ÖDEME EKLE
                            </button>
                        </>
                    )}

                    {/* İNDİRİM */}
                    {!hesabaYazModu && (
                        <div style={{ marginTop: "14px" }}>
                            <label>İndirim (Enter ile uygula)</label>
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                <input
                                    type="number"
                                    value={indirimInput}
                                    onChange={(e) => setIndirimInput(e.target.value)}
                                    onKeyDown={indirimEnter}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "1px solid #bfa37d",
                                        fontSize: "15px",
                                        background: "#fff",
                                    }}
                                />
                                <button
                                    onClick={indirimSifirla}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #bfa37d",
                                        background: "#fdf4e4",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                    }}
                                >
                                    Sıfırla
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HESABI AYIR ALANI - ÇOKLU SPLIT İÇİN */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid #ecd3a5", paddingTop: "12px" }}>
                        <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#c57f3e" }}>
                            ✂️ HESABI AYIR (ÇOKLU)
                        </div>
                        
                        <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "13px", marginBottom: "4px" }}>Açıklama (Zorunlu):</div>
                            <input
                                type="text"
                                value={splitAciklamaInput}
                                onChange={(e) => setSplitAciklamaInput(e.target.value)}
                                placeholder="Örn: Kişi1, Çocuklar, Özel Hesap..."
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    border: "1px solid #bfa37d",
                                    fontSize: "14px",
                                    background: "#fff"
                                }}
                            />
                        </div>
                        
                        {/* HESABI AYIR butonu - Sadece YENİ adisyonda ürün varsa göster */}
                        {adisyon && adisyon.kalemler && adisyon.kalemler.length > 0 && (
                            <button
                                onClick={hesabiAyir}
                                disabled={!splitAciklamaInput.trim()}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: !splitAciklamaInput.trim() ? "#ccc" : "#ffeedd",
                                    color: !splitAciklamaInput.trim() ? "#999" : "#c57f3e",
                                    cursor: !splitAciklamaInput.trim() ? "not-allowed" : "pointer",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    marginTop: "8px",
                                }}
                            >
                                HESABI AYIR ✂️ ({splitAdisyonlar.length + 1}. kez)
                            </button>
                        )}
                        
                        {splitAdisyonlar.length > 0 && (
                            <div style={{
                                marginTop: "10px",
                                padding: "8px",
                                background: "#e8f4fc",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "#1a5fb4",
                                textAlign: "center"
                            }}>
                                📋 <b>{splitAdisyonlar.length}</b> adet ayrılmış hesap mevcut
                            </div>
                        )}
                    </div>
                </div>

                {/* ALT BUTONLAR */}
                <div style={{ borderTop: "1px solid #ecd3a5", paddingTop: "12px" }}>
                    {/* ÖDEME YAP / ADİSYON KAPAT */}
                    <button
                        onClick={adisyonKapat}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "none",
                            background: kalan === 0 ? "#27ae60" : "#95a5a6",
                            color: "#fff",
                            cursor: kalan === 0 ? "pointer" : "not-allowed",
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginBottom: "8px",
                        }}
                        disabled={kalan !== 0}
                    >
                        MASAYI KAPAT
                    </button>

                    {kapanisMesaji && (
                        <div
                            style={{
                                marginBottom: "8px",
                                padding: "8px",
                                borderRadius: "8px",
                                background: "#e8f8f1",
                                color: "#1e8449",
                                fontSize: "14px",
                                textAlign: "center",
                            }}
                        >
                            {kapanisMesaji}
                        </div>
                    )}

                    {/* MASAYA DÖN */}
                    <button
                        onClick={masayaDon}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #bfa37d",
                            background: "#fdf4e4",
                            cursor: "pointer",
                            fontSize: "15px",
                        }}
                    >
                        {isBilardo ? "BİLARDO SAYFASINA DÖN" : "ANA SAYFAYA DÖN"}
                    </button>
                </div>
            </div>

            {/* SÜTUN 2: ORTA PANEL – ADİSYON GÖSTERİMİ */}
            <div
                style={{
                    flex: 1.2,
                    background: "#fff7e6",
                    borderRadius: "12px",
                    padding: "12px",
                    boxSizing: "border-box",
                    boxShadow: "0 0 14px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        fontWeight: "bold",
                        fontSize: "32px",
                        marginBottom: "12px",
                        textAlign: "center",
                        letterSpacing: "1px",
                        borderBottom: "2px solid #ecd3a5",
                        paddingBottom: "8px",
                        color: "#4b2e05",
                    }}
                >
                    {isBilardo ? `🎱 BİLARDO ${gercekMasaNo}` : `🍽️ MASA ${gercekMasaNo}`}
                </div>

                {/* ÇOKLU SPLIT ADİSYON GÖSTERİMİ */}
                {splitAdisyonlar.length > 0 && (
                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "10px",
                            background: "#e8f4fc",
                            borderRadius: "8px",
                            border: "2px solid #1a5fb4",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "18px",
                                marginBottom: "8px",
                                color: "#1a5fb4",
                                textAlign: "center",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <span>AYRILMIŞ HESAPLAR ({splitAdisyonlar.length} ADET)</span>
                            <span style={{ fontSize: "14px", background: "#1a5fb4", color: "white", padding: "2px 8px", borderRadius: "10px" }}>
                                TOPLAM: {splitToplamTutari.toFixed(2)} TL
                            </span>
                        </div>
                        
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            padding: "5px"
                        }}>
                            {splitAdisyonlar.map((split, index) => {
                                const splitToplam = (split?.kalemler || []).reduce(
                                    (sum, k) => sum + (Number(k.toplam) || 0),
                                    0
                                );
                                
                                return (
                                    <div key={split.id} style={{
                                        padding: "8px",
                                        background: index % 2 === 0 ? "#f0f8ff" : "#ffffff",
                                        borderRadius: "6px",
                                        border: "1px solid #b3d9ff"
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "6px"
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: "bold", color: "#1a5fb4", fontSize: "15px" }}>
                                                    {index + 1}. {split.splitAciklama || "Ayrılmış Hesap"}
                                                </span>
                                                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                                                    {split.splitTarihi ? new Date(split.splitTarihi).toLocaleTimeString('tr-TR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : ""}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1a5fb4" }}>
                                                    {splitToplam.toFixed(2)} TL
                                                </span>
                                                <button
                                                    onClick={() => splitAdisyonSil(split.id)}
                                                    style={{
                                                        padding: "4px 8px",
                                                        border: "none",
                                                        background: "#ffebee",
                                                        color: "#d32f2f",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        borderRadius: "4px",
                                                        fontWeight: "bold"
                                                    }}
                                                    title="Bu ayrılmış hesabı sil"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Split adisyon içeriği (ürünler) */}
                                        <div style={{
                                            fontSize: "12px",
                                            color: "#555",
                                            maxHeight: "60px",
                                            overflowY: "auto",
                                            padding: "4px",
                                            background: "#f9f9f9",
                                            borderRadius: "4px",
                                            border: "1px dashed #ddd"
                                        }}>
                                            {split.kalemler && split.kalemler.length > 0 ? (
                                                split.kalemler.slice(0, 3).map((kalem, kIndex) => (
                                                    <div key={kIndex} style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: "2px"
                                                    }}>
                                                        <span>{kalem.urunAd} x{kalem.adet}</span>
                                                        <span>{kalem.toplam ? kalem.toplam.toFixed(2) : "0.00"} TL</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: "center", color: "#999", fontStyle: "italic" }}>
                                                    Ürün yok
                                                </div>
                                            )}
                                            {split.kalemler && split.kalemler.length > 3 && (
                                                <div style={{ textAlign: "center", color: "#666", marginTop: "2px" }}>
                                                    + {split.kalemler.length - 3} daha fazla ürün...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* HESABA YAZ MODU AÇIKSA HESABA YAZ PANELİ */}
                {hesabaYazModu ? (
                    // HESABA YAZ MODU
                    <div style={{ flex: 1, padding: "12px", boxSizing: "border-box" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "24px",
                                marginBottom: "20px",
                                textAlign: "center",
                                color: "#2980b9", // MAVİ RENK
                                borderBottom: "2px solid #2980b9",
                                paddingBottom: "10px"
                            }}
                        >
                            🏦 HESABA YAZ (VERESİYE)
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                            }}
                        >
                            {/* Sol: Müşteri bilgileri */}
                            <div>
                                <div style={{ marginBottom: "15px" }}>
                                    <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                                        Mevcut Müşteri
                                    </div>
                                    <select
                                        value={seciliMusteriId || ""}
                                        onChange={(e) => {
                                            setSeciliMusteriId(e.target.value || null);
                                            // Eğer mevcut müşteri seçildiyse, yeni müşteri formunu temizle
                                            if (e.target.value) {
                                                setYeniMusteriAdSoyad("");
                                                setYeniMusteriTelefon("");
                                                setYeniMusteriNot("");
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            border: "2px solid #bfa37d",
                                            marginTop: "4px",
                                            fontSize: "14px",
                                            background: "#fff"
                                        }}
                                    >
                                        <option value="">Müşteri Seçiniz</option>
                                        {musteriler.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.adSoyad} - {m.telefon} (Borç: {(m.total_debt || m.debt || 0).toFixed(2)} TL)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: "8px" }}>
                                    <div style={{ fontWeight: "500", marginBottom: "8px", color: "#c57f3e" }}>
                                        YENİ MÜŞTERİ EKLE
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ad Soyad *"
                                        value={yeniMusteriAdSoyad}
                                        onChange={(e) => {
                                            setYeniMusteriAdSoyad(e.target.value);
                                            // Yeni müşteri girildiğinde mevcut müşteri seçimini temizle
                                            if (e.target.value.trim()) {
                                                setSeciliMusteriId(null);
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            border: "2px solid #bfa37d",
                                            marginBottom: "10px",
                                            fontSize: "14px"
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Telefon *"
                                        value={yeniMusteriTelefon}
                                        onChange={(e) => {
                                            setYeniMusteriTelefon(e.target.value);
                                            // Yeni müşteri girildiğinde mevcut müşteri seçimini temizle
                                            if (e.target.value.trim()) {
                                                setSeciliMusteriId(null);
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            border: "2px solid #bfa37d",
                                            marginBottom: "10px",
                                            fontSize: "14px"
                                        }}
                                    />
                                    <textarea
                                        placeholder="Not (opsiyonel)"
                                        value={yeniMusteriNot}
                                        onChange={(e) => setYeniMusteriNot(e.target.value)}
                                        rows={3}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "8px",
                                            border: "2px solid #bfa37d",
                                            fontSize: "14px",
                                            resize: "vertical"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Sağ: Borç özeti ve tutar */}
                            <div>
                                <div style={{ marginBottom: "20px" }}>
                                    <div style={{ fontWeight: "500", marginBottom: "4px", fontSize: "16px" }}>
                                        Borç Tutarı (Maks: {kalan.toFixed(2)} TL)
                                    </div>
                                    <input
                                        type="number"
                                        value={borcTutarInput}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Maksimum kalan tutarı geçemez
                                            const maxTutar = Number(kalan.toFixed(2));
                                            const enteredTutar = Number(value);

                                            if (enteredTutar > maxTutar) {
                                                setBorcTutarInput(maxTutar.toString());
                                                alert(`Maksimum borç tutarı: ${maxTutar.toFixed(2)} TL`);
                                            } else {
                                                setBorcTutarInput(value);
                                            }
                                        }}
                                        max={kalan}
                                        min="0.01"
                                        step="0.01"
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            border: "2px solid #2980b9",
                                            marginTop: "4px",
                                            fontSize: "18px",
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            background: "#f0f8ff"
                                        }}
                                    />
                                </div>

                                {seciliMusteriId && (
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            padding: "15px",
                                            borderRadius: "8px",
                                            background: "#e8f4fc",
                                            border: "1px solid #1a5fb4",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                marginBottom: "10px",
                                                textAlign: "center",
                                                color: "#1a5fb4",
                                                fontSize: "16px"
                                            }}
                                        >
                                            📊 MÜŞTERİ BORÇ ÖZETİ
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "14px",
                                                marginBottom: "8px"
                                            }}
                                        >
                                            <span>Toplam Borç:</span>
                                            <b>{mevcutBorcOzet.toplamBorc.toFixed(2)} TL</b>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "14px",
                                                marginBottom: "8px"
                                            }}
                                        >
                                            <span>Toplam Ödeme:</span>
                                            <b style={{ color: "green" }}>{mevcutBorcOzet.toplamOdeme.toFixed(2)} TL</b>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                borderTop: "1px solid #1a5fb4",
                                                paddingTop: "10px",
                                                marginTop: "10px",
                                                fontSize: "16px",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            <span>Net Borç:</span>
                                            <span
                                                style={{
                                                    color: mevcutBorcOzet.kalan > 0 ? "darkred" : "darkgreen",
                                                }}
                                            >
                                                {mevcutBorcOzet.kalan.toFixed(2)} TL
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={hesabaYazKaydet}
                                    disabled={(!seciliMusteriId && !yeniMusteriAdSoyad.trim()) || !borcTutarInput || Number(borcTutarInput) <= 0}
                                    style={{
                                        marginTop: "20px",
                                        width: "100%",
                                        padding: "15px",
                                        borderRadius: "10px",
                                        border: "none",
                                        background: (!seciliMusteriId && !yeniMusteriAdSoyad.trim()) || !borcTutarInput || Number(borcTutarInput) <= 0
                                            ? "#95a5a6"
                                            : "#2980b9",
                                        color: "#fff",
                                        cursor: (!seciliMusteriId && !yeniMusteriAdSoyad.trim()) || !borcTutarInput || Number(borcTutarInput) <= 0
                                            ? "not-allowed"
                                            : "pointer",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                                    }}
                                >
                                    ✅ BORCU HESABA YAZ
                                </button>
                                <button
                                    onClick={hesabaYazIptal}
                                    style={{
                                        marginTop: "10px",
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "10px",
                                        border: "2px solid #bfa37d",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    ❌ İPTAL
                                </button>

                                {/* BİLGİ MESAJI */}
                                <div style={{
                                    marginTop: "15px",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "#fff3cd",
                                    border: "1px solid #ffeaa7",
                                    fontSize: "13px",
                                    color: "#856404"
                                }}>
                                    ⓘ <strong>Önemli:</strong> Hesaba Yaz işlemi borç kaydı oluşturur,
                                    adisyonu <strong>kapatmaz</strong>. Kalan tutar ödenene kadar adisyon açık kalır.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // YENİ ADİSYON İÇERİĞİ - SİYAH RENK (Normal mod)
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "18px",
                                marginBottom: "10px",
                                color: "#000000", // SİYAH
                            }}
                        >
                            ADİSYON
                        </div>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                borderRadius: "8px",
                                overflow: "hidden",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            padding: "8px",
                                            borderBottom: "1px solid #ecd3a5",
                                            textAlign: "left",
                                            color: "#000",
                                        }}
                                    >
                                        Ürün Adı
                                    </th>
                                    <th
                                        style={{
                                            padding: "8px",
                                            borderBottom: "1px solid #ecd3a5",
                                            textAlign: "center",
                                            color: "#000",
                                        }}
                                    >
                                        Adet
                                    </th>
                                    <th
                                        style={{
                                            padding: "8px",
                                            borderBottom: "1px solid #ecd3a5",
                                            textAlign: "right",
                                            color: "#000",
                                        }}
                                    >
                                        Birim
                                    </th>
                                    <th
                                        style={{
                                            padding: "8px",
                                            borderBottom: "1px solid #ecd3a5",
                                            textAlign: "right",
                                            color: "#000",
                                        }}
                                    >
                                        Toplam
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(adisyon.kalemler || []).map((k) => (
                                    <React.Fragment key={k.id}>
                                        <tr>
                                            <td
                                                style={{
                                                    padding: "6px 8px",
                                                    borderBottom: "1px solid #f4e0c2",
                                                    color: "#000",
                                                }}
                                            >
                                                {k.urunAd}
                                                {/* SİPARİŞ YEMEK notu varsa göster */}
                                                {k.not && k.not.trim() !== "" && (
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#666",
                                                            fontStyle: "italic",
                                                            marginTop: "2px",
                                                            paddingLeft: "5px",
                                                        }}
                                                    >
                                                        📝 {k.not}
                                                    </div>
                                                )}
                                                {/* BİLARDO ÜRÜNÜ İSE İŞARETLE */}
                                                {k.isBilardo && (
                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "#1e8449",
                                                            fontWeight: "bold",
                                                            marginTop: "2px",
                                                            paddingLeft: "5px",
                                                            display: "inline-block",
                                                            background: "#e8f5e9",
                                                            padding: "1px 4px",
                                                            borderRadius: "3px"
                                                        }}
                                                    >
                                                        🎱
                                                    </div>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 8px",
                                                    borderBottom: "1px solid #f4e0c2",
                                                    textAlign: "center",
                                                    color: "#000",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => adetAzalt(k.id)}
                                                        style={{
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #d0b48c",
                                                            background: "#fbe9e7",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            lineHeight: "1",
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span>{k.adet}</span>
                                                    <button
                                                        onClick={() => adetArtir(k.id)}
                                                        style={{
                                                            padding: "2px 6px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #d0b48c",
                                                            background: "#e8f5e9",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            lineHeight: "1",
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 8px",
                                                    borderBottom: "1px solid #f4e0c2",
                                                    textAlign: "right",
                                                    color: "#000",
                                                }}
                                            >
                                                {Number(k.birimFiyat || 0).toFixed(2)}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 8px",
                                                    borderBottom: "1px solid #f4e0c2",
                                                    textAlign: "right",
                                                    color: "#000",
                                                }}
                                            >
                                                <b>{Number(k.toplam || 0).toFixed(2)}</b>
                                                <button
                                                    onClick={() => satirSil(k.id)}
                                                    style={{
                                                        marginLeft: "8px",
                                                        padding: "2px 6px",
                                                        border: "none",
                                                        background: "transparent",
                                                        color: "red",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                    }}
                                                    title="Satırı Sil"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        {adisyon.kalemler.length === 0 && (
                            <div
                                style={{ textAlign: "center", color: "#888", padding: "20px" }}
                            >
                                Yeni adisyon üzerinde ürün bulunmamaktadır.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SÜTUN 3: SAĞ 1 PANEL – MENÜ */}
            <div
                style={{
                    flex: 1,
                    background: "#fff7e6",
                    borderRadius: "12px",
                    padding: "12px",
                    boxSizing: "border-box",
                    boxShadow: "0 0 14px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        fontWeight: "bold",
                        fontSize: "24px",
                        marginBottom: "12px",
                        textAlign: "center",
                        letterSpacing: "1px",
                        borderBottom: "2px solid #ecd3a5",
                        paddingBottom: "8px",
                    }}
                >
                    MENÜ (Ürünler)
                </div>

                {/* ÜRÜN ARAMA KUTUSU */}
                <div style={{ marginBottom: "12px" }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="🔍 Tüm ürünlerde ara..."
                            value={urunArama}
                            onChange={(e) => setUrunArama(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                paddingLeft: "36px", // İkon için boşluk
                                borderRadius: "8px",
                                border: "1px solid #d0b48c",
                                fontSize: "14px",
                                background: "#fff",
                                color: "#4b2e05",
                                outline: "none",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            }}
                        />
                        <div style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "16px",
                            color: "#8d7b5f"
                        }}>
                            🔍
                        </div>
                        {urunArama && (
                            <button
                                onClick={() => setUrunArama("")}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    color: "#ff6b6b",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    padding: "0",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                                title="Aramayı temizle"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {urunArama && (
                        <div style={{
                            fontSize: "12px",
                            color: "#8d7b5f",
                            marginTop: "4px",
                            textAlign: "center"
                        }}>
                            "{urunArama}" için {filtreliUrunler.length} ürün bulundu
                            {aktifKategori && aktifKategori !== "SİPARİŞ YEMEK" && (
                                <span style={{ marginLeft: "8px", fontStyle: "italic" }}>
                                    (Tüm kategorilerde aranıyor)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ÜRÜN LİSTESİ */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        borderRadius: "8px",
                        border: "1px solid #ecd3a5",
                        padding: "8px",
                        background: "#fffdf7",
                    }}
                >
                    {filtreliUrunler.length === 0 ? (
                        <div style={{ 
                            textAlign: "center", 
                            padding: "20px",
                            color: "#8d7b5f"
                        }}>
                            {urunArama ? 
                                `"${urunArama}" için ürün bulunamadı` : 
                                "Bu kategoride ürün yok."
                            }
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(100px, 1fr))",
                                gap: "8px",
                            }}
                        >
                            {filtreliUrunler.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => uruneTiklandi(u)}
                                    style={{
                                        padding: "10px 6px",
                                        borderRadius: "8px",
                                        border: "1px solid #d0b48c",
                                        background: "#ffeaa7",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                        height: "60px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "2px",
                                    }}
                                >
                                    <span style={{ lineHeight: "1.2" }}>{u.ad}</span>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: "normal",
                                            color: "#4b2e05",
                                        }}
                                    >
                                        {u.satis ? u.satis.toFixed(2) : "0.00"} TL
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ÜRÜN ADET PANELİ */}
                {adetPanelAcik && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "24%",
                            width: "250px",
                            background: "#fff",
                            border: "1px solid #bfa37d",
                            borderRadius: "10px",
                            padding: "15px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            zIndex: 100,
                        }}
                    >
                        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                            {seciliUrun.ad}
                        </div>
                        {seciliUrun.id === "siparis-yemek" && (
                            <>
                                <div style={{ marginBottom: "8px" }}>
                                    <label>Fiyat (TL)</label>
                                    <input
                                        type="number"
                                        value={siparisYemekFiyat}
                                        onChange={(e) => setSiparisYemekFiyat(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "6px",
                                            borderRadius: "6px",
                                            border: "1px solid #bfa37d",
                                            marginTop: "4px",
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: "8px" }}>
                                    <label>Not</label>
                                    <input
                                        type="text"
                                        value={siparisYemekNot}
                                        onChange={(e) => setSiparisYemekNot(e.target.value)}
                                        placeholder="Ekstra not"
                                        style={{
                                            width: "100%",
                                            padding: "6px",
                                            borderRadius: "6px",
                                            border: "1px solid #bfa37d",
                                            marginTop: "4px",
                                        }}
                                    />
                                </div>
                            </>
                        )}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "12px",
                            }}
                        >
                            <label>Adet</label>
                            <div
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <button
                                    onClick={() => setAdet(Math.max(1, adet - 1))}
                                    style={{
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #d0b48c",
                                        background: "#fbe9e7",
                                        cursor: "pointer",
                                    }}
                                >
                                    -
                                </button>
                                <span style={{ fontWeight: "bold" }}>{adet}</span>
                                <button
                                    onClick={() => setAdet(adet + 1)}
                                    style={{
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #d0b48c",
                                        background: "#e8f5e9",
                                        cursor: "pointer",
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button
                                onClick={adetPanelEkle}
                                style={{
                                    flex: 1,
                                    padding: "6px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "#4b2e05",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                EKLE
                            </button>
                            <button
                                onClick={() => {
                                    setAdetPanelAcik(false);
                                    setSeciliUrun(null);
                                }}
                                style={{
                                    padding: "6px",
                                    borderRadius: "6px",
                                    border: "1px solid #bfa37d",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                İPTAL
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SÜTUN 4: SAĞ 2 PANEL – KATEGORİLER */}
            <div
                style={{
                    flex: 0.8,
                    background: "#fff7e6",
                    borderRadius: "12px",
                    padding: "12px",
                    boxSizing: "border-box",
                    boxShadow: "0 0 14px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        fontWeight: "bold",
                        fontSize: "24px",
                        marginBottom: "12px",
                        textAlign: "center",
                        letterSpacing: "1px",
                        borderBottom: "2px solid #ecd3a5",
                        paddingBottom: "8px",
                    }}
                >
                    KATEGORİLER
                </div>

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        padding: "5px",
                        border: "1px solid #ecd3a5",
                        borderRadius: "8px",
                        background: "#fffdf7",
                        alignContent: "start",
                    }}
                >
                    {kategoriler.map((kat) => (
                        <button
                            key={kat}
                            onClick={() => {
                                setAktifKategori(kat);
                                setUrunArama(""); // Kategori değiştirince aramayı temizle
                            }}
                            style={{
                                padding: "15px 5px",
                                borderRadius: "8px",
                                border:
                                    aktifKategori === kat
                                        ? "2px solid #c57f3e"
                                        : "1px solid #bfa37d",
                                background:
                                    aktifKategori === kat ? "#f7d9a8" : "rgba(255,255,255,0.9)",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                textAlign: "center",
                                minHeight: "80px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                wordBreak: "break-word",
                                lineHeight: "1.2",
                            }}
                        >
                            {kat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ÖDEME SÖZÜ POPUP */}
            {odemeSozuPopup && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "#fff7e6",
                            padding: "20px",
                            borderRadius: "10px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                            width: "300px",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "18px",
                                marginBottom: "8px",
                                textAlign: "center",
                            }}
                        >
                            MÜŞTERİ BORCU HATIRLATMA
                        </div>
                        <div style={{ fontSize: "14px", marginBottom: "12px" }}>
                            {odemeSozuPopup.musteriAd} için ödeme sözü tarihi geldi:{" "}
                            <b>{odemeSozuPopup.odemeSozu}</b>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "8px",
                            }}
                        >
                            <button
                                onClick={odemeSozuPopupKapat}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #bfa37d",
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                TAMAM
                            </button>
                            <button
                                onClick={odemeSozuPopupDetayaGit}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "#4b2e05",
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                BORÇ DETAYINA GİT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}