import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService],
  exports: [JwtTokenService],
})
export class AuthModule {}
