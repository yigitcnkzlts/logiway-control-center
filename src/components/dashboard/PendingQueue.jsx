export default function PendingQueue({ items = [] }) {
  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Bekleyen İşler</h3>
        <p className="lw-card-subtitle">Onay ve kontrol gerektiren işlemler</p>
      </div>

      <div className="lw-list">
        {items.map((it) => (
          <div key={it.id} className="lw-list-item">
            <div className="lw-list-main">
              <div className="lw-list-title">{it.title}</div>
              <div className="lw-list-sub">{it.sub}</div>
            </div>

            <div className="lw-list-right">
              <span className={`lw-badge ${it.tone}`}>{it.badge}</span>
              <button type="button" className="lw-btn">
                İncele
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 ? <div className="lw-emptybox">Bekleyen işlem yok.</div> : null}
      </div>
    </div>
  );
}
