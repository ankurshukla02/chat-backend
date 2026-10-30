import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { Op, Sequelize } from 'sequelize';
import { Chat } from './chat.entity';
import { ChatMember } from './chat-member.entity';
import { User } from '../users/user.entity';

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const createChatsService = (
  chats: typeof Chat,
  members: typeof ChatMember,
  users: typeof User,
  sequelize: Sequelize,
  firestore: Firestore,
) => {
  const createOrGet = async (userAId: string, userBId: string, requesterId: string) => {
    if (userAId === userBId)
      throw new HttpError('A 1:1 chat requires two different users', 400);
    if (![userAId, userBId].includes(requesterId))
      throw new HttpError('You can only create a chat involving yourself', 403);

    const foundUsers = await users.findAll({ where: { id: { [Op.in]: [userAId, userBId] } } });
    if (foundUsers.length !== 2)
      throw new HttpError('One or both users do not exist', 404);

    const pair = [userAId, userBId].sort();
    const existing = await chats.findOne({ where: { userLowId: pair[0], userHighId: pair[1] } });
    if (existing) return { chatId: existing.id, created: false };

    try {
      const chatId = await sequelize.transaction(async (transaction) => {
        const chat = await chats.create({ userLowId: pair[0], userHighId: pair[1] }, { transaction });
        await members.bulkCreate(
          [
            { chatId: chat.id, userId: pair[0] },
            { chatId: chat.id, userId: pair[1] },
          ],
          { transaction },
        );
        return chat.id;
      });
      return { chatId, created: true };
    } catch (error) {
      const winner = await chats.findOne({ where: { userLowId: pair[0], userHighId: pair[1] } });
      if (winner) return { chatId: winner.id, created: false };
      throw error;
    }
  };

  const assertMember = async (chatId: string, userId: string) => {
    const member = await members.findOne({ where: { chatId, userId } });
    if (!member) throw new HttpError('You are not a member of this chat', 403);
  };

  const listUserChats = async (userId: string) => {
    const memberships = await members.findAll({
      where: { userId },
      include: [
        {
          model: Chat,
          as: 'chat',
          include: [{ model: ChatMember, as: 'members', include: [{ model: User, as: 'user' }] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return Promise.all(
      memberships.map(async (membership) => {
        const chat = membership.chat as Chat & { members?: Array<ChatMember & { user?: User }> };
        const chatMembers = (chat.members ?? []).map((member) => ({
          id: member.user?.id,
          name: member.user?.name,
          email: member.user?.email,
        }));

        const lastMessage = await firestore
          .collection('chats')
          .doc(membership.chatId)
          .collection('messages')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        return {
          chatId: membership.chatId,
          members: chatMembers,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          lastMessage: lastMessage.empty ? null : lastMessage.docs[0].data(),
        };
      }),
    );
  };

  const sendMessage = async (chatId: string, senderId: string, text: string) => {
    await assertMember(chatId, senderId);
    const ref = firestore.collection('chats').doc(chatId).collection('messages').doc();
    const message = {
      messageId: ref.id,
      chatId,
      senderId,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
      readBy: { [senderId]: true },
    };
    await ref.set(message);
    await chats.update({ updatedAt: new Date() }, { where: { id: chatId } });
    const saved = await ref.get();
    return saved.data();
  };

  const getMessages = async (chatId: string, userId: string, limit: number, cursor?: string) => {
    await assertMember(chatId, userId);
    let query = firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      const cursorDoc = await firestore.collection('chats').doc(chatId).collection('messages').doc(cursor).get();
      if (!cursorDoc.exists) throw new HttpError('Invalid pagination cursor', 400);
      query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map((doc) => doc.data()).reverse();
    return {
      messages,
      nextCursor: snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null,
    };
  };

  const markRead = async (chatId: string, messageId: string, userId: string) => {
    await assertMember(chatId, userId);
    const ref = firestore.collection('chats').doc(chatId).collection('messages').doc(messageId);
    const doc = await ref.get();
    if (!doc.exists) throw new HttpError('Message not found', 404);
    await ref.update({ [`readBy.${userId}`]: true });
    return { chatId, messageId, userId, read: true };
  };

  const updateLastSeen = async (chatId: string, userId: string, messageId: string) => {
    await assertMember(chatId, userId);
    const messageRef = firestore.collection('chats').doc(chatId).collection('messages').doc(messageId);
    const message = await messageRef.get();
    if (!message.exists) throw new HttpError('Message not found', 404);
    await firestore
      .collection('chats')
      .doc(chatId)
      .collection('lastSeen')
      .doc(userId)
      .set({ userId, messageId, updatedAt: FieldValue.serverTimestamp() });
    return { chatId, userId, messageId, updated: true };
  };

  return { createOrGet, assertMember, listUserChats, sendMessage, getMessages, markRead, updateLastSeen };
};

type ChatsService = ReturnType<typeof createChatsService>;

export { createChatsService, type ChatsService };
