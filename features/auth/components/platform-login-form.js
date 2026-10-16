"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
    <Card as="form" className="login-card login-card-simple" noValidate onSubmit={submit}>
      <CardHeader>
        <CardTitle as="h1">Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="login-form-fields">
          <div className="field-group">
            <Label htmlFor="email">Email</Label>
            <Input
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              autoComplete="username"
              autoFocus
              id="email"
              inputMode="email"
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="m@example.com"
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
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
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
                {showPassword ? (
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
                )}
              </button>
            </div>
          </div>

          <div
            aria-live="polite"
            className={`form-alert ${error ? "visible" : ""}`}
            id="login-error"
            role="status"
          >
            {error ? (
              <>
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </>
            ) : null}
          </div>
        </div>
      </CardContent>

      <CardFooter className="login-card-actions">
        <Button disabled={loading} type="submit">
          {loading ? <span aria-hidden="true" className="spinner" /> : null}
          {loading ? "Logging in…" : "Login"}
        </Button>
      </CardFooter>
    </Card>
  );
}
