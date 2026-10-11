import BrandMark from "../../components/brand-mark";
import PlatformNav from "../../components/platform-nav";
import LogoutButton from "../../features/auth/components/logout-button";
import { verifyPlatformSession } from "../../lib/dal/platform-auth";

export default async function ProtectedLayout({ children }) {
  const { admin } = await verifyPlatformSession();
  const initials = admin.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <BrandMark compact />
        <PlatformNav />
        <div className="sidebar-foot">
          <div className="environment"><span /> Secure platform session</div>
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <div>
            <span className="topbar-label">Platform administration</span>
            <strong>Control center</strong>
          </div>
          <div className="profile-chip">
            <span className="avatar">{initials || "PA"}</span>
            <span><strong>{admin.name}</strong><small>{admin.email}</small></span>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
