import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const learningStates = sqliteTable('learning_states', {
  userId: text('user_id').primaryKey(),
  body: text('body').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});
