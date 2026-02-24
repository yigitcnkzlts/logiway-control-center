// Stilize edilmiş radio button komponenti - birden bir seçim için
export default function Radio({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = "",
  value,
  ...props
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <div className="relative">
        {/* Gizli gerçek input */}
        <input
          type="radio"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          value={value}
          className="absolute inset-0 opacity-0 cursor-pointer"
          {...props}
        />
        {/* Görünür radio button - çember şekli ve iç içerik */}
        <div className={`
          w-5 h-5 rounded-full border-2 transition-all
          ${checked ? "border-slate-900 bg-white" : "border-slate-300 bg-white"}
          ${disabled ? "bg-slate-100" : ""}
        `}>
          {/* Seçili iken içeride küçük siyah daire gösterilir */}
          {checked && (
            <div className="absolute inset-1.5 rounded-full bg-slate-900" />
          )}
        </div>
      </div>
      {/* Seçeneğin label metni */}
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}
