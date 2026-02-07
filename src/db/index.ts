import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

/**
 * @description Exports the Drizzle ORM database instance.
 * @type {DrizzlePostgreSQL}
 */
export const db = drizzle(pool, { 
  schema,
  logger: true,
});
