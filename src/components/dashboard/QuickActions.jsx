export default function QuickActions() {
  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Hızlı İşlemler</h3>
        <p className="lw-card-subtitle">Sık kullanılan işlemler</p>
      </div>

      <div className="lw-actions">
        <button className="lw-btn-primary" type="button">
          + Yeni İlan
        </button>
        <button className="lw-btn-secondary" type="button">
          + Şoför Ekle
        </button>
        <button className="lw-btn-secondary" type="button">
          + Araç Ekle
        </button>
      </div>
    </div>
  );
}
