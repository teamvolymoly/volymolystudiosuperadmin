"use client";

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

function PasswordField({ autoFocus = false, id, label, onChange, value }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field-group">
      <Label htmlFor={id}>{label}</Label>
      <div className="password-input-wrap">
        <Input
          autoComplete="new-password"
          autoFocus={autoFocus}
          id={id}
          onChange={onChange}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 3 18 18" /><path d="M10.7 5.1A10 10 0 0 1 12 5c4.8 0 8.1 4.2 9 7a11.6 11.6 0 0 1-1.4 2.5" /><path d="M6.6 6.6A11.4 11.4 0 0 0 3 12c.9 2.8 4.2 7 9 7 1.4 0 2.8-.4 4-1" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="3" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PlatformChangePasswordForm() {
  const router = useRouter();
  const busy = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;

    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    busy.current = true;
    setLoading(true);
    setError("");

    try {
      await platformAuthApi.changePassword({ password, passwordConfirmation: confirmation });
      router.replace("/dashboard");
      router.refresh();
    } catch (requestError) {
      const validationMessage = Array.isArray(requestError.errors?.password)
        ? requestError.errors.password[0]
        : "";
      setError(validationMessage || requestError.message || "Unable to change your password.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  function clearError() {
    if (error) setError("");
  }

  return (
    <Card as="form" className="login-card login-card-simple" noValidate onSubmit={submit}>
      <CardHeader>
        <CardTitle as="h1">Create a new password</CardTitle>
        <CardDescription>
          A password update is required before you can access Platform Administration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="login-form-fields">
          <div className="password-requirements">
            <strong>Password requirements</strong>
            <span>12+ characters with uppercase, lowercase, number, and symbol.</span>
          </div>
          <PasswordField
            autoFocus
            id="new-password"
            label="New password"
            onChange={(event) => { setPassword(event.target.value); clearError(); }}
            value={password}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            onChange={(event) => { setConfirmation(event.target.value); clearError(); }}
            value={confirmation}
          />
          <div
            aria-live="polite"
            className={`form-alert ${error ? "visible" : ""}`}
            id="change-password-error"
            role="status"
          >
            {error ? <><span aria-hidden="true">!</span><p>{error}</p></> : null}
          </div>
        </div>
      </CardContent>
      <CardFooter className="login-card-actions">
        <Button disabled={loading} type="submit">
          {loading ? <span aria-hidden="true" className="spinner" /> : null}
          {loading ? "Updating password…" : "Update password and continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
