import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DELETE, GET, PATCH, POST, PUT } from "../app/api/platform/management/[...path]/route.js";

const originalFetch = globalThis.fetch;
process.env.API_UPSTREAM_URL = "http://localhost:8000";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("tenancy snapshot uses only the isolated platform session", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/tenancy");
    assert.equal(options.method, "GET");
    assert.equal(options.headers.get("cookie"), "laravel_session=platform");
    return Response.json({ organizations: [], stores: [], summary: {} });
  };

  const response = await GET(
    new Request("http://localhost:3001/api/platform/management/tenancy", {
      headers: {
        Cookie: "laravel_session=merchant; platform_admin_session=platform",
        "User-Agent": "Browser test",
      },
    }),
    { params: Promise.resolve({ path: ["tenancy"] }) },
  );

  assert.equal(response.status, 200);
});

test("organization creation forwards JSON and CSRF to the allowlisted endpoint", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/organizations");
    assert.equal(options.headers.get("x-csrf-token"), "csrf-token");
    assert.equal(options.body, '{"name":"Acme","owner_email":"owner@example.test"}');
    return Response.json({ organization: { id: 1 } }, { status: 201 });
  };

  const response = await POST(
    new Request("http://localhost:3001/api/platform/management/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "csrf-token" },
      body: '{"name":"Acme","owner_email":"owner@example.test"}',
    }),
    { params: Promise.resolve({ path: ["organizations"] }) },
  );

  assert.equal(response.status, 201);
});

test("store status updates are restricted to numeric store identifiers", async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/stores/42/status");
    assert.equal(options.method, "PATCH");
    return Response.json({ store: { id: 42, status: "suspended" } });
  };

  const accepted = await PATCH(
    new Request("http://localhost:3001/api/platform/management/stores/42/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"status":"suspended"}',
    }),
    { params: Promise.resolve({ path: ["stores", "42", "status"] }) },
  );
  const rejected = await PATCH(
    new Request("http://localhost:3001/api/platform/management/stores/all/status", {
      method: "PATCH",
    }),
    { params: Promise.resolve({ path: ["stores", "all", "status"] }) },
  );

  assert.equal(accepted.status, 200);
  assert.equal(rejected.status, 404);
  assert.equal(calls, 1);
});

test("merchant account queries and status updates use allowlisted endpoints", async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    if (options.method === "GET") {
      assert.equal(url.href, "http://localhost:8000/api/v1/platform/merchants?search=rahul&status=active");
      return Response.json({ merchants: [], summary: {}, pagination: {} });
    }

    assert.equal(url.href, "http://localhost:8000/api/v1/platform/merchants/17/status");
    assert.equal(options.method, "PATCH");
    return Response.json({ merchant: { id: 17, status: "suspended" } });
  };

  const listed = await GET(
    new Request("http://localhost:3001/api/platform/management/merchants?search=rahul&status=active"),
    { params: Promise.resolve({ path: ["merchants"] }) },
  );
  const updated = await PATCH(
    new Request("http://localhost:3001/api/platform/management/merchants/17/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"status":"suspended"}',
    }),
    { params: Promise.resolve({ path: ["merchants", "17", "status"] }) },
  );
  const rejected = await PATCH(
    new Request("http://localhost:3001/api/platform/management/merchants/all/status", { method: "PATCH" }),
    { params: Promise.resolve({ path: ["merchants", "all", "status"] }) },
  );

  assert.equal(listed.status, 200);
  assert.equal(updated.status, 200);
  assert.equal(rejected.status, 404);
  assert.equal(calls, 2);
});

test("merchant creation and invitation use allowlisted endpoints", async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    if (url.pathname.endsWith("/merchants")) {
      assert.equal(options.method, "POST");
      assert.equal(options.body, '{"name":"New Merchant","email":"new@example.test"}');
      return Response.json({ merchant: { id: 21 } }, { status: 201 });
    }
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/merchants/21/invitation");
    assert.equal(options.method, "POST");
    return Response.json({ message: "Merchant invitation queued." }, { status: 202 });
  };

  const created = await POST(
    new Request("http://localhost:3001/api/platform/management/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"New Merchant","email":"new@example.test"}',
    }),
    { params: Promise.resolve({ path: ["merchants"] }) },
  );
  const invited = await POST(
    new Request("http://localhost:3001/api/platform/management/merchants/21/invitation", { method: "POST" }),
    { params: Promise.resolve({ path: ["merchants", "21", "invitation"] }) },
  );

  assert.equal(created.status, 201);
  assert.equal(invited.status, 202);
  assert.equal(calls, 2);
});

test("merchant organization and store access mutations require numeric identifiers", async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    if (options.method === "PUT") {
      assert.equal(url.href, "http://localhost:8000/api/v1/platform/merchants/21/organizations/8");
      assert.equal(options.body, '{"role":"owner"}');
      return Response.json({ merchant: { id: 21 } });
    }
    assert.equal(url.href, "http://localhost:8000/api/v1/platform/merchants/21/stores/13");
    assert.equal(options.method, "DELETE");
    assert.equal(options.body, undefined);
    return Response.json({ merchant: { id: 21 } });
  };

  const assigned = await PUT(
    new Request("http://localhost:3001/api/platform/management/merchants/21/organizations/8", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: '{"role":"owner"}',
    }),
    { params: Promise.resolve({ path: ["merchants", "21", "organizations", "8"] }) },
  );
  const removed = await DELETE(
    new Request("http://localhost:3001/api/platform/management/merchants/21/stores/13", { method: "DELETE" }),
    { params: Promise.resolve({ path: ["merchants", "21", "stores", "13"] }) },
  );
  const rejected = await PUT(
    new Request("http://localhost:3001/api/platform/management/merchants/all/organizations/8", { method: "PUT" }),
    { params: Promise.resolve({ path: ["merchants", "all", "organizations", "8"] }) },
  );

  assert.equal(assigned.status, 200);
  assert.equal(removed.status, 200);
  assert.equal(rejected.status, 404);
  assert.equal(calls, 2);
});

test("unlisted management routes never reach Laravel", async () => {
  globalThis.fetch = () => {
    throw new Error("Upstream must not be called");
  };

  const response = await GET(
    new Request("http://localhost:3001/api/platform/management/admins"),
    { params: Promise.resolve({ path: ["admins"] }) },
  );

  assert.equal(response.status, 404);
});
