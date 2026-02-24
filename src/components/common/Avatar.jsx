export default function Avatar({
  src,
  initials,
  size = "md",
  className = "",
  online = false,
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-br from-slate-300 to-slate-400
          flex items-center justify-center font-semibold text-white
        `}>
          {initials}
        </div>
      )}

      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}
