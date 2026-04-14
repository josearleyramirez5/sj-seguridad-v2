import { Pool, PoolClient } from 'pg';
import { createMemoryClient, memoryQuery } from './memory-database';

export type DatabaseClient = {
  query: (text: string, params?: any[]) => Promise<any>;
  release: () => void;
};

const useSsl = process.env.DATABASE_SSL === 'true' || process.env.PGSSLMODE === 'require';
const databaseUrl = process.env.DATABASE_URL || '';
const memoryFallbackAllowed = process.env.ALLOW_MEMORY_FALLBACK !== 'false';
const hasPlaceholderDatabaseUrl = databaseUrl.includes('user:password@host:5432');

let databaseMode: 'postgres' | 'memory' = !databaseUrl || hasPlaceholderDatabaseUrl ? 'memory' : 'postgres';
let memoryFallbackLogged = false;

const pool = databaseMode === 'postgres'
  ? new Pool({
      connectionString: databaseUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    })
  : null;

pool?.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

function enableMemoryFallback(reason: string, error?: unknown) {
  if (!memoryFallbackAllowed) {
    throw error instanceof Error ? error : new Error(reason);
  }

  databaseMode = 'memory';

  if (!memoryFallbackLogged) {
    memoryFallbackLogged = true;
    console.warn(`Database fallback enabled: ${reason}`);

    if (error) {
      console.warn(error);
    }
  }
}

export async function query(text: string, params?: any[]) {
  if (databaseMode === 'memory') {
    enableMemoryFallback(hasPlaceholderDatabaseUrl ? 'placeholder DATABASE_URL detected' : 'DATABASE_URL missing');
    return memoryQuery(text, params);
  }

  const start = Date.now();

  try {
    const result = await pool!.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database error:', error);
    enableMemoryFallback('postgres connection failed, switching to in-memory mode', error);
    return memoryQuery(text, params);
  }
}

export async function getClient(): Promise<DatabaseClient> {
  if (databaseMode === 'memory') {
    return createMemoryClient();
  }

  try {
    return await pool!.connect();
  } catch (error) {
    enableMemoryFallback('postgres client acquisition failed, switching to in-memory mode', error);
    return createMemoryClient();
  }
}

export default pool;
