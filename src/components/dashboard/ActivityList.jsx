import React from "react";
export default function ActivityList({ items = [] }) {
  return (
    <div className="lw-card">
      <div className="lw-card-header">
        <h3 className="lw-card-title">Son Aktiviteler</h3>
        <p className="lw-card-subtitle">Sistemdeki son hareketler</p>
      </div>

      <div className="lw-activity">
        {items.map((a) => (
          <div key={a.id} className="lw-activity-item">
            <div className="lw-dot" />
            <div className="lw-activity-content">
              <div className="lw-activity-text">{a.text}</div>
              <div className="lw-activity-meta">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
