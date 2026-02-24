import { Check } from "lucide-react";

export default function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer"
          {...props}
        />
        <div className={`
          w-5 h-5 rounded border-2 transition-colors
          ${checked ? "bg-slate-900 border-slate-900" : "border-slate-300 bg-white"}
          ${disabled ? "bg-slate-100" : ""}
        `}>
          {checked && (
            <Check size={16} className="text-white absolute inset-0.5" />
          )}
        </div>
      </div>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}
