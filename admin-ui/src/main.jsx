// ------------------------------------------------------
//  AUTO BACKUP & RESTORE SYSTEM  (MyCafe FINAL)
// ------------------------------------------------------

function restoreBackupIfNeeded() {
  // KATEGORİLER
  if (!localStorage.getItem("kategoriler")) {
    const backup = localStorage.getItem("mc_backup_kategoriler");
    if (backup) {
      localStorage.setItem("kategoriler", backup);
      console.log("Kategoriler backup'tan geri yüklendi.");
    }
  }

  // ÜRÜNLER
  if (!localStorage.getItem("urunler")) {
    const backup = localStorage.getItem("mc_backup_urunler");
    if (backup) {
      localStorage.setItem("urunler", backup);
      console.log("Ürünler backup'tan geri yüklendi.");
    }
  }
}

// Bu fonksiyon her veri değiştiğinde çağrılabilir.
// (Ürün / kategori ekleme–silme sayfalarında da çağrılacak.)
export function updateBackup() {
  const kategoriler = localStorage.getItem("kategoriler");
  const urunler = localStorage.getItem("urunler");

  if (kategoriler) {
    localStorage.setItem("mc_backup_kategoriler", kategoriler);
  }
  if (urunler) {
    localStorage.setItem("mc_backup_urunler", urunler);
  }
}

// Uygulama yüklenirken backup restore edilir
restoreBackupIfNeeded();

// ------------------------------------------------------
//  REACT APP BOOTSTRAP
// ------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./global.css";

// ------------------------------------------------------
//  FAZ 2 – RAPOR MOTORU (TEST AMAÇLI GLOBAL BAĞLAMA)
//  ⚠️ SADECE TEST / DOĞRULAMA İÇİN
// ------------------------------------------------------

import { computeKasaRaporuV2 } from "./reportCore/computeKasaRaporuV2";

// Console testleri için
window.computeKasaRaporuV2 = computeKasaRaporuV2;

// ------------------------------------------------------
//  RENDER
// ------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
