/**
 * Postgres connection. Server-side only, never import this from a screen.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, types } from 'pg';

/**
 * `date` columns are calendar days, not instants. Left alone, node-postgres
 * parses them into a JS Date at local midnight, which shifts the day once it
 * is serialised in another timezone. Keep them as YYYY-MM-DD strings.
 */
types.setTypeParser(types.builtins.DATE, (value) => value);

const connectionString = process.env.DATABASE_URL_POOLED;

if (!connectionString) {
    throw new Error('DATABASE_URL_POOLED is not set');
}

const pool = new Pool({ connectionString });

export const db = drizzle({ client: pool });
