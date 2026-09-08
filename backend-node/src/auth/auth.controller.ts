import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ok } from '../common/api-response';
import type { AppConfig } from '../config/env.schema';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import {
  GoogleLoginRequestDto,
  SigninRequestDto,
  SignupRequestDto,
} from './dto/auth.dto';

@Controller('api/auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupRequestDto) {
    const data = await this.authService.signup(dto);
    return ok(data);
  }

  @Post('signin')
  async signin(@Body() dto: SigninRequestDto) {
    const data = await this.authService.signin(dto);
    return ok(data);
  }

  @Get('signout')
  signout() {
    return ok(this.authService.signout());
  }

  @Post('google-login')
  async googleLogin(@Body() dto: GoogleLoginRequestDto) {
    const data = await this.authService.googleLogin(dto.token);
    return ok(data);
  }

  @Post('google-callback')
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const appConfig = this.configService.get<AppConfig>('app');
    const frontendUrl = appConfig?.frontendUrl ?? 'http://localhost:5173';
    const body = req.body as { credential?: unknown } | undefined;
    const credential =
      typeof body?.credential === 'string' ? body.credential : '';

    try {
      const data = await this.authService.googleLogin(credential);
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
      res.redirect(302, `${frontendUrl}/#google_auth=${encoded}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google authentication failed';
      res.redirect(
        302,
        `${frontendUrl}/#google_auth_error=${encodeURIComponent(message)}`,
      );
    }
  }
}
