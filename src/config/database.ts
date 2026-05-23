import { Pool, PoolClient, PoolConfig, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import type { QueryParam } from '../types/index.js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL ?? '';
const isRemoteDb =
  databaseUrl.includes('supabase.co') ||
  databaseUrl.includes('neon.tech') ||
  databaseUrl.includes('elephantsql.com');

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
};

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryParam[]
) => {
  return pool.query<T>(text, params);
};

export default pool;
