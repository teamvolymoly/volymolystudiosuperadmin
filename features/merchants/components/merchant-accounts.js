"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { platformTenancyApi } from "../../tenancy/services/platform-tenancy-api";

function firstError(error) {
  const validation = Object.values(error.errors || {}).flat()[0];
  return validation || error.message || "Unable to update the merchant account.";
}

function pageHref(page, filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/merchant-accounts?${query}` : "/merchant-accounts";
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MerchantAccounts({
  accessAvailable,
  accessOptions,
  filters,
  serviceAvailable,
  snapshot,
}) {
  const router = useRouter();
  const busy = useRef(false);
  const [operation, setOperation] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedMerchant = snapshot.merchants.find((merchant) => merchant.id === selectedMerchantId) || null;
  const working = operation !== "";

  async function perform(key, action, afterSuccess) {
    if (busy.current) return null;
    busy.current = true;
    setOperation(key);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message || "Saved successfully.");
      afterSuccess?.(result);
      router.refresh();
      return result;
    } catch (requestError) {
      setError(firstError(requestError));
      return null;
    } finally {
      busy.current = false;
      setOperation("");
    }
  }

  async function createMerchant(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await perform(
      "create",
      () => platformTenancyApi.createMerchant({
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim().toLowerCase(),
      }),
      (payload) => setSelectedMerchantId(payload.merchant?.id ?? null),
    );
    if (result) form.reset();
  }

  async function updateStatus(merchant) {
    const next = merchant.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !window.confirm(`Suspend ${merchant.name}? Their active sessions and pending invitation will be revoked.`)) return;
    await perform(`status-${merchant.id}`, () => platformTenancyApi.updateMerchantStatus(merchant.id, next));
  }

  async function resendInvitation(merchant) {
    await perform(`invite-${merchant.id}`, () => platformTenancyApi.resendMerchantInvitation(merchant.id));
  }

  async function assignOrganization(event) {
    event.preventDefault();
    if (!selectedMerchant) return;
    const data = new FormData(event.currentTarget);
    const organizationId = Number(data.get("organization_id"));
    const role = String(data.get("role") || "member");
    await perform(
      `organization-${organizationId}`,
      () => platformTenancyApi.updateMerchantOrganizationAccess(selectedMerchant.id, organizationId, role),
    );
  }

  async function removeOrganization(organization) {
    if (!selectedMerchant || !window.confirm(`Remove access to ${organization.name}? Store access inside this organization will also be removed.`)) return;
    await perform(
      `organization-${organization.id}`,
      () => platformTenancyApi.removeMerchantOrganizationAccess(selectedMerchant.id, organization.id),
    );
  }

  async function assignStore(event) {
    event.preventDefault();
    if (!selectedMerchant) return;
    const data = new FormData(event.currentTarget);
    const storeId = Number(data.get("store_id"));
    const role = String(data.get("role") || "staff");
    await perform(
      `store-${storeId}`,
      () => platformTenancyApi.updateMerchantStoreAccess(selectedMerchant.id, storeId, role),
    );
  }

  async function removeStore(store) {
    if (!selectedMerchant || !window.confirm(`Remove access to ${store.name}?`)) return;
    await perform(
      `store-${store.id}`,
      () => platformTenancyApi.removeMerchantStoreAccess(selectedMerchant.id, store.id),
    );
  }

  const pagination = snapshot.pagination;

  return (
    <div className="tenant-page merchant-accounts-page">
      <section className="tenant-heading">
        <div>
          <span className="section-kicker">Account control</span>
          <h1>Merchant accounts</h1>
          <p>Create merchant logins, manage invitations, and control organization and store access.</p>
        </div>
        <span className="security-badge">Database connected</span>
      </section>

      {!serviceAvailable ? <div className="tenant-alert error" role="alert">Merchant account service is unavailable. Verify Laravel is running and migrations are applied.</div> : null}
      {error ? <div className="tenant-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="tenant-alert success" role="status">{notice}</div> : null}

      <Card as="form" className="merchant-create-card" onSubmit={createMerchant}>
        <CardHeader>
          <div><span className="section-kicker">New account</span><CardTitle as="h2">Create Merchant</CardTitle><CardDescription>The Merchant receives a secure email link to set their own password.</CardDescription></div>
          <CardAction><span className="security-badge">No password sharing</span></CardAction>
        </CardHeader>
        <CardContent className="merchant-create-fields">
          <div><label htmlFor="new-merchant-name">Merchant name</label><input id="new-merchant-name" maxLength="255" name="name" placeholder="Merchant or business owner" required /></div>
          <div><label htmlFor="new-merchant-email">Login email</label><input autoComplete="email" id="new-merchant-email" maxLength="255" name="email" placeholder="merchant@company.com" required type="email" /></div>
        </CardContent>
        <CardFooter><button disabled={!serviceAvailable || working} type="submit">{operation === "create" ? "Creating…" : "Create account & send invite"}</button></CardFooter>
      </Card>

      <section className="tenant-summary" aria-label="Merchant account totals">
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>All accounts</CardDescription><CardTitle>{snapshot.summary.total}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Active</CardDescription><CardTitle>{snapshot.summary.active}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Suspended</CardDescription><CardTitle>{snapshot.summary.suspended}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Email verified</CardDescription><CardTitle>{snapshot.summary.verified}</CardTitle></CardHeader></Card>
      </section>

      <Card as="section" className="merchant-filter-card">
        <CardContent>
          <form action="/merchant-accounts" className="merchant-filters" method="get">
            <div><label htmlFor="merchant-search">Search merchant</label><input defaultValue={filters.search} id="merchant-search" maxLength="120" name="search" placeholder="Name or email" type="search" /></div>
            <div><label htmlFor="merchant-status">Account status</label><select defaultValue={filters.status} id="merchant-status" name="status"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
            <button disabled={!serviceAvailable} type="submit">Apply filters</button>
            {(filters.search || filters.status) ? <Link className="filter-reset" href="/merchant-accounts">Reset</Link> : null}
          </form>
        </CardContent>
      </Card>

      <Card as="section" className="tenant-directory merchant-directory">
        <CardHeader className="directory-heading">
          <div><span className="section-kicker">Merchant directory</span><CardTitle as="h2">Registered accounts</CardTitle></div>
          <CardAction>{pagination.total} {pagination.total === 1 ? "result" : "results"}</CardAction>
        </CardHeader>
        <CardContent>
          {snapshot.merchants.length === 0 ? (
            <div className="tenant-empty"><strong>No merchant accounts found</strong><p>Create an account or try different filters.</p></div>
          ) : (
            <div className="tenant-table-wrap">
              <table className="tenant-table merchant-account-table">
                <thead><tr><th>Merchant</th><th>Setup</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {snapshot.merchants.map((merchant) => (
                    <tr className={selectedMerchantId === merchant.id ? "selected-row" : ""} key={merchant.id}>
                      <td><strong>{merchant.name}</strong><small>{merchant.email} · Joined {formatDate(merchant.createdAt)}</small></td>
                      <td><span className={`verification-badge ${merchant.setupStatus === "complete" ? "verified" : "pending"}`}>{merchant.setupStatus === "complete" ? "Ready" : "Invite pending"}</span><small>{merchant.emailVerified ? "Email verified" : "Awaiting verification"}</small></td>
                      <td><strong>{merchant.organizationsCount} organizations</strong><small>{merchant.storesCount} {merchant.storesCount === 1 ? "store" : "stores"}</small></td>
                      <td><span className={`status-badge ${merchant.status}`}>{merchant.status}</span></td>
                      <td>
                        <div className="merchant-row-actions">
                          <button className="table-action" disabled={working || !accessAvailable} onClick={() => setSelectedMerchantId(selectedMerchantId === merchant.id ? null : merchant.id)} type="button">{selectedMerchantId === merchant.id ? "Close" : "Manage"}</button>
                          {merchant.setupStatus === "pending" && merchant.status === "active" ? <button className="table-action" disabled={working || !serviceAvailable} onClick={() => resendInvitation(merchant)} type="button">{operation === `invite-${merchant.id}` ? "Sending…" : "Resend invite"}</button> : null}
                          <button className="table-action" disabled={working || !serviceAvailable} onClick={() => updateStatus(merchant)} type="button">{operation === `status-${merchant.id}` ? "Saving…" : merchant.status === "active" ? "Suspend" : "Activate"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {pagination.lastPage > 1 ? (
          <div className="merchant-pagination" aria-label="Merchant account pages">
            {pagination.page > 1 ? <Link href={pageHref(pagination.page - 1, filters)}>← Previous</Link> : <span />}
            <span>Page {pagination.page} of {pagination.lastPage}</span>
            {pagination.page < pagination.lastPage ? <Link href={pageHref(pagination.page + 1, filters)}>Next →</Link> : <span />}
          </div>
        ) : null}
      </Card>

      {selectedMerchant ? (
        <Card as="section" className="merchant-access-card">
          <CardHeader>
            <div><span className="section-kicker">Access manager</span><CardTitle as="h2">{selectedMerchant.name}</CardTitle><CardDescription>{selectedMerchant.email} · {titleCase(selectedMerchant.setupStatus)} setup</CardDescription></div>
            <CardAction><button className="panel-close" onClick={() => setSelectedMerchantId(null)} type="button">Close</button></CardAction>
          </CardHeader>
          <CardContent className="merchant-access-grid">
            <section className="merchant-access-section">
              <div className="access-section-heading"><div><h3>Organizations</h3><p>Owner access automatically includes every store in that organization.</p></div><span>{selectedMerchant.organizations.length}</span></div>
              <form className="access-assignment-form" onSubmit={assignOrganization}>
                <select aria-label="Organization" defaultValue="" name="organization_id" required><option disabled value="">Select organization</option>{accessOptions.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} · {organization.status}</option>)}</select>
                <select aria-label="Organization role" defaultValue="member" name="role"><option value="owner">Owner</option><option value="admin">Admin</option><option value="member">Member</option></select>
                <button disabled={working || !accessAvailable || accessOptions.organizations.length === 0} type="submit">Assign / update</button>
              </form>
              <div className="access-list">
                {selectedMerchant.organizations.length === 0 ? <p className="access-empty">No organization access assigned.</p> : selectedMerchant.organizations.map((organization) => (
                  <div className="access-item" key={organization.id}><div><strong>{organization.name}</strong><small>{titleCase(organization.role)} · {organization.status}</small></div><button disabled={working} onClick={() => removeOrganization(organization)} type="button">Remove</button></div>
                ))}
              </div>
            </section>

            <section className="merchant-access-section">
              <div className="access-section-heading"><div><h3>Stores</h3><p>Assign direct store access and choose the Merchant&apos;s operating role.</p></div><span>{selectedMerchant.stores.length}</span></div>
              <form className="access-assignment-form" onSubmit={assignStore}>
                <select aria-label="Store" defaultValue="" name="store_id" required><option disabled value="">Select store</option>{accessOptions.stores.map((store) => <option key={store.id} value={store.id}>{store.organization?.name || "Organization"} / {store.name} · {store.status}</option>)}</select>
                <select aria-label="Store role" defaultValue="staff" name="role"><option value="owner">Owner</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option></select>
                <button disabled={working || !accessAvailable || accessOptions.stores.length === 0} type="submit">Assign / update</button>
              </form>
              <div className="access-list">
                {selectedMerchant.stores.length === 0 ? <p className="access-empty">No store access assigned.</p> : selectedMerchant.stores.map((store) => (
                  <div className="access-item" key={store.id}><div><strong>{store.name}</strong><small>{store.organization?.name || "No organization"} · {titleCase(store.role)}</small></div><button disabled={working} onClick={() => removeStore(store)} type="button">Remove</button></div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
