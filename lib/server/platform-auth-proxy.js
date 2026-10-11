import { randomUUID } from "node:crypto";
import {
  rewritePlatformCookie,
  toUpstreamPlatformCookies,
} from "./platform-cookies.js";
import { platformClientHeaders } from "./platform-client-context.js";
import { laravelApiOrigin } from "./laravel-origin.js";

const METHODS = new Map([
  ["csrf-token", "GET"],
  ["login", "POST"],
  ["password/forgot", "POST"],
  ["password/reset", "POST"],
  ["me", "GET"],
  ["logout", "POST"],
]);

function safeFailure(status, requestId) {
  return Response.json(
    { message: "Platform authentication service is unavailable. Please try again." },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Request-ID": requestId,
      },
    },
  );
}

function logProxyFailure({ requestId, endpoint, method, status, error }) {
  console.error("Platform authentication proxy failure", {
    requestId,
    endpoint,
    method,
    status,
    error: error instanceof Error ? error.message : undefined,
  });
}

export async function proxyPlatformAuthRequest(request, { params }) {
  const { path } = await params;
  const endpoint = path.join("/");

  if (METHODS.get(endpoint) !== request.method) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  const requestId = randomUUID();
  let upstream;

  try {
    const upstreamPath = `/api/v1/platform/auth/${endpoint}`;
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

    upstream = await fetch(
      new URL(upstreamPath, laravelApiOrigin()),
      {
        method: request.method,
        headers,
        body: request.method === "POST" ? await request.text() : undefined,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      },
    );
  } catch (error) {
    logProxyFailure({ requestId, endpoint, method: request.method, status: 502, error });
    return safeFailure(502, requestId);
  }

  if (upstream.status >= 500) {
    await upstream.body?.cancel();
    logProxyFailure({ requestId, endpoint, method: request.method, status: upstream.status });
    return safeFailure(503, requestId);
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

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
