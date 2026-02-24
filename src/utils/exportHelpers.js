// Veri export fonksiyonları

export function exportToCSV(data, filename = "export.csv") {
  if (!data || data.length === 0) {
    alert("Dışa aktarılacak veri yok");
    return;
  }

  // CSV header'ı oluştur
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // String değerleri quote'la
          if (typeof value === "string") {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Blob oluştur ve download başlat
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data, filename = "export.json") {
  if (!data || data.length === 0) {
    alert("Dışa aktarılacak veri yok");
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data, filename = "export.xlsx") {
  alert("Excel export henüz desteklenmiyor, CSV olarak indirilecek");
  const csvFilename = filename.replace(".xlsx", ".csv");
  exportToCSV(data, csvFilename);
}
