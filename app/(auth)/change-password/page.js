import { redirect } from "next/navigation";
import PlatformAuthShell from "../../../components/platform-auth-shell";
import PlatformChangePasswordForm from "../../../features/auth/components/platform-change-password-form";
import { getCurrentPlatformAdmin } from "../../../lib/dal/platform-auth";

export const metadata = { title: "Change administrator password" };

export default async function ChangePasswordPage() {
  const admin = await getCurrentPlatformAdmin();
  if (!admin) redirect("/login");
  if (!admin.mustChangePassword) redirect("/dashboard");

  return (
    <PlatformAuthShell standaloneCard>
      <PlatformChangePasswordForm />
    </PlatformAuthShell>
  );
}
