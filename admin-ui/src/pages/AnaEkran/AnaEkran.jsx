/* ---------------------------------------------------------
   AnaEkran.jsx — PREMIUM PLUS TASARIM — SADECE UI
   Bilardo eklendi, raporlar sadeleştirildi, ikonlar eklendi
----------------------------------------------------------*/

import React from "react";
import "./AnaEkran.css";
import "./dashboard.css";

export default function AnaEkran() {
  return (
    <div className="ana-wrapper">

      {/* ÜST BAŞLIK + SAAT */}
      <div className="top-bar">
        <div className="title-3d">GÜNLÜK ÖZET</div>
        <div className="clock-box">17:30:45</div>
      </div>

      {/* ÜST 4 KART */}
      <div className="summary-cards">
        <div className="sum-card">
          <div className="sum-icon">💰</div>
          <div className="sum-title">Günlük Satış</div>
          <div className="sum-value">4.250,00 ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🧾</div>
          <div className="sum-title">Hesaba Yaz</div>
          <div className="sum-value">300,00 ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">💸</div>
          <div className="sum-title">Günlük Gider</div>
          <div className="sum-value">1.200,00 ₺</div>
        </div>

        <div className="sum-card">
          <div className="sum-icon">🏦</div>
          <div className="sum-title">Kritik Stok</div>
          <div className="sum-value">2 Ürün</div>
        </div>
      </div>

      {/* AÇIK ADİSYON + KRİTİK STOK PANELİ */}
      <div className="middle-panels">

        {/* Açık Adisyonlar */}
<div className="panel-box">
  <div className="panel-header">
    <span>Açık Adisyonlar</span>
  </div>

  <div className="panel-list">
    <div className="panel-item">
      <span>🍽 Masa 1</span>
      <span>35s 5dk</span>
      <span>860,00</span>
    </div>

    <div className="panel-item">
      <span>🍽 Masa 2</span>
      <span>2s 40dk</span>
      <span>200,00</span>
    </div>

    <div className="panel-item">
      <span>🎱 Bilardo</span>
      <span>30dk</span>
      <span>275,00</span>
    </div>
  </div>
</div>


        {/* Kritik Stok */}
        <div className="panel-box">
          <div className="panel-header">Kritik Stok</div>
          <div className="panel-list">

            <div className="stock-item">
              <span className="stock-left">🍶 Türk Kahvesi</span>
              <span className="stock-right">Mevcut: 5 — Kritik: 10</span>
            </div>

            <div className="stock-item">
              <span className="stock-left">🍵 Çay</span>
              <span className="stock-right">Mevcut: 24 — Kritik: 30</span>
            </div>

          </div>
        </div>

      </div>

      {/* RAPOR KUTULARI */}
      <div className="report-row">

        <div className="report-card">
          <div className="report-icon">💼</div>
          <div className="report-label">Kasa Raporu</div>
        </div>

        <div className="report-card">
          <div className="report-icon">📄</div>
          <div className="report-label">Giderler Raporu</div>
        </div>

        <div className="report-card">
          <div className="report-icon">🪑</div>
          <div className="report-label">Masa Detay Raporu</div>
        </div>

      </div>
    </div>
  );
}
