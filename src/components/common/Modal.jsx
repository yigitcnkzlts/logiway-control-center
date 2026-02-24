// Temel modal dialog komponenti - başlık, içerik ve alt butonlar desteği
export default function Modal({ open, title, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Saydam arka plan overlay - tıklanınca modal kapanır */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal kutusu kendisi - ortada konumlandırılmış */}
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        {/* Başlık kısmı - üstte mesaj başlığı */}
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
        </div>

        {/* Modal içerik alanı */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer - butonlar veya diğer aksiyonlar */}
        {footer && (
          <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}