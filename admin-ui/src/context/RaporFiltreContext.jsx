// File: admin-ui/src/context/RaporFiltreContext.jsx (güncellenmiş)
import React, { createContext, useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

const RaporFiltreContext = createContext();

export const useRaporFiltre = () => {
  const context = useContext(RaporFiltreContext);
  if (!context) {
    throw new Error('useRaporFiltre must be used within a RaporFiltreProvider');
  }
  return context;
};

export const RaporFiltreProvider = ({ children }) => {
  const [filtreler, setFiltreler] = useState({
    baslangicTarihi: null,
    bitisTarihi: null,
    masaTipi: '', // 'normal', 'bilardo' veya ''
    odemeTipi: '', // 'nakit', 'kart', 'hesap', ''
    minTutar: null,
    maxTutar: null,
    kategoriId: null,
    urunId: null,
    masaNo: null
  });

  const [aktifRapor, setAktifRapor] = useState('gun-sonu'); // Hangi rapor görüntüleniyor

  const filtreGuncelle = useCallback((yeniFiltreler) => {
    setFiltreler(prev => ({
      ...prev,
      ...yeniFiltreler
    }));
  }, []);

  const filtreleriSifirla = useCallback(() => {
    setFiltreler({
      baslangicTarihi: null,
      bitisTarihi: null,
      masaTipi: '',
      odemeTipi: '',
      minTutar: null,
      maxTutar: null,
      kategoriId: null,
      urunId: null,
      masaNo: null
    });
  }, []);

  const buguneAyarla = useCallback(() => {
    const bugun = new Date();
    const bugunBaslangic = new Date(bugun);
    bugunBaslangic.setHours(0, 0, 0, 0);
    
    const bugunBitis = new Date(bugun);
    bugunBitis.setHours(23, 59, 59, 999);
    
    setFiltreler(prev => ({
      ...prev,
      baslangicTarihi: bugunBaslangic.toISOString().split('T')[0],
      bitisTarihi: bugunBitis.toISOString().split('T')[0]
    }));
  }, []);

  const buHaftayaAyarla = useCallback(() => {
    const bugun = new Date();
    const haftaBaslangici = new Date(bugun);
    haftaBaslangici.setDate(bugun.getDate() - bugun.getDay() + 1); // Pazartesi
    haftaBaslangici.setHours(0, 0, 0, 0);
    
    const haftaBitisi = new Date(haftaBaslangici);
    haftaBitisi.setDate(haftaBaslangici.getDate() + 6); // Pazar
    haftaBitisi.setHours(23, 59, 59, 999);
    
    setFiltreler(prev => ({
      ...prev,
      baslangicTarihi: haftaBaslangici.toISOString().split('T')[0],
      bitisTarihi: haftaBitisi.toISOString().split('T')[0]
    }));
  }, []);

  const buAyaAyarla = useCallback(() => {
    const bugun = new Date();
    const ayBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
    ayBaslangici.setHours(0, 0, 0, 0);
    
    const ayBitisi = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);
    ayBitisi.setHours(23, 59, 59, 999);
    
    setFiltreler(prev => ({
      ...prev,
      baslangicTarihi: ayBaslangici.toISOString().split('T')[0],
      bitisTarihi: ayBitisi.toISOString().split('T')[0]
    }));
  }, []);

  const value = {
    filtreler,
    aktifRapor,
    setAktifRapor,
    filtreGuncelle,
    filtreleriSifirla,
    buguneAyarla,
    buHaftayaAyarla,
    buAyaAyarla
  };

  return (
    <RaporFiltreContext.Provider value={value}>
      {children}
    </RaporFiltreContext.Provider>
  );
};

RaporFiltreProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default RaporFiltreContext;