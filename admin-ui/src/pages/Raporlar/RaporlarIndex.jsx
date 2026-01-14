import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Raporlar from './Raporlar';

// Eski ayrı rapor sayfalarını da desteklemek için
import GenelOzet from './GenelOzet/GenelOzet';
import KategoriRaporu from './KategoriRaporu/KategoriRaporu';
import UrunRaporu from './UrunRaporu/UrunRaporu';
import MasaRaporu from './MasaRaporu/MasaRaporu';
import KasaRaporu from './KasaRaporu/KasaRaporu';
import GiderRaporlari from './GiderRaporlari/GiderRaporlari';

const RaporlarIndex = () => {
  return (
    <Routes>
      <Route path="/" element={<Raporlar />} />
      {/* Eski route'lar için backward compatibility */}
      <Route path="/genel" element={<GenelOzet />} />
      <Route path="/kategori" element={<KategoriRaporu />} />
      <Route path="/urun" element={<UrunRaporu />} />
      <Route path="/masa" element={<MasaRaporu />} />
      <Route path="/kasa" element={<KasaRaporu />} />
      <Route path="/gider" element={<GiderRaporlari />} />
    </Routes>
  );
};

export default RaporlarIndex;