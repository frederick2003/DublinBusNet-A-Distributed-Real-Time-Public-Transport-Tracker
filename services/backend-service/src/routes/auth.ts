import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from 'crypto';
import { db } from "../db";
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getMostCommonRoute } from "../services/routeUsage";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  favourite_route: string | null;
  created_at: string;
}

/**
 * POST /api/auth/signup
 */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const id = randomUUID();
    db.prepare(
      `
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `
    ).run(id, email, passwordHash, new Date().toISOString());

    return res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("[signup] error:", err);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

/**
 * POST /api/auth/signin
 */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = db
    .prepare<[string], UserRow>(`SELECT * FROM users WHERE email = ?`)
    .get(email);

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    success: true,
    token,
  });
});


/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.prepare(`
    SELECT id, email, favourite_route
    FROM users
    WHERE id = ?
  `).get(req.user!.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const mostCommonRoute = getMostCommonRoute(req.user!.userId);
  console.log("[auth/me] mostCommonRoute =", mostCommonRoute);

  return res.json({
    success: true,
    user: {
      ...user,
      most_common_route: mostCommonRoute,
    },
  });
});


export default router;