import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

const alertStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  error: "bg-rose-50 border-rose-200 text-rose-800",
};

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export default function AlertBanner({
  type = "info",
  title,
  message,
  dismissible = true,
  onDismiss,
  className = "",
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const Icon = alertIcons[type];
  const styles = alertStyles[type];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 ${styles} ${className}`}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        {message && <p className="text-sm">{message}</p>}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
