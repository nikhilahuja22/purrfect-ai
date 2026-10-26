import { DATABASE_URL } from '$app/env/private';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

type Db = PostgresJsDatabase<typeof schema>;

let db: Db | undefined;

// Created on first use, so importing this module (for example during build) does not need DATABASE_URL.
export function getDb(): Db {
  if (!db) {
    db = drizzle(postgres(DATABASE_URL), { schema });
  }
  return db;
}
