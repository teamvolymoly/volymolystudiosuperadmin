"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { platformAuthApi } from "../services/platform-auth-api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

export default function PlatformResetPasswordForm({ initialEmail }) {
  const busy = useRef(false);
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    setToken(fragment.get("token") || "");
    setTokenReady(true);
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!token) {
      setError("This reset link is incomplete. Request a new link.");
      return;
    }
    if (!EMAIL.test(normalizedEmail)) {
      setError("Enter the administrator email used for this reset link.");
      return;
    }
    if (!STRONG_PASSWORD.test(password)) {
      setError("Use at least 12 characters with uppercase, lowercase, number, and symbol.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");

    try {
      await platformAuthApi.resetPassword({
        email: normalizedEmail,
        token,
        password,
        passwordConfirmation,
      });
      setPassword("");
      setPasswordConfirmation("");
      window.history.replaceState(null, "", "/reset-password");
      setComplete(true);
    } catch (requestError) {
      const passwordError = requestError.errors?.password?.[0];
      if (requestError.status === 422) {
        setError(passwordError || "This reset link is invalid or expired. Request a new link.");
      } else if (requestError.status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else {
        setError(requestError.message || "Unable to reset the password. Please try again.");
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <div className="auth-result" aria-live="polite">
        <span aria-hidden="true" className="result-icon">✓</span>
        <strong>Password updated</strong>
        <p>Your other Platform Admin sessions have been revoked. Sign in with your new password.</p>
        <Link className="login-button result-button" href="/login">Sign in to platform <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  const linkError = tokenReady && !token;

  return (
    <form className="login-form compact-auth-form" noValidate onSubmit={submit}>
      <div className="field-group">
        <label htmlFor="reset-account-email">Admin email</label>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" /></svg>
          <input
            autoComplete="username"
            id="reset-account-email"
            inputMode="email"
            onChange={(event) => { setEmail(event.target.value); if (error) setError(""); }}
            placeholder="admin@company.com"
            spellCheck="false"
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <label htmlFor="new-password">New password</label>
          <span>12+ strong characters</span>
        </div>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="10" rx="2" width="14" x="5" y="10" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <input
            autoComplete="new-password"
            id="new-password"
            onChange={(event) => { setPassword(event.target.value); if (error) setError(""); }}
            placeholder="Create a strong password"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="confirm-password">Confirm new password</label>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="10" rx="2" width="14" x="5" y="10" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <input
            autoComplete="new-password"
            id="confirm-password"
            onChange={(event) => { setPasswordConfirmation(event.target.value); if (error) setError(""); }}
            placeholder="Repeat your new password"
            type={showPassword ? "text" : "password"}
            value={passwordConfirmation}
          />
        </div>
      </div>

      <div aria-live="polite" className={`form-alert ${error || linkError ? "visible" : ""}`} role="status">
        {error || linkError ? <><span aria-hidden="true">!</span><p>{error || "This reset link is incomplete. Request a new link."}</p></> : null}
      </div>

      <button className="login-button" disabled={loading || !tokenReady || !token} type="submit">
        {loading ? <span aria-hidden="true" className="spinner" /> : null}
        {loading ? "Updating password…" : "Reset admin password"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>
      <Link className="text-link centered-link" href="/forgot-password">Request a new reset link</Link>
    </form>
  );
}
