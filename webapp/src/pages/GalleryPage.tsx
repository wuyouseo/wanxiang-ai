import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { GalleryCard } from "../components/gallery/GalleryCard";
import { AccountPanel } from "../components/auth/AccountPanel";
import { useHistoryStore } from "../store/useHistoryStore";
import { usePublicGalleryStore } from "../store/usePublicGalleryStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTransferStore } from "../store/useTransferStore";
import { toast } from "../store/useToastStore";
import { ADMIN_EMAIL } from "../lib/constants";
import { dimensionsFor, formatDateTime, routeByType, typeLabels } from "../lib/historyFormat";
import type { FeatureType, HistoryItem } from "../lib/types";

type KindFilter = "all" | "image" | "video" | "favorite";
type TypeFilter = "all" | FeatureType;
type GalleryTab = "public" | "mine";

export function GalleryPage() {
  const [tab, setTab] = useState<GalleryTab>("public");
  const navigate = useNavigate();
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.email === ADMIN_EMAIL;

  const mine = useHistoryStore();
  const pub = usePublicGalleryStore();

  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [preview, setPreview] = useState<HistoryItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mine.loaded) mine.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.loaded]);

  // Public feed refetches from the server on filter change (it's paginated,
  // so a client-side filter would only ever see whatever page happened to
  // load first) — resultKind/favorite aren't both meaningful there anyway
  // (see below), so only resultKind + type feed the query.
  useEffect(() => {
    if (tab !== "public") return;
    pub.setFilters({
      resultKind: kindFilter === "image" || kindFilter === "video" ? kindFilter : undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, kindFilter, typeFilter]);

  // Infinite scroll for the public feed: fetch the next page once the
  // sentinel at the bottom of the grid comes into view.
  useEffect(() => {
    if (tab !== "public") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) pub.loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, pub.items.length, pub.hasMore]);

  const mineFiltered = useMemo(() => {
    return mine.items.filter((i) => {
      if (kindFilter === "image" && i.resultKind !== "image") return false;
      if (kindFilter === "video" && i.resultKind !== "video") return false;
      if (kindFilter === "favorite" && !i.favorite) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      return true;
    });
  }, [mine.items, kindFilter, typeFilter]);

  async function handleExport() {
    const json = await mine.exportJSON();
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
      await mine.importJSON(text);
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
            {tab === "public" ? "所有登录用户公开生成的作品" : "你自己生成并同步到云端的作品"}
          </p>
        </div>
        {tab === "mine" && user && (
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
            {isAdmin && (
              <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>
                清空
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip active={tab === "public"} onClick={() => setTab("public")}>
            公开画廊
          </Chip>
          <Chip active={tab === "mine"} onClick={() => setTab("mine")}>
            个人作品
          </Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "image", "video", ...(tab === "mine" ? (["favorite"] as const) : [])] as KindFilter[]).map(
            (k) => (
              <Chip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
                {{ all: "全部", image: "图片", video: "视频", favorite: "已收藏" }[k]}
              </Chip>
            ),
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(typeLabels) as FeatureType[]).map((t) => (
          <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}>
            {typeLabels[t]}
          </Chip>
        ))}
      </div>

      {(() => {
        const currentList = tab === "public" ? pub.items : mineFiltered;
        const isLoading = tab === "public" ? pub.loading : !mine.loaded;
        if (tab === "mine" && !user) {
          return (
            <Card className="mx-auto max-w-md p-6">
              <h2 className="mb-1.5 text-base font-semibold">登录后查看你的个人作品</h2>
              <p className="mb-4 text-sm text-text-secondary">
                未登录时生成的作品只保存在你自己的浏览器里，也不会出现在这里。登录后，新生成的作品会自动同步，之前的本地记录也可以一键同步上去。
              </p>
              <AccountPanel />
            </Card>
          );
        }
        if (isLoading) {
          return <p className="py-24 text-center text-sm text-text-muted">加载中…</p>;
        }
        if (currentList.length === 0) {
          return (
            <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong py-24 text-center text-text-muted">
              <p className="text-sm">还没有符合条件的生成记录</p>
            </div>
          );
        }
        return (
        // Masonry via CSS columns, not a fixed-aspect grid: history mixes
        // every ratio the workbench supports (1:1 through 21:9 and 9:16), so
        // a uniform aspect-[4/3] box combined with object-cover was center-
        // cropping tall/wide results into an unrecognizable sliver. Each
        // card here is only as tall as its own image/video needs.
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {currentList.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              showFavorite={tab === "mine"}
              canDelete={isAdmin}
              onOpen={() => setPreview(item)}
              onToggleFavorite={tab === "mine" ? () => mine.toggleFavorite(item.id) : undefined}
              onReuse={() => reuse(item)}
              onRemove={() => (tab === "public" ? pub.remove(item.id) : mine.remove(item.id))}
            />
          ))}
        </div>
        );
      })()}

      {tab === "public" && <div ref={sentinelRef} className="h-1" />}
      {tab === "public" && pub.loadingMore && (
        <p className="py-6 text-center text-xs text-text-muted">加载中…</p>
      )}
      {tab === "public" && !pub.hasMore && pub.items.length > 0 && (
        <p className="py-6 text-center text-xs text-text-muted">已经到底啦</p>
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
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>{typeLabels[preview.type as FeatureType]}</span>
              <span>·</span>
              <span>{dimensionsFor(preview)}</span>
              <span>·</span>
              <span>{formatDateTime(preview.createdAt)}</span>
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
              {isAdmin && (
                <Button
                  variant="danger"
                  icon="trash"
                  onClick={() => {
                    if (tab === "public") pub.remove(preview.id);
                    else mine.remove(preview.id);
                    setPreview(null);
                  }}
                >
                  删除
                </Button>
              )}
              <Button variant="primary" icon="download" onClick={() => window.open(preview.resultUrl, "_blank")}>
                下载
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="确认清空全部个人作品？">
        <p className="mb-5 text-sm text-text-secondary">此操作不可恢复，将永久删除你云端保存的全部生成记录。</p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmClear(false)}>取消</Button>
          <Button
            variant="danger"
            onClick={() => {
              mine.clearAll();
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
