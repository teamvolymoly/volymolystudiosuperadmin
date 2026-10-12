import { randomUUID } from "node:crypto";
import {
  rewritePlatformCookie,
  toUpstreamPlatformCookies,
} from "./platform-cookies.js";
import { platformClientHeaders } from "./platform-client-context.js";
import { laravelApiOrigin } from "./laravel-origin.js";

function resolveUpstream(path, method) {
  const endpoint = path.join("/");
  if (endpoint === "tenancy" && method === "GET") return "/api/v1/platform/tenancy";
  if (endpoint === "merchants" && method === "GET") return "/api/v1/platform/merchants";
  if (endpoint === "organizations" && method === "POST") return "/api/v1/platform/organizations";
  if (endpoint === "stores" && method === "POST") return "/api/v1/platform/stores";
  if (/^stores\/\d+\/status$/.test(endpoint) && method === "PATCH") {
    return `/api/v1/platform/${endpoint}`;
  }
  if (/^merchants\/\d+\/status$/.test(endpoint) && method === "PATCH") {
    return `/api/v1/platform/${endpoint}`;
  }
  return null;
}

export async function proxyPlatformManagementRequest(request, { params }) {
  const { path } = await params;
  const upstreamPath = resolveUpstream(path, request.method);
  if (!upstreamPath) return Response.json({ message: "Not found." }, { status: 404 });

  const requestId = randomUUID();
  let upstream;
  try {
    const headers = new Headers({
      Accept: "application/json",
      ...platformClientHeaders(request, upstreamPath),
    });
    headers.set("x-request-id", requestId);
    for (const name of ["content-type", "x-csrf-token"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const cookies = toUpstreamPlatformCookies(request.headers.get("cookie") || "");
    if (cookies) headers.set("cookie", cookies);

    const upstreamUrl = new URL(upstreamPath, laravelApiOrigin());
    if (request.method === "GET") upstreamUrl.search = new URL(request.url).search;

    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: ["POST", "PATCH"].includes(request.method) ? await request.text() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("Platform management proxy failure", {
      requestId,
      upstreamPath,
      method: request.method,
      error: error instanceof Error ? error.message : undefined,
    });
    return Response.json(
      { message: "Platform management service is unavailable. Please try again." },
      { status: 502, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } },
    );
  }

  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Request-ID": requestId,
  });
  for (const name of ["content-type", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    const rewritten = rewritePlatformCookie(cookie);
    if (rewritten) responseHeaders.append("Set-Cookie", rewritten);
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
