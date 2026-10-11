const COOKIE_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

function cookieName(environmentName, fallback) {
  const value = process.env[environmentName] || fallback;
  if (!COOKIE_NAME.test(value)) {
    throw new Error(`Invalid ${environmentName} configuration`);
  }
  return value;
}

export function upstreamSessionCookieName() {
  return cookieName("LARAVEL_SESSION_COOKIE", "laravel_session");
}

export function platformSessionCookieName() {
  return cookieName("PLATFORM_SESSION_COOKIE", "platform_admin_session");
}

export function platformXsrfCookieName() {
  return cookieName("PLATFORM_XSRF_COOKIE", "platform_admin_xsrf");
}

export function hasPlatformSessionCookie(cookieHeader) {
  const expected = platformSessionCookieName();

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => {
      const separator = cookie.indexOf("=");
      return separator > 0
        && cookie.slice(0, separator) === expected
        && cookie.slice(separator + 1).length > 0;
    });
}

export function toUpstreamPlatformCookies(cookieHeader) {
  const browserSession = platformSessionCookieName();
  const browserXsrf = platformXsrfCookieName();
  const upstreamSession = upstreamSessionCookieName();

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .map((cookie) => {
      const separator = cookie.indexOf("=");
      if (separator < 1) return null;
      const name = cookie.slice(0, separator);
      const value = cookie.slice(separator + 1);
      if (name === browserSession) return `${upstreamSession}=${value}`;
      if (name === browserXsrf) return `XSRF-TOKEN=${value}`;
      return null;
    })
    .filter(Boolean)
    .join("; ");
}

export function rewritePlatformCookie(cookie) {
  const separator = cookie.indexOf("=");
  if (separator < 1) return null;

  const upstreamName = cookie.slice(0, separator);
  const downstreamName = upstreamName === upstreamSessionCookieName()
    ? platformSessionCookieName()
    : upstreamName === "XSRF-TOKEN"
      ? platformXsrfCookieName()
      : null;

  if (!downstreamName) return null;

  return downstreamName + cookie.slice(separator)
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*SameSite=[^;]*/gi, "") + "; SameSite=Lax";
}
