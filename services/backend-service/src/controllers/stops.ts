import { Request, Response } from "express";
import redis from "../services/redisClient";

export const stopBusynessHandler = async (
  req: Request,
  res: Response
) => {
  const { stop_id } = req.params;

  if (!stop_id) {
    return res.status(400).json({
      success: false,
      error: "stop_id is required",
    });
  }

  const key = `stop:busyness:${stop_id}`;
  const raw = await redis.get(key);

  if (!raw) {
    return res.status(404).json({
      success: false,
      error: "No busyness data for this stop",
    });
  }

  const data = JSON.parse(raw);

  res.json({
    success: true,
    data,
  });
};
