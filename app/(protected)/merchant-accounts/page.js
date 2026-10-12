import MerchantAccounts from "../../../features/merchants/components/merchant-accounts";
import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import { fetchPlatformMerchants } from "../../../lib/server/platform-client";

export const metadata = { title: "Merchant accounts" };

const EMPTY = {
  merchants: [],
  summary: { total: 0, active: 0, suspended: 0, verified: 0 },
  pagination: { page: 1, perPage: 20, lastPage: 1, total: 0 },
};

function scalar(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MerchantAccountsPage({ searchParams }) {
  await verifyPlatformSession();
  const query = await searchParams;
  const search = String(scalar(query.search) || "").trim().slice(0, 120);
  const requestedStatus = scalar(query.status);
  const status = ["active", "suspended"].includes(requestedStatus) ? requestedStatus : "";
  const requestedPage = Number.parseInt(scalar(query.page), 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const snapshot = await fetchPlatformMerchants({ search, status, page });

  return (
    <MerchantAccounts
      filters={{ search, status }}
      serviceAvailable={snapshot !== null}
      snapshot={snapshot || EMPTY}
    />
  );
}
