// /src/layout/AppLayout.jsx
import React from "react";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {/* FIXED SIDEBAR */}
      <Sidebar />

      {/* SAĞ İÇERİK ALANI */}
      <div
        style={{
          marginLeft: "280px",          // Sidebar genişliği
          width: "calc(100% - 280px)",  // Sidebar çıkarıldı
          padding: "28px",
          minHeight: "100vh",
          background: "#f5e7d0",
          boxSizing: "border-box",
          overflow: "hidden",           // Global scroll KAPALI
          color: "#4b2e05",
          transition: "all 0.25s ease",
          fontSize: "18px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
