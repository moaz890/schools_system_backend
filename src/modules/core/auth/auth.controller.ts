import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Stricter than global default: slows brute-force / credential stuffing per IP. */
  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get access + refresh tokens' })
  login(@Body() loginDto: LoginDto, @Req() req: any) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.login(loginDto, deviceInfo, ipAddress);
  }

  /** Public endpoint: without a limit it can be abused to hammer DB + crypto (bcrypt session match). */
  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.refresh(dto.refreshToken, deviceInfo, ipAddress);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email',
    description:
      'Always returns the same message whether the email exists or not. School users must send schoolCode (same as login).',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.forgotPassword(dto, deviceInfo, ipAddress);
  }

  @Post('reset-password')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete password reset using token from email link',
    description:
      'Use userId and token from the frontend reset page query string.',
  })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.resetPassword(dto, deviceInfo, ipAddress);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and revoke current session' })
  logout(
    @CurrentUser() user: any,
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
  ) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.logout(
      user.id,
      dto.refreshToken,
      deviceInfo,
      ipAddress,
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change own password (invalidates all sessions)' })
  changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ) {
    const deviceInfo: string | undefined =
      req.headers['user-agent'] ?? undefined;
    const ipAddress: string | undefined = req.ip ?? undefined;
    return this.authService.changePassword(user.id, dto, deviceInfo, ipAddress);
  }
}
