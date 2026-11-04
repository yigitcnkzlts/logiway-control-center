/**
 * messageStore.js
 * Demo-mode local persistence for conversations and messages.
 * Completely separate from marketplaceStore — no cross-contamination.
 *
 * Data isolation:
 *  - All keys are prefixed with the session userId so different demo
 *    accounts cannot see each other's conversations.
 *  - getSession() is called lazily; if unauthenticated the fallback key
 *    "anon" is used (should not happen in normal usage).
 */
import { getSession } from "../api/authClient";

// ── Key helpers ────────────────────────────────────────────────────
function uid() {
  try { return getSession()?.userId || "anon"; } catch { return "anon"; }
}
const CONV_KEY  = () => `logiway-conv-${uid()}`;
const MSG_KEY   = (convId) => `logiway-msg-${uid()}-${convId}`;

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v !== null ? v : fallback;
  } catch { return fallback; }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("logiway-messages-change", { detail: { key } }));
  return value;
}

// ── Conversations ──────────────────────────────────────────────────
export function getConversations(seed = []) {
  const stored = read(CONV_KEY(), null);
  if (stored !== null && Array.isArray(stored)) return stored;
  // First visit: seed and persist
  return write(CONV_KEY(), seed);
}

export function saveConversations(convs) {
  return write(CONV_KEY(), convs);
}

export function upsertConversation(conv) {
  const all = getConversations([]);
  const idx = all.findIndex((c) => c.id === conv.id);
  const next = idx >= 0
    ? all.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
    : [conv, ...all];
  return saveConversations(next);
}

export function markConversationRead(convId) {
  const all = getConversations([]);
  const next = all.map((c) => (c.id === convId ? { ...c, unread: 0 } : c));
  return saveConversations(next);
}

// ── Messages per conversation ──────────────────────────────────────
export function getMessages(convId, seed = []) {
  const stored = read(MSG_KEY(convId), null);
  if (stored !== null && Array.isArray(stored)) return stored;
  return write(MSG_KEY(convId), seed);
}

export function saveMessages(convId, msgs) {
  return write(MSG_KEY(convId), msgs);
}

export function appendMessage(convId, msg) {
  const msgs = getMessages(convId, []);
  const next = [...msgs, msg];
  saveMessages(convId, next);
  // Update conversation's last message preview and timestamp
  const all = getConversations([]);
  const next2 = all.map((c) =>
    c.id === convId
      ? {
          ...c,
          last: msg.text?.slice(0, 60) || c.last,
          time: msg.time || "Şimdi",
          unread: msg.mine ? c.unread : (c.unread || 0) + 1,
        }
      : c,
  );
  saveConversations(next2);
  return next;
}

// ── Total unread ───────────────────────────────────────────────────
export function totalUnread() {
  return getConversations([]).reduce((sum, c) => sum + (c.unread || 0), 0);
}

// ── Subscribe ──────────────────────────────────────────────────────
export function subscribeMessages(callback) {
  window.addEventListener("logiway-messages-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("logiway-messages-change", callback);
    window.removeEventListener("storage", callback);
  };
}

// ── Build a conversation from a load+offer pair ────────────────────
/**
 * Creates (or returns existing) conversation linked to a load/offer.
 * Used when user clicks "Mesaj" from OfferComparison.
 */
export function ensureConversation({ loadId, loadRef, route, company, amount, offerStatus, offerId }) {
  const convId = `conv-${loadId}-${offerId || "nooffer"}`;
  const existing = getConversations([]).find((c) => c.id === convId);
  if (existing) return existing;
  const conv = {
    id: convId,
    matchId: null,
    company: company || "Taşıyıcı",
    reference: loadRef || loadId,
    route: route || "",
    verified: true,
    unread: 0,
    last: "Konuşma başlatıldı.",
    time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    kind: "load",
    businessStatus: offerStatus || "Teklif Bekliyor",
    amount: amount || "",
    offerId: offerId || null,
    loadId: loadId || null,
    demo: true,
  };
  upsertConversation(conv);
  // Seed with a system message
  const seed = [
    {
      id: `sys-${Date.now()}`,
      system: true,
      text: `${loadRef || loadId} ilanı için konuşma başlatıldı`,
      time: conv.time,
    },
  ];
  saveMessages(convId, seed);
  return conv;
}
