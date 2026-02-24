export default function StatusBadge({
  status,
  icon,
  label,
  className = "",
}) {
  const statusStyles = {
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    inactive: "bg-slate-100 text-slate-700 border border-slate-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    error: "bg-rose-100 text-rose-700 border border-rose-200",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    info: "bg-blue-100 text-blue-700 border border-blue-200",
  };

  const style = statusStyles[status] || statusStyles.inactive;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${style} ${className}`}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
