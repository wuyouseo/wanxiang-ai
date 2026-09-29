import { IMAGE_MODEL, TEXT_MODEL, VIDEO_MODEL } from "../constants";
import { IMAGE_TIMEOUT_MS, agnesFetchJSON, agnesFetchStream, readSSE } from "../http";
import type { AppSettings, ImageGenerationParams, VideoGenerationParams } from "../types";
import { ProviderError } from "../types";
import type {
  ChatStreamParams,
  ImageProvider,
  ImageResult,
  ModelProvider,
  TextProvider,
  VideoProvider,
  VideoTaskHandle,
  VideoTaskStatusResult,
} from "./types";

// ---------------------------------------------------------------------------
// Text — Chat Completions API (docs/API接口文档.md §1.1)
// ---------------------------------------------------------------------------

const textProvider: TextProvider = {
  async *streamChat(params: ChatStreamParams, settings: AppSettings) {
    const messages = [
      ...(params.systemPrompt ? [{ role: "system", content: params.systemPrompt }] : []),
      { role: "user", content: params.userPrompt },
    ];

    const res = await agnesFetchStream(
      "v1",
      "/chat/completions",
      settings,
      {
        method: "POST",
        signal: params.signal,
        body: JSON.stringify({
          model: params.model ?? settings.defaultTextModel ?? TEXT_MODEL,
          messages,
          temperature: params.temperature ?? 0.7,
          stream: true,
          ...(params.enableThinking
            ? { chat_template_kwargs: { enable_thinking: true } }
            : {}),
        }),
      },
    );

    for await (const chunk of readSSE(res)) {
      const delta: string | undefined = chunk?.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
};

// ---------------------------------------------------------------------------
// Image — Images Generations API (docs/API接口文档.md §2). One endpoint
// covers text-to-image / image-to-image / multi-image via `extra_body.image`.
// ---------------------------------------------------------------------------

interface ImagesGenerationsResponse {
  created: number;
  data: { url: string | null; b64_json: string | null; revised_prompt: string | null }[];
}

const imageProvider: ImageProvider = {
  async generateImage(params: ImageGenerationParams, settings: AppSettings): Promise<ImageResult[]> {
    const body: Record<string, unknown> = {
      model: params.model ?? IMAGE_MODEL,
      prompt: params.prompt,
      size: params.size,
      ratio: params.ratio,
      extra_body: {
        response_format: "url",
        ...(params.inputImages.length > 0 ? { image: params.inputImages } : {}),
      },
    };

    const res = await agnesFetchJSON<ImagesGenerationsResponse>(
      "v1",
      "/images/generations",
      settings,
      // Image generation is synchronous upstream and can take minutes per the
      // API docs — give it the full documented budget instead of the default.
      { method: "POST", body: JSON.stringify(body), timeoutMs: IMAGE_TIMEOUT_MS },
    );

    return res.data.map((d) => ({
      url: d.url ?? undefined,
      b64Json: d.b64_json ?? undefined,
      revisedPrompt: d.revised_prompt ?? undefined,
    }));
  },
};

// ---------------------------------------------------------------------------
// Video — async task API (docs/API接口文档.md §3). Response field names for
// task creation / status query are NOT fully documented upstream — see the
// "待联调验证" notes in the API doc. `normalizeTaskId` / `normalizeStatus`
// are the single seam to update once real responses are observed; nothing
// else in the app needs to change.
// ---------------------------------------------------------------------------

function normalizeTaskId(res: any): string {
  const id = res?.video_id ?? res?.id ?? res?.task_id ?? res?.data?.video_id ?? res?.data?.id;
  if (!id) {
    throw new ProviderError("视频任务创建成功，但响应中未找到任务 ID", "server", {
      detail: JSON.stringify(res),
    });
  }
  return String(id);
}

function normalizeStatus(res: any): VideoTaskStatusResult {
  const rawStatus = String(res?.status ?? res?.data?.status ?? "processing").toLowerCase();
  const statusMap: Record<string, VideoTaskStatusResult["status"]> = {
    pending: "queued",
    queued: "queued",
    queuing: "queued",
    processing: "processing",
    running: "processing",
    in_progress: "processing",
    completed: "completed",
    succeeded: "completed",
    success: "completed",
    failed: "failed",
    error: "failed",
  };
  const status = statusMap[rawStatus] ?? "processing";

  const resultUrl =
    res?.video_url ?? res?.url ?? res?.output_url ?? res?.data?.video_url ?? res?.data?.url ?? undefined;

  const errorMessage =
    status === "failed"
      ? (res?.detail ?? res?.error ?? res?.message ?? res?.data?.detail ?? "视频生成失败")
      : undefined;

  const progress =
    typeof res?.progress === "number"
      ? res.progress
      : typeof res?.data?.progress === "number"
        ? res.data.progress
        : undefined;

  return { status, progress, resultUrl, errorMessage };
}

function buildCreateVideoBody(params: VideoGenerationParams): Record<string, unknown> {
  const base: Record<string, unknown> = {
    model: params.model ?? VIDEO_MODEL,
    prompt: params.prompt,
    mode: params.mode,
    seconds: params.seconds,
    size: "720P",
    aspect_ratio: params.ratio,
    ...(params.seed !== undefined ? { seed: params.seed } : {}),
  };
  if (params.mode === "keyframe") {
    base.first_frame = params.firstFrame;
    base.last_frame = params.lastFrame;
  }
  if (params.mode === "reference") {
    base.images = params.referenceImages ?? [];
  }
  return base;
}

const videoProvider: VideoProvider = {
  async createVideoTask(params: VideoGenerationParams, settings: AppSettings): Promise<VideoTaskHandle> {
    const res = await agnesFetchJSON<any>("v1", "/videos", settings, {
      method: "POST",
      body: JSON.stringify(buildCreateVideoBody(params)),
    });
    return { taskId: normalizeTaskId(res) };
  },

  async queryVideoTask(
    taskId: string,
    params: VideoGenerationParams,
    settings: AppSettings,
  ): Promise<VideoTaskStatusResult> {
    const search = new URLSearchParams({
      video_id: taskId,
      model_name: params.model ?? VIDEO_MODEL,
    });
    const res = await agnesFetchJSON<any>("root", `/agnesapi?${search.toString()}`, settings, {
      method: "GET",
    });
    return normalizeStatus(res);
  },
};

async function testConnection(settings: AppSettings): Promise<{ ok: boolean; message: string }> {
  try {
    await agnesFetchJSON("v1", "/chat/completions", settings, {
      method: "POST",
      body: JSON.stringify({
        model: settings.defaultTextModel ?? TEXT_MODEL,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 4,
      }),
    });
    return { ok: true, message: "连接成功，API Key 有效" };
  } catch (e) {
    if (e instanceof ProviderError) {
      return { ok: false, message: `${e.message}${e.detail ? `：${e.detail}` : ""}` };
    }
    return { ok: false, message: "连接失败，请检查网络或 Base URL" };
  }
}

export const agnesProvider: ModelProvider = {
  id: "agnes",
  name: "Agnes AI",
  text: textProvider,
  image: imageProvider,
  video: videoProvider,
  testConnection,
};
