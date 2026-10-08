/**
 * HTTP Basic auth for the admin area. Set ADMIN_PASSWORD (and optionally
 * ADMIN_USER, default "admin"). Without a password the admin is open in
 * development and locked in production.
 */
export function isAdminRequestAllowed(authorization: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production";
  if (!authorization?.startsWith("Basic ")) return false;

  const decoded = atob(authorization.slice("Basic ".length));
  const separator = decoded.indexOf(":");
  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  return timingSafeEqual(user, process.env.ADMIN_USER ?? "admin") && timingSafeEqual(pass, password);
}

function timingSafeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
