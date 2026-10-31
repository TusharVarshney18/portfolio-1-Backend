import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";
const DEV_FALLBACK = "dev-secret-change-me";

// In production a missing JWT_SECRET disables admin auth entirely (fail closed)
// instead of silently signing tokens with a publicly known default.
// Public endpoints (contact, analytics, clicks) are unaffected.
if (!process.env.JWT_SECRET) {
  console.error(
    isProd
      ? "[auth] JWT_SECRET is not set - admin login and admin routes are DISABLED."
      : "[auth] JWT_SECRET is not set - using an insecure development fallback."
  );
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  return isProd ? null : DEV_FALLBACK;
}

export class MissingSecretError extends Error {}

export function isAuthConfigured() {
  return Boolean(getSecret());
}

export function signToken(payload) {
  const secret = getSecret();
  if (!secret) throw new MissingSecretError("JWT_SECRET is not configured.");
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

export function requireAuth(req, res, next) {
  const secret = getSecret();
  if (!secret) {
    return res.status(503).json({ error: "Admin auth is not configured." });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Optional API-key protection for public write endpoints.
// Only enforced when API_KEY is set in the environment.
export function requireApiKey(req, res, next) {
  const configured = process.env.API_KEY;
  if (!configured) return next();

  const supplied = req.headers["x-api-key"];
  if (supplied !== configured) {
    return res.status(401).json({ error: "Invalid API key." });
  }

  return next();
}
