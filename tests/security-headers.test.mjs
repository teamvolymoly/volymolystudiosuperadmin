import assert from "node:assert/strict";
import { test } from "node:test";
import nextConfig, { contentSecurityPolicy, securityHeaders } from "../next.config.mjs";

test("platform routes receive hardened response headers", async () => {
  const rules = await nextConfig.headers();
  assert.equal(rules.length, 1);
  assert.deepEqual(rules[0].headers, securityHeaders);

  const headers = new Map(securityHeaders.map(({ key, value }) => [key, value]));
  assert.equal(headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy, /object-src 'none'/);
  assert.equal(nextConfig.poweredByHeader, false);
});
