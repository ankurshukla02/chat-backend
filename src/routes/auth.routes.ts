import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller';

const createAuthRoutes = (authController: ReturnType<typeof createAuthController>) => {
  const router = Router();

  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));

  return router;
};

export { createAuthRoutes };
