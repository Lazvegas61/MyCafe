// File: admin-ui/src/pages/Raporlar/index.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RaporFiltreBar from './components/RaporFiltreBar';
import { RaporFiltreProvider } from '../../context/RaporFiltreContext';
import './Raporlar.css';

const Raporlar = () => {
  return (
    <RaporFiltreProvider>
      <div className="raporlar-container">
        <Sidebar />
        <div className="raporlar-content">
          <header className="raporlar-header">
            <h1>Raporlar ve Analizler</h1>
            <p>Detaylı raporlara ve analizlere buradan ulaşabilirsiniz</p>
          </header>
          
          <div className="raporlar-filtre">
            <RaporFiltreBar />
          </div>
          
          <main className="raporlar-main">
            <Outlet /> {/* Nested route'lar burada render olacak */}
          </main>
        </div>
      </div>
    </RaporFiltreProvider>
  );
};

export default Raporlar;