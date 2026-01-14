export default function UrunRaporu({ urunler }) {
  if (!urunler) return null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#7a3e06", marginBottom: 12 }}>Ürün Raporu</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1e2c6" }}>
            <Th>Ürün</Th>
            <Th>Kategori</Th>
            <Th align="right">Adet</Th>
            <Th align="right">Ciro</Th>
          </tr>
        </thead>
        <tbody>
          {urunler.length === 0 && (
            <tr>
              <td colSpan="4" style={{ padding: 16, textAlign: "center" }}>
                Kayıt yok
              </td>
            </tr>
          )}

          {urunler.map((u, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ea" }}>
              <Td>{u.urunAd}</Td>
              <Td>{u.kategori}</Td>
              <Td align="right">{u.adet}</Td>
              <Td align="right">
                {u.ciro.toLocaleString("tr-TR")} ₺
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
