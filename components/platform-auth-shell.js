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
    <main className={`login-page ${pageClassName}`.trim()}>
      <header className="login-header">
        <BrandMark compact />
        <span><i /> Secure platform access</span>
      </header>
      <section className="login-panel">
        {standaloneCard ? children : (
          <Card as="section" className="login-card">
            <CardHeader className="login-heading">
              <div className="login-emblem" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9.5 12l1.7 1.7 3.8-4" /></svg>
              </div>
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
      </section>
      <footer className="login-footer">
        <span>© 2026 Volymoly</span>
        <span>Platform administration</span>
      </footer>
    </main>
  );
}
