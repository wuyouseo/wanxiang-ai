import { AGNES_DEFAULT_BASE_URL } from "./constants";
import { ProviderError, type AppSettings } from "./types";

/**
 * URL routing for Agnes calls.
 *
 * When the user is on the default Agnes base URL, requests go through this
 * app's own same-origin edge-function proxy (see /functions, /api, /netlify
 * — all thin wrappers around src/server/proxy-core.ts). That sidesteps any
 * uncertainty about whether api.agnes-ai.cn allows browser-origin CORS, and
 * gives us one place to do request pre-validation and error normalization.
 *
 * If the user points Base URL at something else (a future OpenAI-compatible
 * provider), we call it directly from the browser — CORS then becomes that
 * provider's responsibility, same as any other client-side SDK.
 */
function isDefaultAgnesHost(baseUrl: string): boolean {
  return baseUrl.trim().replace(/\/$/, "") === AGNES_DEFAULT_BASE_URL;
}

function hostRoot(baseUrl: string): string {
  return baseUrl.trim().replace(/\/v1\/?$/, "").replace(/\/$/, "");
}

export function buildUrl(kind: "v1" | "root", path: string, settings: AppSettings): string {
  if (isDefaultAgnesHost(settings.baseUrl) || !settings.baseUrl) {
    return kind === "v1" ? `/api/agnes/v1${path}` : `/api/agnes${path}`;
  }
  const root = hostRoot(settings.baseUrl);
  return kind === "v1" ? `${root}/v1${path}` : `${root}${path}`;
}

function authHeaders(settings: AppSettings): HeadersInit {
  return {
    Authorization: `Bearer ${settings.apiKey}`,
    "Content-Type": "application/json",
  };
}

async function toProviderError(res: Response): Promise<ProviderError> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.detail || body?.error?.message || body?.error || JSON.stringify(body);
  } catch {
    detail = await res.text().catch(() => "");
  }

  if (res.status === 401 || res.status === 403) {
    return new ProviderError("API Key 无效或未授权", "auth", { detail, httpStatus: res.status });
  }
  if (res.status === 429) {
    return new ProviderError("请求过于频繁或额度不足", "quota", { detail, httpStatus: res.status });
  }
  if (res.status === 400) {
    return new ProviderError("请求参数不合法", "invalid_request", { detail, httpStatus: res.status });
  }
  if (res.status >= 500) {
    return new ProviderError("服务暂时不可用，请稍后重试", "server", { detail, httpStatus: res.status });
  }
  return new ProviderError(detail || `请求失败（HTTP ${res.status}）`, "unknown", {
    detail,
    httpStatus: res.status,
  });
}

export async function agnesFetchJSON<T>(
  kind: "v1" | "root",
  path: string,
  settings: AppSettings,
  init?: RequestInit,
): Promise<T> {
  if (!settings.apiKey) {
    throw new ProviderError("尚未配置 API Key，请先前往设置中心添加", "auth");
  }
  let res: Response;
  try {
    res = await fetch(buildUrl(kind, path, settings), {
      ...init,
      headers: { ...authHeaders(settings), ...(init?.headers || {}) },
    });
  } catch (e) {
    throw new ProviderError("网络请求失败，请检查网络连接", "network", {
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  if (!res.ok) throw await toProviderError(res);
  return (await res.json()) as T;
}

/** Raw (non-JSON) fetch, used for the streaming chat-completions call. */
export async function agnesFetchStream(
  kind: "v1" | "root",
  path: string,
  settings: AppSettings,
  init?: RequestInit,
): Promise<Response> {
  if (!settings.apiKey) {
    throw new ProviderError("尚未配置 API Key，请先前往设置中心添加", "auth");
  }
  let res: Response;
  try {
    res = await fetch(buildUrl(kind, path, settings), {
      ...init,
      headers: { ...authHeaders(settings), ...(init?.headers || {}) },
    });
  } catch (e) {
    throw new ProviderError("网络请求失败，请检查网络连接", "network", {
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  if (!res.ok) throw await toProviderError(res);
  return res;
}

/**
 * Parses an OpenAI-style `text/event-stream` body (`data: {...}\n\n`,
 * terminated by `data: [DONE]`) and yields each decoded JSON chunk.
 */
export async function* readSSE(res: Response): AsyncGenerator<any> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        yield JSON.parse(data);
      } catch {
        // Ignore keep-alive/comment lines that aren't valid JSON payloads.
      }
    }
  }
}
