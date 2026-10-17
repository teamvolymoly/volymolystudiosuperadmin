import PlatformHeader from "../../components/platform-header";
import PlatformSidebar from "../../components/platform-sidebar";
import { verifyPlatformSession } from "../../lib/dal/platform-auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  const { admin } = await verifyPlatformSession();
  if (admin.mustChangePassword) redirect("/change-password");

  return (
    <div className="admin-shell">
      <PlatformSidebar />

      <div className="admin-main">
        <PlatformHeader adminName={admin.name} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
