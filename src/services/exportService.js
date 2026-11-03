/**
 * exportService.js
 * Pure-function export helpers: CSV, Excel (.xlsx), PDF.
 *
 * Security:
 *  - CSV: cells that start with =, +, -, @ are prefixed with a tab to
 *    prevent formula-injection in spreadsheet applications.
 *  - Excel: the same sanitisation is applied before writing cells.
 *  - PDF: values are converted to strings; no HTML or formula evaluation.
 *  - No personal data is exported beyond what the caller explicitly passes.
 */

// ── Sanitise a single cell value for CSV formula-injection ───────────────────
export function sanitiseSpreadsheetCell(value) {
  const s = String(value ?? "");
  return /^[=+\-@]/.test(s.trimStart()) ? `\t${s}` : s;
}

export function buildSpreadsheetData(headers, rows) {
  return [headers, ...rows].map((row) =>
    row.map((cell) => sanitiseSpreadsheetCell(cell)),
  );
}

export function buildCSVContent(headers, rows) {
  const lines = buildSpreadsheetData(headers, rows).map((row) =>
    row
      .map((safe) =>
        safe.includes(",") || safe.includes('"') || /[\r\n]/.test(safe)
          ? `"${safe.replace(/"/g, '""')}"`
          : safe,
      )
      .join(","),
  );
  return `\uFEFF${lines.join("\r\n")}`;
}

// ── Trigger a browser file download ──────────────────────────────────────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}

// ── Timestamp suffix for filenames ───────────────────────────────────────────
function stamp() {
  return new Date()
    .toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\./g, "-");
}

// ──────────────────────────────────────────────────────────────────────────────
// CSV
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @param {string[]}   headers  Column labels (Türkçe)
 * @param {string[][]} rows     2-D array of cell values
 * @param {string}     filename Without extension
 */
export function exportCSV(headers, rows, filename = "logiway-export") {
  const blob = new Blob([buildCSVContent(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, `${filename}_${stamp()}.csv`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Excel (.xlsx) via SheetJS (xlsx)
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @param {string}     sheetName  Worksheet tab name
 * @param {string[]}   headers
 * @param {string[][]} rows
 * @param {string}     filename   Without extension
 */
export async function exportXLSX(
  sheetName,
  headers,
  rows,
  filename = "logiway-export",
) {
  const { utils, write } = await import("xlsx");

  // Apply sanitisation to every cell
  const data = buildSpreadsheetData(headers, rows);

  const ws = utils.aoa_to_sheet(data);

  // Bold header row
  const range = utils.decode_range(ws["!ref"] || "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const addr = utils.encode_cell({ r: 0, c: col });
    if (ws[addr]) ws[addr].s = { font: { bold: true } };
  }

  // Auto column width (max 40 chars)
  ws["!cols"] = headers.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[colIdx] ?? "").length),
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const buf = write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${filename}_${stamp()}.xlsx`);
}

// ──────────────────────────────────────────────────────────────────────────────
// PDF via jsPDF + browser canvas. Text is rasterised with the browser's
// Unicode font support, so Turkish glyphs remain intact without a remote font.
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @param {string}     title      Document title (shown at top)
 * @param {string[]}   headers
 * @param {string[][]} rows
 * @param {string}     filename   Without extension
 */
export async function exportPDF(
  title,
  headers,
  rows,
  filename = "logiway-export",
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const safeRows = buildSpreadsheetData([], rows).slice(1);
  const rowsPerPage = 16;
  const pageCount = Math.max(1, Math.ceil(safeRows.length / rowsPerPage));

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) doc.addPage("a4", "landscape");
    const canvas = document.createElement("canvas");
    canvas.width = 1684;
    canvas.height = 1190;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PDF oluşturma bu tarayıcıda desteklenmiyor.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#102a20";
    ctx.font = "700 32px Arial, sans-serif";
    ctx.fillText(title, 60, 60);
    ctx.fillStyle = "#63736a";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText(`Oluşturulma tarihi: ${new Date().toLocaleString("tr-TR")}`, 60, 94);

    const left = 60;
    const top = 130;
    const tableWidth = canvas.width - left * 2;
    const columnWidth = tableWidth / Math.max(headers.length, 1);
    const rowHeight = 56;
    const drawCell = (value, column, row, header = false) => {
      const x = left + column * columnWidth;
      const y = top + row * rowHeight;
      ctx.fillStyle = header ? "#102a20" : row % 2 ? "#f3f7f1" : "#ffffff";
      ctx.fillRect(x, y, columnWidth, rowHeight);
      ctx.strokeStyle = "#dce5d8";
      ctx.strokeRect(x, y, columnWidth, rowHeight);
      ctx.fillStyle = header ? "#ffffff" : "#263a30";
      ctx.font = `${header ? "700" : "400"} ${header ? 16 : 15}px Arial, sans-serif`;
      let text = String(value ?? "");
      const maxWidth = columnWidth - 18;
      while (text.length > 1 && ctx.measureText(text).width > maxWidth) {
        text = text.slice(0, -1);
      }
      if (text !== String(value ?? "")) text = `${text.slice(0, -1)}…`;
      ctx.fillText(text, x + 9, y + 34);
    };

    headers.forEach((header, column) => drawCell(header, column, 0, true));
    safeRows
      .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
      .forEach((row, rowIndex) =>
        headers.forEach((_, column) => drawCell(row[column], column, rowIndex + 1)),
      );
    ctx.fillStyle = "#7d8b83";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText(`Sayfa ${page + 1} / ${pageCount}`, canvas.width - 170, canvas.height - 35);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210, undefined, "FAST");
  }

  doc.save(`${filename}_${stamp()}.pdf`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Domain-specific row builders
// ──────────────────────────────────────────────────────────────────────────────

/** Build rows + headers for a loads array (Yük İlanlarım). */
export function loadsExportData(loads) {
  const headers = [
    "İlan No",
    "Yük Adı",
    "Kalkış",
    "Varış",
    "Yük Tipi",
    "Ağırlık",
    "Araç Tipi",
    "Yükleme Tarihi",
    "Hedef Bütçe",
    "Para Birimi",
    "Teklif Sayısı",
    "Durum",
  ];
  const rows = loads.map((x) => [
    x.id ?? "",
    x.cargo ?? "",
    x.from ?? "",
    x.to ?? "",
    x.loadType ?? "",
    x.weight ?? "",
    x.vehicle ?? "",
    x.pickupDate ?? x.date ?? "",
    x.price ?? "",
    x.currency ?? "",
    String(x.offers ?? 0),
    statusLabelExport(x.status),
  ]);
  return { headers, rows };
}

/** Build rows + headers for an offers array (Gelen Teklifler). */
export function offersExportData(offers) {
  const headers = [
    "Teklif No",
    "Firma / Sürücü",
    "Tutar",
    "Para Birimi",
    "Müsaitlik",
    "Araç",
    "Durum",
    "Teklif Tarihi",
  ];
  const rows = offers.map((o) => [
    o.id ?? "",
    o.company || o.driver || "",
    o.amount ?? "",
    o.currency ?? "",
    o.eta ?? "",
    o.vehicle ?? "",
    o.status ?? "",
    o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("tr-TR")
      : "",
  ]);
  return { headers, rows };
}

/** Build rows for shipments (Sevkiyatlarım), enriched with joined load/offer. */
export function shipmentsExportData(shipments, loads = [], offers = []) {
  const headers = [
    "Sevkiyat No",
    "Yük Adı",
    "Kalkış",
    "Varış",
    "Taşıyıcı",
    "Teklif Tutarı",
    "Araç ID",
    "Durum",
    "Yükleme Tarihi",
    "Teslim Tarihi",
    "Oluşturulma Tarihi",
    "Son Güncelleme",
  ];
  const rows = shipments.map((s) => {
    const load = loads.find((l) => l.id === s.loadId);
    const offer = offers.find((o) => o.id === s.acceptedOfferId);
    return [
      s.id ?? "",
      load?.cargo ?? s.loadId ?? "",
      load?.from ?? "",
      load?.to ?? "",
      offer?.company || offer?.driver || "",
      offer?.amount ?? "",
      s.vehicleId ?? "",
      s.status ?? "",
      load?.pickupDate ?? "",
      load?.deliveryDate ?? "",
      s.createdAt
        ? new Date(s.createdAt).toLocaleString("tr-TR")
        : "",
      s.updatedAt
        ? new Date(s.updatedAt).toLocaleString("tr-TR")
        : "",
    ];
  });
  return { headers, rows };
}

/** Build rows for history matches (Geçmiş). */
export function historyExportData(records, role = "yuk-veren") {
  const headers = [
    "Sefer No",
    "Tarih",
    "Rota",
    "Yük",
    role === "sofor" ? "Taşıyıcı" : "Şoför",
    "Araç",
    "Tutar",
    "Durum",
  ];
  const rows = records.map((x) => [
    x.loadId ?? x.id ?? "",
    x.matchedAt ? new Date(x.matchedAt).toLocaleDateString("tr-TR") : "",
    x.route ?? `${x.from ?? ""} → ${x.to ?? ""}`,
    x.cargo ?? "",
    role === "sofor" ? (x.carrier ?? "") : (x.driver ?? ""),
    x.vehicle ?? "",
    x.amount ?? "",
    x.status ?? "",
  ]);
  return { headers, rows };
}

/** Static demo payment rows (PaymentCenter has no prop-driven data). */
export function paymentsExportData(rows = []) {
  const headers = [
    "İşlem",
    "Referans",
    "Para Birimi",
    "Tutar",
    "Durum",
  ];
  return { headers, rows };
}

// Internal helper — mirrors statusLabel() in Portal.jsx without importing it
function statusLabelExport(status) {
  const MAP = {
    DRAFT:           "Taslak",
    PUBLISHED:       "Teklif alıyor",
    "Teklif alıyor": "Teklif alıyor",
    "Şoför eşleşti": "Taşıyıcı seçildi",
    MATCHED:         "Taşıyıcı seçildi",
    CANCELLED:       "İptal edildi",
    IN_TRANSIT:      "Yolda",
    DELIVERED:       "Teslim edildi",
  };
  return MAP[status] || status || "";
}
