"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { mdiAlertCircleOutline, mdiCheckCircleOutline } from "@mdi/js";
import { Icon } from "@/components/Icon";

type ToastKind = "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    success: (message) => pushToast("success", message),
    error: (message) => pushToast("error", message)
  }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-enter flex items-start gap-3 rounded-lg border bg-white p-4 shadow-soft ${
              toast.kind === "success" ? "border-mint" : "border-coral/35"
            }`}
          >
            <span className={`mt-0.5 ${toast.kind === "success" ? "text-moss" : "text-coral"}`}>
              <Icon path={toast.kind === "success" ? mdiCheckCircleOutline : mdiAlertCircleOutline} size={0.82} />
            </span>
            <p className="text-sm font-bold leading-5 text-ink">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
