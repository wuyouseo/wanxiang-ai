import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-card glass-panel ${className}`} {...rest} />;
}

export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs font-medium uppercase tracking-wide text-text-muted ${className}`}>{children}</div>;
}
