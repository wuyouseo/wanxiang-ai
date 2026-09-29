import type { ImageModelId, ImageRatio, ImageSizeTier, TextModelId, VideoModelId, VideoRatio } from "./types";

export const AGNES_DEFAULT_BASE_URL = "https://api.agnes-ai.cn/v1";

// The only account allowed to delete cloud-synced history/artworks (see
// supabase/schema.sql's delete policies, which check this same address via
// auth.jwt() ->> 'email' — this constant is for UI gating only; the database
// is what actually enforces it). Hardcoded by design per product decision:
// this is a single-owner site, not a multi-admin system.
export const ADMIN_EMAIL = "youge51168@gmail.com";

// Contact channels shown in the site footer. Update the GitHub address here
// when the actual repository / profile URL is decided.
export const CONTACT_EMAIL = "youge51168@gmail.com";
export const GITHUB_URL = "https://github.com/wuyouseo/wanxiang-ai";

// Other projects of the author, shown in the footer's "项目链接" column.
export const PROJECT_LINKS = [
  { label: "魔音工坊", href: "https://steptts3.netlify.app/" },
  { label: "语音克隆", href: "https://yzai-tts.netlify.app/" },
];

export const TEXT_MODEL = "agnes-2.5-flash";
export const IMAGE_MODEL = "agnes-image-2.5-flash";
export const VIDEO_MODEL = "agnes-video-2.5-flash";

// Selectable models shown in the workbench (docs/API接口文档.md §1/§2/§3).
// First entry = default used when the panel hasn't picked one yet.
export const TEXT_MODEL_OPTIONS: TextModelId[] = ["agnes-2.5-flash", "agnes-3.0-flash"];

export const TEXT_MODEL_LABELS: Partial<Record<TextModelId, string>> = {
  "agnes-2.5-flash": "Agnes 2.5 Flash",
  "agnes-3.0-flash": "Agnes 3.0 Flash（新一代）",
};
export const IMAGE_MODEL_OPTIONS: ImageModelId[] = [
  "agnes-image-2.5-flash",
  "agnes-image-2.1-flash",
  "agnes-image-2.0-flash",
];

export const IMAGE_MODEL_LABELS: Partial<Record<ImageModelId, string>> = {
  "agnes-image-2.5-flash": "Image 2.5 Flash（推荐）",
  "agnes-image-2.1-flash": "Image 2.1 Flash",
  "agnes-image-2.0-flash": "Image 2.0 Flash（前代）",
};

export const VIDEO_MODEL_OPTIONS: VideoModelId[] = ["agnes-video-2.5-flash", "agnes-video-2.0-flash"];

export const VIDEO_MODEL_LABELS: Partial<Record<VideoModelId, string>> = {
  "agnes-video-2.5-flash": "Video 2.5 Flash（推荐）",
  "agnes-video-2.0-flash": "Video 2.0 Flash（前代）",
};

export const IMAGE_SIZE_TIERS: ImageSizeTier[] = ["1K", "2K", "3K", "4K"];

export const IMAGE_RATIOS: ImageRatio[] = ["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"];

// Pixel lookup per docs/API接口文档.md §2 (nonstandard sizes get normalized
// server-side anyway; this table only drives the UI's "predicted output" hint).
export const IMAGE_DIMENSIONS: Record<ImageRatio, Record<ImageSizeTier, [number, number]>> = {
  "1:1": { "1K": [1024, 1024], "2K": [2048, 2048], "3K": [3072, 3072], "4K": [4096, 4096] },
  "3:4": { "1K": [896, 1184], "2K": [1792, 2368], "3K": [2688, 3552], "4K": [3584, 4736] },
  "4:3": { "1K": [1184, 896], "2K": [2368, 1792], "3K": [3552, 2688], "4K": [4736, 3584] },
  "16:9": { "1K": [1312, 736], "2K": [2624, 1472], "3K": [3936, 2208], "4K": [5248, 2944] },
  "9:16": { "1K": [736, 1312], "2K": [1472, 2624], "3K": [2208, 3936], "4K": [2944, 5248] },
  "2:3": { "1K": [864, 1296], "2K": [1728, 2592], "3K": [2592, 3888], "4K": [3456, 5184] },
  "3:2": { "1K": [1296, 864], "2K": [2592, 1728], "3K": [3888, 2592], "4K": [5184, 3456] },
  "21:9": { "1K": [1568, 672], "2K": [3136, 1344], "3K": [4704, 2016], "4K": [6272, 2688] },
};

export const VIDEO_RATIOS: VideoRatio[] = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];

export const VIDEO_DIMENSIONS: Record<VideoRatio, [number, number]> = {
  "21:9": [1680, 720],
  "16:9": [1280, 720],
  "4:3": [960, 720],
  "1:1": [720, 720],
  "3:4": [720, 960],
  "9:16": [720, 1280],
};

export const VIDEO_MIN_SECONDS = 4;
export const VIDEO_MAX_SECONDS = 12;
export const VIDEO_MAX_REFERENCE_IMAGES = 5;
export const MULTI_IMAGE_FREE_LIMIT = 3;

export const VIDEO_POLL_INTERVAL_MS = 1500;
export const VIDEO_POLL_INTERVAL_HIDDEN_MS = 6000;

export const PROMPT_ENHANCER_SYSTEM_PROMPT =
  "你是专业的 AI 绘画/视频提示词工程师。请将用户输入的简短描述改写为更适合生图/生视频模型的详细提示词，" +
  "补充画面细节、光影、构图、镜头语言与风格关键词，保持简洁但信息密度高，直接输出改写结果，不要额外解释。";
