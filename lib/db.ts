import { getDatabase } from '@netlify/database';

/** Netlify injects the active branch connection. NETLIFY_DB_URL also supports local tools. */
export function getDb() {
  const connectionString = process.env.NETLIFY_DB_URL;
  return connectionString ? getDatabase({ connectionString }) : getDatabase();
}

export function hasDatabaseConfiguration() {
  return Boolean(process.env.NETLIFY_DB_URL || process.env.NETLIFY);
}

export function isMissingDatabaseError(error: unknown) {
  return error instanceof Error && /environment not configured|database not found|connection string/i.test(error.message);
}
