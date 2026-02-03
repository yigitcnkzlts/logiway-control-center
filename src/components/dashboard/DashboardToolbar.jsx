export default function DashboardToolbar({ range, onChangeRange }) {
  const items = [
    { key: "today", label: "Bugün" },
    { key: "7d", label: "Son 7 Gün" },
    { key: "30d", label: "Son 30 Gün" },
  ];

  return (
    <div className="lw-toolbar">
      <div className="lw-toolbar-left">
        <div className="lw-toolbar-title">Özet</div>
        <div className="lw-toolbar-subtitle">Zaman aralığına göre metrikler</div>
      </div>

      <div className="lw-toolbar-right">
        <div className="lw-seg">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              className={`lw-seg-btn ${range === it.key ? "is-active" : ""}`}
              onClick={() => onChangeRange(it.key)}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
