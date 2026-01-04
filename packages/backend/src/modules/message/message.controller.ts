import { Controller, Get, Query, Delete } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get()
  async getMessages(@Query('limit') limit: string = '100') {
    const messages = await this.messageService.getRecentMessages(
      parseInt(limit),
    );
    return {
      data: messages.reverse(), // 按时间正序返回
      total: messages.length,
    };
  }

  @Get('history')
  async getHistory(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    return await this.messageService.getHistoryMessages(
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Delete('all')
  async clearAll() {
    await this.messageService.deleteAllMessages();
    return { message: '所有消息已清除' };
  }
}
