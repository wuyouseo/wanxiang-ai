import { Icon, type IconName } from "../icons/Icon";
import { Card } from "../ui/Card";

interface ActionDef {
  icon: IconName;
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface Props {
  kind: "image" | "video";
  src: string | null;
  loading?: boolean;
  emptyHint?: string;
  actions?: ActionDef[];
  height?: number;
}

export function ResultPreview({ kind, src, loading, emptyHint, actions, height = 420 }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs text-text-muted">生成结果</span>
      <Card
        className="flex items-center justify-center overflow-hidden"
        style={{ height }}
      >
        {loading ? (
          <div className="flex h-full w-full animate-breathe items-center justify-center bg-gradient-to-br from-accent-violet/10 to-accent-cyan/10">
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <Icon name={kind} size={34} />
              <span className="text-sm">正在生成中…</span>
            </div>
          </div>
        ) : src ? (
          kind === "image" ? (
            <img src={src} alt="生成结果" className="h-full w-full object-contain" />
          ) : (
            <video src={src} controls className="h-full w-full object-contain" />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <Icon name={kind} size={34} />
            <span className="text-sm">{emptyHint ?? "生成结果将显示在这里"}</span>
          </div>
        )}
      </Card>

      {src && actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`focus-ring flex items-center gap-1.5 text-sm transition-colors ${
                a.active ? "text-accent-violet" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon name={a.icon} size={16} />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
