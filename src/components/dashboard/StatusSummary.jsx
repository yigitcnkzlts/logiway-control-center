import React, { useMemo } from "react";
export default function StatusSummary({ items = [] }) {
  const total = useMemo(
    () => items.reduce((acc, x) => acc + (Number(x.value) || 0), 0),
    [items]
  );

  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Durum Özeti</h3>
        <p className="lw-card-subtitle">İlan ve operasyon dağılımı</p>
      </div>

      <div className="lw-status-list">
        {items.map((it) => {
          const pct = total ? Math.round((it.value / total) * 100) : 0;
          return (
            <div key={it.key} className="lw-status-item">
              <div className="lw-status-row">
                <span className="lw-status-label">{it.label}</span>
                <span className="lw-status-meta">
                  {it.value} • %{pct}
                </span>
              </div>

              <div className="lw-progress">
                <div className="lw-progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
