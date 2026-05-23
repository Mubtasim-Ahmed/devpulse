import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL ?? '';
const jwtSecret = process.env.JWT_SECRET ?? '';

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is required in .env');
  process.exit(1);
}

if (!jwtSecret || jwtSecret.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  databaseUrl,
};
