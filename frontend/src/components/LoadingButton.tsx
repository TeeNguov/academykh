"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { mdiLoading } from "@mdi/js";
import { Icon } from "@/components/Icon";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  icon?: string;
  children: ReactNode;
};

export function LoadingButton({ loading = false, icon, children, className = "", disabled, ...props }: LoadingButtonProps) {
  return (
    <button
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">
          <Icon path={mdiLoading} size={0.76} />
        </span>
      ) : icon ? (
        <Icon path={icon} size={0.76} />
      ) : null}
      {children}
    </button>
  );
}
