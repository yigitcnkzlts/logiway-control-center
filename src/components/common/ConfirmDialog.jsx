import { AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Evet, Devam Et",
  cancelText = "İptal",
  danger = false,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {danger ? (
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          ) : (
            <CheckCircle className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
