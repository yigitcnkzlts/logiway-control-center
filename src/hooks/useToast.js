import { useContext } from "react";
import { ToastContext } from "./ToastContext";

export function useToast() {
  const context = useContext(ToastContext);
  
  // Toast sistemi en üste ToastProvider ile sarılı olması gerekir
  if (!context) {
    throw new Error("useToast hook'u ToastProvider içinde kullanılmalı");
  }

  const { addToast } = context;

  // Kolay kullanım için önceden tanımlanmış yardımcı fonksiyonlar
  return {
    success: (message, duration) => addToast(message, "success", duration),
    error: (message, duration) => addToast(message, "error", duration),
    warning: (message, duration) => addToast(message, "warning", duration),
    info: (message, duration) => addToast(message, "info", duration),
  };
}
