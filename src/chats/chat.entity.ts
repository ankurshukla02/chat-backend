import { DataTypes, Model, Sequelize } from 'sequelize';
import { ChatMember } from './chat-member.entity';

export interface ChatAttributes {
  id: string;
  userLowId: string;
  userHighId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type ChatCreationAttributes = Omit<ChatAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> &
  Partial<Pick<ChatAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  declare id: string;
  declare userLowId: string;
  declare userHighId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
  declare members?: ChatMember[];

  static initModel(sequelize: Sequelize) {
    Chat.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        userLowId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_low_id',
        },
        userHighId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_high_id',
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
        tableName: 'chats',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        modelName: 'Chat',
        indexes: [
          {
            unique: true,
            name: 'uq_chats_user_pair',
            fields: ['userLowId', 'userHighId'],
          },
        ],
        validate: {
          userPairOrdered() {
            if (this.userLowId && this.userHighId && this.userLowId >= this.userHighId) {
              throw new Error('user_low_id must be lower than user_high_id');
            }
          },
        },
      },
    );

    return Chat;
  }
}
