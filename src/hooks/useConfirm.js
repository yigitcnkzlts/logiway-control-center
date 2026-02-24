import { useState } from "react";

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    danger: false,
  });

  const confirm = (config) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: config.title || "Emin misiniz?",
        message: config.message || "Bu işlem geri alınamaz.",
        danger: config.danger || false,
        onConfirm: () => {
          setState((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((prev) => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  };

  return {
    ...state,
    confirm,
    closeDialog: () => setState((prev) => ({ ...prev, open: false })),
  };
}
