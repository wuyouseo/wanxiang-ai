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

// ---------------------------------------------------------------------------
// Multi-key pool: round-robin distribution + automatic failover.
//
// Every Agnes call goes through fetchWithKeyFailover, which walks the user's
// key pool (primary key first, then backup keys) starting from a rotating
// index. A request moves to the next key when the current one times out on
// connect, or fails with an auth/quota/server status; parameter errors (400)
// are not retried since a different key cannot fix them. Keys that just
// failed enter a short cooldown so subsequent requests skip them (longer for
// auth failures, which won't heal on their own).
// ---------------------------------------------------------------------------

export interface AgnesRequestInit extends RequestInit {
  /** Per-attempt timeout waiting for response headers (ms). */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
export const IMAGE_TIMEOUT_MS = 360_000; // docs/API接口文档.md §2: allow 60–360s for sync image generation
const AUTH_COOLDOWN_MS = 10 * 60_000;
const TRANSIENT_COOLDOWN_MS = 60_000;
const FAILOVER_STATUS = new Set([401, 402, 403, 408, 429, 500, 502, 503, 504]);

let rrCounter = 0;
const cooldownUntil = new Map<number, number>();

/** All configured keys (primary + backups), trimmed, de-duplicated, in order. */
export function getKeyPool(settings: AppSettings): string[] {
  const pool = [settings.apiKey, ...(settings.apiKeys ?? [])].map((k) => k.trim()).filter(Boolean);
  return [...new Set(pool)];
}

function emitFailover(from: number, to: number, reason: string, poolLen: number) {
  if (typeof window !== "undefined" && poolLen > 1) {
    window.dispatchEvent(
      new CustomEvent("agnes:key-failover", { detail: { from, to, reason, poolLen } }),
    );
  }
}

/** Internal: an attempt failed for a reason that permits trying the next key. */
class RetryableAttemptError extends Error {
  reason: "timeout" | "network" | string;
  cause?: unknown;
  constructor(reason: "timeout" | "network", cause?: unknown) {
    super(reason);
    this.reason = reason;
    this.cause = cause;
  }
}

async function attemptFetch(
  url: string,
  init: AgnesRequestInit,
  apiKey: string,
  timeoutMs: number,
): Promise<Response> {
  const outerSignal = init.signal;
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onOuterAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      // JSON body is the default for every Agnes call; per-init headers may
      // still override it.
      headers: { "Content-Type": "application/json", ...(init.headers || {}), Authorization: `Bearer ${apiKey}` },
    });
  } catch (e) {
    if (outerSignal?.aborted) throw e; // user-initiated stop — propagate untouched
    if (timedOut) throw new RetryableAttemptError("timeout");
    throw new RetryableAttemptError("network", e);
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onOuterAbort);
  }
}

async function fetchWithKeyFailover(
  kind: "v1" | "root",
  path: string,
  settings: AppSettings,
  init?: AgnesRequestInit,
): Promise<Response> {
  const pool = getKeyPool(settings);
  if (pool.length === 0) {
    throw new ProviderError("尚未配置 API Key，请先前往设置中心添加", "auth");
  }
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(kind, path, settings);
  const now = Date.now();

  // Round-robin start position, skipping keys in cooldown.
  rrCounter = (rrCounter + 1) % pool.length;
  let start = rrCounter;
  for (let i = 0; i < pool.length; i++) {
    if ((cooldownUntil.get(start) ?? 0) <= now) break;
    start = (start + 1) % pool.length;
  }

  let lastError: unknown;
  for (let n = 0; n < pool.length; n++) {
    const idx = (start + n) % pool.length;
    let res: Response;
    try {
      res = await attemptFetch(url, init ?? {}, pool[idx], timeoutMs);
    } catch (e) {
      if (!(e instanceof RetryableAttemptError)) throw e; // user abort
      cooldownUntil.set(idx, now + TRANSIENT_COOLDOWN_MS);
      const reason = e.reason === "timeout" ? "连接超时" : "网络异常";
      emitFailover(idx, (idx + 1) % pool.length, reason, pool.length);
      lastError =
        e.reason === "timeout"
          ? new ProviderError(`API Key ${idx + 1} 连接超时`, "network", { detail: reason })
          : new ProviderError("网络请求失败，请检查网络连接", "network", {
              detail: e.cause instanceof Error ? e.cause.message : String(e.cause ?? ""),
            });
      continue;
    }
    if (!res.ok && FAILOVER_STATUS.has(res.status) && n < pool.length - 1) {
      const mapped = await toProviderError(res);
      cooldownUntil.set(idx, now + (res.status === 401 || res.status === 403 ? AUTH_COOLDOWN_MS : TRANSIENT_COOLDOWN_MS));
      emitFailover(idx, (idx + 1) % pool.length, `HTTP ${res.status}`, pool.length);
      lastError = new ProviderError(`${mapped.message}（Key ${idx + 1}）`, mapped.kind, {
        detail: mapped.detail,
        httpStatus: mapped.httpStatus,
      });
      continue;
    }
    if (!res.ok) throw await toProviderError(res);
    return res;
  }
  throw lastError ?? new ProviderError("请求失败", "unknown");
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
  init?: AgnesRequestInit,
): Promise<T> {
  const res = await fetchWithKeyFailover(kind, path, settings, init);
  return (await res.json()) as T;
}

/** Raw (non-JSON) fetch, used for the streaming chat-completions call.
 *  Failover happens before the stream starts; an in-flight stream is
 *  never silently re-issued on another key. */
export async function agnesFetchStream(
  kind: "v1" | "root",
  path: string,
  settings: AppSettings,
  init?: AgnesRequestInit,
): Promise<Response> {
  return fetchWithKeyFailover(kind, path, settings, init);
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
