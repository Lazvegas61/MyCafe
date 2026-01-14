export default function MasaRaporu({ masalar }) {
  if (!masalar) return null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Masa Raporu</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1e2c6" }}>
            <Th>Masa</Th>
            <Th align="right">Adisyon</Th>
            <Th align="right">Toplam Ciro</Th>
            <Th align="right">Ortalama</Th>
          </tr>
        </thead>
        <tbody>
          {masalar.length === 0 && (
            <tr>
              <td colSpan="4" style={{ padding: 16, textAlign: "center" }}>
                Kayıt yok
              </td>
            </tr>
          )}

          {masalar.map((m, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}>
              <Td>{m.masa}</Td>
              <Td align="right">{m.adisyon}</Td>
              <Td align="right">
                {m.ciro.toLocaleString("tr-TR")} ₺
              </Td>
              <Td align="right">
                {m.ortalama.toLocaleString("tr-TR")} ₺
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
