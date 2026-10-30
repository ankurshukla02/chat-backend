import { DataTypes, Model, Sequelize } from 'sequelize';
import { User } from '../users/user.entity';
import { Chat } from './chat.entity';

export interface ChatMemberAttributes {
  chatId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type ChatMemberCreationAttributes = Omit<ChatMemberAttributes, 'createdAt' | 'updatedAt' | 'deletedAt'> &
  Partial<Pick<ChatMemberAttributes, 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class ChatMember extends Model<ChatMemberAttributes, ChatMemberCreationAttributes> implements ChatMemberAttributes {
  declare chatId: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
  declare chat?: Chat;
  declare user?: User;

  static initModel(sequelize: Sequelize) {
    ChatMember.init(
      {
        chatId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          field: 'chat_id',
        },
        userId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          field: 'user_id',
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
          field: 'updated_at',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at',
        },
      },
      {
        sequelize,
        tableName: 'chat_members',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        modelName: 'ChatMember',
        indexes: [
          {
            name: 'idx_chat_members_user_id',
            fields: ['userId'],
          },
        ],
      },
    );

    return ChatMember;
  }
}
