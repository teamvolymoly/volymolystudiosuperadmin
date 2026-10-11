import PlatformAuthShell from "../../../components/platform-auth-shell";
import PlatformResetPasswordForm from "../../../features/auth/components/platform-reset-password-form";

export const metadata = { title: "Reset administrator password" };

export default async function ResetPasswordPage({ searchParams }) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email.slice(0, 255) : "";

  return (
    <PlatformAuthShell
      description="Choose a new password for your Platform Super Admin account."
      pageClassName="auth-page-scroll"
      title="Reset password"
    >
      <PlatformResetPasswordForm initialEmail={email} />
    </PlatformAuthShell>
  );
}
