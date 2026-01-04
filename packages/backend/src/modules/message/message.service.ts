import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { MessageDto } from '../../dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async saveMessage(dto: MessageDto, userIp: string): Promise<Message> {
    const message = this.messageRepo.create({
      ...dto,
      userIp,
    });

    return await this.messageRepo.save(message);
  }

  async getRecentMessages(limit: number = 100): Promise<Message[]> {
    return await this.messageRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getHistoryMessages(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ data: Message[]; total: number }> {
    const [data, total] = await this.messageRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async deleteAllMessages(): Promise<void> {
    await this.messageRepo.clear();
  }

  async deleteMessages(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    // 1. 查找要删除的消息
    const messages = await this.messageRepo.findByIds(ids);

    // 2. 删除物理文件
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'uploads');

    for (const msg of messages) {
      if ((msg.type === 'image' || msg.type === 'file') && msg.url) {
        try {
          // url 格式通常是 /uploads/filename.ext
          const filename = path.basename(msg.url);
          const filePath = path.join(uploadDir, filename);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file: ${filePath}`);
          }
        } catch (err) {
          console.error(`Failed to delete file for message ${msg.id}:`, err);
        }
      }
    }

    // 3. 删除数据库记录
    await this.messageRepo.delete(ids);
  }
}
