import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Check, CheckCheck,
  ChevronRight, Clock3, FileText, MessageCircle,
  Paperclip, Search, Send, ShieldCheck, X,
} from "lucide-react";
import { listMatchMessages, sendMatchMessage } from "../../api/operationsClient";
import { isApiConfigured, isDemoMode } from "../../api/apiClient";

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_CONVERSATIONS = [
  {
    id: "conv-1",
    matchId: null,
    company: "ABC Logistics",
    reference: "LW-3012",
    route: "Tekirdağ → Berlin",
    verified: true,
    unread: 2,
    last: "Aracı yükleme için planladık.",
    time: "10:42",
    kind: "load",
    businessStatus: "Teklif Kabul Edildi",
    amount: "3.750 €",
  },
  {
    id: "conv-2",
    matchId: null,
    company: "NordCargo AS",
    reference: "SHP-2847",
    route: "Bergen → Milano",
    verified: true,
    unread: 0,
    last: "ETA güncellendi: 18:30",
    time: "Dün",
    kind: "shipment",
    businessStatus: "Yolda",
    amount: "4.650 €",
  },
];

const DEMO_MESSAGES = {
  "conv-1": [
    { id: 1, mine: false, text: "Merhaba, teklifimizle ilgili sorularınızı yanıtlayabiliriz.", time: "10:31", status: "read" },
    { id: 2, mine: true,  text: "Araç ve şoför atamasını ne zaman paylaşabilirsiniz?",        time: "10:38", status: "read" },
    { id: 3, mine: false, text: "Aracı yükleme için planladık.",                               time: "10:42", status: "read" },
    { id: "sys-1", system: true, text: "Teklif kabul edildi", time: "09:55" },
  ],
  "conv-2": [
    { id: "sys-2", system: true, text: "Sevkiyat oluşturuldu", time: "Dün 08:00" },
    { id: 1, mine: false, text: "ETA güncellendi: 18:30", time: "Dün 14:22", status: "read" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function MessageStatus({ status }) {
  if (!status) return null;
  if (status === "sending") return <Clock3 size={11} className="msg-status sending" aria-label="Gönderiliyor" />;
  if (status === "sent")    return <Check size={11} className="msg-status sent" aria-label="Gönderildi" />;
  if (status === "read")    return <CheckCheck size={11} className="msg-status read" aria-label="Okundu" />;
  if (status === "failed")  return <AlertTriangle size={11} className="msg-status failed" aria-label="Gönderilemedi" />;
  return null;
}

// ── ConversationList ───────────────────────────────────────────────────────
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
          aria-label={`${conv.company}, ${conv.reference}, ${conv.unread > 0 ? `${conv.unread} okunmamış mesaj` : ""}`}
        >
          <span className="conversation-avatar" aria-hidden="true">
            {conv.company.slice(0, 2).toUpperCase()}
          </span>
          <span className="conv-body">
            <strong className="conv-company">
              {conv.company}
              {conv.verified && <ShieldCheck size={11} aria-hidden="true" className="conv-verified" />}
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

// ── ReferenceCard ──────────────────────────────────────────────────────────
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
          Detayı Aç <ChevronRight size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ── ConversationView ───────────────────────────────────────────────────────
function ConversationView({ conv, messages, onSend, onBack, onOpenDetail, sending }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get("message") || "").trim();
    if (!text) return;
    onSend(text);
    e.currentTarget.reset();
    e.currentTarget.querySelector("input[name='message']")?.focus();
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
          </strong>
          <small>{conv.reference} · {conv.route}</small>
        </div>
        <div className="conv-header-status">
          {conv.businessStatus && (
            <em className={`conv-biz-pill ${conv.businessStatus === "Yolda" ? "conv-biz-pill--transit" : ""}`}>
              {conv.businessStatus}
            </em>
          )}
          {onOpenDetail && (
            <button className="conv-header-action" onClick={onOpenDetail} aria-label="Sevkiyatı aç">
              {conv.kind === "shipment" ? "Sevkiyatı Aç" : "İlanı Aç"}
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <button className="conv-close" onClick={onBack} aria-label="Konuşmayı kapat">
          <X size={16} />
        </button>
      </header>

      {/* Reference card (context) */}
      <ReferenceCard conv={conv} onOpenDetail={onOpenDetail} />

      {/* Messages */}
      <div className="message-history" role="log" aria-live="polite" aria-label="Mesaj geçmişi">
        {messages.map((msg) => {
          if (msg.system) {
            return (
              <div key={msg.id} className="msg-system" role="note">
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
        {/* Attachment — UI hazırlığı, backend yok */}
        <button
          type="button"
          className="composer-attach"
          aria-label="Dosya ekle (bekleniyor)"
          title="Dosya ekleme API bekleniyor"
          disabled
        >
          <Paperclip size={17} aria-hidden="true" />
        </button>
        <input
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

// ── Main MessagesCenter ────────────────────────────────────────────────────
/**
 * MessagesCenter
 *
 * Props:
 *   demo          – boolean (falls back to demo data when true)
 *   conversations – optional override array
 *   onOpenShipment – (conv) => void
 */
export default function MessagesCenter({ demo: demoProp, conversations: convProp, onOpenShipment }) {
  const demo = demoProp ?? (!isApiConfigured() || isDemoMode());
  const [conversations] = useState(convProp || DEMO_CONVERSATIONS);
  const [selected, setSelected]   = useState(conversations[0]?.id || null);
  const [messages, setMessages]   = useState(DEMO_MESSAGES);
  const [sending, setSending]     = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [query, setQuery]         = useState("");

  const current = conversations.find((c) => c.id === selected);

  // Load live messages when a conversation is selected
  useEffect(() => {
    if (!current || demo) return;
    const matchId = current.matchId;
    if (!matchId) return;
    setLoadingMsgs(true);
    listMatchMessages(matchId)
      .then((data) => {
        const normalized = (Array.isArray(data) ? data : data.content || []).map((m) => ({
          id: m.id,
          mine: m.senderRole === "SHIPPER",
          text: m.body || m.content || "",
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
            : "",
          status: "read",
        }));
        setMessages((prev) => ({ ...prev, [current.id]: normalized }));
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selected, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(text, retryId) {
    if (!current) return;

    const tempId = retryId || `temp-${Date.now()}`;
    const tempMsg = { id: tempId, mine: true, text, time: "Şimdi", status: "sending" };

    // Optimistic update
    setMessages((prev) => {
      const list = prev[current.id] || [];
      const filtered = retryId ? list.filter((m) => m.id !== retryId) : list;
      return { ...prev, [current.id]: [...filtered, tempMsg] };
    });

    setSending(true);
    try {
      if (!demo && current.matchId) {
        await sendMatchMessage(current.matchId, text, "SHIPPER");
      }
      // Mark as sent
      setMessages((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || []).map((m) =>
          m.id === tempId ? { ...m, status: "sent" } : m
        ),
      }));
    } catch {
      // Mark as failed
      setMessages((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || []).map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        ),
      }));
    } finally {
      setSending(false);
    }
  }

  const filtered = query.trim()
    ? conversations.filter(
        (c) =>
          c.company.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")) ||
          c.reference.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
      )
    : conversations;

  const currentMessages = current
    ? [
        ...(messages[current.id] || []).filter((m) => !m.system),
        ...(messages[current.id] || []).filter((m) => m.system),
      ].sort((a, b) => (a.id > b.id ? 1 : -1))
    : [];

  return (
    <section
      className={`messages-center ${selected ? "has-selection" : ""}`}
      aria-label="Mesaj merkezi"
    >
      <ConversationList
        conversations={filtered}
        selectedId={selected}
        onSelect={setSelected}
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
              onOpenDetail={onOpenShipment ? () => onOpenShipment(current) : null}
              sending={sending}
            />
          )
        ) : (
          <div className="conversation-placeholder" role="status">
            <MessageCircle size={32} aria-hidden="true" />
            <h3>Bir konuşma seçin</h3>
            <p>Yük, teklif veya sevkiyata bağlı mesajları burada yönetin.</p>
          </div>
        )}
      </div>
    </section>
  );
}
