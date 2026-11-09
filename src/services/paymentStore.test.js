/**
 * paymentStore.test.js
 * Unit tests for paymentStore helpers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_PAYMENTS,
  PAYMENT_STATUSES,
  formatPaymentAmount,
  filterPayments,
  paymentSummary,
  mapPaymentLedger,
  paymentStatusLabel,
  paymentStatusClass,
  paymentDocumentLabel,
  PAYMENT_DOCUMENT_STATUSES,
} from "./paymentStore.js";

// ── paymentSummary ────────────────────────────────────────────────

test("paymentSummary never mixes currencies", () => {
  const payments = [
    { amount: 1000, currency: "EUR", status: "PENDING" },
    { amount: 2000, currency: "GBP", status: "PENDING" },
    { amount: 500,  currency: "EUR", status: "PAID"    },
  ];
  const summary = paymentSummary(payments);
  assert.equal(summary.EUR.pending, 1000);
  assert.equal(summary.GBP.pending, 2000);
  assert.equal(summary.EUR.paid,    500);
  assert.equal(summary.GBP.paid,    0);
  assert.ok(!("USD" in summary), "no USD key should exist");
});

test("live ledger SECURED kaydını ödenmiş gibi göstermez", () => {
  const [payment] = mapPaymentLedger([{
    id: "pay-1", matchId: "match-1", amount: 2500, currency: "EUR",
    kind: "HOLD", status: "SECURED", providerReference: "provider-1",
    createdAt: "2026-11-09T12:00:00Z",
  }], {
    matches: [{ id: "match-1", loadId: "load-1", offerId: "offer-1", carrierName: "Taşıyıcı A", pickupCity: "İstanbul", dropoffCity: "Berlin" }],
    shipments: [{ id: "shipment-1", matchId: "match-1", loadId: "load-1" }],
    loads: [{ id: "load-1", cargo: "Makine" }],
  });
  assert.equal(payment.status, "SECURED");
  assert.equal(payment.paidDate, null);
  assert.equal(payment.paymentTerm, "Ödeme güvencesi");
  assert.match(payment.note, /ödeme yapıldığı anlamına gelmez/);
  assert.equal(payment.shipmentId, "shipment-1");
});

test("paymentSummary aggregates DUE_SOON and OVERDUE separately", () => {
  const payments = [
    { amount: 300, currency: "EUR", status: "DUE_SOON" },
    { amount: 700, currency: "EUR", status: "OVERDUE"  },
    { amount: 200, currency: "EUR", status: "PAID"     },
  ];
  const s = paymentSummary(payments).EUR;
  assert.equal(s.dueSoon, 300);
  assert.equal(s.overdue, 700);
  assert.equal(s.paid, 200);
  // pending = DUE_SOON + OVERDUE + PENDING
  assert.equal(s.pending, 300 + 700);
});

test("paymentSummary returns empty object for empty array", () => {
  assert.deepEqual(paymentSummary([]), {});
});

// ── formatPaymentAmount ───────────────────────────────────────────

test("formatPaymentAmount formats EUR correctly", () => {
  const result = formatPaymentAmount(4850, "EUR");
  assert.ok(result.includes("€"), `expected € in "${result}"`);
  assert.ok(result.includes("4.850") || result.includes("4850"), `expected 4850 in "${result}"`);
});

test("formatPaymentAmount formats GBP with £ symbol", () => {
  assert.ok(formatPaymentAmount(1000, "GBP").includes("£"));
});

test("formatPaymentAmount formats NOK with kr symbol", () => {
  assert.ok(formatPaymentAmount(500, "NOK").includes("kr"));
});

test("formatPaymentAmount returns — for non-finite values", () => {
  assert.equal(formatPaymentAmount(NaN, "EUR"), "—");
  assert.equal(formatPaymentAmount(undefined, "EUR"), "—");
});

// ── paymentStatusLabel ────────────────────────────────────────────

test("paymentStatusLabel maps all known statuses to Turkish", () => {
  assert.equal(paymentStatusLabel("PENDING"),   "Bekliyor");
  assert.equal(paymentStatusLabel("PAID"),       "Ödendi");
  assert.equal(paymentStatusLabel("DUE_SOON"),   "Vadesi yaklaşıyor");
  assert.equal(paymentStatusLabel("OVERDUE"),    "Vadesi geçti");
  assert.equal(paymentStatusLabel("CANCELLED"),  "İptal edildi");
});

test("paymentStatusLabel falls back to raw value for unknown status", () => {
  assert.equal(paymentStatusLabel("UNKNOWN_XYZ"), "UNKNOWN_XYZ");
});

test("paymentStatusLabel returns — for empty input", () => {
  assert.equal(paymentStatusLabel(""), "—");
  assert.equal(paymentStatusLabel(null), "—");
  assert.equal(paymentStatusLabel(undefined), "—");
});

// ── paymentStatusClass ────────────────────────────────────────────

test("paymentStatusClass returns correct CSS class names", () => {
  assert.ok(paymentStatusClass("PAID").includes("paid"));
  assert.ok(paymentStatusClass("OVERDUE").includes("overdue"));
  assert.ok(paymentStatusClass("DUE_SOON").includes("due-soon"));
  assert.ok(paymentStatusClass("PENDING").includes("pending"));
  assert.ok(paymentStatusClass("CANCELLED").includes("cancelled"));
});

// ── filterPayments ────────────────────────────────────────────────

test("filterPayments returns all payments when no filter is set", () => {
  const filters = { status: "ALL", date: "", carrier: "ALL", currency: "ALL", query: "" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.equal(result.length, DEMO_PAYMENTS.length);
});

test("filterPayments filters by status", () => {
  const filters = { status: "PAID", date: "", carrier: "ALL", currency: "ALL", query: "" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.ok(result.length > 0, "should have at least one PAID record");
  assert.ok(result.every((p) => p.status === "PAID"));
});

test("filterPayments filters by carrier", () => {
  const filters = { status: "ALL", date: "", carrier: "Anadolu Filo", currency: "ALL", query: "" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.ok(result.every((p) => p.carrier === "Anadolu Filo"));
});

test("filterPayments filters by currency", () => {
  const filters = { status: "ALL", date: "", carrier: "ALL", currency: "GBP", query: "" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.ok(result.every((p) => p.currency === "GBP"));
});

test("filterPayments filters by text query across multiple fields", () => {
  const filters = { status: "ALL", date: "", carrier: "ALL", currency: "ALL", query: "Bergen" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.ok(result.length > 0, "Bergen should match at least one route");
  assert.ok(result.every((p) =>
    JSON.stringify(p).toLowerCase().includes("bergen"),
  ));
});

test("filterPayments returns empty array when no records match", () => {
  const filters = { status: "ALL", date: "", carrier: "ALL", currency: "USD", query: "" };
  const result = filterPayments(DEMO_PAYMENTS, filters);
  assert.deepEqual(result, []);
});

// ── DEMO_PAYMENTS shape ───────────────────────────────────────────

test("DEMO_PAYMENTS have required fields", () => {
  for (const p of DEMO_PAYMENTS) {
    assert.ok(p.id,       `${p.id}: missing id`);
    assert.ok(p.carrier,  `${p.id}: missing carrier`);
    assert.ok(p.currency, `${p.id}: missing currency`);
    assert.ok(p.status,   `${p.id}: missing status`);
    assert.ok(PAYMENT_STATUSES[p.status] !== undefined, `${p.id}: unknown status "${p.status}"`);
  }
});

test("DEMO_PAYMENTS contains all required status variants", () => {
  const statuses = new Set(DEMO_PAYMENTS.map((p) => p.status));
  assert.ok(statuses.has("PAID"),     "should have PAID");
  assert.ok(statuses.has("PENDING"),  "should have PENDING");
  assert.ok(statuses.has("DUE_SOON"), "should have DUE_SOON");
  assert.ok(statuses.has("OVERDUE"),  "should have OVERDUE");
});

test("DEMO_PAYMENTS includes multiple currencies (EUR, GBP, NOK)", () => {
  const currencies = new Set(DEMO_PAYMENTS.map((p) => p.currency));
  assert.ok(currencies.has("EUR"), "should have EUR");
  assert.ok(currencies.size > 1, "should have more than one currency");
});

// ── paymentDocumentLabel ──────────────────────────────────────────

test("paymentDocumentLabel maps all document statuses", () => {
  for (const [key, label] of Object.entries(PAYMENT_DOCUMENT_STATUSES)) {
    assert.equal(paymentDocumentLabel(key), label);
  }
});
