import { Response } from 'express';
import { type ChatsService } from '../chats/chats.service';
import { sendErrorResponse, sendForbiddenResponse } from '../common/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const createUserController = (chatsService: ChatsService) => {
  const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
    if (error instanceof Error) {
      const status = 'status' in error ? Number((error as { status?: number }).status ?? 500) : 500;
      return sendErrorResponse(res, error.message || fallbackMessage, status);
    }

    return sendErrorResponse(res, fallbackMessage, 500);
  };

  const listUserChats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub ?? '';
      if (req.params.userId !== userId) {
        return sendForbiddenResponse(res);
      }

      const result = await chatsService.listUserChats(userId);
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to list user chats');
    }
  };

  return { listUserChats };
};
