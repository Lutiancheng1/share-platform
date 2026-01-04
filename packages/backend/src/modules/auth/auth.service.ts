import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InviteService } from '../invite/invite.service';
import { JwtPayload } from '../../interfaces/jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private inviteService: InviteService,
  ) {}

  /**
   * 验证管理员密码
   */
  validateAdminPassword(password: string): boolean {
    const adminPassword = this.configService.get<string>('ACCESS_PASSWORD');
    return password === adminPassword;
  }

  /**
   * 管理员登录 - 生成admin token
   */
  adminLogin(password: string, ip: string): string {
    const isValid = this.validateAdminPassword(password);

    if (!isValid) {
      throw new UnauthorizedException('管理员密码错误');
    }

    const payload: JwtPayload = {
      type: 'admin',
      userId: 'admin',
      ip,
      timestamp: Date.now(),
    };

    return this.jwtService.sign(payload);
  }

  /**
   * 访客登录 - 验证邀请链接并生成guest token
   */
  guestLogin(inviteToken: string, ip: string): string {
    const isValid = this.inviteService.verifyInvite(inviteToken);

    if (!isValid) {
      throw new UnauthorizedException('邀请链接无效或已过期');
    }

    // 生成唯一guest ID
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const payload: JwtPayload = {
      type: 'guest',
      userId: guestId,
      inviteToken,
      ip,
      timestamp: Date.now(),
    };

    return this.jwtService.sign(payload);
  }

  /**
   * 验证token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token 无效或已过期');
    }
  }
}
