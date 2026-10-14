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
import { platformTenancyApi } from "../services/platform-tenancy-api";

const SETUP_STEPS = ["Owner", "Business", "Store", "Review"];

function blankSetup() {
  return {
    ownerMode: "new",
    ownerName: "",
    ownerEmail: "",
    ownerId: "",
    businessName: "",
    storeName: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
  };
}

function firstError(error) {
  const validation = Object.values(error.errors || {}).flat()[0];
  return validation || error.message || "Unable to complete the request.";
}

export default function TenantManagement({
  accountServiceAvailable,
  merchantOptions,
  serviceAvailable,
  snapshot,
}) {
  const router = useRouter();
  const busy = useRef(false);
  const [setupOpen, setSetupOpen] = useState(snapshot.organizations.length === 0);
  const [setupStep, setSetupStep] = useState(1);
  const [setup, setSetup] = useState(blankSetup);
  const [setupProgress, setSetupProgress] = useState({ owner: null, organization: null });
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupComplete, setSetupComplete] = useState(null);
  const [setupError, setSetupError] = useState("");
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [storeBusy, setStoreBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedMerchant = merchantOptions.find((merchant) => String(merchant.id) === setup.ownerId) || null;
  const setupOwner = setupProgress.owner || (
    setup.ownerMode === "existing"
      ? selectedMerchant
      : { name: setup.ownerName, email: setup.ownerEmail }
  );

  function updateSetup(field, value) {
    setSetup((current) => ({ ...current, [field]: value }));
  }

  function openSetup() {
    setSetup(blankSetup());
    setSetupProgress({ owner: null, organization: null });
    setSetupComplete(null);
    setSetupError("");
    setSetupStep(1);
    setError("");
    setNotice("");
    setSetupOpen(true);
  }

  function closeSetup() {
    if (setupBusy) return;
    setSetupOpen(false);
    setSetupComplete(null);
    setSetupError("");
  }

  async function run(action, setLoading) {
    if (busy.current) return null;
    busy.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message || "Saved successfully.");
      router.refresh();
      return result;
    } catch (requestError) {
      setError(firstError(requestError));
      return null;
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  function continueOwner(event) {
    event.preventDefault();
    if (setup.ownerMode === "existing" && !selectedMerchant) return;
    setSetupStep(2);
  }

  function continueBusiness(event) {
    event.preventDefault();
    setSetupStep(3);
  }

  function continueStore(event) {
    event.preventDefault();
    setSetupStep(4);
  }

  async function completeSetup() {
    if (busy.current || !setupOwner) return;
    busy.current = true;
    setSetupBusy(true);
    setSetupError("");
    setError("");
    setNotice("");

    let owner = setupProgress.owner || (setup.ownerMode === "existing" ? selectedMerchant : null);
    let organization = setupProgress.organization;
    let changed = false;

    try {
      if (!owner) {
        const ownerResult = await platformTenancyApi.createMerchant({
          name: setup.ownerName.trim(),
          email: setup.ownerEmail.trim().toLowerCase(),
        });
        owner = ownerResult.merchant;
        changed = true;
        setSetupProgress((current) => ({ ...current, owner }));
      }

      if (!organization) {
        const organizationResult = await platformTenancyApi.createOrganization({
          name: setup.businessName.trim(),
          owner_email: owner.email,
        });
        organization = organizationResult.organization;
        changed = true;
        setSetupProgress({ owner: setup.ownerMode === "new" ? owner : null, organization });
      }

      const storeResult = await platformTenancyApi.createStore({
        organization_id: Number(organization.id),
        name: setup.storeName.trim(),
        currency: setup.currency,
        timezone: setup.timezone,
      });
      changed = true;
      setSetupComplete({ owner, organization, store: storeResult.store });
      setNotice("Merchant setup completed successfully.");
      router.refresh();
    } catch (requestError) {
      const detail = firstError(requestError);
      if (organization) {
        setSetupError(`The merchant and business are saved. The store still needs attention: ${detail}`);
      } else if (owner && setup.ownerMode === "new") {
        setSetupError(`The merchant account is saved. The business still needs attention: ${detail}`);
      } else {
        setSetupError(detail);
      }
      if (changed) router.refresh();
    } finally {
      busy.current = false;
      setSetupBusy(false);
    }
  }

  async function createStore(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await run(
      () => platformTenancyApi.createStore({
        organization_id: Number(data.get("organization_id")),
        name: String(data.get("name") || "").trim(),
        currency: String(data.get("currency") || "INR"),
        timezone: String(data.get("timezone") || "Asia/Kolkata"),
      }),
      setStoreBusy,
    );
    if (result) {
      form.reset();
      setStoreFormOpen(false);
    }
  }

  function updateStatus(store) {
    const next = store.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !window.confirm(`Suspend ${store.name}? Merchants will not be able to open this store.`)) return;
    run(
      () => platformTenancyApi.updateStoreStatus(store.id, next),
      (loading) => setStatusBusy(loading ? store.id : null),
    );
  }

  const earliestEditableStep = setupProgress.organization ? 3 : setupProgress.owner ? 2 : 1;
  const canCreateSetup = serviceAvailable
    && (setup.ownerMode === "existing"
      ? Boolean(selectedMerchant)
      : Boolean(setupProgress.owner) || accountServiceAvailable);

  return (
    <div className="tenant-page">
      <section className="tenant-heading">
        <div>
          <span className="section-kicker">Merchant operations</span>
          <h1>Merchants &amp; stores</h1>
          <p>Set up a merchant owner, their business, and first store in one guided flow.</p>
        </div>
        {!setupOpen ? <button className="tenant-primary-action" onClick={openSetup} type="button">+ Add merchant</button> : null}
      </section>

      {!serviceAvailable ? (
        <div className="tenant-alert error" role="alert">Merchant and store data is currently unavailable. Check the platform service and try again.</div>
      ) : null}
      {error ? <div className="tenant-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="tenant-alert success" role="status">{notice}</div> : null}

      {setupOpen ? (
        <Card as="section" className="merchant-setup-card">
          <CardHeader className="merchant-setup-header">
            <div>
              <span className="section-kicker">Guided setup</span>
              <CardTitle as="h2">Add a merchant</CardTitle>
              <CardDescription>Complete the four short steps. You can review everything before anything is created.</CardDescription>
            </div>
            <CardAction><button className="setup-close" disabled={setupBusy} onClick={closeSetup} type="button" aria-label="Close merchant setup">×</button></CardAction>
          </CardHeader>

          <ol className="setup-steps" aria-label="Merchant setup progress">
            {SETUP_STEPS.map((label, index) => {
              const number = index + 1;
              const state = number < setupStep ? "complete" : number === setupStep ? "current" : "upcoming";
              return (
                <li className={state} key={label} aria-current={state === "current" ? "step" : undefined}>
                  <span>{state === "complete" ? "✓" : number}</span>
                  <small>{label}</small>
                </li>
              );
            })}
          </ol>

          {setupError ? <div className="setup-inline-error" role="alert">{setupError}</div> : null}

          {setupComplete ? (
            <CardContent className="setup-success">
              <span className="setup-success-icon">✓</span>
              <div>
                <h3>Merchant is ready</h3>
                <p><strong>{setupComplete.owner.name}</strong> owns {setupComplete.organization.name} and has access to {setupComplete.store.name}.</p>
                <small>An invitation was sent if this is a new merchant account.</small>
              </div>
              <button className="secondary-button" onClick={openSetup} type="button">Add another merchant</button>
              <button className="tenant-primary-action" onClick={closeSetup} type="button">Done</button>
            </CardContent>
          ) : null}

          {!setupComplete && setupStep === 1 ? (
            <form onSubmit={continueOwner}>
              <CardContent className="setup-panel">
                <div className="setup-panel-heading">
                  <span>Step 1</span>
                  <div><h3>Who will own this merchant account?</h3><p>Create a new login or connect an active merchant who already exists.</p></div>
                </div>
                <div className="owner-mode" role="group" aria-label="Merchant owner type">
                  <button className={setup.ownerMode === "new" ? "active" : ""} onClick={() => updateSetup("ownerMode", "new")} type="button" aria-pressed={setup.ownerMode === "new"}>New merchant</button>
                  <button className={setup.ownerMode === "existing" ? "active" : ""} onClick={() => updateSetup("ownerMode", "existing")} type="button" aria-pressed={setup.ownerMode === "existing"}>Existing merchant</button>
                </div>
                {setup.ownerMode === "new" ? (
                  <div className="setup-field-grid">
                    <div><label htmlFor="setup-owner-name">Merchant name</label><input autoComplete="name" id="setup-owner-name" maxLength="255" onChange={(event) => updateSetup("ownerName", event.target.value)} placeholder="Rahul Sharma" required value={setup.ownerName} /></div>
                    <div><label htmlFor="setup-owner-email">Login email</label><input autoComplete="email" id="setup-owner-email" maxLength="255" onChange={(event) => updateSetup("ownerEmail", event.target.value)} placeholder="rahul@company.com" required type="email" value={setup.ownerEmail} /></div>
                    <p className={`setup-field-note${accountServiceAvailable ? "" : " error"}`}>{accountServiceAvailable ? "We will email the merchant a secure link to create their password." : "Merchant account creation is currently unavailable. Try again after the platform service is restored."}</p>
                  </div>
                ) : (
                  <div className="setup-field-grid single">
                    <div>
                      <label htmlFor="setup-owner-existing">Merchant account</label>
                      <select id="setup-owner-existing" onChange={(event) => updateSetup("ownerId", event.target.value)} required value={setup.ownerId}>
                        <option disabled value="">Select an active merchant</option>
                        {merchantOptions.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name} · {merchant.email}</option>)}
                      </select>
                    </div>
                    {merchantOptions.length === 0 ? <p className="setup-field-note">No active accounts are available. <Link href="/merchant-accounts">Manage merchant accounts</Link></p> : null}
                  </div>
                )}
              </CardContent>
              <CardFooter className="setup-footer"><button className="secondary-button" onClick={closeSetup} type="button">Cancel</button><button className="tenant-primary-action" type="submit">Continue to business <span>→</span></button></CardFooter>
            </form>
          ) : null}

          {!setupComplete && setupStep === 2 ? (
            <form onSubmit={continueBusiness}>
              <CardContent className="setup-panel">
                <div className="setup-panel-heading">
                  <span>Step 2</span>
                  <div><h3>Tell us about the business</h3><p>This is the organization that will contain the merchant&apos;s stores.</p></div>
                </div>
                <div className="setup-owner-summary"><span>{setupOwner?.name?.slice(0, 1).toUpperCase() || "M"}</span><div><small>Merchant owner</small><strong>{setupOwner?.name}</strong><p>{setupOwner?.email}</p></div></div>
                <div className="setup-field-grid single">
                  <div><label htmlFor="setup-business-name">Business name</label><input autoFocus id="setup-business-name" maxLength="120" onChange={(event) => updateSetup("businessName", event.target.value)} placeholder="Rahul Fashion" required value={setup.businessName} /></div>
                  <p className="setup-field-note">A web-friendly URL identifier will be generated automatically.</p>
                </div>
              </CardContent>
              <CardFooter className="setup-footer">
                {earliestEditableStep < 2 ? <button className="secondary-button" onClick={() => setSetupStep(1)} type="button">← Back</button> : <span />}
                <button className="tenant-primary-action" type="submit">Continue to store <span>→</span></button>
              </CardFooter>
            </form>
          ) : null}

          {!setupComplete && setupStep === 3 ? (
            <form onSubmit={continueStore}>
              <CardContent className="setup-panel">
                <div className="setup-panel-heading">
                  <span>Step 3</span>
                  <div><h3>Create the first store</h3><p>The merchant owner will automatically receive Store Owner access.</p></div>
                </div>
                <div className="setup-field-grid">
                  <div className="full"><label htmlFor="setup-store-name">Store name</label><input autoFocus id="setup-store-name" maxLength="120" onChange={(event) => updateSetup("storeName", event.target.value)} placeholder="Rahul Mens Wear" required value={setup.storeName} /></div>
                  <div><label htmlFor="setup-currency">Currency</label><select id="setup-currency" onChange={(event) => updateSetup("currency", event.target.value)} value={setup.currency}><option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option></select></div>
                  <div><label htmlFor="setup-timezone">Timezone</label><select id="setup-timezone" onChange={(event) => updateSetup("timezone", event.target.value)} value={setup.timezone}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New York</option><option value="Europe/London">Europe/London</option></select></div>
                </div>
              </CardContent>
              <CardFooter className="setup-footer">
                {earliestEditableStep < 3 ? <button className="secondary-button" onClick={() => setSetupStep(2)} type="button">← Back</button> : <span />}
                <button className="tenant-primary-action" type="submit">Review setup <span>→</span></button>
              </CardFooter>
            </form>
          ) : null}

          {!setupComplete && setupStep === 4 ? (
            <>
              <CardContent className="setup-panel">
                <div className="setup-panel-heading">
                  <span>Step 4</span>
                  <div><h3>Review merchant setup</h3><p>Confirm the details below before creating the account, business, and store.</p></div>
                </div>
                <div className="setup-review">
                  <div><span>01</span><p><small>Merchant owner</small><strong>{setupOwner?.name}</strong><em>{setupOwner?.email}</em></p>{setupProgress.owner ? <b>Saved</b> : null}</div>
                  <div><span>02</span><p><small>Business</small><strong>{setup.businessName}</strong><em>Owner access included</em></p>{setupProgress.organization ? <b>Saved</b> : null}</div>
                  <div><span>03</span><p><small>First store</small><strong>{setup.storeName}</strong><em>{setup.currency} · {setup.timezone}</em></p></div>
                </div>
                <p className="setup-submit-note">New merchants receive an invitation email. Store access is assigned automatically.</p>
              </CardContent>
              <CardFooter className="setup-footer">
                <button className="secondary-button" disabled={setupBusy} onClick={() => setSetupStep(earliestEditableStep)} type="button">← Edit details</button>
                <button className="tenant-primary-action" disabled={!canCreateSetup || setupBusy} onClick={completeSetup} type="button">{setupBusy ? "Creating merchant…" : "Create merchant setup"}</button>
              </CardFooter>
            </>
          ) : null}
        </Card>
      ) : null}

      <section className="tenant-summary" aria-label="Tenant totals">
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Merchant owners</CardDescription><CardTitle>{snapshot.summary.merchants}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Businesses</CardDescription><CardTitle>{snapshot.summary.organizations}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>All stores</CardDescription><CardTitle>{snapshot.summary.stores}</CardTitle></CardHeader></Card>
        <Card as="article" className="tenant-stat" size="sm"><CardHeader><CardDescription>Active stores</CardDescription><CardTitle>{snapshot.summary.activeStores}</CardTitle></CardHeader></Card>
      </section>

      <Card as="section" className="tenant-directory">
        <CardHeader className="directory-heading">
          <div><span className="section-kicker">Store directory</span><CardTitle as="h2">Connected stores</CardTitle></div>
          <CardAction className="directory-actions"><span>{snapshot.stores.length} shown</span><button className="secondary-button" disabled={!serviceAvailable || snapshot.organizations.every((item) => item.status !== "active")} onClick={() => setStoreFormOpen((open) => !open)} type="button">{storeFormOpen ? "Close" : "+ Add store"}</button></CardAction>
        </CardHeader>
        {storeFormOpen ? (
          <form className="quick-store-form" onSubmit={createStore}>
            <div><label htmlFor="store-organization">Business</label><select id="store-organization" name="organization_id" required defaultValue=""><option disabled value="">Select business</option>{snapshot.organizations.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div><label htmlFor="store-name">Store name</label><input id="store-name" maxLength="120" name="name" placeholder="Rahul Mens Wear" required /></div>
            <div><label htmlFor="store-currency">Currency</label><select id="store-currency" name="currency" defaultValue="INR"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
            <div><label htmlFor="store-timezone">Timezone</label><select id="store-timezone" name="timezone" defaultValue="Asia/Kolkata"><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="America/New_York">America/New York</option><option value="Europe/London">Europe/London</option></select></div>
            <button className="tenant-primary-action" disabled={storeBusy} type="submit">{storeBusy ? "Creating…" : "Create store"}</button>
          </form>
        ) : null}
        <CardContent>
          {snapshot.stores.length === 0 ? (
            <div className="tenant-empty"><strong>No stores yet</strong><p>Use Add merchant to create an owner, business, and first store together.</p></div>
          ) : (
            <div className="tenant-table-wrap">
              <table className="tenant-table">
                <thead><tr><th>Store</th><th>Business</th><th>Merchant owner</th><th>Status</th><th>Action</th></tr></thead>
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
        <CardHeader className="directory-heading"><div><span className="section-kicker">Businesses</span><CardTitle as="h2">Merchant ownership</CardTitle></div></CardHeader>
        <CardContent className={snapshot.organizations.length > 0 ? "organization-grid" : ""}>
          {snapshot.organizations.length === 0 ? <div className="tenant-empty"><strong>No businesses yet</strong><p>Add a merchant to create the first business.</p></div> : null}
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
