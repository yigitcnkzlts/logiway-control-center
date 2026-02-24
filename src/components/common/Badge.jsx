export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}) {
  const baseStyles = "inline-flex items-center rounded-full font-medium transition";

  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    primary: "bg-slate-900 text-white",
    purple: "bg-purple-100 text-purple-700",
    indigo: "bg-indigo-100 text-indigo-700",
    cyan: "bg-cyan-100 text-cyan-700",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={[baseStyles, variants[variant], sizes[size], className].join(" ")}
    >
      {children}
    </span>
  );
}
