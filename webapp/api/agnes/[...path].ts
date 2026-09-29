// Vercel Edge Function entry point.
// Handles every request under /api/agnes/* — file-based routing via the
// `[...path]` catch-all segment. Thin adapter only: all logic lives in
// src/server/proxy-core.ts so the three platform entry points stay in sync.
import { handleAgnesProxy, handleImageRelay, stripProxyPrefix } from "../../src/server/proxy-core.ts";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/agnes/relay-image") return handleImageRelay(request);
  const upstreamPath = stripProxyPrefix(url.pathname, url.search);
  return handleAgnesProxy(request, { upstreamPath });
}
