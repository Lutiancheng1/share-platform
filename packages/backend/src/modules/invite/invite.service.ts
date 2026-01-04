import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InviteToken } from '../../interfaces/user.interface';

@Injectable()
export class InviteService {
  // 内存存储邀请令牌（生产环境应该用Redis）
  private invites: Map<string, InviteToken> = new Map();

  /**
   * 生成邀请令牌
   */
  generateInvite(
    expiresInDays: number | null = null,
    baseUrl: string = 'http://localhost:3000',
  ): {
    token: string;
    url: string;
    expiresAt: Date | null;
  } {
    const token = randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    this.invites.set(token, {
      token,
      createdAt: now,
      expiresAt,
      usedCount: 0,
    });

    // 如果是开发环境端口3001，替换为3000（前端端口）
    // 简单处理：如果baseUrl包含3001，替换为3000
    const frontendUrl = baseUrl.replace(':3001', ':3000');
    const url = `${frontendUrl}?invite=${token}`;

    return { token, url, expiresAt };
  }

  /**
   * 验证邀请令牌
   */
  verifyInvite(token: string): boolean {
    const invite = this.invites.get(token);
    if (!invite) return false;

    // 检查是否过期
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      this.invites.delete(token);
      return false;
    }

    // 增加使用次数
    invite.usedCount++;

    return true;
  }

  /**
   * 获取所有有效邀请
   */
  getAllInvites(): InviteToken[] {
    const now = new Date();
    return Array.from(this.invites.values()).filter(
      (invite) => !invite.expiresAt || invite.expiresAt > now,
    );
  }

  /**
   * 删除邀请令牌
   */
  deleteInvite(token: string): boolean {
    return this.invites.delete(token);
  }
}
