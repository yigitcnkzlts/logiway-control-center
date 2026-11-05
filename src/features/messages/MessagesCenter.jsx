/**
 * MessagesCenter — Logiway Mesaj Merkezi
 *
 * Props:
 *   demo           – boolean (demo modu; localStorage kullan)
 *   onOpenShipment – () => void   (Sevkiyatlarım'a git)
 *   onOpenOffers   – () => void   (Gelen Teklifler'e git)
 *   loads          – load[] (yük ilanı eşleştirmesi için)
 *   offers         – offer[] (teklif bilgisi için)
 *   initialConvId  – string (belirli bir konuşmayı aç)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  MessageCircle,
  Paperclip,
  Phone,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { listMatchMessages, sendMatchMessage } from "../../api/operationsClient";
import { isApiConfigured, isDemoMode } from "../../api/apiClient";
import { getSession } from "../../api/authClient";
import { loadMyMatches } from "../../api/marketplaceClient";
import {
  appendMessage,
  getConversations,
  getMessages,
  markConversationRead,
  subscribeMessages,
} from "../../services/messageStore";

// ── Demo seed conversations ────────────────────────────────────────
const DEMO_SEED_CONVERSATIONS = [
  {
    id: "conv-demo-1",
    matchId: null,
    loadId: "LW-2847",
    offerId: "offer-1",
    company: "ABC Logistics",
    contactName: "Lars Johansen",
    contactPhone: "+47 912 34 567",
    reference: "LW-3012",
    route: "Tekirdağ → Berlin",
    verified: true,
    unread: 2,
    last: "Aracı yükleme için planladık.",
    time: "10:42",
    kind: "load",
    businessStatus: "Teklif Kabul Edildi",
    amount: "3.750 €",
    demo: true,
  },
  {
    id: "conv-demo-2",
    matchId: null,
    loadId: "LW-2844",
    offerId: "offer-2",
    company: "NordCargo AS",
    contactName: "Marco Bianchi",
    contactPhone: "+39 334 567 890",
    reference: "SHP-2847",
    route: "Bergen → Milano",
    verified: true,
    unread: 0,
    last: "ETA güncellendi: 18:30",
    time: "Dün",
    kind: "shipment",
    businessStatus: "Yolda",
    amount: "4.650 €",
    demo: true,
  },
  {
    id: "conv-demo-3",
    matchId: null,
    loadId: "LW-2838",
    offerId: "offer-3",
    company: "EuroTrans GmbH",
    contactName: "Erik Müller",
    contactPhone: "+49 151 234 56789",
    reference: "LW-2838",
    route: "Rotterdam → Torino",
    verified: false,
    unread: 0,
    last: "Teklif detayları bekleniyor.",
    time: "2 gün önce",
    kind: "load",
    businessStatus: "Teklif Bekliyor",
    amount: "3.650 €",
    demo: true,
  },
];

const DEMO_SEED_MESSAGES = {
  "conv-demo-1": [
    { id: "sys-d1", system: true, text: "LW-3012 ilanı için konuşma başlatıldı", time: "09:50" },
    { id: "msg-d1-1", mine: false, text: "Merhaba, teklifimizle ilgili sorularınızı yanıtlayabiliriz.", time: "10:31", status: "read" },
    { id: "msg-d1-2", mine: true,  text: "Araç ve şoför atamasını ne zaman paylaşabilirsiniz?", time: "10:38", status: "read" },
    { id: "msg-d1-3", mine: false, text: "Aracı yükleme için planladık. Şoför ataması 30 dk içinde gelecek.", time: "10:42", status: "read" },
  ],
  "conv-demo-2": [
    { id: "sys-d2", system: true, text: "Sevkiyat SHP-2847 oluşturuldu", time: "Dün 08:00" },
    { id: "msg-d2-1", mine: false, text: "Bergen'den yükü aldık. Yola çıktık.", time: "Dün 09:15", status: "read" },
    { id: "msg-d2-2", mine: true,  text: "Teşekkürler. Hamburg geçişinden haber verir misiniz?", time: "Dün 09:30", status: "read" },
    { id: "msg-d2-3", mine: false, text: "ETA güncellendi: 18:30", time: "Dün 14:22", status: "read" },
  ],
  "conv-demo-3": [
    { id: "sys-d3", system: true, text: "LW-2838 ilanı için konuşma başlatıldı", time: "2 gün önce" },
    { id: "msg-d3-1", mine: false, text: "Teklifinizi aldık, detayları inceliyoruz.", time: "2 gün önce 14:00", status: "read" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────
function MessageStatus({ status }) {
  if (!status) return null;
  if (status === "sending") return <Clock3 size={11} className="msg-status sending" aria-label="Gönderiliyor" />;
  if (status === "sent")    return <Check size={11} className="msg-status sent" aria-label="Gönderildi" />;
  if (status === "read")    return <CheckCheck size={11} className="msg-status read" aria-label="Okundu" />;
  if (status === "failed")  return <AlertTriangle size={11} className="msg-status failed" aria-label="Gönderilemedi" />;
  return null;
}

function statusPillClass(status = "") {
  if (!status) return "conv-biz-pill";
  const s = status.toLowerCase();
  if (s.includes("yolda") || s.includes("transit"))   return "conv-biz-pill conv-biz-pill--transit";
  if (s.includes("kabul") || s.includes("accepted"))  return "conv-biz-pill conv-biz-pill--accepted";
  if (s.includes("iptal") || s.includes("cancel"))    return "conv-biz-pill conv-biz-pill--cancelled";
  return "conv-biz-pill";
}

// ── ContactCard ────────────────────────────────────────────────────
function ContactCard({ conv }) {
  // Only show contact details for accepted/shipment conversations to
  // prevent exposing phone numbers for pending offers.
  const status = (conv.businessStatus || "").toLowerCase();
  const isEligible =
    status.includes("kabul") ||
    status.includes("yolda") ||
    status.includes("accepted") ||
    conv.kind === "shipment";

  if (!conv.contactName && !conv.company) return null;

  return (
    <div className="contact-card" aria-label="İletişim bilgileri">
      <ShieldCheck size={13} className="contact-card-icon" aria-hidden="true" />
      <div className="contact-card-body">
        <strong>{conv.contactName || conv.company}</strong>
        <small>{conv.company}</small>
      </div>
      {isEligible && conv.contactPhone ? (
        <a
          href={`tel:${conv.contactPhone.replace(/\s/g, "")}`}
          className="contact-call-btn"
          aria-label={`${conv.contactName || conv.company}'ı ara: ${conv.contactPhone}`}
        >
          <Phone size={13} aria-hidden="true" />
          <span>{conv.contactPhone}</span>
        </a>
      ) : !isEligible ? (
        <span className="contact-restricted" title="Teklif kabul edildikten sonra iletişim bilgileri görünür">
          Teklif kabul edilince görünür
        </span>
      ) : null}
      {conv.demo && (
        <span className="demo-badge-inline" style={{ marginLeft: "auto" }}>DEMO</span>
      )}
    </div>
  );
}

// ── OfferInfoPanel ─────────────────────────────────────────────────
function OfferInfoPanel({ conv, loads, offers, onOpenOffers }) {
  if (!conv.offerId && !conv.loadId) return null;

  const load   = loads?.find((l) => l.id === conv.loadId);
  const offer  = offers?.find((o) =>
    String(o.id) === String(conv.offerId) ||
    String(o.load) === String(conv.loadId)
  );

  if (!load && !offer) return null;

  return (
    <div className="offer-info-panel">
      <div className="oip-header">
        <FileText size={13} aria-hidden="true" />
        <span>Teklif Bilgileri</span>
      </div>
      <div className="oip-body">
        {load && (
          <div className="oip-row">
            <small>YÜK</small>
            <strong>{load.cargo || conv.reference}</strong>
          </div>
        )}
        {load && (load.from || load.to) && (
          <div className="oip-row">
            <small>GÜZERGAH</small>
            <strong>{load.from || ""} → {load.to || ""}</strong>
          </div>
        )}
        {(offer?.amount || conv.amount) && (
          <div className="oip-row">
            <small>TEKLİF TUTARI</small>
            <strong className="oip-amount">{offer?.amount || conv.amount}</strong>
          </div>
        )}
        {(offer?.status || conv.businessStatus) && (
          <div className="oip-row">
            <small>DURUM</small>
            <em className={statusPillClass(offer?.status || conv.businessStatus)}>
              {offer?.status || conv.businessStatus}
            </em>
          </div>
        )}
      </div>
      {onOpenOffers && (
        <button className="oip-cta" onClick={onOpenOffers} aria-label="Teklif karşılaştırmaya git">
          <ExternalLink size={12} aria-hidden="true" />
          Teklifleri Karşılaştır
        </button>
      )}
    </div>
  );
}

// ── ConversationList ───────────────────────────────────────────────
function ConversationList({ conversations, selectedId, onSelect, query, onQuery }) {
  return (
    <aside className="conversation-list" aria-label="Konuşmalar">
      <div className="messages-title">
        <div>
          <span className="section-kicker">İLETİŞİM MERKEZİ</span>
          <h2>Mesajlar</h2>
        </div>
      </div>

      <label className="conversation-search" aria-label="Konuşma arama">
        <Search size={15} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Firma veya yük ara"
          aria-label="Firma veya yük ara"
        />
        {query && (
          <button onClick={() => onQuery("")} aria-label="Aramayı temizle">
            <X size={13} />
          </button>
        )}
      </label>

      {conversations.length === 0 && (
        <div className="conv-empty" role="status">
          <MessageCircle size={24} aria-hidden="true" />
          <p>Konuşma bulunamadı.</p>
        </div>
      )}

      {conversations.map((conv) => (
        <button
          key={conv.id}
          className={`conv-item ${selectedId === conv.id ? "conv-item--active" : ""}`}
          onClick={() => onSelect(conv.id)}
          aria-current={selectedId === conv.id ? "true" : undefined}
          aria-label={`${conv.company}, ${conv.reference}${conv.unread > 0 ? `, ${conv.unread} okunmamış mesaj` : ""}`}
        >
          <span className="conversation-avatar" aria-hidden="true">
            {(conv.company || "?").slice(0, 2).toUpperCase()}
          </span>
          <span className="conv-body">
            <strong className="conv-company">
              {conv.company}
              {conv.verified && <ShieldCheck size={11} aria-hidden="true" className="conv-verified" />}
              {conv.demo && <span className="conv-demo-tag">DEMO</span>}
            </strong>
            <small className="conv-ref">{conv.reference} · {conv.route}</small>
            <p className="conv-last">{conv.last}</p>
          </span>
          <span className="conversation-meta">
            <small>{conv.time}</small>
            {conv.unread > 0 && (
              <b className="conv-unread" aria-label={`${conv.unread} okunmamış`}>{conv.unread}</b>
            )}
            {conv.businessStatus && (
              <em className="conv-biz-status">{conv.businessStatus}</em>
            )}
          </span>
        </button>
      ))}
    </aside>
  );
}

// ── ReferenceCard ──────────────────────────────────────────────────
function ReferenceCard({ conv, onOpenDetail }) {
  return (
    <div className="ref-card" aria-label={`${conv.kind === "shipment" ? "Sevkiyat" : "Yük"} referansı: ${conv.reference}`}>
      <div className="ref-card-body">
        <div className="ref-card-id">
          <FileText size={14} aria-hidden="true" />
          <strong>{conv.reference}</strong>
        </div>
        <div className="ref-card-details">
          <span>{conv.route}</span>
          {conv.amount && <span>{conv.amount}</span>}
          {conv.businessStatus && (
            <em className={`ref-card-status ${conv.businessStatus === "Yolda" ? "ref-card-status--transit" : ""}`}>
              {conv.businessStatus}
            </em>
          )}
        </div>
      </div>
      {onOpenDetail && (
        <button
          className="ref-card-cta"
          onClick={onOpenDetail}
          aria-label={`${conv.reference} detayını aç`}
        >
          {conv.kind === "shipment" ? "Sevkiyatı Gör" : "İlanı Gör"}
          <ChevronRight size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ── ConversationView ───────────────────────────────────────────────
function ConversationView({
  conv, messages, onSend, onBack, onOpenDetail, onOpenOffers,
  sending, loads, offers,
}) {
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Focus composer when conversation opens
    inputRef.current?.focus();
  }, [conv?.id]);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get("message") || "").trim();
    if (!text) return;
    onSend(text);
    e.currentTarget.reset();
    inputRef.current?.focus();
  }

  return (
    <div className="conversation-detail">
      {/* Header */}
      <header className="conv-header">
        <button className="mobile-back" onClick={onBack} aria-label="Konuşmalar listesine dön">
          <ArrowLeft size={18} />
        </button>
        <div className="conv-header-firm">
          <strong>
            {conv.company}
            {conv.verified && <ShieldCheck size={13} aria-hidden="true" className="conv-verified" />}
            {conv.demo && <span className="conv-demo-tag">DEMO</span>}
          </strong>
          <small>{conv.reference} · {conv.route}</small>
        </div>
        <div className="conv-header-status">
          {conv.businessStatus && (
            <em className={statusPillClass(conv.businessStatus)}>
              {conv.businessStatus}
            </em>
          )}
          {onOpenDetail && (
            <button className="conv-header-action" onClick={onOpenDetail} aria-label="Detay sayfasını aç">
              {conv.kind === "shipment" ? "Sevkiyatı Aç" : "İlanı Aç"}
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <button className="conv-close" onClick={onBack} aria-label="Konuşmayı kapat">
          <X size={16} />
        </button>
      </header>

      {/* Reference card */}
      <ReferenceCard conv={conv} onOpenDetail={onOpenDetail} />

      {/* Contact info */}
      <ContactCard conv={conv} />

      {/* Offer info panel */}
      <OfferInfoPanel
        conv={conv}
        loads={loads}
        offers={offers}
        onOpenOffers={onOpenOffers}
      />

      {/* Messages */}
      <div className="message-history" role="log" aria-live="polite" aria-label="Mesaj geçmişi">
        {messages.map((msg) => {
          if (msg.system) {
            return (
              <div key={msg.id} className="msg-system" role="note">
                <BadgeCheck size={11} aria-hidden="true" />
                <span>{msg.text}</span>
                <time>{msg.time}</time>
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`message ${msg.mine ? "mine" : ""} ${msg.status === "sending" ? "message--sending" : ""} ${msg.status === "failed" ? "message--failed" : ""}`}
            >
              <p>{msg.text}</p>
              <div className="msg-meta">
                <time>{msg.time}</time>
                {msg.mine && <MessageStatus status={msg.status} />}
                {msg.status === "failed" && (
                  <button className="msg-retry" aria-label="Mesajı tekrar gönder" onClick={() => onSend(msg.text, msg.id)}>
                    Tekrar dene
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} aria-hidden="true" />
      </div>

      {/* Composer */}
      <form className="message-composer" onSubmit={handleSubmit} aria-label="Mesaj gönder">
        <button
          type="button"
          className="composer-attach"
          aria-label="Dosya ekle (yakında)"
          title="Dosya ekleme yakında geliyor"
          disabled
        >
          <Paperclip size={17} aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          name="message"
          placeholder="Mesajınızı yazın…"
          autoComplete="off"
          aria-label="Mesajınızı yazın"
          disabled={sending}
        />
        <button
          type="submit"
          aria-label="Mesaj gönder"
          disabled={sending}
          className={sending ? "composer-sending" : ""}
        >
          {sending ? <Clock3 size={17} aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}

// ── MessagesCenter (main) ──────────────────────────────────────────
export default function MessagesCenter({
  demo: demoProp,
  onOpenShipment,
  onOpenOffers,
  loads = [],
  offers = [],
  initialConvId,
}) {
  const demo = demoProp ?? (!isApiConfigured() || isDemoMode());

  // ── State ──────────────────────────────────────────────────────
  const [conversations, setConversations] = useState(() =>
    demo ? getConversations(DEMO_SEED_CONVERSATIONS) : [],
  );

  // Per-conversation message cache: { convId → msg[] }
  const [msgCache, setMsgCache] = useState(() => {
    if (!demo) return {};
    // Pre-load seed messages from store (or fall back to DEMO_SEED_MESSAGES)
    const cache = {};
    DEMO_SEED_CONVERSATIONS.forEach((c) => {
      cache[c.id] = getMessages(c.id, DEMO_SEED_MESSAGES[c.id] || []);
    });
    return cache;
  });

  const [selected,    setSelected]    = useState(initialConvId || conversations[0]?.id || null);
  const [sending,     setSending]     = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [query,       setQuery]       = useState("");

  const current = conversations.find((c) => c.id === selected) || null;

  // ── Subscribe to cross-tab changes (demo) ──────────────────────
  useEffect(() => {
    if (!demo) return;
    return subscribeMessages(() => {
      setConversations(getConversations(DEMO_SEED_CONVERSATIONS));
    });
  }, [demo]);

  // ── Mark read when opening a conversation ──────────────────────
  useEffect(() => {
    if (!selected || !demo) return;
    markConversationRead(selected);
    setConversations((prev) =>
      prev.map((c) => (c.id === selected ? { ...c, unread: 0 } : c)),
    );
    // Load messages from store if not in cache
    setMsgCache((prev) => {
      if (prev[selected]) return prev;
      const msgs = getMessages(selected, DEMO_SEED_MESSAGES[selected] || []);
      return { ...prev, [selected]: msgs };
    });
  }, [selected, demo]);

  // ── Live API: load conversations from matches ──────────────────
  useEffect(() => {
    if (demo) return;
    loadMyMatches()
      .then((matches) => {
        const normalized = matches.map((match) => ({
          id: `match-${match.id}`,
          matchId: match.id,
          company: "Eşleşen operasyon ortağı",
          reference: String(match.id).slice(0, 8).toUpperCase(),
          route: match.cargo || "Eşleşme sohbeti",
          verified: true,
          unread: 0,
          last: "Güvenli sohbeti başlatın.",
          time: match.matchedAt ? new Date(match.matchedAt).toLocaleDateString("tr-TR") : "",
          kind: "shipment",
          businessStatus: match.status === "ACTIVE" ? "Aktif eşleşme" : (match.status || ""),
          amount: "",
        }));
        setConversations(normalized);
        setSelected((v) => v || normalized[0]?.id || null);
      })
      .catch(() => setConversations([]));
  }, [demo]);

  // ── Live API: load messages for selected conversation ──────────
  useEffect(() => {
    if (!current || demo) return;
    const matchId = current.matchId;
    if (!matchId) return;
    setLoadingMsgs(true);
    listMatchMessages(matchId)
      .then((data) => {
        const normalized = (Array.isArray(data) ? data : data.content || []).map((m) => ({
          id: m.id,
          mine: String(m.senderUserId) === String(getSession()?.userId),
          text: m.body || m.content || "",
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
            : "",
          status: "read",
        }));
        setMsgCache((prev) => ({ ...prev, [current.id]: normalized }));
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [current, demo]);

  // ── Send ───────────────────────────────────────────────────────
  const handleSend = useCallback(async (text, retryId) => {
    if (!current) return;
    const now = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const tempId = retryId || `temp-${Date.now()}`;
    const tempMsg = { id: tempId, mine: true, text, time: now, status: "sending" };

    // Optimistic add to cache
    setMsgCache((prev) => {
      const list = prev[current.id] || [];
      const filtered = retryId ? list.filter((m) => m.id !== retryId) : list;
      return { ...prev, [current.id]: [...filtered, tempMsg] };
    });

    setSending(true);
    try {
      if (!demo && current.matchId) {
        await sendMatchMessage(current.matchId, text);
      } else if (demo) {
        // Persist to localStorage via appendMessage
        appendMessage(current.id, { ...tempMsg, status: "sent" });
        setConversations(getConversations(DEMO_SEED_CONVERSATIONS));
      }
      setMsgCache((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || []).map((m) =>
          m.id === tempId ? { ...m, status: "sent" } : m,
        ),
      }));
    } catch {
      setMsgCache((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || []).map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m,
        ),
      }));
    } finally {
      setSending(false);
    }
  }, [current, demo]);

  // ── Select conversation ────────────────────────────────────────
  const handleSelect = useCallback((id) => {
    setSelected(id);
  }, []);

  // ── Filter conversations ───────────────────────────────────────
  const filtered = query.trim()
    ? conversations.filter(
        (c) =>
          (c.company || "").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) ||
          (c.reference || "").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) ||
          (c.route || "").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
      )
    : conversations;

  // Messages for current conv — sorted by id (insertion order)
  const currentMessages = current
    ? [...(msgCache[current.id] || [])].sort((a, b) =>
        String(a.id) > String(b.id) ? 1 : -1,
      )
    : [];

  // ── Open detail ────────────────────────────────────────────────
  function handleOpenDetail() {
    if (!current) return;
    if (current.kind === "shipment" && onOpenShipment) onOpenShipment(current);
    else if (current.kind === "load" && onOpenShipment) onOpenShipment(current);
  }

  return (
    <section
      className={`messages-center ${selected ? "has-selection" : ""}`}
      aria-label="Mesaj merkezi"
    >
      <ConversationList
        conversations={filtered}
        selectedId={selected}
        onSelect={handleSelect}
        query={query}
        onQuery={setQuery}
      />

      <div className="conversation-detail-wrap">
        {current ? (
          loadingMsgs ? (
            <div className="conv-loading" role="status" aria-live="polite">
              <Clock3 size={20} aria-hidden="true" />
              <p>Mesajlar yükleniyor…</p>
            </div>
          ) : (
            <ConversationView
              conv={current}
              messages={currentMessages}
              onSend={handleSend}
              onBack={() => setSelected(null)}
              onOpenDetail={handleOpenDetail}
              onOpenOffers={onOpenOffers}
              sending={sending}
              loads={loads}
              offers={offers}
            />
          )
        ) : (
          <div className="conversation-placeholder" role="status">
            <MessageCircle size={32} aria-hidden="true" />
            <h3>Bir konuşma seçin</h3>
            <p>Teklif veya sevkiyat üzerinden bir görüşme başladığında burada görünecek. Soldaki listeden mevcut konuşmaları açabilirsiniz.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Helper: open a specific conversation (from OfferComparison) ───
// Note: ensureConversation is exported from ../../services/messageStore directly.
