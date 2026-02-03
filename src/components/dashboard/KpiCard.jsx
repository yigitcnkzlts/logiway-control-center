import React from "react";

export default function KpiCard({ title, value, helper, icon }) {
  return (
    <div className="lw-kpi">
      <div className="lw-kpi-top">
        <div className="lw-kpi-title">
          <span className="lw-kpi-icon">{icon}</span>
          <span>{title}</span>
        </div>
      </div>

      <div className="lw-kpi-value">{value}</div>

      {helper ? <div className="lw-kpi-helper">{helper}</div> : null}
    </div>
  );
}
