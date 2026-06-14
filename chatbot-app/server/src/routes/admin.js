import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { query } from "../config/db.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const [users] = await query("SELECT COUNT(*) AS count FROM users");
    const [conversations] = await query("SELECT COUNT(*) AS count FROM conversations");
    const [messages] = await query("SELECT COUNT(*) AS count FROM messages");
    res.json({
      users: users.count,
      conversations: conversations.count,
      messages: messages.count
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});
