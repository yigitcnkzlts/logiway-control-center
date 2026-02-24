import {
  Search,
  FileText,
  Inbox,
  AlertCircle,
} from "lucide-react";

const iconMap = {
  search: Search,
  document: FileText,
  inbox: Inbox,
  error: AlertCircle,
};

export default function EmptyState({
  icon = "inbox",
  title = "Sonuç Bulunamadı",
  message = "Aradığınız veri bulunamadı veya henüz eklenmemiş.",
  action = null,
  className = "",
}) {
  const Icon = iconMap[icon] || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 p-4 rounded-full bg-slate-100">
        <Icon size={32} className="text-slate-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-slate-600 max-w-md mb-6">
        {message}
      </p>

      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
