export default function Card({
  children,
  header,
  footer,
  hover = false,
  className = "",
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-slate-200 shadow-sm
        ${hover ? "hover:shadow-md transition cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">
          {header}
        </div>
      )}

      <div className="px-5 py-4">
        {children}
      </div>

      {footer && (
        <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
