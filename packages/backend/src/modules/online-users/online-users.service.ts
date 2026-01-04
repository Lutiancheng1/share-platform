import { Injectable } from '@nestjs/common';
import { OnlineUser } from '../../interfaces/user.interface';
import * as UAParser from 'ua-parser-js';

@Injectable()
export class OnlineUsersService {
  // 内存存储在线用户（生产环境应该用Redis）
  private onlineUsers: Map<string, OnlineUser> = new Map();

  /**
   * 解析User-Agent字符串，提取设备、操作系统和浏览器信息。
   */
  private parseUserAgent(userAgent: string) {
    interface UAResult {
      device: { type?: string };
      os: { name?: string; version?: string };
      browser: { name?: string; version?: string };
    }

    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult() as UAResult;

    return {
      device: result.device?.type || 'desktop',
      os: `${result.os?.name || 'Unknown'} ${result.os?.version || ''}`.trim(),
      browser:
        `${result.browser?.name || 'Unknown'} ${result.browser?.version || ''}`.trim(),
    };
  }

  /**
   * 添加在线用户
   */
  addUser(
    socketId: string,
    userId: string,
    userType: 'admin' | 'guest',
    ip: string,
    userAgent: string,
  ): OnlineUser {
    const deviceInfo = this.parseUserAgent(userAgent);

    const user: OnlineUser = {
      socketId,
      userId,
      userType,
      ip,
      device: deviceInfo.device,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      connectedAt: new Date(),
      lastActiveAt: new Date(),
    };

    this.onlineUsers.set(socketId, user);
    return user;
  }

  /**
   * 移除在线用户
   */
  removeUser(socketId: string): boolean {
    return this.onlineUsers.delete(socketId);
  }

  /**
   * 更新最后活跃时间
   */
  updateLastActive(socketId: string): void {
    const user = this.onlineUsers.get(socketId);
    if (user) {
      user.lastActiveAt = new Date();
    }
  }

  /**
   * 获取所有在线用户
   */
  getAllUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * 获取在线用户数量
   */
  getCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * 根据socketId获取用户
   */
  getUser(socketId: string): OnlineUser | undefined {
    return this.onlineUsers.get(socketId);
  }

  /**
   * 踢出用户（返回socketId以便断开连接）
   */
  kickUser(socketId: string): boolean {
    return this.removeUser(socketId);
  }
}
