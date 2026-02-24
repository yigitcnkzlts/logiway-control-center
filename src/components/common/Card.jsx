// Kart/Container komponenti - başlık, içerik ve alt slot'ları desteği
export default function Card({
  children,
  header,
  footer,
  hover = false,
  className = "",
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-slate-200 shadow-sm
        ${hover ? "hover:shadow-md transition cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Başlık kısmı - isteğe bağlı üst bölüm */}
      {header && (
        <div className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">
          {header}
        </div>
      )}

      {/* Kart içerik alanı */}
      <div className="px-5 py-4">
        {children}
      </div>

      {/* Footer - isteğe bağlı alt bölüm */}
      {footer && (
        <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
