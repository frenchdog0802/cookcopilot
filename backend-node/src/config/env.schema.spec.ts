import { parseEnv, toAppConfig, validateEnv } from './env.schema';
import { DEFAULT_PORT, JWT_SECRET_MIN_LENGTH } from './env.constants';

const validRaw: Record<string, unknown> = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'lardermind',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_SSL_MODE: 'disable',
  JWT_SECRET: 'x'.repeat(JWT_SECRET_MIN_LENGTH),
  GOOGLE_CLIENT_ID: '',
  FRONTEND_URL: 'http://localhost:5173',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173, http://localhost:3000',
};

describe('env schema', () => {
  it('parses valid Spring-compatible env and defaults PORT', () => {
    const env = parseEnv(validRaw);
    expect(env.PORT).toBe(DEFAULT_PORT);
    expect(env.DB_POOL_SIZE).toBe(2);

    const app = toAppConfig(env);
    expect(app.corsAllowedOrigins).toEqual([
      'http://localhost:5173',
      'http://localhost:3000',
    ]);
    expect(app.subscription.free.maxRecipes).toBe(50);
  });

  it('fails fast when JWT_SECRET is missing', () => {
    const rest = { ...validRaw };
    delete rest.JWT_SECRET;
    expect(() => parseEnv(rest)).toThrow(/JWT_SECRET/);
  });

  it('fails fast when JWT_SECRET is too short', () => {
    expect(() => parseEnv({ ...validRaw, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('validateEnv attaches typed app config', () => {
    const merged = validateEnv(validRaw);
    expect(merged).toHaveProperty('app');
    expect((merged.app as { port: number }).port).toBe(DEFAULT_PORT);
    expect(
      (merged.app as { jwtExpiresInSeconds: number }).jwtExpiresInSeconds,
    ).toBe(60 * 60 * 24 * 30);
    const app = toAppConfig(parseEnv(validRaw));
    expect(app.optional.chatRecursionLimit).toBe(12);
    expect(app.optional.chatTurnToolRounds).toBe(3);
    expect(typeof app.optional.chatHitlEnabled).toBe('boolean');
  });

  it('respects CHAT_HITL_ENABLED and memory checkpointer flags', () => {
    const app = toAppConfig(
      parseEnv({
        ...validRaw,
        CHAT_HITL_ENABLED: 'false',
        CHAT_USE_MEMORY_CHECKPOINTER: 'true',
        CHAT_RECURSION_LIMIT: '8',
        CHAT_TURN_TOOL_ROUNDS: '4',
      }),
    );
    expect(app.optional.chatHitlEnabled).toBe(false);
    expect(app.optional.chatUseMemoryCheckpointer).toBe(true);
    expect(app.optional.chatRecursionLimit).toBe(8);
    expect(app.optional.chatTurnToolRounds).toBe(4);
  });
});
