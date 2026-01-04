import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  type: 'admin' | 'guest';
  userId: string;
  ip: string;
  timestamp: number;
  inviteToken?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_SECRET') || 'default_secret_key_12345',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.userId,
      type: payload.type,
      ip: payload.ip,
    };
  }
}
