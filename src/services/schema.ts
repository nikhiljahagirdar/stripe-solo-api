import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for the 'customers' table.
 */
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});