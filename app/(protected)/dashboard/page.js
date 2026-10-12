import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

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
        <Card as="article" className="status-card featured" size="sm">
          <CardHeader>
            <CardAction className="card-icon shield"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9 12l2 2 4-5" /></svg></CardAction>
            <CardDescription className="card-label">Authentication</CardDescription>
            <CardTitle>Protected</CardTitle>
          </CardHeader>
          <CardContent><p>Dedicated Laravel guard and an isolated browser session are active.</p></CardContent>
          <CardFooter><span className="card-state"><i /> Verified now</span></CardFooter>
        </Card>
        <Card as="article" className="status-card" size="sm">
          <CardHeader>
            <CardAction className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.7 3.3-7 8-7s7.3 2.3 8 7" /></svg></CardAction>
            <CardDescription className="card-label">Account state</CardDescription>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent><p>{admin.email}</p></CardContent>
          <CardFooter><span className="card-meta">Platform Super Admin</span></CardFooter>
        </Card>
        <Card as="article" className="status-card" size="sm">
          <CardHeader>
            <CardAction className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></CardAction>
            <CardDescription className="card-label">Current sign-in</CardDescription>
            <CardTitle>{formatLogin(admin.lastLoginAt)}</CardTitle>
          </CardHeader>
          <CardContent><p>India Standard Time</p></CardContent>
          <CardFooter><span className="card-meta">Session expires after inactivity</span></CardFooter>
        </Card>
      </section>

      <Card as="section" className="foundation-card">
        <CardHeader className="foundation-heading">
          <div>
            <span className="section-kicker">Foundation milestone</span>
            <CardTitle as="h2">Platform access is ready</CardTitle>
          </div>
          <CardAction className="phase-badge">Core ready</CardAction>
        </CardHeader>
        <CardContent className="check-list">
          <div><span>✓</span><p><strong>Separate admin identity</strong><small>Platform accounts never share the merchant users table.</small></p></div>
          <div><span>✓</span><p><strong>Server-side session checks</strong><small>Protected pages verify access before rendering.</small></p></div>
          <div><span>✓</span><p><strong>Safe API boundary</strong><small>Only allowlisted auth calls pass through the Next.js BFF.</small></p></div>
          <div><span>✓</span><p><strong>Tenant management</strong><small>Merchant organizations and store access are connected.</small></p></div>
        </CardContent>
      </Card>
    </div>
  );
}
