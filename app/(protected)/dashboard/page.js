import { verifyPlatformSession } from "../../../lib/dal/platform-auth";

export const metadata = { title: "Overview" };

function formatLogin(value) {
  if (!value) return "First secure session";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const { admin } = await verifyPlatformSession();

  return (
    <div className="overview">
      <section className="welcome-row">
        <div>
          <span className="section-kicker">System overview</span>
          <h1>Good to see you, {admin.name.split(" ")[0]}.</h1>
          <p>Your isolated Platform Super Admin login is active and ready.</p>
        </div>
        <span className="live-pill"><i /> All auth services operational</span>
      </section>

      <section className="status-grid" aria-label="Authentication status">
        <article className="status-card featured">
          <div className="card-icon shield"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9 12l2 2 4-5" /></svg></div>
          <span className="card-label">Authentication</span>
          <strong>Protected</strong>
          <p>Dedicated Laravel guard and an isolated browser session are active.</p>
          <span className="card-state"><i /> Verified now</span>
        </article>
        <article className="status-card">
          <div className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.7 3.3-7 8-7s7.3 2.3 8 7" /></svg></div>
          <span className="card-label">Account state</span>
          <strong>Active</strong>
          <p>{admin.email}</p>
          <span className="card-meta">Platform Super Admin</span>
        </article>
        <article className="status-card">
          <div className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
          <span className="card-label">Current sign-in</span>
          <strong>{formatLogin(admin.lastLoginAt)}</strong>
          <p>India Standard Time</p>
          <span className="card-meta">Session expires after inactivity</span>
        </article>
      </section>

      <section className="foundation-card">
        <div className="foundation-heading">
          <div>
            <span className="section-kicker">Foundation milestone</span>
            <h2>Platform access is ready</h2>
          </div>
          <span>Phase 1</span>
        </div>
        <div className="check-list">
          <div><span>✓</span><p><strong>Separate admin identity</strong><small>Platform accounts never share the merchant users table.</small></p></div>
          <div><span>✓</span><p><strong>Server-side session checks</strong><small>Protected pages verify access before rendering.</small></p></div>
          <div><span>✓</span><p><strong>Safe API boundary</strong><small>Only allowlisted auth calls pass through the Next.js BFF.</small></p></div>
          <div className="pending"><span>→</span><p><strong>Tenant management</strong><small>Merchant and store controls begin in the next approved phase.</small></p></div>
        </div>
      </section>
    </div>
  );
}
