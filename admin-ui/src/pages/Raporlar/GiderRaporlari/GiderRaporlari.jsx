export default function GiderRaporu({ giderler }) {
    if (!giderler) return null;
  
    const toplamGider = giderler.reduce((t, g) => t + g.tutar, 0);
  
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Gider Raporu</h2>
  
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            marginBottom: 16,
          }}
        >
          <strong>Toplam Gider:</strong>{" "}
          {toplamGider.toLocaleString("tr-TR")} ₺
        </div>
  
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1e2c6" }}>
              <Th>Tarih</Th>
              <Th>Açıklama</Th>
              <Th align="right">Tutar</Th>
            </tr>
          </thead>
          <tbody>
            {giderler.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: 16, textAlign: "center" }}>
                  Kayıt yok
                </td>
              </tr>
            )}
  
            {giderler.map((g, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}>
                <Td>{g.tarih}</Td>
                <Td>{g.aciklama}</Td>
                <Td align="right">
                  {g.tutar.toLocaleString("tr-TR")} ₺
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
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
  