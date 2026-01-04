import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../interfaces/socket.interface';
import { MessageService } from '../modules/message/message.service';
import { OnlineUsersService } from '../modules/online-users/online-users.service';
import { AuthService } from '../modules/auth/auth.service';
import { MessageDto } from '../dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境建议设置具体域名
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private onlineUsersService: OnlineUsersService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // 获取token（从auth或query参数）
      const token = (client.handshake.auth?.token ||
        client.handshake.query?.token) as string | undefined;

      // 获取客户端IP
      const ip: string =
        (client.handshake.headers['x-forwarded-for'] as string) ||
        client.handshake.address;

      // 获取User-Agent
      const userAgent: string =
        client.handshake.headers['user-agent'] || 'Unknown';

      let userId = 'anonymous';
      let userType: 'admin' | 'guest' = 'guest';

      // 验证token（如果有）
      if (token) {
        try {
          const decoded = this.authService.verifyToken(token);
          userId = decoded.userId;
          userType = decoded.type || 'guest';
        } catch (e) {
          console.warn(`⚠️  Invalid token from ${ip}`, e);
        }
      }

      // 添加到在线用户列表（收集设备信息）
      const user = this.onlineUsersService.addUser(
        client.id,
        userId,
        userType,
        ip,
        userAgent,
      );

      console.log(
        `✅ ${userType === 'admin' ? '👑 Admin' : '👤 Guest'} connected: ${client.id} (${user.device} - ${user.browser}) Total: ${this.onlineUsersService.getCount()}`,
      );

      // 绑定用户信息到socket（后续使用）
      client.userData = { userId, userType };

      // 广播在线用户数
      this.server.emit('onlineCount', this.onlineUsersService.getCount());

      // 如果是管理员，发送在线用户列表
      if (userType === 'admin') {
        client.emit('onlineUsers', this.onlineUsersService.getAllUsers());
      }

      // 发送最近100条历史消息
      const history = await this.messageService.getRecentMessages(100);
      client.emit('history', history.reverse());
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.onlineUsersService.removeUser(client.id);
    console.log(
      `❌ Client disconnected: ${client.id} (Total: ${this.onlineUsersService.getCount()})`,
    );

    // 广播在线用户数
    this.server.emit('onlineCount', this.onlineUsersService.getCount());

    // 通知所有管理员更新在线用户列表
    this.broadcastOnlineUsersToAdmins();
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // 更新最后活跃时间
      this.onlineUsersService.updateLastActive(client.id);

      // 获取客户端IP
      const clientIp = client.handshake.address || 'unknown';

      // 保存到数据库
      const savedMessage = await this.messageService.saveMessage(
        data,
        clientIp,
      );

      // 广播给所有客户端（包括发送者）
      this.server.emit('message', savedMessage);

      console.log(
        `📨 Message broadcasted: ${savedMessage.type} from ${clientIp}`,
      );
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('error', { message: '消息发送失败' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    this.onlineUsersService.updateLastActive(client.id);
    client.emit('pong');
  }

  /**
   * 管理员请求在线用户列表
   */
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const userData = client.userData;

    // 只有管理员可以获取详细列表
    if (userData?.userType === 'admin') {
      client.emit('onlineUsers', this.onlineUsersService.getAllUsers());
    }
  }

  /**
   * 管理员踢出用户
   */
  @SubscribeMessage('kickUser')
  handleKickUser(
    @MessageBody() socketId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userData = client.userData;

    // 只有管理员可以踢人
    if (userData?.userType === 'admin') {
      const targetSocket = this.server.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit('kicked', { message: '你已被管理员踢出' });
        targetSocket.disconnect(true);
        console.log(`🚫 User kicked by admin: ${socketId}`);
      }
    }
  }

  /**
   * 管理员批量删除消息
   */
  @SubscribeMessage('deleteMessages')
  async handleDeleteMessages(
    @MessageBody() messageIds: number[],
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userData = client.userData;

    // 只有管理员可以删除消息
    if (userData?.userType === 'admin') {
      try {
        await this.messageService.deleteMessages(messageIds);

        // 广播删除事件给所有客户端
        this.server.emit('messagesDeleted', messageIds);

        console.log(
          `🗑️ Messages deleted by admin: ${messageIds.length} messages`,
        );
      } catch (error) {
        console.error('Error deleting messages:', error);
        client.emit('error', { message: '删除消息失败' });
      }
    } else {
      client.emit('error', { message: '无权执行此操作' });
    }
  }

  /**
   * 广播在线用户列表给所有管理员
   */
  private broadcastOnlineUsersToAdmins() {
    const onlineUsers = this.onlineUsersService.getAllUsers();
    this.server.sockets.sockets.forEach((socket) => {
      const authenticatedSocket = socket as AuthenticatedSocket;
      const userData = authenticatedSocket.userData;
      if (userData?.userType === 'admin') {
        socket.emit('onlineUsers', onlineUsers);
      }
    });
  }
}
