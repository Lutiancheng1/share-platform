import { Socket } from 'socket.io';

// 扩展Socket类型以包含自定义userData
export interface AuthenticatedSocket extends Socket {
  userData?: {
    userId: string;
    userType: 'admin' | 'guest';
  };
}
