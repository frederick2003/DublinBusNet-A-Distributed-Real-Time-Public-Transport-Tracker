import { Router } from 'express';
import { healthHandler } from './controllers/health';
import { predictHandler } from './controllers/predict';
import { activeBusesHandler, busesByRouteHandler, busesByStopHandler } from './controllers/buses';
import { routePathHandler, routeShapeHandler, closestStopHandler } from './controllers/routes';
import { rateLimiterMiddleware } from './middleware/rateLimiter';

const router = Router();

router.get('/health', healthHandler);
router.get('/hello', (_req, res) => {
  res.json({ message: 'Hello from backend-service' });
});

// Predict endpoint: POST /predict
router.post('/predict', rateLimiterMiddleware, predictHandler);

// Bus endpoints consumed by the frontend map
router.get('/buses/active', activeBusesHandler);
router.get('/buses/by-route', busesByRouteHandler);
router.get('/buses/by-stop', busesByStopHandler);

// Simple route geometry helpers for drawing lines on the map
router.get('/routes/shape', routeShapeHandler);
router.get('/routes/path', routePathHandler);
router.get('/routes/closest-stop', closestStopHandler);

export default router;
