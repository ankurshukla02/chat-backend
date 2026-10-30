import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const createUserRoutes = (userController: ReturnType<typeof createUserController>) => {
  const router = Router();

  router.get('/user/:userId/chats', authMiddleware, (req, res) => userController.listUserChats(req, res));

  return router;
};

export { createUserRoutes };
