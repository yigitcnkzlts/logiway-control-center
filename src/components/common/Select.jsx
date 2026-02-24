import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Dropdown select komponenti - açılır menü desteği
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = "Seçim yapın...",
  className = "",
  disabled = false,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Dışarıya tıklanca menü kapatılır
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Seçili değerin label'ını bulur
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`
          w-full h-10 rounded-xl border border-slate-200 bg-white px-3
          flex items-center justify-between gap-2 text-sm
          hover:border-slate-300 transition
          focus:outline-none focus:ring-2 focus:ring-slate-200
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}
        `}
        {...props}
      >
        {/* Seçili değeri göster */}
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {selectedLabel}
        </span>
        {/* Aşağı ok ikonu */}
        <ChevronDown size={16} className={`text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Açılır menü */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">Seçenek yok</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition
                  ${value === option.value ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"}
                `}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
