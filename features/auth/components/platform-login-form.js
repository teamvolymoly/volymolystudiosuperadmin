"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { platformAuthApi } from "../services/platform-auth-api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m3 3 18 18" />
      <path d="M10.7 5.1A10 10 0 0 1 12 5c4.8 0 8.1 4.2 9 7a11.6 11.6 0 0 1-1.4 2.5" />
      <path d="M6.6 6.6A11.4 11.4 0 0 0 3 12c.9 2.8 4.2 7 9 7 1.4 0 2.8-.4 4-1" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PlatformLoginForm() {
  const router = useRouter();
  const busy = useRef(false);
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function finishLogin(payload) {
    router.replace(payload?.admin?.must_change_password ? "/change-password" : "/dashboard");
    router.refresh();
  }

  async function submitCredentials(event) {
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
    setNotice("");

    try {
      const payload = await platformAuthApi.login(normalizedEmail, password);
      if (payload.verification_required) {
        setMaskedEmail(payload.email || normalizedEmail);
        setCooldown(Number(payload.retry_after || 60));
        setStep("verification");
        setPassword("");
        setNotice(payload.message || "Verification code sent.");
      } else {
        finishLogin(payload);
      }
    } catch (requestError) {
      if (requestError.status === 429) {
        setError(requestError.message || "Too many login attempts. Please wait and try again.");
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

  async function submitVerification(event) {
    event.preventDefault();
    if (busy.current) return;

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      finishLogin(await platformAuthApi.verifyLogin(code));
    } catch (requestError) {
      if (requestError.restartLogin) {
        setStep("credentials");
        setCode("");
      }
      setError(requestError.message || "Unable to verify this code. Please try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  async function resendCode() {
    if (busy.current || cooldown > 0) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const payload = await platformAuthApi.resendLoginCode();
      setCooldown(Number(payload.retry_after || 60));
      setNotice(payload.message || "A new verification code has been sent.");
    } catch (requestError) {
      if (requestError.restartLogin) {
        setStep("credentials");
        setCode("");
      }
      if (requestError.retryAfter > 0) setCooldown(requestError.retryAfter);
      setError(requestError.message || "Unable to resend the code.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  function restart() {
    setStep("credentials");
    setCode("");
    setError("");
    setNotice("");
  }

  const verification = step === "verification";

  return (
    <Card
      as="form"
      className="login-card login-card-simple"
      noValidate
      onSubmit={verification ? submitVerification : submitCredentials}
    >
      <CardHeader>
        <CardTitle as="h1">{verification ? "Verify your sign-in" : "Login to your account"}</CardTitle>
        <CardDescription>
          {verification
            ? <>Enter the security code sent to <strong>{maskedEmail}</strong>.</>
            : "Enter your administrator credentials to continue."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="login-form-fields">
          {verification ? (
            <>
              <div className="verification-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <div className="field-group otp-field">
                <Label htmlFor="verification-code">6-digit verification code</Label>
                <Input
                  aria-describedby={error ? "login-error" : "verification-help"}
                  aria-invalid={Boolean(error)}
                  autoComplete="one-time-code"
                  autoFocus
                  id="verification-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError("");
                  }}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  value={code}
                />
                <p id="verification-help">The code expires in 10 minutes and can be used once.</p>
              </div>
              <div className="verification-resend">
                <span>Didn&apos;t receive it?</span>
                <button disabled={loading || cooldown > 0} onClick={resendCode} type="button">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="field-group">
                <Label htmlFor="email">Email</Label>
                <Input
                  aria-describedby={error ? "login-error" : undefined}
                  aria-invalid={Boolean(error)}
                  autoComplete="username"
                  autoFocus
                  id="email"
                  inputMode="email"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="admin@example.com"
                  spellCheck="false"
                  type="email"
                  value={email}
                />
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <Label htmlFor="password">Password</Label>
                  <Link className="field-action-link" href="/forgot-password">
                    Forgot your password?
                  </Link>
                </div>
                <div className="password-input-wrap">
                  <Input
                    aria-describedby={error ? "login-error" : undefined}
                    aria-invalid={Boolean(error)}
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
                    aria-pressed={showPassword}
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    <EyeIcon hidden={showPassword} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div
            aria-live="polite"
            className={`form-alert ${error ? "visible" : ""}`}
            id="login-error"
            role="status"
          >
            {error ? <><span aria-hidden="true">!</span><p>{error}</p></> : null}
          </div>
          <div aria-live="polite" className={`form-notice ${notice ? "visible" : ""}`} role="status">
            {notice ? <><span aria-hidden="true">✓</span><p>{notice}</p></> : null}
          </div>
        </div>
      </CardContent>

      <CardFooter className="login-card-actions">
        <Button disabled={loading} type="submit">
          {loading ? <span aria-hidden="true" className="spinner" /> : null}
          {loading ? "Please wait…" : verification ? "Verify and continue" : "Continue securely"}
        </Button>
        {verification ? (
          <Button disabled={loading} onClick={restart} type="button" variant="outline">
            Back to login
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
