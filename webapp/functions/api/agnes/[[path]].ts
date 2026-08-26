// Cloudflare Pages Functions entry point.
// Handles every request under /api/agnes/* — file-based routing via the
// `[[path]]` catch-all segment. Thin adapter only: all logic lives in
// src/server/proxy-core.ts so the three platform entry points stay in sync.
import { handleAgnesProxy, handleImageRelay, stripProxyPrefix } from "../../../src/server/proxy-core.ts";

// Typed loosely (avoids a hard dependency on @cloudflare/workers-types);
// Cloudflare Pages only needs this to be an async (context) => Response function.
export const onRequest = async (context: { request: Request }): Promise<Response> => {
  const url = new URL(context.request.url);
  if (url.pathname === "/api/agnes/relay-image") return handleImageRelay(context.request);
  const upstreamPath = stripProxyPrefix(url.pathname, url.search);
  return handleAgnesProxy(context.request, { upstreamPath });
};
