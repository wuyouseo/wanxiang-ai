import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../icons/Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconTrailing?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-gradient text-white shadow-glow hover:brightness-110 disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100",
  secondary:
    "bg-surface2 border border-border-subtle text-text-primary hover:border-border-strong disabled:opacity-40",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40",
  danger:
    "bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20 disabled:opacity-40",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3.5 gap-2.5",
};

// Primary/danger buttons sit on a colored fill, so the spinner reads fine in
// white; secondary/ghost sit on the page surface, which flips between near-
// white and near-black across themes, so the spinner borrows the current
// text color there instead of assuming white.
const spinnerClasses: Record<Variant, string> = {
  primary: "border-white/30 border-t-white",
  danger: "border-danger/30 border-t-danger",
  secondary: "border-text-primary/20 border-t-text-primary",
  ghost: "border-text-primary/20 border-t-text-primary",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "secondary",
    size = "md",
    icon,
    iconTrailing,
    loading,
    fullWidth,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`focus-ring inline-flex items-center justify-center rounded-control font-medium transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className={`h-4 w-4 animate-spin rounded-full border-2 ${spinnerClasses[variant]}`} />
      ) : (
        icon && <Icon name={icon} size={size === "lg" ? 20 : 16} />
      )}
      {children}
      {!loading && iconTrailing && <Icon name={iconTrailing} size={16} />}
    </button>
  );
});
