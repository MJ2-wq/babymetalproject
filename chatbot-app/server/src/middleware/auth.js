import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No autenticado" });

    const payload = jwt.verify(token, env.JWT_SECRET);
    const users = await query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = :id LIMIT 1",
      { id: payload.sub }
    );

    if (!users.length) return res.status(401).json({ message: "Usuario no encontrado" });
    req.user = users[0];
    next();
  } catch {
    res.status(401).json({ message: "Sesion invalida o expirada" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Solo administradores" });
  next();
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}
