import type { customerTable } from '../db/schema';

// Drizzle-inferred types for customers

export type Customer = typeof customerTable.$inferSelect; // return type
export type NewCustomer = typeof customerTable.$inferInsert; // insert type
export type UpdateCustomer = Partial<NewCustomer>; // update type