import { Bookmark, Check, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useState } from "react";

/**
 * SavedFilters
 *
 * Props:
 *   filters       – [{ id, label, filters, savedAt }]
 *   activeFilters – current filter state object
 *   onApply       – (filters) => void
 *   onSave        – (label, filters) => void
 *   onRemove      – (id) => void
 */
export function SavedFilters({ filters = [], activeFilters, onApply, onSave, onRemove }) {
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");

  function handleSave(e) {
    e.preventDefault();
    if (!label.trim()) return;
    onSave?.(label.trim(), activeFilters);
    setLabel("");
    setSaving(false);
  }

  // Derive display label from filter object
  function filterLabel(f) {
    const parts = [];
    if (f.origin)      parts.push(f.origin);
    if (f.destination) parts.push(f.destination);
    if (f.vehicle && f.vehicle !== "Tümü") parts.push(f.vehicle);
    if (f.weight)      parts.push(`≤${f.weight} ton`);
    return parts.join(" · ") || "Filtre";
  }

  return (
    <div className="saved-filters" aria-label="Kayıtlı filtreler">
      {/* Saved filter chips */}
      {filters.length > 0 && (
        <div className="sf-chips" role="list" aria-label="Kayıtlı filtreler">
          {filters.map((f) => (
            <div key={f.id} className="sf-chip" role="listitem">
              <button
                className="sf-chip-apply"
                onClick={() => onApply?.(f.filters)}
                aria-label={`${f.label} filtresini uygula`}
              >
                <SlidersHorizontal size={11} aria-hidden="true" />
                <span>{f.label}</span>
                <small>{filterLabel(f.filters)}</small>
              </button>
              <button
                className="sf-chip-remove"
                onClick={() => onRemove?.(f.id)}
                aria-label={`${f.label} filtresini sil`}
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save current filter */}
      {!saving ? (
        <button
          className="sf-save-btn"
          onClick={() => setSaving(true)}
          aria-label="Mevcut filtreyi kaydet"
        >
          <Bookmark size={13} aria-hidden="true" />
          Filtreyi Kaydet
        </button>
      ) : (
        <form className="sf-save-form" onSubmit={handleSave} aria-label="Filtre kaydet formu">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Filtre adı (örn. İstanbul → Almanya)"
            maxLength={40}
            aria-label="Filtre adı"
          />
          <button type="submit" disabled={!label.trim()} aria-label="Kaydet">
            <Check size={13} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => { setSaving(false); setLabel(""); }} aria-label="İptal">
            <X size={13} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
