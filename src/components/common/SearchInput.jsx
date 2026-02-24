import { Search, X } from "lucide-react";
import { useState } from "react";

export default function SearchInput({
  placeholder = "Ara...",
  value = "",
  onChange,
  onSearch,
  className = "",
}) {
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChange?.("");
    onSearch?.("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition
        ${focused ? "border-slate-400 ring-2 ring-slate-200 bg-white" : "border-slate-200 bg-slate-50"}
      `}>
        <Search size={18} className="text-slate-500 flex-shrink-0" />
        
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch?.(value);
            }
          }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />

        {value && (
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
