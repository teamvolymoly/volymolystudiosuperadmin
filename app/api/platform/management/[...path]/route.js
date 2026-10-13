import { proxyPlatformManagementRequest } from "../../../../../lib/server/platform-management-proxy.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  return proxyPlatformManagementRequest(request, context);
}

export async function POST(request, context) {
  return proxyPlatformManagementRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyPlatformManagementRequest(request, context);
}

export async function PUT(request, context) {
  return proxyPlatformManagementRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyPlatformManagementRequest(request, context);
}
