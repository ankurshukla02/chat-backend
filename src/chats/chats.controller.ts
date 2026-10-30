import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { type ChatsService } from './chats.service';
import {
  CreateChatDto,
  LastSeenDto,
  MessageQueryDto,
  ReadMessageDto,
  SendMessageDto,
} from './chat.dto';

const createChatsController = (chats: ChatsService) => ({
  create: (dto: CreateChatDto, req: AuthenticatedRequest) =>
    chats.createOrGet(dto.userAId, dto.userBId, req.user.sub),
  send: (chatId: string, dto: SendMessageDto, req: AuthenticatedRequest) =>
    chats.sendMessage(chatId, req.user.sub, dto.text),
  messages: (chatId: string, query: MessageQueryDto, req: AuthenticatedRequest) =>
    chats.getMessages(chatId, req.user.sub, query.limit, query.cursor),
  read: (chatId: string, messageId: string, dto: ReadMessageDto, req: AuthenticatedRequest) => {
    if (dto.userId !== req.user.sub) {
      throw Object.assign(new Error('Authenticated user must match userId'), { status: 403 });
    }
    return chats.markRead(chatId, messageId, req.user.sub);
  },
  lastSeen: (chatId: string, dto: LastSeenDto, req: AuthenticatedRequest) => {
    if (dto.userId !== req.user.sub) {
      throw Object.assign(new Error('Authenticated user must match userId'), { status: 403 });
    }
    return chats.updateLastSeen(chatId, req.user.sub, dto.messageId);
  },
  list: (userId: string, req: AuthenticatedRequest) => {
    if (userId !== req.user.sub) {
      throw Object.assign(new Error('Authenticated user must match userId'), { status: 403 });
    }
    return chats.listUserChats(req.user.sub);
  },
});

export { createChatsController };
