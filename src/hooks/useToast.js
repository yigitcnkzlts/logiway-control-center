import { useContext } from "react";
import { ToastContext } from "./ToastContext";

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast hook'u ToastProvider içinde kullanılmalı");
  }

  const { addToast } = context;

  return {
    success: (message, duration) => addToast(message, "success", duration),
    error: (message, duration) => addToast(message, "error", duration),
    warning: (message, duration) => addToast(message, "warning", duration),
    info: (message, duration) => addToast(message, "info", duration),
  };
}
