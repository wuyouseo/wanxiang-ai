import type { SVGProps } from "react";

const PATHS: Record<string, JSX.Element> = {
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 17l4.5-4.5 3 3L17 10l3 4" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M17 9.5l4-2.3v9.6l-4-2.3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  sparkle: <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z" />,
  gear: (
    <>
      <path d="M12 3l7.79 4.5v9L12 21l-7.79-4.5v-9L12 3z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  upload: <path d="M12 15.5V4M8 8l4-4 4 4M4.5 16v2.5a2 2 0 002 2h11a2 2 0 002-2V16" />,
  download: <path d="M12 4v11.5M8 12l4 4 4-4M4.5 19h15" />,
  star: <path d="M12 3.2l2.7 5.6 6.1.6-4.6 4.1 1.3 6-5.5-3.2-5.5 3.2 1.3-6-4.6-4.1 6.1-.6z" />,
  starFilled: (
    <path
      d="M12 3.2l2.7 5.6 6.1.6-4.6 4.1 1.3 6-5.5-3.2-5.5 3.2 1.3-6-4.6-4.1 6.1-.6z"
      fill="currentColor"
    />
  ),
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  dots: (
    <>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.2 1.8" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3L2 20h20L12 3z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <rect x="4" y="4" width="11" height="11" rx="1.5" />
    </>
  ),
  expand: <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
    </>
  ),
  filter: <path d="M4 6h16M7.5 12h9M11 18h2" />,
  retry: <path d="M4 12a8 8 0 1 1 2.6 5.9M4 12V6M4 12h6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  tasks: (
    <>
      <path d="M5 6h11M5 12h11M5 18h7" />
      <circle cx="20" cy="18" r="2" />
    </>
  ),
  wand: <path d="M4 20L15 9m3-3l1.5 1.5M15 4l1 1M20 9l1 1M9 4l1 1M4 9l1 1" />,
  plus: <path d="M12 5v14M5 12h14" />,
  eye: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A10.4 10.4 0 0112 5.5c6.5 0 10 6.5 10 6.5a17.6 17.6 0 01-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 6.5 10 6.5a10 10 0 004.2-.9" />
      <path d="M9.9 10a3 3 0 004.1 4.1" />
    </>
  ),
  reuse: <path d="M4 12a8 8 0 1 1 2.6 5.9M4 12V6M4 12h6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  className,
  ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
