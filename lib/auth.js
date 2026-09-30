import jwt from "jsonwebtoken";

const JWT_SECRET = () =>
  process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: "30d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET());
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
