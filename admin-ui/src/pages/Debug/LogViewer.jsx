/* ------------------------------------------------------------
   📌 LogViewer.jsx — Frontend Log Görüntüleme Ekranı (FINAL)
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";

export default function LogViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("mc_logs") || "[]");
    setLogs(data);
  }, []);

  return (
    <div style={{ padding: 20, background: "#f5e8c8", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>MyCafe Log Kayıtları</h1>

      {logs.length === 0 && (
        <div style={{ fontSize: 22 }}>Hiç log kaydı yok.</div>
      )}

      {logs.map((l, i) => (
        <pre
          key={i}
          style={{
            padding: 12,
            background: "#fff",
            borderRadius: 8,
            marginBottom: 10,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            whiteSpace: "pre-wrap",
            fontSize: 16,
          }}
        >
{`${l.time} → ${l.message}\n${l.error}`}
        </pre>
      ))}
    </div>
  );
}
