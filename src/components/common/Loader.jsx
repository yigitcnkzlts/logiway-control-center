import React from "react";

/**
 * Sayfa ve komponent yüklenmelerinde tek tip loader.
 */
export default function Loader({ size = "md", text = "Yükleniyor...", className = "" }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
  };

  return (
    <div className={`flex items-center gap-2 text-slate-600 ${className}`}>
      <span
        className={`${sizes[size]} inline-block animate-spin rounded-full border-slate-300 border-t-slate-700`}
        aria-hidden="true"
      />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}