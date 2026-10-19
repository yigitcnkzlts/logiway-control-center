import { Bookmark, BookmarkCheck, ExternalLink, Package } from "lucide-react";
import { formatMoney, formatWeight } from "../../utils/formatters";

/**
 * SavedLoads — Kaydedilen yük kartları görünümü
 *
 * Props:
 *   loads        – tüm yükler listesi (marketplace snapshot)
 *   savedIds     – string[]  (prefs.savedLoadIds)
 *   onToggleSave – (loadId) => void
 *   onView       – (load) => void   drawer aç
 *   compact      – boolean          density
 */
export function SavedLoads({ loads = [], savedIds = [], onToggleSave, onView, compact = false }) {
  const saved = loads.filter((l) => savedIds.includes(l.id));

  if (savedIds.length === 0 || saved.length === 0) {
    return (
      <div className="panel-empty" role="status">
        <BookmarkCheck size={28} aria-hidden="true" />
        <h3>Kaydedilen yük yok</h3>
        <p>Yük pazarında bir yükü kaydetmek için yıldız simgesine tıklayın.</p>
      </div>
    );
  }

  return (
    <div className={`saved-loads ${compact ? "saved-loads--compact" : ""}`} aria-label="Kaydedilen yükler">
      <div className="saved-loads-header">
        <span className="section-kicker">KAYDEDİLENLER</span>
        <small>{saved.length} yük kaydedildi</small>
      </div>
      <div className="saved-loads-grid">
        {saved.map((load) => (
          <div key={load.id} className="saved-load-card">
            <div className="slc-top">
              <span className="slc-icon" aria-hidden="true"><Package size={15} /></span>
              <div className="slc-info">
                <strong>{load.cargo}</strong>
                <small>{load.id}</small>
              </div>
              <button
                className="slc-bookmark slc-bookmark--saved"
                onClick={() => onToggleSave?.(load.id)}
                aria-label={`${load.cargo} kaydını kaldır`}
              >
                <BookmarkCheck size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="slc-route">
              <span>{load.from}</span>
              <span aria-hidden="true">→</span>
              <span>{load.to}</span>
            </div>
            <div className="slc-meta">
              {load.price && <span>{formatMoney(load.price)}</span>}
              {load.weight && <span>{formatWeight(load.weight)}</span>}
              {load.date && <span>{load.date}</span>}
            </div>
            <button
              className="slc-open"
              onClick={() => onView?.(load)}
              aria-label={`${load.cargo} detayını aç`}
            >
              <ExternalLink size={12} aria-hidden="true" /> Detayı Aç
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * BookmarkButton — Yük kartına eklenir
 */
export function BookmarkButton({ loadId, saved, onToggle }) {
  return (
    <button
      className={`slc-bookmark ${saved ? "slc-bookmark--saved" : ""}`}
      onClick={(e) => { e.stopPropagation(); onToggle?.(loadId); }}
      aria-label={saved ? "Kaydı kaldır" : "Kaydet"}
      aria-pressed={saved}
      title={saved ? "Kaydedildi" : "Kaydet"}
    >
      {saved
        ? <BookmarkCheck size={16} aria-hidden="true" />
        : <Bookmark size={16} aria-hidden="true" />}
    </button>
  );
}
