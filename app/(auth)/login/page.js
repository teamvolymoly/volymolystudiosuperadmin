import { redirect } from "next/navigation";
import PlatformAuthShell from "../../../components/platform-auth-shell";
import PlatformLoginForm from "../../../features/auth/components/platform-login-form";
import { getCurrentPlatformAdmin } from "../../../lib/dal/platform-auth";

export const metadata = { title: "Administrator sign in" };

export default async function LoginPage() {
  const admin = await getCurrentPlatformAdmin();
  if (admin) redirect(admin.mustChangePassword ? "/change-password" : "/dashboard");

  return (
    <PlatformAuthShell standaloneCard>
      <PlatformLoginForm />
    </PlatformAuthShell>
  );
}
