export default function FormGroup({
  label,
  error,
  help,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-900">
          {label}
          {required && <span className="text-rose-600 ml-1">*</span>}
        </label>
      )}

      <div>
        {children}
      </div>

      {error && (
        <p className="text-sm text-rose-600 flex items-start gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}

      {help && !error && (
        <p className="text-sm text-slate-500">
          {help}
        </p>
      )}
    </div>
  );
}
