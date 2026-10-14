import TenantManagement from "../../../features/tenancy/components/tenant-management";
import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import { fetchPlatformMerchants, fetchPlatformTenancy } from "../../../lib/server/platform-client";

export const metadata = { title: "Merchants & stores" };

const EMPTY = {
  organizations: [],
  stores: [],
  summary: { organizations: 0, stores: 0, activeStores: 0, merchants: 0 },
};

export default async function MerchantsPage() {
  await verifyPlatformSession();
  const [snapshot, merchantSnapshot] = await Promise.all([
    fetchPlatformTenancy(),
    fetchPlatformMerchants({ status: "active", perPage: 100 }),
  ]);

  return (
    <TenantManagement
      accountServiceAvailable={merchantSnapshot !== null}
      merchantOptions={merchantSnapshot?.merchants || []}
      serviceAvailable={snapshot !== null}
      snapshot={snapshot || EMPTY}
    />
  );
}
