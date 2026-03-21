import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './Chat.service';
import { JwtService }] from '@nestjs/jwt'


@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;


  private onlineUsers = new Map<number, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;

      this.onlineUsers.set(payload.sub, client.id);
      this.server.emit('user_online', { userId: payload.sub });

      const chats = await this.chatService.getUserChats(payload.sub);
      chats.forEach(chat => client.join(`chat_${chat.id}`));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() { chatId }: { chatId: number }) {
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() { chatId }: { chatId: number }) {
    client.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() { chatId }: { chatId: number }) {
    client.to(`chat_${chatId}`).emit('user_stop_typing', {
      chatId,
      userId: client.data.userId,
    });
  }

  broadcastMessage(chatId: number, message: any) {
    this.server.to(`chat_${chatId}`).emit('new_message', message);
  }

  broadcastEvent(chatId: number, event: string, data: any) {
    this.server.to(`chat_${chatId}`).emit(event, data);
  }

  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers.keys());
  }
}