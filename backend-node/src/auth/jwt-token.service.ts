import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config/env.schema';
import { DEFAULT_JWT_EXPIRES_IN_SECONDS } from '../config/env.constants';
import { UnauthorizedError } from '../common/errors/http-errors';

export type JwtPayload = {
  user_id: string;
  iat: number;
  exp?: number;
};

@Injectable()
export class JwtTokenService {
  private readonly secret: string;
  private readonly expiresInSeconds: number;

  constructor(configService: ConfigService) {
    const appConfig = configService.get<AppConfig>('app');
    this.secret = appConfig?.jwtSecret ?? '';
    this.expiresInSeconds =
      appConfig?.jwtExpiresInSeconds ?? DEFAULT_JWT_EXPIRES_IN_SECONDS;
  }

  sign(userId: string): string {
    const payload: JwtPayload = {
      user_id: userId,
      iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: this.expiresInSeconds,
    });
  }

  verify(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as JwtPayload;
      if (!decoded.user_id) {
        throw new UnauthorizedError('Invalid token');
      }
      return { userId: decoded.user_id };
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
