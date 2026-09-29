// Shared domain types used across providers, stores, and UI.
// Keeping these provider-agnostic is what makes it possible to bolt on a
// second model vendor later without touching pages/components — only a new
// `Provider` implementation (see lib/providers) is required.

export type FeatureType = "text-to-image" | "image-to-image" | "multi-image" | "video";

export type ImageSizeTier = "1K" | "2K" | "3K" | "4K";

export type ImageRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | "2:3" | "3:2" | "21:9";

export type VideoMode = "text" | "keyframe" | "reference";

export type VideoRatio = "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";

/** Selectable image generation models (Agnes Image series). */
export type ImageModelId = "agnes-image-2.0-flash" | "agnes-image-2.1-flash" | "agnes-image-2.5-flash";

/** Selectable video generation models (Agnes Video series). */
export type VideoModelId = "agnes-video-2.0-flash" | "agnes-video-2.5-flash";

/** Selectable text models (used by prompt enhancement and connection test). */
export type TextModelId = "agnes-2.5-flash" | "agnes-3.0-flash";

export interface ImageGenerationParams {
  prompt: string;
  size: ImageSizeTier;
  ratio: ImageRatio;
  /** Base64 data-URIs of input images. Empty for text-to-image. */
  inputImages: string[];
  /** Chosen generation model; provider falls back to its default when absent. */
  model?: ImageModelId;
}

export interface VideoGenerationParams {
  prompt: string;
  mode: VideoMode;
  seconds: string;
  ratio: VideoRatio;
  seed?: number;
  firstFrame?: string;
  lastFrame?: string;
  referenceImages?: string[];
  /** Chosen generation model; provider falls back to its default when absent. */
  model?: VideoModelId;
}

export type TaskStatus = "queued" | "processing" | "completed" | "failed";

export interface VideoTask {
  id: string;
  providerId: string;
  createdAt: number;
  updatedAt: number;
  status: TaskStatus;
  progress?: number;
  params: VideoGenerationParams;
  resultUrl?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface HistoryItem {
  id: string;
  type: FeatureType | "video";
  createdAt: number;
  favorite: boolean;
  /** Rendered output: image URL/base64, or video URL. */
  resultUrl: string;
  resultKind: "image" | "video";
  /** Enough to fully re-populate the creation form via "reuse params". */
  params: ImageGenerationParams | VideoGenerationParams;
  prompt: string;
}

export interface AppSettings {
  apiKey: string;
  /**
   * Backup API Keys for round-robin load distribution and automatic
   * failover when a key times out or errors. The primary `apiKey` above
   * participates in the pool as well (it goes first).
   */
  apiKeys: string[];
  baseUrl: string;
  /** Text model used for prompt enhancement / connection test. */
  defaultTextModel: TextModelId;
  defaultImageSize: ImageSizeTier;
  defaultImageRatio: ImageRatio;
  defaultVideoSeconds: string;
  defaultPromptEnhance: boolean;
  thinkingMode: boolean;
  language: "zh-CN";
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  apiKeys: [],
  baseUrl: "https://api.agnes-ai.cn/v1",
  defaultTextModel: "agnes-2.5-flash",
  defaultImageSize: "1K",
  defaultImageRatio: "1:1",
  defaultVideoSeconds: "5",
  defaultPromptEnhance: true,
  thinkingMode: false,
  language: "zh-CN",
};

export type KeyStatus = "unconfigured" | "unverified" | "verified" | "invalid";

/** Normalized error shape every provider call rejects with. */
export class ProviderError extends Error {
  kind: "auth" | "quota" | "invalid_request" | "network" | "server" | "unknown";
  detail?: string;
  httpStatus?: number;

  constructor(
    message: string,
    kind: ProviderError["kind"] = "unknown",
    opts?: { detail?: string; httpStatus?: number },
  ) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.detail = opts?.detail;
    this.httpStatus = opts?.httpStatus;
  }
}
