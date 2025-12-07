import { Router } from 'express';
import { HealthResponse } from '../types/service';

export const createHealthRouter = (): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    const payload: HealthResponse = {
      status: 'ok',
      service: 'spike-recorder-web',
      timestamp: new Date().toISOString(),
      notes: 'Spike Recorder Web Service backend scaffold is running.',
    };

    res.json(payload);
  });

  return router;
};
