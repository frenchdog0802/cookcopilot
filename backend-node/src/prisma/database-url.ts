import type { AppConfig } from '../config/env.schema';

export function buildDatabaseUrl(database: AppConfig['database']): string {
  const encodedUsername = encodeURIComponent(database.username);
  const encodedPassword = encodeURIComponent(database.password);
  const base = `postgresql://${encodedUsername}:${encodedPassword}@${database.host}:${database.port}/${database.name}?sslmode=${encodeURIComponent(database.sslMode)}`;

  if (database.port === 6543) {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}pgbouncer=true`;
  }

  return base;
}
