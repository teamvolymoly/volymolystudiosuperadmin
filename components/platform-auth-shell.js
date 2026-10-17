import BrandMark from "./brand-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function PlatformAuthShell({
  children,
  description,
  title,
  pageClassName = "",
  standaloneCard = false,
}) {
  return (
    <main className={`login-page auth-shell ${pageClassName}`.trim()}>
      <section className="auth-showcase" aria-label="Volymoly platform administration">
        <div className="auth-showcase-top">
          <BrandMark inverse />
          <span className="auth-environment"><i /> Production console</span>
        </div>

        <div className="auth-showcase-copy">
          <span className="auth-eyebrow">Platform operations</span>
          <h2>One secure workspace for your entire commerce network.</h2>
          <p>
            Manage organizations, stores, merchant access, and platform operations from a single
            protected control plane.
          </p>
          <div className="auth-capabilities" aria-label="Platform capabilities">
            <span><i aria-hidden="true">01</i> Organization oversight</span>
            <span><i aria-hidden="true">02</i> Merchant access control</span>
            <span><i aria-hidden="true">03</i> Secure audit-ready sessions</span>
          </div>
        </div>

        <div className="auth-showcase-foot">
          <span className="auth-security-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>
          </span>
          <span><strong>Protected access</strong><small>Encrypted, isolated administrator session</small></span>
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="auth-mobile-brand"><BrandMark /></div>
        <div className="auth-form-container">
          {standaloneCard ? children : (
            <Card as="section" className="login-card">
              <CardHeader className="login-heading">
                <span className="security-badge">Restricted area</span>
                <CardTitle as="h1">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="login-card-content">{children}</CardContent>
              <CardFooter className="login-card-footer">
                <p className="access-note">Authorized Platform Super Administrators only.</p>
              </CardFooter>
            </Card>
          )}
        </div>
        <footer className="auth-form-footer">
          <span>© 2026 Volymoly</span>
          <span>Privacy · Security</span>
        </footer>
      </section>
    </main>
  );
}
