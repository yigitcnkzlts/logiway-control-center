import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCSVContent,
  buildSpreadsheetData,
  historyExportData,
  loadsExportData,
  offersExportData,
  paymentsExportData,
  sanitiseSpreadsheetCell,
  shipmentsExportData,
} from "./exportService.js";

test("CSV ve Excel hücreleri formül enjeksiyonuna karşı güvenlidir", () => {
  for (const value of ["=1+1", "+SUM(A1:A2)", "-2+3", "@cmd", "  =HYPERLINK()"])
    assert.equal(sanitiseSpreadsheetCell(value), `\t${value}`);
  assert.equal(sanitiseSpreadsheetCell("Mars Lojistik"), "Mars Lojistik");
  assert.deepEqual(buildSpreadsheetData(["Firma"], [["=cmd"]]), [["Firma"], ["\t=cmd"]]);
});

test("CSV UTF-8 BOM, Türkçe karakter, tırnak ve satır sonlarını korur", () => {
  const csv = buildCSVContent(["Yük Adı", "Güzergâh"], [["İçecek, gıda", "İstanbul\nKöln"]]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /Yük Adı,Güzergâh/);
  assert.match(csv, /"İçecek, gıda"/);
  assert.match(csv, /"İstanbul\nKöln"/);
});

test("Excel çalışma kitabı gerçekten yazılıp okunabilir ve Türkçe hücreleri korur", async () => {
  const { utils, write, read } = await import("xlsx");
  const matrix = buildSpreadsheetData(["Yük Adı"], [["İstanbul → Münih"], ["=1+1"]]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(matrix), "Yükler");
  const bytes = write(workbook, { bookType: "xlsx", type: "array" });
  const parsed = read(bytes, { type: "array" });
  const values = utils.sheet_to_json(parsed.Sheets.Yükler, { header: 1 });
  assert.equal(values[1][0], "İstanbul → Münih");
  assert.equal(values[2][0], "\t=1+1");
});

test("ilan exportu yalnızca kendisine verilen filtrelenmiş veri kümesini kullanır", () => {
  const filtered = [{
    id: "LW-1", cargo: "Soğutulmuş ürün", from: "İzmir", to: "Münih",
    loadType: "Gıda", weight: "12 ton", vehicle: "Frigo", pickupDate: "2026-11-10",
    price: 4200, currency: "EUR", offers: 3, status: "PUBLISHED",
  }];
  const { headers, rows } = loadsExportData(filtered);
  assert.equal(headers.length, 12);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].slice(0, 4), ["LW-1", "Soğutulmuş ürün", "İzmir", "Münih"]);
  assert.equal(rows[0][11], "Teklif alıyor");
});

test("teklif ve sevkiyat raporları canlı API modellerini güvenli biçimde eşler", () => {
  const offer = {
    id: "OF-1", loadId: "LD-1", company: "Örnek Taşıma", amount: "3.500 €",
    currency: "EUR", eta: "2 saat", vehicle: "Tenteli", status: "Bekliyor",
    createdAt: "2026-11-03T10:00:00.000Z",
  };
  const offers = offersExportData([offer]);
  assert.equal(offers.rows[0][1], "Örnek Taşıma");
  assert.equal(offers.rows[0][2], "3.500 €");

  const shipments = shipmentsExportData(
    [{ id: "SH-1", loadId: "LD-1", acceptedOfferId: "OF-1", vehicleId: "VH-1", status: "IN_TRANSIT", updatedAt: "2026-11-03T11:00:00.000Z" }],
    [{ id: "LD-1", cargo: "Makine", from: "Bursa", to: "Köln" }],
    [offer],
  );
  assert.deepEqual(shipments.rows[0].slice(0, 5), ["SH-1", "Makine", "Bursa", "Köln", "Örnek Taşıma"]);
});

test("boş ve demo veri kümeleri için rapor üreticileri sahte kayıt eklemez", () => {
  assert.deepEqual(loadsExportData([]).rows, []);
  assert.deepEqual(offersExportData([]).rows, []);
  assert.deepEqual(shipmentsExportData([]).rows, []);
  assert.deepEqual(historyExportData([], "yuk-veren").rows, []);
  assert.deepEqual(paymentsExportData([]).rows, []);

  const demoRows = [["Demo rota", "LW-DEMO", "EUR", "1.000 €", "Demo"]];
  assert.deepEqual(paymentsExportData(demoRows).rows, demoRows);
});

test("ödeme Excel ve PDF export kaynağı tüm finans alanlarını ve Türkçe durumları içerir", () => {
  const payment = {
    id: "PAY-1", loadId: "LW-1", shipmentId: "SHP-1", offerId: "OFF-1",
    carrier: "Örnek Taşıma", route: "İstanbul → Münih", amount: 4850,
    currency: "EUR", paymentTerm: "7 gün vadeli", dueDate: "2026-11-10",
    paidDate: null, status: "DUE_SOON", documentStatus: "PENDING_REVIEW",
  };
  const { headers, rows } = paymentsExportData([payment]);
  assert.deepEqual(headers, [
    "İşlem No", "Yük İlanı", "Yük Adı", "Sevkiyat", "Teklif", "Taşıyıcı", "Güzergah",
    "Tutar", "Para Birimi", "Ödeme Koşulu", "Vade Tarihi", "Ödeme Tarihi",
    "Durum", "Belge / Dekont",
  ]);
  assert.equal(rows[0][12], "Vadesi yaklaşıyor");
  assert.equal(rows[0][13], "İnceleniyor");
});
