export default function KasaRaporu({ kasa }) {
    if (!kasa) return null;
  
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Kasa Raporu</h2>
  
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Kart baslik="Toplam Kasa" deger={`${kasa.toplamKasa.toLocaleString("tr-TR")} ₺`} />
          <Kart baslik="Nakit" deger={`${kasa.nakit.toLocaleString("tr-TR")} ₺`} />
          <Kart baslik="Kart" deger={`${kasa.kart.toLocaleString("tr-TR")} ₺`} />
          <Kart baslik="Havale" deger={`${kasa.havale.toLocaleString("tr-TR")} ₺`} />
          <Kart baslik="Hesaba Yaz" deger={`${kasa.hesabaYaz.toLocaleString("tr-TR")} ₺`} />
        </div>
      </div>
    );
  }
  
  function Kart({ baslik, deger }) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ fontSize: 13, color: "#92400e", marginBottom: 6 }}>
          {baslik}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{deger}</div>
      </div>
    );
  }
  