/**
 * ExportButton
 *
 * A dropdown button that lets the user choose between CSV, Excel, and PDF
 * (or a subset thereof) and triggers the corresponding export.
 *
 * Props:
 *   label      – string shown on the button  (default "Dışa Aktar")
 *   formats    – array subset of ["csv","xlsx","pdf"]  (default all three)
 *   onExport   – async (format: "csv"|"xlsx"|"pdf") => void
 *   disabled   – boolean  (no data → disable)
 *   className  – extra CSS class on the wrapper
 */
import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";

const FORMAT_LABELS = {
  csv:  "CSV (.csv)",
  xlsx: "Excel (.xlsx)",
  pdf:  "PDF (.pdf)",
};

export default function ExportButton({
  label = "Dışa Aktar",
  formats = ["csv", "xlsx", "pdf"],
  onExport,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  async function handleSelect(format) {
    setOpen(false);
    if (busy) return;
    setError("");
    setBusy(format);
    try {
      await onExport?.(format);
    } catch {
      setError("Dosya oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div
      className={`export-btn-wrap ${className}`}
      ref={ref}
      style={{ position: "relative", display: "inline-flex" }}
    >
      <button
        type="button"
        className="export-btn"
        disabled={disabled || !!busy}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label} — format seçin`}
      >
        {busy ? (
          <span className="button-spinner" aria-hidden="true" />
        ) : (
          <Download size={14} aria-hidden="true" />
        )}
        {busy ? "İndiriliyor…" : label}
        <ChevronDown
          size={13}
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: ".15s" }}
        />
      </button>

      {open && (
        <ul
          className="export-menu"
          role="menu"
          aria-label="Dışa aktarma formatı"
        >
          {formats.map((fmt) => (
            <li key={fmt} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelect(fmt)}
                disabled={!!busy}
              >
                {FORMAT_LABELS[fmt]}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <span className="export-error" role="alert">{error}</span>}
    </div>
  );
}
