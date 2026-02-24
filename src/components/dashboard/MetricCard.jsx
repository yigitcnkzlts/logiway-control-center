import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function MetricCard({
  title,
  value,
  unit = "",
  change,
  icon,
  color = "slate",
  trend = "neutral",
  size = "md",
  className = "",
}) {
  const colorMap = {
    slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  };

  const sizeMap = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const selected = colorMap[color];
  const isPositive = trend === "up";

  return (
    <div className={`border rounded-lg ${selected.bg} ${selected.border} ${sizeMap[size]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-2xl font-bold text-slate-900">
              {value}
              {unit && <span className="text-lg text-slate-600 font-normal">{unit}</span>}
            </div>
          </div>
        </div>

        {icon && (
          <div className={`text-lg ${selected.text} opacity-50`}>
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${
          isPositive ? "text-emerald-600" : "text-rose-600"
        }`}>
          {isPositive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          <span>{Math.abs(change)}%</span>
          <span className="text-slate-600 font-normal">
            {trend === "up" ? "artış" : "azalış"}
          </span>
        </div>
      )}
    </div>
  );
}
