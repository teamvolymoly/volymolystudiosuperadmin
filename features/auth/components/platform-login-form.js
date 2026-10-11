"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { platformAuthApi } from "../services/platform-auth-api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PlatformLoginForm() {
  const router = useRouter();
  const busy = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL.test(normalizedEmail)) {
      setError("Enter a valid administrator email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");

    try {
      await platformAuthApi.login(normalizedEmail, password);
      router.replace("/dashboard");
      router.refresh();
    } catch (requestError) {
      if (requestError.status === 429) {
        setError("Too many login attempts. Please wait a minute and try again.");
      } else if (requestError.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError(requestError.message || "Unable to sign in. Please try again.");
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <form className="login-form" noValidate onSubmit={submit}>
      <div className="field-group">
        <label htmlFor="email">Admin email</label>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />
          </svg>
          <input
            autoComplete="username"
            autoFocus
            id="email"
            inputMode="email"
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            placeholder="admin@company.com"
            spellCheck="false"
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <label htmlFor="password">Password</label>
          <Link className="field-action-link" href="/forgot-password">Forgot password?</Link>
        </div>
        <div className="input-shell">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect height="10" rx="2" width="14" x="5" y="10" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <input
            autoComplete="current-password"
            id="password"
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div aria-live="polite" className={`form-alert ${error ? "visible" : ""}`} role="status">
        {error ? (
          <>
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </>
        ) : null}
      </div>

      <button className="login-button" disabled={loading} type="submit">
        {loading ? <span aria-hidden="true" className="spinner" /> : null}
        {loading ? "Verifying access…" : "Sign in to platform"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}
