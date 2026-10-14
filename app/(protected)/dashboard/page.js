import { verifyPlatformSession } from "../../../lib/dal/platform-auth";
import {
  Card,
  CardAction,
  CardContent,
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
          <h1>Welcome, {admin.name.split(" ")[0]}</h1>
        </div>
        <span className="live-pill"><i /> All services operational</span>
      </section>

      <section className="status-grid" aria-label="Authentication status">
        <Card as="article" className="status-card featured" size="sm">
          <CardHeader>
            <CardAction className="card-icon shield"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9 12l2 2 4-5" /></svg></CardAction>
            <CardTitle as="h2">Authentication</CardTitle>
          </CardHeader>
          <CardContent><strong className="status-value">Protected</strong></CardContent>
          <CardFooter><span className="card-state"><i /> Verified now</span></CardFooter>
        </Card>
        <Card as="article" className="status-card" size="sm">
          <CardHeader>
            <CardAction className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.7 3.3-7 8-7s7.3 2.3 8 7" /></svg></CardAction>
            <CardTitle as="h2">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="status-value">Active</strong>
            <p>{admin.email}</p>
          </CardContent>
        </Card>
        <Card as="article" className="status-card" size="sm">
          <CardHeader>
            <CardAction className="card-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></CardAction>
            <CardTitle as="h2">Last sign-in</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="status-value status-value-date">{formatLogin(admin.lastLoginAt)}</strong>
            <p>India Standard Time</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
