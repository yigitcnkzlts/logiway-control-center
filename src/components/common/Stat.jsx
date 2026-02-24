import { TrendingUp, TrendingDown } from "lucide-react";

export default function Stat({
  label,
  value,
  trend = null, // { value: number, isPositive: boolean }
  icon,
  className = "",
  color = "slate",
}) {
  const colorMap = {
    slate: "text-slate-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  const bgMap = {
    slate: "bg-slate-50",
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
  };

  return (
    <div className={`${bgMap[color]} rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {icon && (
          <div className={`${colorMap[color]} bg-white rounded p-1.5`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend.isPositive ? "text-emerald-600" : "text-rose-600"
          }`}>
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
