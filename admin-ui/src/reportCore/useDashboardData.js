// File: admin-ui/src/core/dashboard/useDashboardData.js
// Purpose: Dashboard için TEK veri kaynağı (Single Source of Truth)

import { useEffect, useState } from "react";
import { collect, computeLiveDay } from "@/core/reporting";
import { useGun } from "@/context/GunContext";

const EMPTY_DASHBOARD = {
  meta: {
    gunDurumu: "BASLAMADI",
    gunBaslangic: null,
    gunBitis: null,
    now: new Date().toISOString()
  },

  satis: {
    toplam: 0,
    normal: 0,
    bilardo: 0
  },

  adisyon: {
    acikSayisi: 0,
    toplamTutar: 0
  },

  kasa: {
    nakit: 0,
    kart: 0,
    hesabaYaz: 0,
    havale: 0,
    toplam: 0,
    kasaToplam: 0,
    satisToplam: 0,
    tutarUyumlu: true
  },

  gider: {
    toplam: 0,
    adet: 0
  },

  bilardo: {
    aktifMasa: 0,
    toplamCiro: 0
  }
};

export default function useDashboardData() {
  const { gun } = useGun();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);

  useEffect(() => {
    // 1️⃣ Tüm ham verileri tek yerden topla
    const raw = collect();

    // 2️⃣ Gün durumuna göre canlı hesapla
    const live = computeLiveDay({
      gun,
      data: raw
    });

    // 3️⃣ Dashboard sözleşmesine dönüştür
    setDashboard({
      meta: {
        gunDurumu: live.gunDurumu,
        gunBaslangic: live.gunBaslangic,
        gunBitis: live.gunBitis,
        now: new Date().toISOString()
      },

      satis: {
        toplam: live.toplamCiro,
        normal: live.normalCiro,
        bilardo: live.bilardoCiro
      },

      adisyon: {
        acikSayisi: live.acikAdisyonSayisi,
        toplamTutar: live.acikAdisyonToplam
      },

      kasa: {
        nakit: live.kasa.nakit,
        kart: live.kasa.kart,
        hesabaYaz: live.kasa.hesabaYaz,
        havale: live.kasa.havale,
        toplam: live.kasa.toplam,
        kasaToplam: live.kasa.kasaToplam,
        satisToplam: live.kasa.satisToplam,
        tutarUyumlu: live.kasa.tutarUyumlu
      },

      gider: {
        toplam: live.gider.toplam,
        adet: live.gider.adet
      },

      bilardo: {
        aktifMasa: live.bilardo.aktifMasa,
        toplamCiro: live.bilardo.toplamCiro
      }
    });
  }, [gun]);

  return dashboard;
}