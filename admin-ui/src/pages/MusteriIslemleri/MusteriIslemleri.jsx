/* ============================================================
   📄 DOSYA: MusteriIslemleri.jsx
   📌 AMAÇ:
   MyCafe — Müşteri İşlemleri (Hesaba Yaz & Tahsilat) sayfası.
   Hafızada kayıtlı tüm iş kurallarına birebir uygun JSX iskeletidir.
   - Admin / Garson yetki ayrımı destekler
   - Bej–Kahve tema varsayılır
   - API entegrasyonu daha sonra eklenir
============================================================ */

import React, { useState } from "react";

export default function MusteriIslemleri() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [role] = useState("ADMIN"); // ADMIN | GARSON

  const customers = [
    { id: 1, name: "Ahmet Yılmaz", phone: "05xx xxx xx xx", debt: 1250 },
    { id: 2, name: "Mehmet Kaya", phone: "05xx xxx xx xx", debt: 450 },
    { id: 3, name: "Ayşe Demir", phone: "05xx xxx xx xx", debt: 780 }
  ];

  const transactions = [
    { id: 1, date: "20.11.2025", type: "BORÇ EKLENDİ", amount: "+750 ₺", desc: "Masa 12" },
    { id: 2, date: "22.11.2025", type: "TAHSİLAT", amount: "-250 ₺", desc: "Garson aldı" },
    { id: 3, date: "25.11.2025", type: "TAHSİLAT", amount: "-300 ₺", desc: "Admin" }
  ];

  return (
    <div className="musteri-islemleri-container">

      {/* BAŞLIK */}
      <h1 className="page-title">MÜŞTERİ İŞLEMLERİ</h1>

      {/* ÜST PANEL */}
      <div className="panel-top">

        {/* MÜŞTERİ LİSTESİ */}
        <div className="panel customers">
          <h2>MÜŞTERİ LİSTESİ</h2>
          <input type="text" placeholder="Ara..." />

          <ul>
            {customers.map(c => (
              <li key={c.id} onClick={() => setSelectedCustomer(c)}>
                <span>{c.name}</span>
                <strong>{c.debt} ₺</strong>
              </li>
            ))}
          </ul>

          <button className="btn-add">+ YENİ MÜŞTERİ EKLE</button>
        </div>

        {/* MÜŞTERİ DETAY */}
        <div className="panel detail">
          {selectedCustomer ? (
            <>
              <h2>MÜŞTERİ DETAYI</h2>
              <p><strong>Ad Soyad:</strong> {selectedCustomer.name}</p>
              <p><strong>Telefon:</strong> {selectedCustomer.phone}</p>
              <p className="debt"><strong>Mevcut Borç:</strong> {selectedCustomer.debt} ₺</p>

              <div className="info-box">
                <p><strong>Masa No:</strong> 12</p>
                <p><strong>Adisyon Açılış:</strong> 18:42</p>
                <p><strong>Adisyon Kapanış:</strong> 20:10</p>
              </div>

              <textarea placeholder="Not (opsiyonel)" />
            </>
          ) : (
            <p className="empty">Müşteri seçiniz</p>
          )}
        </div>
      </div>

      {/* ALT PANEL */}
      <div className="panel-bottom">

        {/* BORÇ EKLE */}
        <div className="panel">
          <h2>BORÇ EKLE</h2>
          <input type="number" placeholder="Borç Tutarı ₺" />
          <input type="date" />
          <textarea placeholder="Not (opsiyonel)" />
          <button className="btn-primary">BORÇ EKLE</button>
        </div>

        {/* TAHSİLAT */}
        <div className="panel">
          <h2>TAHSİLAT AL</h2>
          {role !== "ADMIN" && (
            <p className="warning">Sadece ADMIN tahsilat alabilir</p>
          )}

          {role === "ADMIN" && (
            <>
              <input type="number" placeholder="Ödeme Tutarı ₺" />
              <div className="radio-group">
                <label><input type="radio" name="pay" /> Nakit</label>
                <label><input type="radio" name="pay" /> Nakit + Kart</label>
                <label><input type="radio" name="pay" /> Havale / EFT</label>
                <label><input type="radio" name="pay" /> Parçalı</label>
              </div>
              <button className="btn-success">TAHSİLAT AL</button>
            </>
          )}
        </div>
      </div>

      {/* GEÇMİŞ */}
      <div className="panel history">
        <h2>BORÇ & ÖDEME GEÇMİŞİ</h2>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem</th>
              <th>Tutar</th>
              <th>Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.type}</td>
                <td>{t.amount}</td>
                <td>{t.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
