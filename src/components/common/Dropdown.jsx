import { useState, useRef, useEffect } from "react";

export default function Dropdown({
  trigger,
  items = [],
  align = "left",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          className={`absolute ${alignClass} top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48 py-1`}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="border-t border-slate-100 my-1" />;
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={`
                  w-full text-left px-4 py-2 text-sm transition
                  flex items-center gap-2
                  ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : item.danger
                      ? "hover:bg-rose-50 text-rose-600"
                      : "hover:bg-slate-100 text-slate-700"
                  }
                `}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
