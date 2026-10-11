import PlatformAuthShell from "../../../components/platform-auth-shell";
import PlatformForgotPasswordForm from "../../../features/auth/components/platform-forgot-password-form";

export const metadata = { title: "Forgot administrator password" };

export default function ForgotPasswordPage() {
  return (
    <PlatformAuthShell
      description="Enter your administrator email. We will send a secure, single-use reset link if the account is active."
      pageClassName="auth-page-scroll"
      title="Forgot password?"
    >
      <PlatformForgotPasswordForm />
    </PlatformAuthShell>
  );
}
