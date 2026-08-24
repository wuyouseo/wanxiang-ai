import { Icon } from "../icons/Icon";
import { useThemeStore } from "../../store/useThemeStore";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
      title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-control border border-border-subtle text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary ${className}`}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}
