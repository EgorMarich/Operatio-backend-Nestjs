import { SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'mail' })
export class MailGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: number }, @ConnectedSocket() client: Socket) {
    client.join(`user_${data.userId}`);
  }

  notifyNewMessages(userId: number, count: number) {
    this.server.to(`user_${userId}`).emit('new_messages', { count });
  }
}