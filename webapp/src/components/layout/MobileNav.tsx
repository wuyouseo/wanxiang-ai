import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../icons/Icon";
import { useTaskStore } from "../../store/useTaskStore";

const items: { to: string; label: string; icon: IconName }[] = [
  { to: "/studio/text-to-image", label: "工作台", icon: "image" },
  { to: "/gallery", label: "画廊", icon: "grid" },
  { to: "/tasks", label: "任务", icon: "tasks" },
  { to: "/help", label: "帮助", icon: "help" },
  { to: "/settings", label: "设置", icon: "gear" },
];

export function MobileNav() {
  const pending = useTaskStore((s) => s.pendingCount());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border-subtle bg-canvas/90 backdrop-blur-xl md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `focus-ring relative flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] ${
              isActive ? "text-text-primary" : "text-text-muted"
            }`
          }
        >
          <Icon name={item.icon} size={19} />
          {item.label}
          {item.to === "/tasks" && pending > 0 && (
            <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-accent-violet" />
          )}
        </NavLink>
      ))}
    </nav>
  );
}
