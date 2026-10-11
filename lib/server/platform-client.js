import "server-only";

import { cookies, headers } from "next/headers";
import {
  hasPlatformSessionCookie,
  toUpstreamPlatformCookies,
} from "./platform-cookies";
import { laravelApiOrigin } from "./laravel-origin";

function toCurrentAdmin(admin) {
  if (
    !admin
    || !["number", "string"].includes(typeof admin.id)
    || typeof admin.name !== "string"
    || typeof admin.email !== "string"
    || admin.status !== "active"
  ) {
    return null;
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    status: admin.status,
    mustChangePassword: admin.must_change_password === true,
    lastLoginAt: typeof admin.last_login_at === "string" ? admin.last_login_at : null,
  };
}

async function fetchPlatform(path) {
  const cookieStore = await cookies();
  const browserCookies = cookieStore.toString();
  if (!hasPlatformSessionCookie(browserCookies)) return null;

  const upstreamCookies = toUpstreamPlatformCookies(browserCookies);
  const requestHeaders = await headers();
  const upstreamHeaders = new Headers({
    Accept: "application/json",
    Cookie: upstreamCookies,
  });
  const userAgent = requestHeaders.get("user-agent");
  if (userAgent) upstreamHeaders.set("user-agent", userAgent.slice(0, 512));

  let response;
  try {
    response = await fetch(new URL(path, laravelApiOrigin()), {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchCurrentPlatformAdmin() {
  const payload = await fetchPlatform("/api/v1/platform/auth/me");
  return toCurrentAdmin(payload?.admin);
}

export async function fetchPlatformTenancy() {
  const payload = await fetchPlatform("/api/v1/platform/tenancy");
  if (!payload || !Array.isArray(payload.organizations) || !Array.isArray(payload.stores)) {
    return null;
  }

  return {
    organizations: payload.organizations,
    stores: payload.stores,
    summary: {
      organizations: Number(payload.summary?.organizations || 0),
      stores: Number(payload.summary?.stores || 0),
      activeStores: Number(payload.summary?.active_stores || 0),
      merchants: Number(payload.summary?.merchants || 0),
    },
  };
}
