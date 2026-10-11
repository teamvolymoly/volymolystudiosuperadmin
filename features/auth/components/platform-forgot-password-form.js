"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { platformAuthApi } from "../services/platform-auth-api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PlatformForgotPasswordForm() {
  const busy = useRef(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL.test(normalizedEmail)) {
      setError("Enter a valid administrator email address.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");

    try {
      await platformAuthApi.forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setSent(true);
    } catch (requestError) {
      if (requestError.status === 429) {
        setError(`Please wait ${requestError.retryAfter || 60} seconds before trying again.`);
      } else {
        setError(requestError.message || "Unable to request a reset link. Please try again.");
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-result" aria-live="polite">
        <span aria-hidden="true" className="result-icon">✓</span>
        <strong>Check your email</strong>
        <p>If an active administrator account exists for <b>{email}</b>, a secure reset link will arrive shortly.</p>
        <button className="secondary-button" onClick={() => setSent(false)} type="button">Send another link</button>
        <Link className="text-link" href="/login">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form className="login-form" noValidate onSubmit={submit}>
      <div className="field-group">
        <label htmlFor="reset-email">Admin email</label>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" /></svg>
          <input
            autoComplete="username"
            autoFocus
            id="reset-email"
            inputMode="email"
            onChange={(event) => { setEmail(event.target.value); if (error) setError(""); }}
            placeholder="admin@company.com"
            spellCheck="false"
            type="email"
            value={email}
          />
        </div>
      </div>

      <div aria-live="polite" className={`form-alert ${error ? "visible" : ""}`} role="status">
        {error ? <><span aria-hidden="true">!</span><p>{error}</p></> : null}
      </div>

      <button className="login-button" disabled={loading} type="submit">
        {loading ? <span aria-hidden="true" className="spinner" /> : null}
        {loading ? "Sending secure link…" : "Email reset link"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>
      <Link className="text-link centered-link" href="/login">← Back to sign in</Link>
    </form>
  );
}
