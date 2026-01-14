import jsPDF from "jspdf";
import "jspdf-autotable";

export const generatePdf = ({
  title,
  subtitle,
  columns,
  rows,
  fileName
}) => {
  const doc = new jsPDF("p", "mm", "a4");

  // Başlık
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MYCAFE", 14, 15);

  doc.setFontSize(11);
  doc.text(title, 14, 22);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 14, 28);
  }

  // Tablo
  doc.autoTable({
    startY: 35,
    head: [columns],
    body: rows,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      lineWidth: 0.2,
      fontStyle: "bold"
    },
    theme: "grid"
  });

  // Alt bilgi
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(
    `Oluşturma Tarihi: ${new Date().toLocaleString("tr-TR")}`,
    14,
    pageHeight - 10
  );

  doc.save(`${fileName}.pdf`);
};
