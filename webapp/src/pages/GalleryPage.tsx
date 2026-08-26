import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/icons/Icon";
import { Badge, Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useHistoryStore } from "../store/useHistoryStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTransferStore } from "../store/useTransferStore";
import { toast } from "../store/useToastStore";
import type { FeatureType, HistoryItem } from "../lib/types";

type KindFilter = "all" | "image" | "video" | "favorite";
type TypeFilter = "all" | FeatureType;

const typeLabels: Record<FeatureType, string> = {
  "text-to-image": "文生图",
  "image-to-image": "图生图",
  "multi-image": "多图合成",
  video: "视频生成",
};

const routeByType: Record<FeatureType, string> = {
  "text-to-image": "/studio/text-to-image",
  "image-to-image": "/studio/image-to-image",
  "multi-image": "/studio/multi-image",
  video: "/studio/video",
};

function timeAgo(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return `${Math.round(diffHour / 24)} 天前`;
}

export function GalleryPage() {
  const { items, loaded, refresh, toggleFavorite, remove, clearAll, exportJSON, importJSON } = useHistoryStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [preview, setPreview] = useState<HistoryItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (kindFilter === "image" && i.resultKind !== "image") return false;
      if (kindFilter === "video" && i.resultKind !== "video") return false;
      if (kindFilter === "favorite" && !i.favorite) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      return true;
    });
  }, [items, kindFilter, typeFilter]);

  async function handleExport() {
    const json = await exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-studio-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      await importJSON(text);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "导入失败，文件格式不正确");
    }
  }

  function reuse(item: HistoryItem) {
    setPendingReuse(item);
    navigate(routeByType[item.type as FeatureType]);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">历史画廊</h1>
          <p className="mt-1 text-sm text-text-muted">
            {user ? "云端同步的生成记录" : "本地保存的生成记录"}，支持收藏、复用参数、下载与删除
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon="download" onClick={handleExport}>
            导出
          </Button>
          <Button size="sm" icon="upload" onClick={() => importRef.current?.click()}>
            导入
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
          <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>
            清空
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "image", "video", "favorite"] as KindFilter[]).map((k) => (
            <Chip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
              {{ all: "全部", image: "图片", video: "视频", favorite: "已收藏" }[k]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(typeLabels) as FeatureType[]).map((t) => (
            <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}>
              {typeLabels[t]}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong py-24 text-center text-text-muted">
          <p className="text-sm">还没有符合条件的生成记录</p>
        </div>
      ) : (
        // Masonry via CSS columns, not a fixed-aspect grid: history mixes
        // every ratio the workbench supports (1:1 through 21:9 and 9:16),
        // so a uniform aspect-[4/3] box combined with object-cover was
        // center-cropping tall/wide results into an unrecognizable sliver.
        // Each card here is only as tall as its own image/video needs.
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {filtered.map((item) => (
            <Card key={item.id} className="group relative mb-4 break-inside-avoid overflow-hidden">
              <button className="block w-full bg-surface2" onClick={() => setPreview(item)}>
                {item.resultKind === "image" ? (
                  <img src={item.resultUrl} alt={item.prompt} className="block h-auto w-full" loading="lazy" />
                ) : (
                  <video src={item.resultUrl} className="block h-auto w-full" muted playsInline preload="metadata" />
                )}
              </button>
              <button
                onClick={() => toggleFavorite(item.id)}
                aria-label="收藏"
                className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <Icon name={item.favorite ? "starFilled" : "star"} size={14} />
              </button>
              <div className="flex items-center justify-between px-3 py-2.5">
                <Badge tone="neutral">{typeLabels[item.type as FeatureType]}</Badge>
                <span className="text-[11px] text-text-muted">{timeAgo(item.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 border-t border-border-subtle px-3 py-2 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => reuse(item)} aria-label="复用参数" className="focus-ring hover:text-text-primary">
                  <Icon name="reuse" size={15} />
                </button>
                <a href={item.resultUrl} download aria-label="下载" className="focus-ring hover:text-text-primary">
                  <Icon name="download" size={15} />
                </a>
                <button onClick={() => remove(item.id)} aria-label="删除" className="focus-ring hover:text-danger">
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="生成详情" wide>
        {preview && (
          <div className="flex flex-col gap-4">
            <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-control bg-surface2">
              {preview.resultKind === "image" ? (
                <img
                  src={preview.resultUrl}
                  alt={preview.prompt}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              ) : (
                <video
                  src={preview.resultUrl}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              )}
            </div>
            <p className="text-sm text-text-secondary">{preview.prompt}</p>
            <div className="flex justify-end gap-2">
              <Button
                icon="copy"
                onClick={() => {
                  navigator.clipboard.writeText(preview.prompt);
                  toast.success("提示词已复制");
                }}
              >
                复制提示词
              </Button>
              <Button icon="reuse" onClick={() => reuse(preview)}>
                复用参数
              </Button>
              <Button variant="primary" icon="download" onClick={() => window.open(preview.resultUrl, "_blank")}>
                下载
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="确认清空全部历史记录？">
        <p className="mb-5 text-sm text-text-secondary">此操作不可恢复，将永久删除本地保存的全部生成记录。</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmClear(false)}>取消</Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAll();
              setConfirmClear(false);
            }}
          >
            确认清空
          </Button>
        </div>
      </Modal>
    </div>
  );
}
