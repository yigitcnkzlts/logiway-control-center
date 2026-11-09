import { getAuthStorage } from "../api/apiClient.js";

/**
 * paymentStore.js
 * Demo-mode local persistence for payment records.
 *
 * DESIGN:
 *  - Records are stored in localStorage, scoped to the current user.
 *  - No real money movement, no bank/card data, no payment provider calls.
 *  - Para birimleri hiçbir zaman tek toplamda birleştirilmez; özet her
 *    currency için ayrı hesaplanır.
 *
 * BACKEND CONTRACT (future):
 *  GET  /api/v1/payments          → list
 *  GET  /api/v1/payments/{id}     → detail
 *  POST /api/v1/payments/{id}/mark-paid  → mark as paid (shipper-side)
 */

// ── Constants ──────────────────────────────────────────────────────
export const PAYMENT_STATUSES = {
  PENDING:    "Bekliyor",
  PENDING_PROVIDER: "Sağlayıcı onayı bekleniyor",
  SECURED:    "Güvence altında",
  PAID:       "Ödendi",
  DUE_SOON:   "Vadesi yaklaşıyor",
  OVERDUE:    "Vadesi geçti",
  CANCELLED:  "İptal edildi",
};

export const PAYMENT_TERMS = [
  "Teslimatta ödeme",
  "7 gün vadeli",
  "15 gün vadeli",
  "30 gün vadeli",
];

export const PAYMENT_DOCUMENT_STATUSES = {
  AVAILABLE: "Dekont mevcut",
  PENDING_REVIEW: "İnceleniyor",
  MISSING: "Belge bekleniyor",
  NOT_REQUIRED: "Belge gerekmiyor",
};

// ── Demo seed data ─────────────────────────────────────────────────
export const DEMO_PAYMENTS = [
  {
    id: "PAY-2847",
    loadId: "LW-2847",
    shipmentId: "SHP-2847",
    offerId: "OFF-2847",
    loadTitle: "Endüstriyel makine parçaları",
    carrier: "NordCargo AS",
    amount: 4850,
    currency: "EUR",
    paymentTerm: "7 gün vadeli",
    dueDate: "2026-11-10",
    paidDate: null,
    status: "DUE_SOON",
    documentStatus: "PENDING_REVIEW",
    route: "Bergen → Milano",
    note: "",
    demo: true,
  },
  {
    id: "PAY-2844",
    loadId: "LW-2844",
    shipmentId: "SHP-2844",
    offerId: "OFF-2844",
    loadTitle: "Otomotiv yedek parçaları",
    carrier: "BalticFreight UAB",
    amount: 3900,
    currency: "EUR",
    paymentTerm: "15 gün vadeli",
    dueDate: "2026-11-20",
    paidDate: null,
    status: "PENDING",
    documentStatus: "MISSING",
    route: "Göteborg → Münih",
    note: "",
    demo: true,
  },
  {
    id: "PAY-2838",
    loadId: "LW-2838",
    shipmentId: "SHP-2838",
    offerId: "OFF-2838",
    loadTitle: "Paketli kimya ürünü",
    carrier: "RotterdamLogix BV",
    amount: 3650,
    currency: "GBP",
    paymentTerm: "30 gün vadeli",
    dueDate: "2026-10-15",
    paidDate: null,
    status: "OVERDUE",
    documentStatus: "AVAILABLE",
    route: "Rotterdam → Torino",
    note: "Taşıyıcı gecikme bildirimi gönderdi.",
    demo: true,
  },
  {
    id: "PAY-2798",
    loadId: "LW-2798",
    shipmentId: "SHP-2798",
    offerId: "OFF-2798",
    loadTitle: "Tekstil paletleri",
    carrier: "Anadolu Filo",
    amount: 3720,
    currency: "EUR",
    paymentTerm: "Teslimatta ödeme",
    dueDate: "2026-05-26",
    paidDate: "2026-05-26",
    status: "PAID",
    documentStatus: "AVAILABLE",
    route: "Bursa → Hamburg",
    note: "",
    demo: true,
  },
  {
    id: "PAY-2742",
    loadId: "LW-2742",
    shipmentId: "SHP-2742",
    offerId: "OFF-2742",
    loadTitle: "Makine ekipmanı",
    carrier: "Anadolu Filo",
    amount: 3240,
    currency: "EUR",
    paymentTerm: "7 gün vadeli",
    dueDate: "2026-04-27",
    paidDate: "2026-04-28",
    status: "PAID",
    documentStatus: "AVAILABLE",
    route: "Göteborg → Paris",
    note: "",
    demo: true,
  },
  {
    id: "PAY-2688",
    loadId: "LW-2688",
    shipmentId: "SHP-2688",
    offerId: "OFF-2688",
    loadTitle: "Tekstil paletleri",
    carrier: "Anadolu Filo",
    amount: 2850,
    currency: "NOK",
    paymentTerm: "15 gün vadeli",
    dueDate: "2026-04-01",
    paidDate: "2026-04-01",
    status: "PAID",
    documentStatus: "AVAILABLE",
    route: "Ankara → Varşova",
    note: "",
    demo: true,
  },
];

// ── Key helper ─────────────────────────────────────────────────────
function uid() {
  try {
    const raw = typeof localStorage !== "undefined"
      ? getAuthStorage()?.getItem("guc-session")
      : null;
    return (raw ? JSON.parse(raw) : null)?.userId || "anon";
  } catch { return "anon"; }
}
const KEY = () => `logiway-payments-${uid()}`;

// ── Storage helpers ────────────────────────────────────────────────
function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY()) || "null");
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}
function write(payments) {
  try { localStorage.setItem(KEY(), JSON.stringify(payments)); } catch { /* quota */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("logiway-payments-change", { detail: { key: KEY() } }),
    );
  }
  return payments;
}

// ── Public API ─────────────────────────────────────────────────────
/** Returns all payments; seeds with DEMO_PAYMENTS on first visit. */
export function getPayments() {
  const stored = read();
  if (stored !== null) return stored;
  return write(DEMO_PAYMENTS);
}

export function savePayments(payments) {
  return write(payments);
}

/** Subscribe to cross-tab / same-tab changes. */
export function subscribePayments(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("logiway-payments-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("logiway-payments-change", callback);
    window.removeEventListener("storage", callback);
  };
}

// ── Summary (per-currency, never mixed) ───────────────────────────
/**
 * Returns per-currency summaries.
 * { EUR: { pending, paid, dueSoon, overdue },  GBP: { ... }, ... }
 */
export function paymentSummary(payments) {
  const totals = {};
  for (const p of payments) {
    const cur = p.currency || "—";
    if (!totals[cur]) totals[cur] = { pending: 0, paid: 0, dueSoon: 0, overdue: 0 };
    const t = totals[cur];
    const amount = Number(p.amount) || 0;
    if (["PENDING", "PENDING_PROVIDER", "SECURED", "DUE_SOON", "OVERDUE"].includes(p.status)) t.pending += amount;
    if (p.status === "PAID")      t.paid     += amount;
    if (p.status === "DUE_SOON")  t.dueSoon  += amount;
    if (p.status === "OVERDUE")   t.overdue  += amount;
  }
  return totals;
}

/** Format an amount with its currency symbol. */
export function formatPaymentAmount(amount, currency) {
  const symbols = { EUR: "€", GBP: "£", TRY: "₺", USD: "$", NOK: "kr", CHF: "Fr" };
  const sym = symbols[currency] || currency;
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "—";
  const formatted = numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return `${formatted} ${sym}`;
}

// ── Status helpers ─────────────────────────────────────────────────
export function paymentStatusLabel(status) {
  return PAYMENT_STATUSES[status] || status || "—";
}

export function paymentStatusClass(status) {
  switch (status) {
    case "PAID":      return "pay-status pay-status--paid";
    case "PENDING":   return "pay-status pay-status--pending";
    case "PENDING_PROVIDER": return "pay-status pay-status--pending";
    case "SECURED":   return "pay-status pay-status--due-soon";
    case "DUE_SOON":  return "pay-status pay-status--due-soon";
    case "OVERDUE":   return "pay-status pay-status--overdue";
    case "CANCELLED": return "pay-status pay-status--cancelled";
    default:          return "pay-status";
  }
}

export function paymentDocumentLabel(status) {
  return PAYMENT_DOCUMENT_STATUSES[status] || status || "—";
}

/** Filters only the caller-provided, already-authorized data set. */
export function filterPayments(payments, filters = {}) {
  const query = String(filters.query || "").trim().toLocaleLowerCase("tr-TR");
  return payments.filter((payment) => {
    if (filters.status && filters.status !== "ALL" && payment.status !== filters.status) return false;
    if (filters.currency && filters.currency !== "ALL" && payment.currency !== filters.currency) return false;
    if (filters.carrier && filters.carrier !== "ALL" && payment.carrier !== filters.carrier) return false;
    if (filters.date && payment.dueDate !== filters.date && payment.paidDate !== filters.date && payment.createdDate !== filters.date) return false;
    if (!query) return true;
    return [
      payment.id,
      payment.loadId,
      payment.loadTitle,
      payment.shipmentId,
      payment.offerId,
      payment.carrier,
      payment.route,
    ].some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(query));
  });
}

/** Maps the authorized payment ledger response without inventing settlement or due-date data. */
export function mapPaymentLedger(rows = [], { matches = [], shipments = [], loads = [] } = {}) {
  return rows.map((row) => {
    const match = matches.find((item) => String(item.id) === String(row.matchId));
    const shipment = shipments.find((item) => String(item.matchId) === String(row.matchId));
    const loadId = match?.loadId || shipment?.loadId || null;
    const load = loads.find((item) => String(item.id) === String(loadId));
    const route = match?.pickupCity && match?.dropoffCity
      ? `${match.pickupCity} → ${match.dropoffCity}`
      : load?.from && load?.to ? `${load.from} → ${load.to}` : "—";
    return {
      id: row.id,
      matchId: row.matchId,
      loadId,
      shipmentId: shipment?.id || match?.shipment?.id || null,
      offerId: match?.offerId || null,
      loadTitle: match?.loadTitle || load?.cargo || load?.title || "—",
      carrier: match?.carrierName || "Taşıyıcı bilgisi yok",
      amount: row.amount,
      currency: row.currency,
      paymentTerm: row.kind === "HOLD" ? "Ödeme güvencesi" : row.kind || "—",
      dueDate: null,
      paidDate: null,
      createdDate: row.createdAt?.slice(0, 10) || null,
      createdAt: row.createdAt,
      status: row.status,
      documentStatus: "NOT_REQUIRED",
      providerReference: row.providerReference || null,
      route,
      note: row.status === "SECURED"
        ? "Tutar güvence kaydındadır; bu durum taşıyıcıya ödeme yapıldığı anlamına gelmez."
        : "Bu kayıt para transferi değil, ödeme sağlayıcısı hazırlık kaydıdır.",
      demo: false,
    };
  });
}
