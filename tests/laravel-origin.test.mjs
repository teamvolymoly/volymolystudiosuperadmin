import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { laravelApiOrigin } from "../lib/server/laravel-origin.js";

const originalEnvironment = process.env.NODE_ENV;
const originalUpstream = process.env.API_UPSTREAM_URL;

afterEach(() => {
  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment;

  if (originalUpstream === undefined) delete process.env.API_UPSTREAM_URL;
  else process.env.API_UPSTREAM_URL = originalUpstream;
});

test("production always uses the live Volymoly API", () => {
  process.env.NODE_ENV = "production";
  process.env.API_UPSTREAM_URL = "http://localhost:8000";

  assert.equal(laravelApiOrigin(), "https://volymoly.com");
});

test("non-production environments can use a configured local API", () => {
  process.env.NODE_ENV = "development";
  process.env.API_UPSTREAM_URL = "http://localhost:8000";

  assert.equal(laravelApiOrigin(), "http://localhost:8000");
});
