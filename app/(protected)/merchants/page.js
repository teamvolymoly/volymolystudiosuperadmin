import TenantManagement from "../../../features/tenancy/components/tenant-management";
import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import { fetchPlatformTenancy } from "../../../lib/server/platform-client";

export const metadata = { title: "Merchants & stores" };

const EMPTY = {
  organizations: [],
  stores: [],
  summary: { organizations: 0, stores: 0, activeStores: 0, merchants: 0 },
};

export default async function MerchantsPage() {
  await verifyPlatformSession();
  const snapshot = await fetchPlatformTenancy();

  return <TenantManagement serviceAvailable={snapshot !== null} snapshot={snapshot || EMPTY} />;
}
