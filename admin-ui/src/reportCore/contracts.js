// admin-ui/src/core/reporting/contracts.js

/**
 * LiveDayReport – Canlı Gün Raporu
 * Tüm UI bu sözleşmeyi SADECE OKUR.
 */
export const emptyLiveDayReport = {
  zaman: {
    baslangic: null,
    simdi: null,
  },
  satis: {
    normal: 0,
    bilardo: 0,
    toplam: 0,
  },
  kasa: {
    nakit: 0,
    kart: 0,
    havale: 0,
    bakiye: 0,
  },
  gider: 0,
  hesabaYaz: 0,
  adisyon: {
    acikSayisi: 0,
  },
};
