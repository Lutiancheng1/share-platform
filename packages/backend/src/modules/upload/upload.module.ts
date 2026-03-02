import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const defaultMaxFileSize = 50 * 1024 * 1024; // 默认50MB
        const maxFileSize = Number(
          configService.get('MAX_FILE_SIZE') ?? defaultMaxFileSize,
        );

        return {
          storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
              const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
          limits: {
            fileSize:
              Number.isFinite(maxFileSize) && maxFileSize > 0
                ? maxFileSize
                : defaultMaxFileSize,
          },
          // 放开文件类型限制，所有文件统一按附件处理（预览能力由前端决定）
          fileFilter: (req, file, callback) => {
            callback(null, true);
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
