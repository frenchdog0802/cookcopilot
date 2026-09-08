import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { User } from '@prisma/client';
import { BadRequestError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import type { AppConfig } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';
import type { SigninRequestDto, SignupRequestDto } from './dto/auth.dto';
import {
  toAuthUserDto,
  type GoogleLoginResponseData,
  type SigninResponseData,
  type SignoutResponseData,
  type SignupResponseData,
} from './dto/auth-response.dto';
import { JwtTokenService } from './jwt-token.service';
import { authenticate, encryptPassword, makeSalt } from './password.util';

@Injectable()
export class AuthService {
  private readonly googleClientId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    configService: ConfigService,
  ) {
    const appConfig = configService.get<AppConfig>('app');
    this.googleClientId = appConfig?.googleClientId ?? '';
  }

  async signup(dto: SignupRequestDto): Promise<SignupResponseData> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestError('Email is taken');
    }

    const salt = makeSalt();
    const hashedPassword = encryptPassword(dto.password, salt);
    const now = BigInt(nowUnixSeconds());
    const name = `${dto.first_name} ${dto.last_name}`.trim();

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.first_name,
        lastName: dto.last_name,
        name,
        email: dto.email,
        hashedPassword,
        salt,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      token: this.jwtTokenService.sign(user.id),
      user: toAuthUserDto(user),
    };
  }

  async signin(dto: SigninRequestDto): Promise<SigninResponseData> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestError('User not found');
    }
    if (
      !user.salt ||
      !user.hashedPassword ||
      !authenticate(dto.password, user.salt, user.hashedPassword)
    ) {
      throw new BadRequestError("Email and password don't match.");
    }

    return {
      token: this.jwtTokenService.sign(user.id),
      user: toAuthUserDto(user),
    };
  }

  signout(): SignoutResponseData {
    return { message: 'signed out' };
  }

  async googleLogin(token: string): Promise<GoogleLoginResponseData> {
    if (!token?.trim()) {
      throw new BadRequestError('Missing Google ID token');
    }

    if (token.startsWith('ya29.')) {
      throw new BadRequestError(
        'Expected a Google ID token (JWT). Access tokens are not accepted.',
      );
    }

    if (!this.googleClientId) {
      throw new BadRequestError('Google login is not configured on the server');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new BadRequestError('Invalid Google ID token format');
    }

    const client = new OAuth2Client(this.googleClientId);
    let payload: {
      sub?: string | null;
      email?: string | null;
      email_verified?: boolean | null;
      given_name?: string | null;
      family_name?: string | null;
      name?: string | null;
      picture?: string | null;
    };

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new BadRequestError(
        'Authentication failed: Invalid or expired Google ID token.',
      );
    }

    if (!payload.sub) {
      throw new BadRequestError('Invalid Google token: missing user id');
    }

    if (!payload.email_verified) {
      throw new BadRequestError('Google email is not verified');
    }

    if (!payload.email) {
      throw new BadRequestError('Invalid Google ID token');
    }

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? payload.name?.split(' ')[0] ?? '',
      lastName:
        payload.family_name ??
        payload.name?.split(' ').slice(1).join(' ') ??
        '',
      name: payload.name ?? payload.email,
      picture: payload.picture ?? null,
    });

    return {
      token: this.jwtTokenService.sign(user.id),
      user: toAuthUserDto(user),
    };
  }

  private async findOrCreateGoogleUser(input: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    picture: string | null;
  }): Promise<User> {
    const now = BigInt(nowUnixSeconds());

    const byGoogle = await this.prisma.user.findFirst({
      where: { googleId: input.googleId },
    });
    if (byGoogle) {
      return byGoogle;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: input.googleId,
          picture: input.picture ?? byEmail.picture,
          updatedAt: now,
        },
      });
    }

    const salt = makeSalt();
    const randomPassword = makeSalt();
    const hashedPassword = encryptPassword(randomPassword, salt);

    return this.prisma.user.create({
      data: {
        firstName: input.firstName || 'Google',
        lastName: input.lastName || 'User',
        name: input.name,
        email: input.email,
        hashedPassword,
        salt,
        role: 'user',
        connectAccount: 'Google',
        googleId: input.googleId,
        picture: input.picture,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}
