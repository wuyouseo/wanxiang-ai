import type {
  AppSettings,
  ImageGenerationParams,
  TaskStatus,
  TextModelId,
  VideoGenerationParams,
} from "../types";

// ---------------------------------------------------------------------------
// Provider abstraction — the extension point for "接入各个服务和功能".
//
// Every page/component talks to `getActiveProvider(settings)` (see ./index)
// instead of calling Agnes endpoints directly. To add a second model vendor
// later (another OpenAI-compatible host, a different image/video API, a
// local model, ...): implement this interface in a new
// `lib/providers/<name>Provider.ts` file and register it in `./index.ts`.
// Nothing in components/pages/stores needs to change.
// ---------------------------------------------------------------------------

export interface ChatStreamParams {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  enableThinking?: boolean;
  /** Text model override; provider falls back to the settings default when absent. */
  model?: TextModelId;
  signal?: AbortSignal;
}

export interface TextProvider {
  /** Streams incremental text deltas (already unwrapped from SSE/JSON framing). */
  streamChat(params: ChatStreamParams, settings: AppSettings): AsyncGenerator<string, void, void>;
}

export interface ImageResult {
  url?: string;
  b64Json?: string;
  revisedPrompt?: string;
}

export interface ImageProvider {
  generateImage(params: ImageGenerationParams, settings: AppSettings): Promise<ImageResult[]>;
}

export interface VideoTaskHandle {
  taskId: string;
}

export interface VideoTaskStatusResult {
  status: TaskStatus;
  progress?: number;
  resultUrl?: string;
  errorMessage?: string;
}

export interface VideoProvider {
  createVideoTask(params: VideoGenerationParams, settings: AppSettings): Promise<VideoTaskHandle>;
  queryVideoTask(
    taskId: string,
    params: VideoGenerationParams,
    settings: AppSettings,
  ): Promise<VideoTaskStatusResult>;
}

export interface ModelProvider {
  id: string;
  name: string;
  text: TextProvider;
  image: ImageProvider;
  video: VideoProvider;
  /** Quick round-trip used by Settings → "测试连接". Should be cheap & fast. */
  testConnection(settings: AppSettings): Promise<{ ok: boolean; message: string }>;
}
