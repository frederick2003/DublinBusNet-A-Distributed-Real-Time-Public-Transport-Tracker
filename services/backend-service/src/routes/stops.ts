import { Router } from "express";
import { stopBusynessHandler } from "../controllers/stops";

const router = Router();

router.get("/:stop_id/busyness", stopBusynessHandler);

export default router;