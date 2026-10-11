import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GET, POST } from "../app/api/platform/auth/[...path]/route.js";
import {
  rewritePlatformCookie,
  toUpstreamPlatformCookies,
} from "../lib/server/platform-cookies.js";

const originalFetch = globalThis.fetch;
process.env.API_UPSTREAM_URL = "http://localhost:8000";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("platform cookies are isolated from merchant cookies", () => {
  const cookies = toUpstreamPlatformCookies(
    "laravel_session=merchant; platform_admin_session=platform; platform_admin_xsrf=csrf; other=private",
  );

  assert.equal(cookies, "laravel_session=platform; XSRF-TOKEN=csrf");
  assert.doesNotMatch(cookies, /merchant|private/);
});

test("upstream session cookies are rewritten onto the platform origin", () => {
  const cookie = rewritePlatformCookie(
    "laravel_session=new; Domain=api.example.com; Path=/; Secure; HttpOnly; SameSite=None",
  );

  assert.match(cookie, /^platform_admin_session=new/);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.doesNotMatch(cookie, /SameSite=None/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /HttpOnly/i);
});

test("login forwards only the platform session and CSRF token", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/auth/login");
    assert.equal(options.headers.get("cookie"), "laravel_session=platform");
    assert.equal(options.headers.get("x-csrf-token"), "csrf-token");
    assert.equal(options.body, '{"email":"admin@example.test","password":"secret"}');

    return Response.json({ admin: { id: 1, email: "admin@example.test" } }, {
      headers: {
        "Set-Cookie": "laravel_session=rotated; Domain=api.example.com; Path=/; HttpOnly; SameSite=None",
      },
    });
  };

  const response = await POST(new Request("http://localhost:3001/api/platform/auth/login", {
    method: "POST",
    headers: {
      Cookie: "laravel_session=merchant; platform_admin_session=platform",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": "csrf-token",
    },
    body: '{"email":"admin@example.test","password":"secret"}',
  }), { params: Promise.resolve({ path: ["login"] }) });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^platform_admin_session=rotated/);
});

test("password reset endpoints are explicitly allowlisted", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: url.href, method: options.method });
    return Response.json({ message: "accepted" }, { status: 202 });
  };

  const forgot = await POST(new Request("http://localhost:3001/api/platform/auth/password/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "csrf-token" },
    body: '{"email":"admin@example.test"}',
  }), { params: Promise.resolve({ path: ["password", "forgot"] }) });

  const reset = await POST(new Request("http://localhost:3001/api/platform/auth/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "csrf-token" },
    body: '{"email":"admin@example.test","token":"token"}',
  }), { params: Promise.resolve({ path: ["password", "reset"] }) });

  assert.equal(forgot.status, 202);
  assert.equal(reset.status, 202);
  assert.deepEqual(requests, [
    { url: "http://localhost:8000/api/v1/platform/auth/password/forgot", method: "POST" },
    { url: "http://localhost:8000/api/v1/platform/auth/password/reset", method: "POST" },
  ]);
});

test("unlisted routes and methods never reach Laravel", async () => {
  globalThis.fetch = () => {
    throw new Error("Upstream must not be called");
  };

  const response = await GET(
    new Request("http://localhost:3001/api/platform/auth/admins"),
    { params: Promise.resolve({ path: ["admins"] }) },
  );
  assert.equal(response.status, 404);

  const wrongMethod = await GET(
    new Request("http://localhost:3001/api/platform/auth/login"),
    { params: Promise.resolve({ path: ["login"] }) },
  );
  assert.equal(wrongMethod.status, 404);
});

test("upstream failures return a safe response", async () => {
  globalThis.fetch = async () => {
    throw new Error("private internal network detail");
  };

  const response = await GET(
    new Request("http://localhost:3001/api/platform/auth/me"),
    { params: Promise.resolve({ path: ["me"] }) },
  );

  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /private internal network detail/);
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
});
