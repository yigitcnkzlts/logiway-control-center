import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

const searchItems = [
  ["Araç", "34 ABC 123", "Volvo FH"],
  ["Şoför", "Ahmet Yılmaz", "Aktif görevde"],
  ["Sevkiyat", "SHP-2847", "Bergen → Milano"],
  ["Yük", "LW-3012", "Tekirdağ → Berlin"],
  ["Firma", "ABC Logistics", "Doğrulanmış taşıyıcı"],
];

export function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      query.trim()
        ? searchItems.filter((item) =>
            item.join(" ").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
          )
        : searchItems.slice(0, 3),
    [query]
  );

  function handleKey(e) {
    if (e.key === "Escape") onClose?.();
  }

  return (
    <div className="command-panel" role="dialog" aria-label="Global arama" aria-modal="true">
      <label>
        <Search size={16} aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Yük, firma, plaka veya sevkiyat ara..."
          aria-label="Arama sorgusu"
        />
        <button onClick={onClose} aria-label="Aramayı kapat">
          <X size={15} />
        </button>
      </label>
      <div role="listbox" aria-label="Arama sonuçları">
        {results.map(([type, title, detail]) => (
          <button
            key={`${type}-${title}`}
            onClick={onClose}
            role="option"
            aria-selected="false"
          >
            <span>{type}</span>
            <strong>{title}</strong>
            <small>{detail}</small>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ))}
        {!results.length && <p>Aramanızla eşleşen kayıt bulunamadı.</p>}
      </div>
      <footer>Arama sonuçları erişim rolünüze göre sınırlandırılır.</footer>
    </div>
  );
}
