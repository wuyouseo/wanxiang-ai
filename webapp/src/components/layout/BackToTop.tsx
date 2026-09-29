import { useEffect, useState } from "react";
import { Icon } from "../icons/Icon";

const SHOW_AFTER = 400;

/** Floating button that appears after scrolling down and smooth-scrolls back to the top. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="返回顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="focus-ring fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary shadow-lg transition-colors hover:text-text-primary md:bottom-8 md:right-8"
    >
      <Icon name="arrowUp" size={20} />
    </button>
  );
}
