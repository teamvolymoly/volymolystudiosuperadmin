"use client";

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
import { platformTenancyApi } from "../services/platform-tenancy-api";

function firstError(error) {
  const validation = Object.values(error.errors || {}).flat()[0];
  return validation || error.message || "Unable to complete the request.";
}

export default function TenantManagement({ snapshot, serviceAvailable }) {
  const router = useRouter();
  const busy = useRef(false);
  const [organizationBusy, setOrganizationBusy] = useState(false);
  const [storeBusy, setStoreBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function run(action, setLoading) {
    if (busy.current) return false;
    busy.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message || "Saved successfully.");
      router.refresh();
      return true;
    } catch (requestError) {
      setError(firstError(requestError));
      return false;
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  async function createOrganization(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await run(
      () => platformTenancyApi.createOrganization({
        name: String(data.get("name") || "").trim(),
        owner_email: String(data.get("owner_email") || "").trim().toLowerCase(),
      }),
      setOrganizationBusy,
    );
    if (saved) form.reset();
  }

  async function createStore(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await run(
      () => platformTenancyApi.createStore({
        organization_id: Number(data.get("organization_id")),
        name: String(data.get("name") || "").trim(),
        currency: String(data.get("currency") || "INR"),
        timezone: String(data.get("timezone") || "Asia/Kolkata"),
      }),
      setStoreBusy,
    );
    if (saved) form.reset();
  }

  function updateStatus(store) {
    const next = store.status === "active" ? "suspended" : "active";
    run(
      () => platformTenancyApi.updateStoreStatus(store.id, next),
      (loading) => setStatusBusy(loading ? store.id : null),
    );
  }

  return (
    <div className="tenant-page">
      <section className="tenant-heading">
        <div>
          <span className="section-kicker">Tenant operations</span>
          <h1>Merchants & stores</h1>
          <p>Create a merchant organization, assign an existing user as owner, then launch stores under it.</p>
        </div>
        <span className="security-badge">Isolated access</span>
      </section>

      {!serviceAvailable ? (
        <div className="tenant-alert error" role="alert">Tenant service is unavailable. Verify Laravel is running and the tenant migration has been applied.</div>
      ) : null}
      {error ? <div className="tenant-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="tenant-alert success" role="status">{notice}</div> : null}

      <section className="tenant-summary" aria-label="Tenant totals">
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Merchant owners</CardDescription><CardTitle>{snapshot.summary.merchants}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Organizations</CardDescription><CardTitle>{snapshot.summary.organizations}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>All stores</CardDescription><CardTitle>{snapshot.summary.stores}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Active stores</CardDescription><CardTitle>{snapshot.summary.activeStores}</CardTitle></CardHeader></Card>
      </section>

      <section className="tenant-form-grid">
        <Card as="form" className="tenant-form-card" onSubmit={createOrganization}>
          <CardHeader className="tenant-form-heading">
            <span className="step-chip">01</span>
            <div><CardTitle as="h2">Create organization</CardTitle><CardDescription>The owner must already have a Merchant Admin account.</CardDescription></div>
          </CardHeader>
          <CardContent className="tenant-form-content">
            <label htmlFor="organization-name">Business name</label>
            <input id="organization-name" maxLength="120" name="name" placeholder="Rahul Fashion" required />
            <label htmlFor="owner-email">Merchant owner email</label>
            <input id="owner-email" name="owner_email" placeholder="owner@company.com" required type="email" />
          </CardContent>
          <CardFooter>
            <button disabled={!serviceAvailable || organizationBusy} type="submit">
              {organizationBusy ? "Creating…" : "Create and assign owner"}
            </button>
          </CardFooter>
        </Card>

        <Card as="form" className="tenant-form-card" onSubmit={createStore}>
          <CardHeader className="tenant-form-heading">
            <span className="step-chip">02</span>
            <div><CardTitle as="h2">Create store</CardTitle><CardDescription>Organization owners automatically receive Store Owner access.</CardDescription></div>
          </CardHeader>
          <CardContent className="tenant-form-content">
            <label htmlFor="store-organization">Organization</label>
            <select id="store-organization" name="organization_id" required defaultValue="">
              <option disabled value="">Select organization</option>
              {snapshot.organizations.filter((item) => item.status === "active").map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <label htmlFor="store-name">Store name</label>
            <input id="store-name" maxLength="120" name="name" placeholder="Rahul Mens Wear" required />
            <div className="tenant-inline-fields">
              <div><label htmlFor="store-currency">Currency</label><select id="store-currency" name="currency" defaultValue="INR"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
              <div><label htmlFor="store-timezone">Timezone</label><select id="store-timezone" name="timezone" defaultValue="Asia/Kolkata"><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New York</option><option value="Europe/London">Europe/London</option></select></div>
            </div>
          </CardContent>
          <CardFooter>
            <button disabled={!serviceAvailable || storeBusy || !snapshot.organizations.some((item) => item.status === "active")} type="submit">
              {storeBusy ? "Creating…" : "Create store"}
            </button>
          </CardFooter>
        </Card>
      </section>

      <Card as="section" className="tenant-directory">
        <CardHeader className="directory-heading"><div><span className="section-kicker">Store directory</span><CardTitle as="h2">Connected stores</CardTitle></div><CardAction>{snapshot.stores.length} shown</CardAction></CardHeader>
        <CardContent>
          {snapshot.stores.length === 0 ? (
            <div className="tenant-empty"><strong>No stores yet</strong><p>Create an organization first, then create its first store.</p></div>
          ) : (
            <div className="tenant-table-wrap">
              <table className="tenant-table">
                <thead><tr><th>Store</th><th>Organization</th><th>Merchant owner</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {snapshot.stores.map((store) => (
                    <tr key={store.id}>
                      <td><strong>{store.name}</strong><small>/{store.slug} · {store.currency}</small></td>
                      <td>{store.organization?.name || "—"}</td>
                      <td>{store.owners?.[0]?.email || "No owner"}</td>
                      <td><span className={`status-badge ${store.status}`}>{store.status}</span></td>
                      <td><button className="table-action" disabled={statusBusy === store.id} onClick={() => updateStatus(store)} type="button">{statusBusy === store.id ? "Saving…" : store.status === "active" ? "Suspend" : "Activate"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card as="section" className="organization-directory">
        <CardHeader className="directory-heading"><div><span className="section-kicker">Organizations</span><CardTitle as="h2">Merchant ownership</CardTitle></div></CardHeader>
        <CardContent className="organization-grid">
          {snapshot.organizations.map((organization) => (
            <Card as="article" className="organization-card" key={organization.id} size="sm">
              <CardHeader><CardAction><span className={`status-badge ${organization.status}`}>{organization.status}</span></CardAction><CardTitle>{organization.name}</CardTitle><CardDescription>{organization.owners?.[0]?.email || "No owner assigned"}</CardDescription></CardHeader>
              <CardFooter>{organization.stores_count} {organization.stores_count === 1 ? "store" : "stores"}</CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
