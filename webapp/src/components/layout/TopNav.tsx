import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../icons/Icon";
import { Logo } from "./Logo";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTaskStore } from "../../store/useTaskStore";

const navItems = [
  { to: "/studio/text-to-image", label: "创作工作台", match: "/studio" },
  { to: "/gallery", label: "历史画廊", match: "/gallery" },
  { to: "/tasks", label: "任务中心", match: "/tasks" },
  { to: "/help", label: "帮助中心", match: "/help" },
];

const keyStatusMeta = {
  unconfigured: { color: "bg-text-muted", label: "未配置 Key" },
  unverified: { color: "bg-warning", label: "未验证" },
  verified: { color: "bg-success", label: "已连接" },
  invalid: { color: "bg-danger", label: "验证失败" },
};

export function TopNav() {
  const keyStatus = useSettingsStore((s) => s.keyStatus);
  const pending = useTaskStore((s) => s.pendingCount());
  const meta = keyStatusMeta[keyStatus];
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-subtle bg-canvas/80 px-6 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-8">
        <Logo size={30} />
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`focus-ring relative text-sm transition-colors ${
                location.pathname.startsWith(item.match)
                  ? "font-medium text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
              {item.to === "/tasks" && pending > 0 && (
                <span className="absolute -right-3.5 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-violet text-[10px] font-semibold text-white">
                  {pending}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className={`h-2 w-2 rounded-full ${meta.color}`} />
          <span className="text-xs text-text-secondary">{meta.label}</span>
        </div>
        <ThemeToggle />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `focus-ring flex h-9 w-9 items-center justify-center rounded-control border transition-colors ${
              isActive
                ? "border-accent-violet/50 bg-accent-violet/10 text-accent-violet"
                : "border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
            }`
          }
          aria-label="设置"
        >
          <Icon name="gear" size={17} />
        </NavLink>
      </div>
    </header>
  );
}
