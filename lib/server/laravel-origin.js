const PRODUCTION_API_ORIGIN = "https://volymoly.com";

export function laravelApiOrigin() {
  const configured = process.env.NODE_ENV === "production"
    ? PRODUCTION_API_ORIGIN
    : process.env.API_UPSTREAM_URL || "http://localhost:8000";
  const url = new URL(configured);
  const loopback = url.hostname === "localhost"
    || url.hostname.endsWith(".localhost")
    || url.hostname === "[::1]"
    || /^127\./.test(url.hostname);

  if (
    !["http:", "https:"].includes(url.protocol)
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
    || (process.env.NODE_ENV === "production" && (url.protocol !== "https:" || loopback))
  ) {
    throw new Error("Invalid API upstream configuration");
  }

  return url.origin;
}
