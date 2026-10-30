import { QueryInterface } from 'sequelize';

const up = async ({ context }: { context: QueryInterface }) => {
  await context.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await context.createTable('users', {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: context.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
    },
    name: { type: 'VARCHAR(120)', allowNull: false },
    email: { type: 'VARCHAR(255)', allowNull: false, unique: true },
    password_hash: { type: 'VARCHAR(255)', allowNull: false },
    created_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    updated_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    deleted_at: { type: 'TIMESTAMPTZ', allowNull: true },
  });

  await context.createTable('chats', {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: context.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
    },
    user_low_id: { type: 'UUID', allowNull: false },
    user_high_id: { type: 'UUID', allowNull: false },
    created_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    updated_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    deleted_at: { type: 'TIMESTAMPTZ', allowNull: true },
  });

  await context.sequelize.query(`ALTER TABLE "chats" ADD CONSTRAINT "uq_chats_user_pair" UNIQUE ("user_low_id", "user_high_id")`);
  await context.sequelize.query(`ALTER TABLE "chats" ADD CONSTRAINT "ck_chats_user_pair_order" CHECK ("user_low_id" < "user_high_id")`);
  await context.sequelize.query(`ALTER TABLE "chats" ADD CONSTRAINT "fk_chats_user_low" FOREIGN KEY ("user_low_id") REFERENCES "users"("id") ON DELETE CASCADE`);
  await context.sequelize.query(`ALTER TABLE "chats" ADD CONSTRAINT "fk_chats_user_high" FOREIGN KEY ("user_high_id") REFERENCES "users"("id") ON DELETE CASCADE`);

  await context.createTable('chat_members', {
    chat_id: { type: 'UUID', allowNull: false, primaryKey: true },
    user_id: { type: 'UUID', allowNull: false, primaryKey: true },
    created_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    updated_at: { type: 'TIMESTAMPTZ', allowNull: false, defaultValue: context.sequelize.literal('NOW()') },
    deleted_at: { type: 'TIMESTAMPTZ', allowNull: true },
  });

  await context.sequelize.query(`CREATE INDEX "idx_chat_members_user_id" ON "chat_members" ("user_id")`);
  await context.sequelize.query(`ALTER TABLE "chat_members" ADD CONSTRAINT "fk_chat_members_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE`);
  await context.sequelize.query(`ALTER TABLE "chat_members" ADD CONSTRAINT "fk_chat_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
};

const down = async ({ context }: { context: QueryInterface }) => {
  await context.sequelize.query('DROP TABLE IF EXISTS "chat_members" CASCADE');
  await context.sequelize.query('DROP TABLE IF EXISTS "chats" CASCADE');
  await context.sequelize.query('DROP TABLE IF EXISTS "users" CASCADE');
};

export { up, down };
