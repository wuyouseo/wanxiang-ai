// Shared, stateless proxy logic used by every platform's thin edge-function
// entry point (functions/api/[[path]].ts for Cloudflare Pages,
// api/[...path].ts for Vercel Edge, netlify/edge-functions/proxy.ts for
// Netlify). All three runtimes expose the same Web-standard
// Request/Response/fetch primitives, so this one module works unmodified
// on all of them — see docs/网页设计文档.md §6.
//
// Hard rule: this proxy is a pure pass-through. It never logs, caches, or
// persists a request/response body or the Authorization header anywhere —
// that's what makes "no backend, no data retention" true at the
// architecture level, not just in the privacy copy shown to users.

const AGNES_HOST = "https://api.agnes-ai.cn";
const PREFIX = "/api/agnes";

// Only forward headers the upstream API actually needs. Dropping
// cookies/host/etc. keeps the proxy from leaking anything about the
// deployment platform, and keeps it a plain Bearer-token relay.
const FORWARD_REQUEST_HEADERS = ["authorization", "content-type", "x-api-key", "anthropic-version"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "cache-control"];

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Pre-flight checks mirroring the Agnes Video Flash constraints documented
 * in docs/API接口文档.md §3.3 — catching them here saves a round trip and
 * matches upstream's "a failing validation never creates a billable task"
 * behavior. Upstream remains the source of truth; this is a fast local echo
 * of its documented rules, not a replacement for its own validation.
 */
function validateVideoCreateBody(body: any): void {
  if (body?.size && body.size !== "720P") {
    throw new ValidationError("size must be 720P");
  }
  if (Array.isArray(body?.images) && body.images.length > 5) {
    throw new ValidationError("images length must not exceed 5");
  }
  if (body?.videos !== undefined) {
    throw new ValidationError("videos is not supported");
  }
}

export interface ProxyRequestInfo {
  /** Everything after the platform-specific prefix, e.g. "/v1/chat/completions" or "/agnesapi?video_id=x". Must start with "/". */
  upstreamPath: string;
}

export async function handleAgnesProxy(request: Request, info: ProxyRequestInfo): Promise<Response> {
  const targetUrl = `${AGNES_HOST}${info.upstreamPath}`;

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("content-type") && request.method !== "GET") {
    headers.set("content-type", "application/json");
  }

  let bodyText: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    bodyText = await request.text();
    if (info.upstreamPath.startsWith("/v1/videos") && bodyText) {
      try {
        validateVideoCreateBody(JSON.parse(bodyText));
      } catch (e) {
        if (e instanceof ValidationError) {
          return jsonResponse({ detail: e.message }, 400);
        }
        // JSON parse failure — let upstream produce the real error.
      }
    }
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyText,
    });
  } catch {
    return jsonResponse({ detail: "上游服务请求失败，请稍后重试" }, 502);
  }

  const resHeaders = new Headers();
  for (const key of FORWARD_RESPONSE_HEADERS) {
    const value = upstreamRes.headers.get(key);
    if (value) resHeaders.set(key, value);
  }

  // Stream the body through unmodified — this preserves SSE chat-completion
  // streaming and keeps large image/video JSON payloads from being buffered
  // in memory on the edge function.
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export function stripProxyPrefix(pathname: string, search: string): string {
  const rest = pathname.startsWith(PREFIX) ? pathname.slice(PREFIX.length) : pathname;
  return `${rest || "/"}${search}`;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
