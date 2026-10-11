import { proxyPlatformAuthRequest } from "../../../../../lib/server/platform-auth-proxy.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  return proxyPlatformAuthRequest(request, context);
}

export async function POST(request, context) {
  return proxyPlatformAuthRequest(request, context);
}
