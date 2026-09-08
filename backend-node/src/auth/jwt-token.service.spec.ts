import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  const secret = 't'.repeat(32);
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const expiresInSeconds = 3600;

  function createService(): JwtTokenService {
    const configService = {
      get: () => ({ jwtSecret: secret, jwtExpiresInSeconds: expiresInSeconds }),
    } as unknown as ConfigService;
    return new JwtTokenService(configService);
  }

  it('signs token with user_id, iat, and exp', () => {
    const service = createService();
    const token = service.sign(userId);
    const decoded = jwt.decode(token) as Record<string, unknown>;

    expect(decoded.user_id).toBe(userId);
    expect(typeof decoded.iat).toBe('number');
    expect(typeof decoded.exp).toBe('number');
    expect((decoded.exp as number) - (decoded.iat as number)).toBe(
      expiresInSeconds,
    );
  });

  it('verify returns userId for valid token', () => {
    const service = createService();
    const token = service.sign(userId);
    expect(service.verify(token)).toEqual({ userId });
  });

  it('verify throws for invalid token', () => {
    const service = createService();
    expect(() => service.verify('not-a-token')).toThrow('Invalid token');
  });

  it('verify throws for expired token', () => {
    const service = createService();
    const expired = jwt.sign({ user_id: userId }, secret, {
      algorithm: 'HS256',
      expiresIn: -10,
    });
    expect(() => service.verify(expired)).toThrow('Invalid token');
  });

  it('still accepts legacy tokens without exp', () => {
    const service = createService();
    const withoutExp = jwt.sign(
      { user_id: userId, iat: Math.floor(Date.now() / 1000) },
      secret,
      { algorithm: 'HS256' },
    );
    const decoded = jwt.decode(withoutExp) as Record<string, unknown>;
    expect(decoded.exp).toBeUndefined();
    expect(service.verify(withoutExp)).toEqual({ userId });
  });
});
