import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { admin } = await verifyPlatformSession();

  return (
    <div className="overview">
      <section className="welcome-row">
        <div>
          <span className="section-kicker">Platform workspace</span>
          <h1>Good to see you, {admin.name.split(" ")[0]}</h1>
          <p>Manage organizations, stores, and merchant access from one secure console.</p>
        </div>
        <span className="live-pill"><i /> All services operational</span>
      </section>

      <section className="dashboard-actions" aria-label="Platform management shortcuts">
        <Link className="dashboard-action-card" href="/merchants">
          <span className="dashboard-action-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9h16l-1-5H5zM6 9v11h12V9M9 20v-6h6v6" /><path d="M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" /></svg>
          </span>
          <span><strong>Organizations & stores</strong><small>Create and manage platform tenants</small></span>
          <b aria-hidden="true">↗</b>
        </Link>
        <Link className="dashboard-action-card" href="/merchant-accounts">
          <span className="dashboard-action-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4" /><path d="M2.5 21a6.5 6.5 0 0 1 13 0M17 8h5M19.5 5.5v5" /></svg>
          </span>
          <span><strong>Merchant accounts</strong><small>Control identities, roles, and access</small></span>
          <b aria-hidden="true">↗</b>
        </Link>
      </section>

      <section className="dashboard-grid">
        <Card as="article" className="control-card">
          <CardHeader>
            <span className="card-icon shield"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9 12l2 2 4-5" /></svg></span>
            <div><span className="section-kicker">Access</span><CardTitle as="h2">Secure administrator session</CardTitle></div>
          </CardHeader>
          <CardContent>
            <div className="session-row"><span>Administrator</span><strong>{admin.name}</strong></div>
            <div className="session-row"><span>Email</span><strong>{admin.email}</strong></div>
            <div className="session-row"><span>Session</span><strong className="session-state"><i /> Active</strong></div>
          </CardContent>
        </Card>

        <Card as="article" className="control-card control-card-muted">
          <CardHeader>
            <span className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16M12 4v16" /><circle cx="12" cy="12" r="9" /></svg></span>
            <div><span className="section-kicker">Designed to scale</span><CardTitle as="h2">One control plane</CardTitle></div>
          </CardHeader>
          <CardContent>
            <p>Every management module uses the same protected layout, API boundary, and access model.</p>
            <div className="module-tags"><span>Organizations</span><span>Stores</span><span>Merchants</span></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
