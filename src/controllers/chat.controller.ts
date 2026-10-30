import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { type ChatsService } from '../chats/chats.service';
import {
  CreateChatDto,
  LastSeenDto,
  MessageQueryDto,
  ReadMessageDto,
  SendMessageDto,
} from '../chats/chat.dto';
import { sendErrorResponse, sendForbiddenResponse } from '../common/response.util';

export const createChatController = (chatsService: ChatsService) => {
  const validateDto = async <T extends object>(dtoClass: new () => T, payload: unknown) => {
    const dto = plainToInstance(dtoClass, payload ?? {});
    await validateOrReject(dto as object);
    return dto;
  };

  const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
    if (error instanceof Error) {
      const status = 'status' in error ? Number((error as { status?: number }).status ?? 500) : 500;
      return sendErrorResponse(res, error.message || fallbackMessage, status);
    }

    return sendErrorResponse(res, fallbackMessage, 500);
  };

  const create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = await validateDto(CreateChatDto, req.body);
      const result = await chatsService.createOrGet(dto.userAId, dto.userBId, req.user?.sub ?? '');
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to create chat');
    }
  };

  const send = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = await validateDto(SendMessageDto, req.body);
      const result = await chatsService.sendMessage(String(req.params.chatId), req.user?.sub ?? '', dto.text);
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to send message');
    }
  };

  const getMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = await validateDto(MessageQueryDto, req.query);
      const result = await chatsService.getMessages(
        String(req.params.chatId),
        req.user?.sub ?? '',
        Number(dto.limit ?? 50),
        dto.cursor,
      );
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to fetch messages');
    }
  };

  const read = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = await validateDto(ReadMessageDto, req.body);
      const userId = req.user?.sub ?? '';
      if (dto.userId !== userId) {
        return sendForbiddenResponse(res);
      }
      const result = await chatsService.markRead(String(req.params.chatId), String(req.params.messageId), userId);
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to mark message as read');
    }
  };

  const lastSeen = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto = await validateDto(LastSeenDto, req.body);
      const userId = req.user?.sub ?? '';
      if (dto.userId !== userId) {
        return sendForbiddenResponse(res);
      }
      const result = await chatsService.updateLastSeen(String(req.params.chatId), userId, dto.messageId);
      return res.json(result);
    } catch (error) {
      return handleError(res, error, 'Unable to update last seen');
    }
  };

  return { create, send, getMessages, read, lastSeen };
};
