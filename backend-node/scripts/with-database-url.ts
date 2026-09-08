import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { parseEnv, toAppConfig } from '../src/config/env.schema';
import { buildDatabaseUrl } from '../src/prisma/database-url';

config();

const env = parseEnv(process.env as Record<string, unknown>);
process.env.DATABASE_URL = buildDatabaseUrl(toAppConfig(env).database);

const args = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
