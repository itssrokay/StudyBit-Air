import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const learningStates = sqliteTable('learning_states', {
  userId: text('user_id').primaryKey(),
  body: text('body').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});
export const userAiKeys = sqliteTable('user_ai_keys', {
  userId: text('user_id').primaryKey(),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  model: text('model').notNull().default('gpt-4.1-mini'),
  updatedAt: text('updated_at').notNull(),
});
