import { Controller, Post, Get, Body, Query, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../../dto/message.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 管理员登录
   */
  @Post('admin/login')
  adminLogin(@Body() dto: LoginDto, @Ip() ip: string) {
    const token = this.authService.adminLogin(dto.password, ip);

    return {
      token,
      type: 'admin',
      expiresIn: '7d',
      message: '管理员登录成功',
    };
  }

  /**
   * 访客登录（通过邀请令牌）
   */
  @Post('guest/login')
  guestLogin(@Body('inviteToken') inviteToken: string, @Ip() ip: string) {
    const token = this.authService.guestLogin(inviteToken, ip);

    return {
      token,
      type: 'guest',
      expiresIn: '30d',
      message: '访客登录成功',
    };
  }

  /**
   * 验证邀请令牌是否有效（不登录）
   */
  @Get('verify-invite')
  verifyInvite(@Query('token') token: string) {
    try {
      const isValid = this.authService['inviteService'].verifyInvite(token);
      return { valid: isValid };
    } catch {
      return { valid: false };
    }
  }

  /**
   * 兼容旧版登录（将被废弃）
   */
  @Post('login')
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    const token = this.authService.adminLogin(dto.password, ip);

    return {
      token,
      expiresIn: '7d',
      message: '登录成功',
    };
  }
}
