# Chat Backend Assignment

Senior/lead-level backend implementation using **Node.js + TypeScript + Express + PostgreSQL + Sequelize + Firebase Firestore + JWT**.

## Architecture

- **Express** handles the HTTP server and route layer in plain TypeScript.
- **PostgreSQL/Sequelize** stores users, chats, and chat membership.
- **Firestore** stores message documents, read receipts (`readBy`), and last-seen records.
- **JWT** authenticates API requests. A user may only operate on chats they belong to; user-scoped routes require the authenticated principal to match the requested user.
- **Sequelize models** define the schema and the project uses a `sync` step for local database initialization.

## Requirements

- Node.js 20+
- PostgreSQL 15+
- Firebase project with Firestore enabled and server-side service-account credentials


## Local setup

```bash
npm install
cp .env.example .env
# Edit .env and configure JWT_SECRET and database credentials
# Start PostgreSQL using Docker Compose
docker compose up -d postgres
```

Configure Firebase Admin credentials with either `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a service-account JSON file or `GOOGLE_APPLICATION_CREDENTIALS` in the environment. Do not commit the credential file.

## Sequelize database setup

The relational schema is defined in the Sequelize models. For local setup, sync the tables with:

```bash
npm run db:sync
```

This creates the required PostgreSQL tables such as `users`, `chats`, and `chat_members` when they do not already exist.

## Start

```bash
npm run db:sync
npm run start:dev
```

- API base URL: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- Health: `GET http://localhost:3000/api/v1/health`

## API endpoints

All endpoints except registration and login require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create user and issue JWT |
| POST | `/auth/login` | Authenticate and issue JWT |
| POST | `/chat/create` | Create or return 1:1 chat |
| POST | `/chat/:chatId/message/send` | Send message to Firestore |
| GET | `/chat/:chatId/messages?limit=50&cursor=<id>` | Fetch messages (cursor pagination) |
| POST | `/chat/:chatId/message/:messageId/read` | Mark message read |
| POST | `/chat/:chatId/lastseen` | Update last-seen message |
| GET | `/user/:userId/chats` | List user's chats and members |

## API examples

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{"name":"Ankur","email":"ankur@example.com","password":"StrongPassword123"}
```

### Create chat

```http
POST /api/v1/chat/create
Authorization: Bearer <token>
Content-Type: application/json

{"userAId":"<authenticated-user-uuid>","userBId":"<other-user-uuid>"}
```

### Send message

```http
POST /api/v1/chat/<chatId>/message/send
Authorization: Bearer <token>
Content-Type: application/json

{"text":"Hello there"}
```

### Read messages

```http
GET /api/v1/chat/<chatId>/messages?limit=50
Authorization: Bearer <token>
```

### Read receipt

```http
POST /api/v1/chat/<chatId>/message/<messageId>/read
Authorization: Bearer <token>
Content-Type: application/json

{"userId":"<authenticated-user-uuid>"}
```

### Last seen

```http
POST /api/v1/chat/<chatId>/lastseen
Authorization: Bearer <token>
Content-Type: application/json

{"userId":"<authenticated-user-uuid>","messageId":"<message-id>"}
```

## Firestore document layout

```text
chats/{chatId}/messages/{messageId}
  messageId, chatId, senderId, text, createdAt, readBy

chats/{chatId}/lastSeen/{userId}
  userId, messageId, updatedAt
```

Message timestamps are generated server-side. Message reads use ordered Firestore queries and cursor pagination.

## Engineering notes / trade-offs

- A canonical sorted user pair (`user_low_id`, `user_high_id`) with a unique database constraint prevents duplicate 1:1 chats even under concurrent requests.
- Chat creation writes the chat and its two membership rows in one SQL transaction.
- Membership is checked before message, read-receipt, and last-seen operations.
- Request DTOs use `class-validator`; the global validation pipe strips unknown fields and rejects non-whitelisted input.
- JWT secret must be a high-entropy secret from a secret manager in production.
- Firestore service credentials remain server-side only.
- Production extensions: rate limiting, refresh-token rotation, observability, transactional outbox for cross-store consistency, message moderation, and integration tests against Firebase Emulator.

## Tests

```bash
npm test
```

Test suite configuration is included. Integration tests should run with a dedicated test database and Firebase Emulator; never point tests at production data.
