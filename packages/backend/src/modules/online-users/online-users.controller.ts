import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { OnlineUsersService } from './online-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/online-users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OnlineUsersController {
  constructor(private readonly onlineUsersService: OnlineUsersService) {}

  /**
   * 获取所有在线用户（仅管理员）
   */
  @Get()
  getAllUsers() {
    return this.onlineUsersService.getAllUsers();
  }

  /**
   * 踢出用户（仅管理员）
   */
  @Delete(':socketId')
  kickUser(@Param('socketId') socketId: string) {
    const kicked = this.onlineUsersService.kickUser(socketId);
    return { success: kicked, socketId };
  }
}
