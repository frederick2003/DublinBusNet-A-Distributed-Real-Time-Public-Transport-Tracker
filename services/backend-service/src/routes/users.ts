import { Router } from "express";
import { db } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * PUT /api/users/me/favourite-route
 */
router.put(
  '/me/favourite-route',
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    const { route_id } = req.body;

    if (!route_id || typeof route_id !== 'string') {
      return res.status(400).json({ error: 'route_id is required' });
    }

    db.prepare(
      `UPDATE users SET favourite_route = ? WHERE id = ?`
    ).run(route_id, req.user!.userId);

    return res.json({
      success: true,
      favourite_route: route_id,
    });
  }
);


export default router;
