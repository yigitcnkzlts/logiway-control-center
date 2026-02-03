export default function RecentLoadsTable({ items = [], onOpen }) {
  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Son İlanlar</h3>
        <p className="lw-card-subtitle">En güncel ilan hareketleri</p>
      </div>

      <div className="lw-table-wrap">
        <table className="lw-table">
          <thead>
            <tr>
              <th>İlan No</th>
              <th>Güzergah</th>
              <th>Tonaj</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th className="lw-th-right">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td className="lw-mono">{x.code}</td>
                <td>{x.route}</td>
                <td>{x.weight}</td>
                <td>
                  <span className={`lw-badge ${x.statusTone}`}>{x.statusText}</span>
                </td>
                <td>{x.date}</td>
                <td className="lw-td-right">
                  <button type="button" className="lw-link" onClick={() => onOpen?.(x)}>
                    Detay
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="lw-empty">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
