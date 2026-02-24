import { useContext } from "react";
import { ToastContext } from "../../context/ToastContext";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const typeStyles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-rose-50 border-rose-200 text-rose-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ToastContainer() {
  const context = useContext(ToastContext);

  if (!context) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = typeIcons[toast.type] || Info;
        const style = typeStyles[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${style} pointer-events-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300`}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
