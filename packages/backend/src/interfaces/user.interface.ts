export interface InviteToken {
  token: string;
  createdAt: Date;
  expiresAt: Date | null; // null表示永久有效
  usedCount: number;
}

export interface OnlineUser {
  socketId: string;
  userId: string;
  userType: 'admin' | 'guest';

  // 设备信息
  ip: string;
  device: string; // Desktop, Mobile, Tablet
  os: string; // Windows 11, macOS, iOS 17
  browser: string; // Chrome 120, Safari 17

  // 连接信息
  connectedAt: Date;
  lastActiveAt: Date;
}
