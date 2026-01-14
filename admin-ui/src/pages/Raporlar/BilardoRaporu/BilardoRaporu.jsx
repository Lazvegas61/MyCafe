export default function BilardoRaporu({ bilardo }) {
  if (!bilardo) return null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Bilardo Raporu</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Kart baslik="Toplam Oyun" deger={bilardo.toplamOyun} />
        <Kart
          baslik="Toplam Ciro"
          deger={`${bilardo.toplamCiro.toLocaleString("tr-TR")} ₺`}
        />
        <Kart
          baslik="Ortalama Oyun"
          deger={`${bilardo.ortalamaCiro.toLocaleString("tr-TR")} ₺`}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1e2c6" }}>
            <Th>Masa</Th>
            <Th align="right">Oyun</Th>
            <Th align="right">Ciro</Th>
          </tr>
        </thead>
        <tbody>
          {bilardo.detay.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: 16, textAlign: "center" }}>
                Kayıt yok
              </td>
            </tr>
          )}

          {bilardo.detay.map((b, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}>
              <Td>{b.masa}</Td>
              <Td align="right">{b.oyun}</Td>
              <Td align="right">
                {b.ciro.toLocaleString("tr-TR")} ₺
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
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

const Th = ({ children, align }) => (
  <th
    style={{
      padding: 10,
      textAlign: align || "left",
      borderBottom: "1px solid #ddd",
    }}
  >
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td
    style={{
      padding: 10,
      textAlign: align || "left",
      borderBottom: "1px solid #eee",
    }}
  >
    {children}
  </td>
);
