"use client";

import { CSSProperties, MouseEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { mdiLoading } from "@mdi/js";
import { Icon } from "@/components/Icon";

type PendingLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function PendingLink({ href, className = "", children }: PendingLinkProps) {
  const [pending, setPending] = useState(false);
  const [pendingSize, setPendingSize] = useState<{ width: number; height: number } | null>(null);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setPendingSize({ width: rect.width, height: rect.height });
    setPending(true);
  }

  const pendingStyle: CSSProperties | undefined = pendingSize
    ? { width: pendingSize.width, height: pendingSize.height }
    : undefined;

  return (
    <Link href={href} onClick={onClick} aria-busy={pending} style={pending ? pendingStyle : undefined} className={`${className} ${pending ? "pointer-events-none opacity-80" : ""}`}>
      {pending ? (
        <span className="flex w-full items-center justify-center animate-spin">
          <Icon path={mdiLoading} size={0.72} />
        </span>
      ) : children}
    </Link>
  );
}
