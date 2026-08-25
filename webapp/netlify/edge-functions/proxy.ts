// Netlify Edge Function entry point.
// Path routing for Netlify edge functions is declared in netlify.toml
// ([[edge_functions]] path = "/api/agnes/*"), not by file location. Thin
// adapter only: all logic lives in src/server/proxy-core.ts so the three
// platform entry points stay in sync.
// Deno (Netlify's edge runtime) requires explicit file extensions on local
// module specifiers — no implicit ".ts" resolution like Node/Vite/tsc do.
import { handleAgnesProxy, stripProxyPrefix } from "../../src/server/proxy-core.ts";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const upstreamPath = stripProxyPrefix(url.pathname, url.search);
  return handleAgnesProxy(request, { upstreamPath });
}
