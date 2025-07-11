import { Router, Request, Response } from 'express';

const router = Router();

// GET /health
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

export { router as healthRouter }; 