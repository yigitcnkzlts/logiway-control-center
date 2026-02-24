export default function ProgressBar({
  value = 0,
  max = 100,
  color = "slate",
  size = "md",
  showLabel = true,
  className = "",
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorMap = {
    slate: "bg-slate-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  const sizeMap = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`w-full ${sizeMap[size]} bg-slate-200 rounded-full overflow-hidden`}>
        <div
          className={`${colorMap[color]} h-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-slate-600 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
