"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export type TurnstileStatus = "disabled" | "loading" | "ready" | "verified" | "error";

type TurnstileWidgetProps = {
  resetSignal: number;
  onTokenChange: (token: string) => void;
  onStatusChange?: (status: TurnstileStatus) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ resetSignal, onTokenChange, onStatusChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<TurnstileStatus>(TURNSTILE_SITE_KEY ? "loading" : "disabled");

  function updateStatus(nextStatus: TurnstileStatus) {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      callback: (token) => {
        onTokenChange(token);
        updateStatus("verified");
      },
      "expired-callback": () => {
        onTokenChange("");
        updateStatus("ready");
      },
      "error-callback": () => {
        onTokenChange("");
        updateStatus("error");
      }
    });
    updateStatus("ready");

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [scriptReady, onTokenChange, onStatusChange]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange("");
      updateStatus("ready");
    }
  }, [resetSignal, onTokenChange, onStatusChange]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      updateStatus("disabled");
    }
  }, [onStatusChange]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div className="flex min-h-[78px] justify-center">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
        onError={() => updateStatus("error")}
      />
      <div className="grid min-h-[65px] w-full place-items-center rounded-md border border-line bg-cloud px-3 py-2">
        <div ref={containerRef} />
        {status === "loading" ? (
          <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-ink/48">Loading security check...</p>
        ) : status === "error" ? (
          <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-red-600">Security check unavailable</p>
        ) : null}
      </div>
    </div>
  );
}
