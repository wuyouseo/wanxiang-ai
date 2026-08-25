import { Link } from "react-router-dom";
import { Icon } from "../icons/Icon";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-lg bg-accent-gradient text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Icon name="sparkle" size={Math.round(size * 0.55)} strokeWidth={2} />
    </span>
  );
}

export function Logo({ size = 32, to = "/", showName = true }: { size?: number; to?: string; showName?: boolean }) {
  return (
    <Link to={to} className="focus-ring flex items-center gap-2.5 rounded-control">
      <LogoMark size={size} />
      {showName && <span className="text-base font-semibold tracking-tight">万象 AI</span>}
    </Link>
  );
}
