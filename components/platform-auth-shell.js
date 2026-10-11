import BrandMark from "./brand-mark";

export default function PlatformAuthShell({ children, description, title, pageClassName = "" }) {
  return (
    <main className={`login-page ${pageClassName}`.trim()}>
      <header className="login-header">
        <BrandMark />
        <span><i /> Secure platform access</span>
      </header>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-emblem" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6zM9.5 12l1.7 1.7 3.8-4" /></svg>
          </div>
          <div className="login-heading">
            <span className="security-badge">Restricted area</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <p className="access-note">This portal is only for authorized Platform Super Administrators.</p>
        </div>
      </section>
      <footer className="login-footer">
        <span>© 2026 Volymoly</span>
        <span>Platform administration</span>
      </footer>
    </main>
  );
}
