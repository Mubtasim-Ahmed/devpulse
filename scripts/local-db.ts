import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const LOCAL_PORT = 5433;
const LOCAL_USER = 'postgres';
const LOCAL_PASSWORD = 'postgres';
const LOCAL_DATABASE = 'devpulse';

let instance: EmbeddedPostgres | null = null;

export const getLocalDatabaseUrl = (): string =>
  `postgresql://${LOCAL_USER}:${LOCAL_PASSWORD}@127.0.0.1:${LOCAL_PORT}/${LOCAL_DATABASE}`;

export const startLocalDatabase = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = getLocalDatabaseUrl();
  }

  instance = new EmbeddedPostgres({
    databaseDir: path.join(projectRoot, '.data', 'postgres'),
    user: LOCAL_USER,
    password: LOCAL_PASSWORD,
    port: LOCAL_PORT,
    persistent: true,
  });

  await instance.initialise();
  await instance.start();

  try {
    await instance.createDatabase(LOCAL_DATABASE);
    console.log(`✅ Created database "${LOCAL_DATABASE}"`);
  } catch {
    console.log(`✅ Database "${LOCAL_DATABASE}" already exists`);
  }

  console.log(`✅ Local PostgreSQL running at ${getLocalDatabaseUrl()}`);
};

export const stopLocalDatabase = async (): Promise<void> => {
  if (instance) {
    await instance.stop();
    instance = null;
  }
};

const isDirectRun = process.argv[1]?.includes('local-db');

if (isDirectRun) {
  startLocalDatabase()
    .then(() => {
      console.log('Press Ctrl+C to stop the local database.');
    })
    .catch((error) => {
      console.error('❌ Failed to start local database:', error);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    await stopLocalDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopLocalDatabase();
    process.exit(0);
  });
}
