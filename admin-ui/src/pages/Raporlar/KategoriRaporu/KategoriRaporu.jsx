export default function KategoriRaporu({ kategoriler }) {
  if (!kategoriler) return null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Kategori Raporu</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1e2c6" }}>
            <Th>Kategori</Th>
            <Th align="right">Adet</Th>
            <Th align="right">Ciro</Th>
          </tr>
        </thead>
        <tbody>
          {kategoriler.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: 16, textAlign: "center" }}>
                Kayıt yok
              </td>
            </tr>
          )}

          {kategoriler.map((k, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}>
              <Td>{k.kategori}</Td>
              <Td align="right">{k.adet}</Td>
              <Td align="right">
                {k.ciro.toLocaleString("tr-TR")} ₺
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
