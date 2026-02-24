import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  action,
  actionLabel = "Tümünü Gör",
  className = "",
}) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>

      {action && (
        <button
          onClick={action}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
