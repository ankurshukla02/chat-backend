import { Router } from 'express';
import { createChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const createChatRoutes = (chatController: ReturnType<typeof createChatController>) => {
  const router = Router();

  router.post('/chat/create', authMiddleware, (req, res) => chatController.create(req, res));
  router.post('/chat/:chatId/message/send', authMiddleware, (req, res) => chatController.send(req, res));
  router.get('/chat/:chatId/messages', authMiddleware, (req, res) => chatController.getMessages(req, res));
  router.post('/chat/:chatId/message/:messageId/read', authMiddleware, (req, res) => chatController.read(req, res));
  router.post('/chat/:chatId/lastseen', authMiddleware, (req, res) => chatController.lastSeen(req, res));

  return router;
};

export { createChatRoutes };
