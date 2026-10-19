/**
 * formatters.js — Shared frontend formatters
 * Tüm component'lar bu helper'ları kullanır; her yerde ayrı format yazılmaz.
 */

// ── Money ──────────────────────────────────────────────────────────────────
const SYM = { EUR: "€", TRY: "₺", GBP: "£", USD: "$", NOK: "kr", SEK: "kr" };

/**
 * formatMoney(2750, "EUR") → "2.750 €"
 * formatMoney("3.250 €")   → "3.250 €"  (passthrough if already string)
 */
export function formatMoney(amount, currency = "EUR") {
  if (typeof amount === "string" && /[€₺£$]/.test(amount)) return amount;
  const num = Number(String(amount).replace(/[^0-9.,]/g, "").replace(",", "."));
  if (isNaN(num)) return "—";
  const sym = SYM[currency] ?? currency;
  return `${num.toLocaleString("tr-TR")} ${sym}`;
}

// ── Weight ─────────────────────────────────────────────────────────────────
/**
 * formatWeight(22000, "kg") → "22 ton"
 * formatWeight(18)          → "18 ton"
 * formatWeight("18 ton")    → "18 ton"
 */
export function formatWeight(value, unit = "ton") {
  if (typeof value === "string" && /ton|kg/i.test(value)) return value;
  const num = Number(value);
  if (isNaN(num)) return "—";
  if (unit === "kg" && num >= 1000) return `${(num / 1000).toLocaleString("tr-TR")} ton`;
  if (unit === "kg") return `${num.toLocaleString("tr-TR")} kg`;
  return `${num.toLocaleString("tr-TR")} ton`;
}

// ── Date ───────────────────────────────────────────────────────────────────
/**
 * formatDate(iso, "list")   → "2 Eki, 14:30"
 * formatDate(iso, "detail") → "2 Ekim 2026 · 14:30"
 * formatDate(iso, "day")    → "2 Ekim 2026"
 * formatDate(iso, "short")  → "2 Eki"
 */
export function formatDate(value, mode = "list") {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d)) return String(value);

  switch (mode) {
    case "list":
      return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    case "detail":
      return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} · ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
    case "day":
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    case "short":
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    case "time":
      return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    default:
      return d.toLocaleDateString("tr-TR");
  }
}

/**
 * formatRelativeTime(iso) → "4 dk önce" / "3 sa önce" / "2 gün önce"
 */
export function formatRelativeTime(value) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d)) return "";
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

// ── Status ─────────────────────────────────────────────────────────────────
/**
 * Shipment / offer backend enums → Turkish label + CSS modifier
 * { label: "Yolda", mod: "transit" }   → className: `status-badge--transit`
 */
const SHIPMENT_STATUS = {
  PLANNED:            { label: "Planlandı",            mod: "planned" },
  VEHICLE_ASSIGNED:   { label: "Araç Atandı",          mod: "assigned" },
  HEADING_TO_PICKUP:  { label: "Yüklemeye Gidiyor",    mod: "heading" },
  LOADED:             { label: "Yüklendi",             mod: "loaded" },
  IN_TRANSIT:         { label: "Yolda",                mod: "transit" },
  AT_DELIVERY:        { label: "Teslim Noktasında",    mod: "delivery" },
  DELIVERED:          { label: "Teslim Edildi",        mod: "delivered" },
  CANCELLED:          { label: "İptal",                mod: "cancelled" },
  // Turkish passthrough
  "Planlandı":        { label: "Planlandı",            mod: "planned" },
  "Yolda":            { label: "Yolda",                mod: "transit" },
  "Teslim Edildi":    { label: "Teslim Edildi",        mod: "delivered" },
  "Teklif alıyor":    { label: "Teklif Alıyor",        mod: "accepting" },
  "Şoför eşleşti":   { label: "Eşleşti",              mod: "matched" },
};

const OFFER_STATUS = {
  PENDING:      { label: "Bekliyor",       mod: "pending" },
  ACCEPTED:     { label: "Kabul Edildi",   mod: "accepted" },
  REJECTED:     { label: "Reddedildi",     mod: "rejected" },
  COUNTERED:    { label: "Karşı Teklif",   mod: "countered" },
  WITHDRAWN:    { label: "Geri Çekildi",   mod: "withdrawn" },
  "Bekliyor":   { label: "Bekliyor",       mod: "pending" },
  "Kabul edildi": { label: "Kabul Edildi", mod: "accepted" },
  "Reddedildi": { label: "Reddedildi",     mod: "rejected" },
};

export function formatStatus(value, type = "shipment") {
  const map = type === "offer" ? OFFER_STATUS : SHIPMENT_STATUS;
  return map[value] ?? { label: value || "—", mod: "default" };
}

// ── Vehicle types ──────────────────────────────────────────────────────────
const VEHICLE_LABELS = {
  REFRIGERATED:  "Frigo",
  CURTAINSIDER:  "Tenteli",
  MEGA:          "Mega",
  LOWBED:        "Lowbed",
  TRUCK:         "Kamyon",
  VAN:           "Van",
  FLATBED:       "Açık Platform",
  TANKER:        "Tanker",
  // passthrough Turkish
  Frigo:         "Frigo",
  Tenteli:       "Tenteli",
  Mega:          "Mega",
  Lowbed:        "Lowbed",
  Kamyon:        "Kamyon",
  Van:           "Van",
  Frigorifik:    "Frigo",
  Tır:           "Tır",
};

export function formatVehicleType(value) {
  return VEHICLE_LABELS[value] ?? value ?? "—";
}
