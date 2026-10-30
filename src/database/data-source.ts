import { Sequelize } from 'sequelize';
import { User } from '../users/user.entity';
import { Chat } from '../chats/chat.entity';
import { ChatMember } from '../chats/chat-member.entity';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'chatdb',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: false,
  },
});

const AppDataSource = sequelize;

User.initModel(sequelize);
Chat.initModel(sequelize);
ChatMember.initModel(sequelize);

User.hasMany(ChatMember, { foreignKey: 'userId', as: 'memberships' });
ChatMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Chat.hasMany(ChatMember, { foreignKey: 'chatId', as: 'members' });
ChatMember.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });

const initializeDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: false, force: false });
};

export { sequelize, AppDataSource, initializeDatabase };
