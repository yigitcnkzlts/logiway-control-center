// Form alan sarıcı - label, input ve hata/yardım metni içerir
export default function FormGroup({
  label,
  error,
  help,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Üstte label metni - gerekli alanlar kırmızı yıldız ile işaretlenir */}
      {label && (
        <label className="block text-sm font-medium text-slate-900">
          {label}
          {required && <span className="text-rose-600 ml-1">*</span>}
        </label>
      )}

      {/* İçeride form alanı (input, select, textarea vb.) */}
      <div>
        {children}
      </div>

      {/* Hata mesajı - varsa kırmızı renkte uyarı ikonu ile gösterilir */}
      {error && (
        <p className="text-sm text-rose-600 flex items-start gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}

      {/* Yardımcı metin - alttan ipucu bilgisi, hata yoksa gösterilir */}
      {help && !error && (
        <p className="text-sm text-slate-500">
          {help}
        </p>
      )}
    </div>
  );
}
