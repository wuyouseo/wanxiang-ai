// Display helpers shared between the public gallery feed and the personal
// works tab (see components/gallery/GalleryCard.tsx and pages/GalleryPage.tsx)
// so both render identical card metadata.
import { IMAGE_DIMENSIONS, VIDEO_DIMENSIONS } from "./constants";
import type { FeatureType, HistoryItem, ImageGenerationParams, VideoGenerationParams } from "./types";

export const typeLabels: Record<FeatureType, string> = {
  "text-to-image": "文生图",
  "image-to-image": "图生图",
  "multi-image": "多图合成",
  video: "视频生成",
};

export const routeByType: Record<FeatureType, string> = {
  "text-to-image": "/studio/text-to-image",
  "image-to-image": "/studio/image-to-image",
  "multi-image": "/studio/multi-image",
  video: "/studio/video",
};

export function timeAgo(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return `${Math.round(diffHour / 24)} 天前`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Video params don't carry a size tier (Agnes fixes video output at 720P),
// only images do — hence the two different lookup tables here.
export function dimensionsFor(item: HistoryItem): string {
  if (item.resultKind === "image") {
    const p = item.params as ImageGenerationParams;
    const dims = IMAGE_DIMENSIONS[p.ratio]?.[p.size];
    return dims ? `${dims[0]}×${dims[1]}` : p.ratio;
  }
  const p = item.params as VideoGenerationParams;
  const dims = VIDEO_DIMENSIONS[p.ratio];
  return dims ? `${dims[0]}×${dims[1]}` : p.ratio;
}
