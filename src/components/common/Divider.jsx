export default function Divider({
  text,
  className = "",
}) {
  if (!text) {
    return <div className={`border-t border-slate-200 ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 border-t border-slate-200" />
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 border-t border-slate-200" />
    </div>
  );
}
