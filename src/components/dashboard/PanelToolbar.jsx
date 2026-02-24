import { Filter } from "lucide-react";

export default function PanelToolbar({
  title,
  filters,
  onFilterChange,
  actions,
  className = "",
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div>
        {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {/* Filters */}
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-600" />
            <div className="flex gap-2">
              {filters.map((filter, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer border border-slate-200"
                >
                  {filter.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="px-3 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
