import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未选择文件');
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
