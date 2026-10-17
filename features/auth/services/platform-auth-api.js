async function getCsrfToken() {
  const response = await fetch("/api/platform/auth/csrf-token", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to initialize the secure login session.");
  }

  const payload = await response.json();
  if (!payload.token) throw new Error("The secure login session did not return a CSRF token.");
  return payload.token;
}

async function request(path, options = {}, csrfRetry = false) {
  const method = (options.method || "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
  const csrfToken = isMutation ? await getCsrfToken() : "";
  const requestHeaders = new Headers(options.headers || {});
  requestHeaders.set("Accept", "application/json");

  if (isMutation) {
    requestHeaders.set("Content-Type", "application/json");
    requestHeaders.set("X-CSRF-TOKEN", csrfToken);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers: requestHeaders,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 419 && isMutation && !csrfRetry) {
    return request(path, options, true);
  }

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: "Unexpected response from the authentication service." };
    }
  }

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed.");
    error.status = response.status;
    error.errors = payload.errors || {};
    error.retryAfter = Number(response.headers.get("retry-after") || 0);
    error.requestId = response.headers.get("x-request-id") || "";
    error.restartLogin = payload.restart_login === true;
    error.remainingAttempts = Number(payload.remaining_attempts || 0);
    throw error;
  }

  return payload;
}

export const platformAuthApi = {
  login: (email, password) => request("/api/platform/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  verifyLogin: (code) => request("/api/platform/auth/login/verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  }),
  resendLoginCode: () => request("/api/platform/auth/login/resend", {
    method: "POST",
    body: "{}",
  }),
  logout: () => request("/api/platform/auth/logout", {
    method: "POST",
    body: "{}",
  }),
  forgotPassword: (email) => request("/api/platform/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  resetPassword: ({ email, token, password, passwordConfirmation }) => request(
    "/api/platform/auth/password/reset",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    },
  ),
  changePassword: ({ password, passwordConfirmation }) => request(
    "/api/platform/auth/password/change",
    {
      method: "POST",
      body: JSON.stringify({
        password,
        password_confirmation: passwordConfirmation,
      }),
    },
  ),
};
