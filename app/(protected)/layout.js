import BrandMark from "../../components/brand-mark";
import PlatformNav from "../../components/platform-nav";
import LogoutButton from "../../features/auth/components/logout-button";
import { verifyPlatformSession } from "../../lib/dal/platform-auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  const { admin } = await verifyPlatformSession();
  if (admin.mustChangePassword) redirect("/change-password");
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
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
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
