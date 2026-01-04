import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../interfaces/jwt.interface';

// 扩展Express Request以包含user属性
interface UserRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user || user.type !== 'admin') {
      throw new ForbiddenException('只有管理员可以访问此资源');
    }

    return true;
  }
}
