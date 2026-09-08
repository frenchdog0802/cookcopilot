/**
 * Provides Spring-compatible env so Nest ConfigModule can boot in unit/e2e tests.
 * Does not override vars already set by the shell or CI.
 */
import { JWT_SECRET_MIN_LENGTH } from '../src/config/env.constants';

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '8090',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'lardermind',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_SSL_MODE: 'disable',
  JWT_SECRET: 't'.repeat(JWT_SECRET_MIN_LENGTH),
  GOOGLE_CLIENT_ID: '',
  FRONTEND_URL: 'http://localhost:5173',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
  CHAT_HITL_ENABLED: 'false',
  CHAT_USE_MEMORY_CHECKPOINTER: 'true',
  CHAT_RECURSION_LIMIT: '12',
};

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
