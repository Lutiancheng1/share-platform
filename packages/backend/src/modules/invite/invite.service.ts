import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InviteToken } from '../../interfaces/user.interface';

@Injectable()
export class InviteService {
  // 内存存储邀请令牌（生产环境应该用Redis）
  private invites: Map<string, InviteToken> = new Map();
  // 记录已使用的令牌，用于提示用户（保留24小时）
  private usedInvites: Map<string, Date> = new Map();

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
  verifyInvite(token: string): 'VALID' | 'EXPIRED' | 'NOT_FOUND' | 'USED' {
    // 先检查是否在已使用列表中
    if (this.usedInvites.has(token)) {
      return 'USED';
    }

    const invite = this.invites.get(token);
    if (!invite) return 'NOT_FOUND';

    // 检查是否过期
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      this.invites.delete(token);
      return 'EXPIRED';
    }

    // 增加使用次数
    invite.usedCount++;

    // 验证成功后立即删除，确保一次性使用，并加入已使用列表
    this.invites.delete(token);
    this.usedInvites.set(token, new Date());

    // 清理过期的已使用记录（简单的清理策略）
    this.cleanupUsedInvites();

    return 'VALID';
  }

  private cleanupUsedInvites() {
    const now = new Date();
    // 简单的概率清理，避免每次都遍历
    if (Math.random() < 0.1) {
      for (const [token, date] of this.usedInvites.entries()) {
        // 保留24小时
        if (now.getTime() - date.getTime() > 24 * 60 * 60 * 1000) {
          this.usedInvites.delete(token);
        }
      }
    }
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
