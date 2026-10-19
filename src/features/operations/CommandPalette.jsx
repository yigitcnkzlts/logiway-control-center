import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, Clock3, FileText,
  MessageCircle, Package, Route, Search,
  ShieldCheck, Truck, Users, X, Zap,
} from "lucide-react";
import { RecentSearchBadges } from "../marketplace/RecentActivity";

// ── Static search items (demo / passthrough until live search API) ─────────
const SEARCH_ITEMS = [
  { type: "Araç",     id: "34 ABC 123", label: "34 ABC 123",    sub: "Volvo FH",             icon: Truck },
  { type: "Şoför",   id: "ahmet",      label: "Ahmet Yılmaz",  sub: "Aktif görevde",        icon: Users },
  { type: "Sevkiyat",id: "SHP-2847",   label: "SHP-2847",      sub: "Bergen → Milano",      icon: Route },
  { type: "Yük",     id: "LW-3012",    label: "LW-3012",       sub: "Tekirdağ → Berlin",    icon: Package },
  { type: "Yük",     id: "LW-2847",    label: "LW-2847",       sub: "Bergen → Milano",      icon: Package },
  { type: "Firma",   id: "abc",        label: "ABC Logistics", sub: "Doğrulanmış taşıyıcı", icon: ShieldCheck },
];

// ── Quick actions per role ──────────────────────────────────────────────────
const QUICK_ACTIONS = {
  "yuk-veren": [
    { id: "new-load",    label: "Yeni Yük Oluştur",       icon: Package,        target: "Yeni Yük",          kbd: "N" },
    { id: "offers",      label: "Teklifleri Aç",           icon: FileText,       target: "Teklifler",         kbd: "O" },
    { id: "shipments",   label: "Aktif Sevkiyatları Aç",   icon: Route,          target: "Aktif Sevkiyatlar", kbd: "S" },
    { id: "messages",    label: "Mesajları Aç",            icon: MessageCircle,  target: "Mesajlar",          kbd: "M" },
  ],
  lojistik: [
    { id: "marketplace", label: "Yük Pazarını Aç",         icon: Package,        target: "Yük pazarı",        kbd: "P" },
    { id: "my-offers",   label: "Tekliflerimi Aç",         icon: FileText,       target: "Tekliflerim",       kbd: "O" },
    { id: "vehicles",    label: "Araçları Aç",             icon: Truck,          target: "Araçlar",           kbd: "V" },
    { id: "drivers",     label: "Şoförleri Aç",           icon: Users,          target: "Şoförler",         kbd: "D" },
    { id: "messages",    label: "Mesajları Aç",            icon: MessageCircle,  target: "Mesajlar",          kbd: "M" },
  ],
  sofor: [
    { id: "job",         label: "Aktif Görevi Aç",         icon: Package,        target: "Atanmış iş",       kbd: "J" },
    { id: "route",       label: "Rotayı Aç",               icon: Route,          target: "Rota",              kbd: "R" },
    { id: "messages",    label: "Mesajları Aç",            icon: MessageCircle,  target: "Mesajlar",          kbd: "M" },
  ],
};

/**
 * CommandPalette
 *
 * Props:
 *   role            – "yuk-veren" | "lojistik" | "sofor"
 *   onNavigate      – (target: string) => void
 *   onClose         – () => void
 *   recentSearches  – string[]
 *   onSearch        – (query) => void  (saves to recent)
 *   recentlyViewed  – [{ type, id, label, sub }]
 */
export function CommandPalette({
  role,
  onNavigate,
  onClose,
  recentSearches = [],
  onSearch,
  onClearSearches,
  recentlyViewed = [],
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap
  useEffect(() => { inputRef.current?.focus(); }, []);

  const actions = QUICK_ACTIONS[role] || [];
  const q = query.trim().toLowerCase();

  // Build result list
  const searchResults = q
    ? SEARCH_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sub.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      )
    : [];

  const filteredActions = q
    ? actions.filter((a) => a.label.toLowerCase().includes(q))
    : actions;

  // Flat navigable items: search results first, then actions
  const allItems = [
    ...searchResults.map((r) => ({ kind: "search", ...r })),
    ...filteredActions.map((a) => ({ kind: "action", ...a })),
  ];

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[cursor];
      if (!item) return;
      pick(item);
    }
  }

  function pick(item) {
    if (item.kind === "search") {
      onSearch?.(item.label);
    }
    if (item.kind === "action") {
      onNavigate?.(item.target);
    }
    if (query.trim()) onSearch?.(query.trim());
    onClose?.();
  }

  function handleRecentSelect(q) {
    setQuery(q);
    inputRef.current?.focus();
  }

  return (
    <div
      className="cp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Komut paleti"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="cp-panel">
        {/* Input */}
        <div className="cp-input-row">
          <Search size={17} aria-hidden="true" className="cp-search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Yük, firma, plaka, sevkiyat veya komut ara..."
            className="cp-input"
            aria-label="Arama ve komut girişi"
            aria-autocomplete="list"
            aria-controls="cp-results"
            aria-activedescendant={allItems[cursor] ? `cp-item-${cursor}` : undefined}
          />
          <kbd className="cp-esc" aria-label="Kapat">Esc</kbd>
          <button className="cp-close" onClick={onClose} aria-label="Komut paletini kapat">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div id="cp-results" className="cp-body" ref={listRef} role="listbox">

          {/* No query: show recent searches + recently viewed + quick actions */}
          {!q && (
            <>
              {recentSearches.length > 0 && (
                <RecentSearchBadges
                  searches={recentSearches}
                  onSelect={handleRecentSelect}
                  onClear={onClearSearches}
                />
              )}

              {recentlyViewed.length > 0 && (
                <div className="cp-section">
                  <span className="cp-section-label">SON GÖRÜNTÜLENDİ</span>
                  {recentlyViewed.slice(0, 5).map((item, i) => {
                    const globalIdx = i;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        id={`cp-item-${globalIdx}`}
                        role="option"
                        aria-selected={cursor === globalIdx}
                        className={`cp-item ${cursor === globalIdx ? "cp-item--active" : ""}`}
                        onClick={() => { onNavigate?.(item.target || item.type); onClose?.(); }}
                        onMouseEnter={() => setCursor(globalIdx)}
                      >
                        <span className="cp-item-type">{item.type}</span>
                        <span className="cp-item-label">{item.label}</span>
                        <small className="cp-item-sub">{item.sub}</small>
                        <ArrowRight size={13} className="cp-item-arrow" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="cp-section">
                <span className="cp-section-label">
                  <Zap size={11} aria-hidden="true" /> HIZLI İŞLEMLER
                </span>
                {actions.map((action, i) => {
                  const globalIdx = recentlyViewed.length > 0 ? Math.min(recentlyViewed.length, 5) + i : i;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      id={`cp-item-${globalIdx}`}
                      role="option"
                      aria-selected={cursor === globalIdx}
                      className={`cp-item ${cursor === globalIdx ? "cp-item--active" : ""}`}
                      onClick={() => { onNavigate?.(action.target); onClose?.(); }}
                      onMouseEnter={() => setCursor(globalIdx)}
                    >
                      <span className="cp-item-icon" aria-hidden="true"><Icon size={15} /></span>
                      <span className="cp-item-label">{action.label}</span>
                      {action.kbd && <kbd className="cp-item-kbd">{action.kbd}</kbd>}
                      <ArrowRight size={13} className="cp-item-arrow" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* With query: search results + filtered actions */}
          {q && (
            <>
              {searchResults.length > 0 && (
                <div className="cp-section">
                  <span className="cp-section-label">SONUÇLAR</span>
                  {searchResults.map((item, i) => {
                    const Icon = item.icon || Package;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        id={`cp-item-${i}`}
                        role="option"
                        aria-selected={cursor === i}
                        className={`cp-item ${cursor === i ? "cp-item--active" : ""}`}
                        onClick={() => pick({ kind: "search", ...item })}
                        onMouseEnter={() => setCursor(i)}
                      >
                        <span className="cp-item-icon" aria-hidden="true"><Icon size={15} /></span>
                        <span className="cp-item-type">{item.type}</span>
                        <span className="cp-item-label">{item.label}</span>
                        <small className="cp-item-sub">{item.sub}</small>
                        <ArrowRight size={13} className="cp-item-arrow" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredActions.length > 0 && (
                <div className="cp-section">
                  <span className="cp-section-label">KOMUTLAR</span>
                  {filteredActions.map((action, i) => {
                    const globalIdx = searchResults.length + i;
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        id={`cp-item-${globalIdx}`}
                        role="option"
                        aria-selected={cursor === globalIdx}
                        className={`cp-item ${cursor === globalIdx ? "cp-item--active" : ""}`}
                        onClick={() => { onNavigate?.(action.target); onClose?.(); }}
                        onMouseEnter={() => setCursor(globalIdx)}
                      >
                        <span className="cp-item-icon" aria-hidden="true"><Icon size={15} /></span>
                        <span className="cp-item-label">{action.label}</span>
                        <ArrowRight size={13} className="cp-item-arrow" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}

              {!searchResults.length && !filteredActions.length && (
                <div className="cp-empty" role="status">
                  <Check size={20} aria-hidden="true" />
                  <p>Eşleşen kayıt veya komut bulunamadı.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="cp-footer" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> Gezin</span>
          <span><kbd>↵</kbd> Seç</span>
          <span><kbd>Esc</kbd> Kapat</span>
        </div>
      </div>
    </div>
  );
}
