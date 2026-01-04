import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/invite')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  /**
   * 生成邀请链接（仅管理员）
   */
  @Post('generate')
  generateInvite(
    @Body('expiresInDays') expiresInDays: number,
    @Headers('origin') origin: string,
    @Headers('host') host: string,
  ) {
    const baseUrl = origin || `http://${host}`;
    return this.inviteService.generateInvite(expiresInDays || null, baseUrl);
  }

  /**
   * 获取所有邀请
   */
  @Get('list')
  getAllInvites() {
    return this.inviteService.getAllInvites();
  }

  /**
   * 删除邀请令牌
   */
  @Delete(':token')
  deleteInvite(@Param('token') token: string) {
    const deleted = this.inviteService.deleteInvite(token);
    return { success: deleted };
  }
}
