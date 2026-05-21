import { startLocalDatabase } from './local-db.js';

const useLocalDb =
  process.env.USE_LOCAL_DB !== 'false' &&
  (!process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('supabase.co') ||
    process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1'));

if (useLocalDb) {
  await startLocalDatabase();
}

await import('../src/index.js');
