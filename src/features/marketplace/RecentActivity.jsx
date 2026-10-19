import { Building2, Clock3, Package, Route, Truck, X } from "lucide-react";

const TYPE_ICON = {
  load:     Package,
  shipment: Route,
  company:  Building2,
  vehicle:  Truck,
  driver:   Truck,
};

/**
 * RecentlyViewed — Son görüntülenen entityler
 *
 * Props:
 *   items   – [{ type, id, label, sub }]  (prefs.recentlyViewed)
 *   onOpen  – ({ type, id }) => void
 */
export function RecentlyViewed({ items = [], onOpen }) {
  if (!items.length) return null;

  return (
    <div className="recently-viewed" aria-label="Son görüntülenenler">
      <span className="section-kicker">SON GÖRÜNTÜLENDİ</span>
      <div className="rv-list" role="list">
        {items.map((item) => {
          const Icon = TYPE_ICON[item.type] || Package;
          return (
            <button
              key={`${item.type}-${item.id}`}
              role="listitem"
              className="rv-item"
              onClick={() => onOpen?.(item)}
              aria-label={`${item.label} — ${item.sub || item.type}`}
            >
              <span className="rv-icon" aria-hidden="true"><Icon size={13} /></span>
              <span className="rv-text">
                <strong>{item.label}</strong>
                {item.sub && <small>{item.sub}</small>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * RecentSearchBadges — Search input altında son aramalar
 *
 * Props:
 *   searches  – string[]
 *   onSelect  – (query) => void
 *   onClear   – () => void
 */
export function RecentSearchBadges({ searches = [], onSelect, onClear }) {
  if (!searches.length) return null;

  return (
    <div className="recent-searches" aria-label="Son aramalar">
      <div className="rs-header">
        <span className="section-kicker">SON ARAMALAR</span>
        <button className="rs-clear" onClick={onClear} aria-label="Son aramaları temizle">
          <X size={12} aria-hidden="true" /> Temizle
        </button>
      </div>
      <div className="rs-chips" role="list">
        {searches.map((q) => (
          <button
            key={q}
            role="listitem"
            className="rs-chip"
            onClick={() => onSelect?.(q)}
            aria-label={`"${q}" aramasını tekrarla`}
          >
            <Clock3 size={11} aria-hidden="true" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
