export default function PageHeader({ title, description, breadcrumb, right }) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <div className="mb-2 text-xs text-slate-500">
          {breadcrumb}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>

        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}