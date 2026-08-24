import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHistoryStore } from "../../store/useHistoryStore";
import type { FeatureType, HistoryItem } from "../../lib/types";
import { Card } from "../ui/Card";

function timeAgo(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return `${Math.round(diffHour / 24)} 天前`;
}

export function HistoryRail({
  scope,
  onUseAsInput,
}: {
  scope: FeatureType;
  onUseAsInput?: (item: HistoryItem) => void;
}) {
  const { items, loaded, refresh } = useHistoryStore();

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  const recent = items.filter((i) => i.type === scope).slice(0, 6);

  return (
    <aside className="hidden w-[280px] flex-shrink-0 flex-col gap-3 border-l border-border-subtle p-6 xl:flex">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">最近生成</span>
        <Link to="/gallery" className="text-xs text-accent-violet hover:underline">
          查看全部
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-text-muted">还没有生成记录，开始创作后会显示在这里</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex max-h-40 items-center justify-center bg-surface2">
                {item.resultKind === "image" ? (
                  <img src={item.resultUrl} alt={item.prompt} className="max-h-40 w-full object-contain" />
                ) : (
                  <video src={item.resultUrl} className="max-h-40 w-full object-contain" muted playsInline preload="metadata" />
                )}
              </div>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-[11px] text-text-muted">{timeAgo(item.createdAt)}</span>
                {onUseAsInput && (
                  <button
                    onClick={() => onUseAsInput(item)}
                    className="focus-ring text-[11px] text-accent-violet hover:underline"
                  >
                    设为输入图
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </aside>
  );
}
