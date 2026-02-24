import { Download, Plus, Filter } from "lucide-react";
import Button from "../common/Button";

export default function PanelLayout({
  title,
  description,
  onAdd,
  onExport,
  onFilter,
  filters = [],
  children,
  loading = false,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && (
              <p className="text-sm text-slate-600 mt-1">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">İndir</span>
              </Button>
            )}
            {onAdd && (
              <Button size="sm" onClick={onAdd} className="gap-2">
                <Plus size={16} />
                <span className="hidden sm:inline">Yeni Ekle</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-slate-600" />
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
              >
                {filter.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
}
