import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "../components/icons/Icon";
import { HistoryRail } from "../components/workbench/HistoryRail";
import type { FeatureType } from "../lib/types";
import { useTransferStore } from "../store/useTransferStore";

const tabs: { to: string; label: string; icon: IconName; scope: FeatureType }[] = [
  { to: "text-to-image", label: "文生图", icon: "image", scope: "text-to-image" },
  { to: "image-to-image", label: "图生图", icon: "image", scope: "image-to-image" },
  { to: "multi-image", label: "多图合成", icon: "layers", scope: "multi-image" },
  { to: "video", label: "视频生成", icon: "video", scope: "video" },
];

export function WorkbenchLayout() {
  const location = useLocation();
  const setPendingImage = useTransferStore((s) => s.setPendingImage);
  const current = tabs.find((t) => location.pathname.endsWith(t.to)) ?? tabs[0];

  return (
    <div className="mx-auto flex max-w-[1680px]">
      <aside className="hidden w-[220px] flex-shrink-0 flex-col gap-1.5 border-r border-border-subtle p-5 md:flex">
        <span className="mb-2 px-2 text-xs uppercase tracking-wide text-text-muted">创作功能</span>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `focus-ring flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent-gradient text-white shadow-glow"
                  : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
              }`
            }
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </NavLink>
        ))}
      </aside>

      <div className="min-w-0 flex-1 px-5 py-6 md:px-8">
        <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `focus-ring flex-shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-transparent bg-accent-gradient text-white"
                    : "border-border-subtle text-text-secondary"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
        <div className="mx-auto max-w-3xl">
          <Outlet />
        </div>
      </div>

      <HistoryRail
        scope={current.scope}
        onUseAsInput={(item) => {
          if (item.resultKind === "image") setPendingImage(item.resultUrl);
        }}
      />
    </div>
  );
}
