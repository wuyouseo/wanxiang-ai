import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className = "", children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={`focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent-violet/60 bg-accent-violet/15 text-text-primary"
          : "border-border-subtle bg-black/[0.015] dark:bg-white/[0.02] text-text-secondary hover:border-border-strong hover:text-text-primary"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  children: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-black/[0.03] dark:bg-white/5 text-text-secondary border-border-subtle",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    accent: "bg-accent-violet/10 text-accent-violet border-accent-violet/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
