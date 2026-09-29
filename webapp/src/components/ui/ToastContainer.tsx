import { useToastStore, type ToastKind } from "../../store/useToastStore";
import { Icon, type IconName } from "../icons/Icon";

const kindIcon: Record<ToastKind, IconName> = {
  success: "checkCircle",
  warning: "alert",
  danger: "alert",
  info: "sparkle",
};

const kindClasses: Record<ToastKind, string> = {
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
  info: "border-accent-violet/40 text-accent-violet",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 rounded-control border bg-surface/95 px-4 py-3 shadow-card backdrop-blur-xl ${kindClasses[t.kind]}`}
        >
          <Icon name={kindIcon[t.kind]} size={18} className="mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-sm text-text-primary">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="关闭通知"
            className="focus-ring flex-shrink-0 text-text-muted hover:text-text-primary"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
