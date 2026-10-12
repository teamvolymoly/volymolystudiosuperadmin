"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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

export default function MerchantAccounts({ filters, serviceAvailable, snapshot }) {
  const router = useRouter();
  const busy = useRef(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(merchant) {
    const next = merchant.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !window.confirm(`Suspend ${merchant.name}? Their active sessions will be signed out.`)) {
      return;
    }
    if (busy.current) return;

    busy.current = true;
    setStatusBusy(merchant.id);
    setError("");
    setNotice("");
    try {
      const result = await platformTenancyApi.updateMerchantStatus(merchant.id, next);
      setNotice(result.message || "Merchant account updated.");
      router.refresh();
    } catch (requestError) {
      setError(firstError(requestError));
    } finally {
      busy.current = false;
      setStatusBusy(null);
    }
  }

  const pagination = snapshot.pagination;

  return (
    <div className="tenant-page merchant-accounts-page">
      <section className="tenant-heading">
        <div>
          <span className="section-kicker">Account control</span>
          <h1>Merchant accounts</h1>
          <p>Review registered merchants, their business access, and suspend or reactivate login access.</p>
        </div>
        <span className="security-badge">Database connected</span>
      </section>

      {!serviceAvailable ? (
        <div className="tenant-alert error" role="alert">Merchant account service is unavailable. Verify Laravel is running and migrations are applied.</div>
      ) : null}
      {error ? <div className="tenant-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="tenant-alert success" role="status">{notice}</div> : null}

      <section className="tenant-summary" aria-label="Merchant account totals">
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>All accounts</CardDescription><CardTitle>{snapshot.summary.total}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Active</CardDescription><CardTitle>{snapshot.summary.active}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Suspended</CardDescription><CardTitle>{snapshot.summary.suspended}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Email verified</CardDescription><CardTitle>{snapshot.summary.verified}</CardTitle></CardHeader></Card>
      </section>

      <Card as="section" className="merchant-filter-card">
        <CardContent>
          <form action="/merchant-accounts" className="merchant-filters" method="get">
            <div>
              <label htmlFor="merchant-search">Search merchant</label>
              <input defaultValue={filters.search} id="merchant-search" maxLength="120" name="search" placeholder="Name or email" type="search" />
            </div>
            <div>
              <label htmlFor="merchant-status">Account status</label>
              <select defaultValue={filters.status} id="merchant-status" name="status">
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
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
            <div className="tenant-empty"><strong>No merchant accounts found</strong><p>Try a different name, email, or status filter.</p></div>
          ) : (
            <div className="tenant-table-wrap">
              <table className="tenant-table merchant-account-table">
                <thead><tr><th>Merchant</th><th>Organization</th><th>Access</th><th>Verification</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {snapshot.merchants.map((merchant) => (
                    <tr key={merchant.id}>
                      <td><strong>{merchant.name}</strong><small>{merchant.email} · Joined {formatDate(merchant.createdAt)}</small></td>
                      <td>
                        <strong>{merchant.organizations?.[0]?.name || "Unassigned"}</strong>
                        {merchant.organizationsCount > 1 ? <small>+{merchant.organizationsCount - 1} more</small> : null}
                      </td>
                      <td>{merchant.organizationsCount} org · {merchant.storesCount} {merchant.storesCount === 1 ? "store" : "stores"}</td>
                      <td><span className={`verification-badge ${merchant.emailVerified ? "verified" : "pending"}`}>{merchant.emailVerified ? "Verified" : "Pending"}</span></td>
                      <td><span className={`status-badge ${merchant.status}`}>{merchant.status}</span></td>
                      <td><button className="table-action" disabled={statusBusy === merchant.id || !serviceAvailable} onClick={() => updateStatus(merchant)} type="button">{statusBusy === merchant.id ? "Saving…" : merchant.status === "active" ? "Suspend" : "Activate"}</button></td>
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
    </div>
  );
}
