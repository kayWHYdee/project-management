import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService, AuthGuard],
  exports: [PasswordService, SessionService, AuthGuard],
})
export class AuthModule {}
