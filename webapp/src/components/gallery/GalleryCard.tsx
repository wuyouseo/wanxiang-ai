import { Icon } from "../icons/Icon";
import { Badge } from "../ui/Chip";
import { Card } from "../ui/Card";
import { dimensionsFor, formatDateTime, timeAgo, typeLabels } from "../../lib/historyFormat";
import type { FeatureType, HistoryItem } from "../../lib/types";

// Used by both the public gallery feed and the personal works tab
// (pages/GalleryPage.tsx) so a card looks identical either way — only which
// actions are available (favorite/delete) differs per tab.
export function GalleryCard({
  item,
  showFavorite,
  canDelete,
  onOpen,
  onToggleFavorite,
  onReuse,
  onRemove,
}: {
  item: HistoryItem;
  showFavorite: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onToggleFavorite?: () => void;
  onReuse: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="group relative mb-4 break-inside-avoid overflow-hidden">
      <button className="block w-full bg-surface2" onClick={onOpen}>
        {item.resultKind === "image" ? (
          <img src={item.resultUrl} alt={item.prompt} className="block h-auto w-full" loading="lazy" />
        ) : (
          <video src={item.resultUrl} className="block h-auto w-full" muted playsInline preload="metadata" />
        )}
      </button>
      {showFavorite && onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          aria-label="收藏"
          className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <Icon name={item.favorite ? "starFilled" : "star"} size={14} />
        </button>
      )}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <Badge tone="neutral">{typeLabels[item.type as FeatureType]}</Badge>
          <span className="text-[11px] text-text-muted" title={formatDateTime(item.createdAt)}>
            {timeAgo(item.createdAt)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-muted">
          <span>{dimensionsFor(item)}</span>
          <span>{formatDateTime(item.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-border-subtle px-3 py-2 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onReuse} aria-label="复用参数" className="focus-ring hover:text-text-primary">
          <Icon name="reuse" size={15} />
        </button>
        <a href={item.resultUrl} download aria-label="下载" className="focus-ring hover:text-text-primary">
          <Icon name="download" size={15} />
        </a>
        {canDelete && (
          <button onClick={onRemove} aria-label="删除" className="focus-ring hover:text-danger">
            <Icon name="trash" size={15} />
          </button>
        )}
      </div>
    </Card>
  );
}
