import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Message } from './entities/message.entity';
import { AuthModule } from './modules/auth/auth.module';
import { MessageModule } from './modules/message/message.module';
import { UploadModule } from './modules/upload/upload.module';
import { InviteModule } from './modules/invite/invite.module';
import { OnlineUsersModule } from './modules/online-users/online-users.module';
import { ChatGateway } from './gateway/chat.gateway';

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'], // 支持多个路径
    }),

    // TypeORM 配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [Message],
        synchronize: true, // 生产环境改为 false
        logging: false,
        timezone: 'Asia/Shanghai', // 设置时区为中国上海
      }),
      inject: [ConfigService],
    }),

    // JWT 全局配置
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('JWT_SECRET') || 'default_secret_key_12345';
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret,
          signOptions: { expiresIn: expiresIn as any }, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        };
      },
      inject: [ConfigService],
    }),

    // 功能模块
    AuthModule,
    MessageModule,
    UploadModule,
    InviteModule,
    OnlineUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
