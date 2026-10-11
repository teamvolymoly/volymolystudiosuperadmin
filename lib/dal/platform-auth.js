import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { fetchCurrentPlatformAdmin } from "../server/platform-client";

export const getCurrentPlatformAdmin = cache(async () => fetchCurrentPlatformAdmin());

export const verifyPlatformSession = cache(async () => {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) redirect("/login");

  return { isAuthenticated: true, admin };
});
