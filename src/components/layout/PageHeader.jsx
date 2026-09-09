export default function PageHeader({ title, description, breadcrumb, right }) {
  return (
    <div className="mb-7 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm shadow-slate-900/[.025] sm:px-6">
      {breadcrumb && (
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
          {breadcrumb}
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="font-['Manrope'] text-2xl font-bold tracking-[-.03em] text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-slate-500">{description}</p>
          )}
        </div>

        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}
