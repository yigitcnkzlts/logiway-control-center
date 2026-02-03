export default function AlertsPanel({ items = [] }) {
  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Uyarılar</h3>
        <p className="lw-card-subtitle">Operasyonel risk ve sistem sağlığı</p>
      </div>

      <div className="lw-alerts">
        {items.map((a) => (
          <div key={a.id} className="lw-alert">
            <div className="lw-alert-left">
              <div className={`lw-alert-dot ${a.tone}`} />
              <div>
                <div className="lw-alert-title">{a.title}</div>
                <div className="lw-alert-sub">{a.sub}</div>
              </div>
            </div>
            <span className={`lw-badge ${a.tone}`}>{a.level}</span>
          </div>
        ))}

        {items.length === 0 ? <div className="lw-emptybox">Uyarı bulunmuyor.</div> : null}
      </div>
    </div>
  );
}
