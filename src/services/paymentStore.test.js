import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_PAYMENTS,
  filterPayments,
  formatPaymentAmount,
  paymentDocumentLabel,
  paymentStatusLabel,
  paymentSummary,
} from "./paymentStore.js";

test("ödeme durumları ve belge durumları Türkçe gösterilir", () => {
  assert.equal(paymentStatusLabel("PENDING"), "Bekliyor");
  assert.equal(paymentStatusLabel("PAID"), "Ödendi");
  assert.equal(paymentStatusLabel("DUE_SOON"), "Vadesi yaklaşıyor");
  assert.equal(paymentStatusLabel("OVERDUE"), "Vadesi geçti");
  assert.equal(paymentStatusLabel("CANCELLED"), "İptal edildi");
  assert.equal(paymentDocumentLabel("AVAILABLE"), "Dekont mevcut");
});

test("para birimleri ayrı özetlenir ve birbirine dönüştürülmez", () => {
  const summary = paymentSummary([
    { amount: 100, currency: "EUR", status: "PENDING" },
    { amount: 25, currency: "EUR", status: "DUE_SOON" },
    { amount: 40, currency: "GBP", status: "OVERDUE" },
    { amount: 60, currency: "GBP", status: "PAID" },
    { amount: 999, currency: "EUR", status: "CANCELLED" },
  ]);
  assert.deepEqual(summary.EUR, { pending: 125, paid: 0, dueSoon: 25, overdue: 0 });
  assert.deepEqual(summary.GBP, { pending: 40, paid: 60, dueSoon: 0, overdue: 40 });
  assert.equal(formatPaymentAmount(4850, "EUR"), "4.850 €");
  assert.equal(formatPaymentAmount(2500, "GBP"), "2.500 £");
});

test("ödeme filtreleri durum, tarih, firma, para birimi ve metin aramasını birlikte uygular", () => {
  const records = [
    { id: "PAY-1", loadId: "LW-1", loadTitle: "Makine", shipmentId: "SHP-1", carrier: "Mars", currency: "EUR", status: "PENDING", dueDate: "2026-11-10", paidDate: null },
    { id: "PAY-2", loadId: "LW-2", loadTitle: "Tekstil", shipmentId: "SHP-2", carrier: "Aras", currency: "GBP", status: "PAID", dueDate: "2026-10-01", paidDate: "2026-10-02" },
  ];
  assert.deepEqual(filterPayments(records, { query: "makine" }).map((x) => x.id), ["PAY-1"]);
  assert.deepEqual(filterPayments(records, { status: "PAID", carrier: "Aras", currency: "GBP", date: "2026-10-02" }).map((x) => x.id), ["PAY-2"]);
  assert.deepEqual(filterPayments(records, { status: "OVERDUE" }), []);
});

test("demo kayıtları açıkça işaretlidir ve boş veri sahte ödeme üretmez", () => {
  assert.ok(DEMO_PAYMENTS.length > 0);
  assert.ok(DEMO_PAYMENTS.every((payment) => payment.demo === true));
  assert.deepEqual(filterPayments([], { status: "ALL" }), []);
  assert.deepEqual(paymentSummary([]), {});
});
