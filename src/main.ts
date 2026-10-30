import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import * as fs from 'node:fs';
import * as path from 'node:path';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { AppDataSource, initializeDatabase } from './database/data-source';
import { createAuthService } from './auth/auth.service';
import { User } from './users/user.entity';
import { Chat } from './chats/chat.entity';
import { ChatMember } from './chats/chat-member.entity';
import { createChatsService } from './chats/chats.service';
import { createAuthController } from './controllers/auth.controller';
import { createChatController } from './controllers/chat.controller';
import { createAuthRoutes } from './routes/auth.routes';
import { createChatRoutes } from './routes/chat.routes';
import { createUserRoutes } from './routes/user.routes';
import { createUserController } from './controllers/user.controller';

const PORT = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret-key-1234567890';

const jwtService = {
  signAsync: async (payload: unknown): Promise<string> =>
    jwt.sign(payload as object, JWT_SECRET as Secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as SignOptions['expiresIn'],
    }),
  verifyAsync: async <T>(token: string): Promise<T> =>
    jwt.verify(token, JWT_SECRET as Secret) as T,
};

const initFirestore = () => {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(process.cwd(), 'firebase-service-account.json'),
  ].filter((value): value is string => Boolean(value));

  const resolvedPath = candidatePaths.find((filePath) => fs.existsSync(filePath));

  if (resolvedPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    return getFirestore(app);
  }

  const app = initializeApp({ credential: applicationDefault() });
  return getFirestore(app);
};

async function bootstrap() {
  await initializeDatabase();

  const authService = createAuthService(User, jwtService);
  const chatsService = createChatsService(Chat, ChatMember, User, AppDataSource, initFirestore());
  const authController = createAuthController(authService);
  const chatController = createChatController(chatsService);
  const userController = createUserController(chatsService);

  const app = express();
  app.use(helmet());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', createAuthRoutes(authController));
  app.use('/api/v1', createUserRoutes(userController));
  app.use('/api/v1', createChatRoutes(chatController));

  app.listen(PORT, () => {
    console.log(`Chat backend listening on http://localhost:${PORT}/api/v1`);
  });
}

void bootstrap();
