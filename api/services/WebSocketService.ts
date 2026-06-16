import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { TelemetryData, Notification, AbnormalEvent } from '../../shared/types';
import { setTelemetryCallback, setAbnormalCallback } from './MissionService';
import { setNotificationCallback } from './NotificationService';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
}

let wss: WebSocketServer | null = null;
const connectedClients = new Map<string, AuthenticatedWebSocket[]>();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    console.log('[WebSocket] 新连接建立');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth') {
          ws.userId = data.userId;
          ws.role = data.role;

          if (!connectedClients.has(data.userId)) {
            connectedClients.set(data.userId, []);
          }
          connectedClients.get(data.userId)!.push(ws);

          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'WebSocket连接已认证'
          }));

          console.log(`[WebSocket] 用户 ${data.userId} (${data.role}) 已连接`);
        }
      } catch (e) {
        console.error('[WebSocket] 消息解析失败:', e);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        const clients = connectedClients.get(ws.userId);
        if (clients) {
          const index = clients.indexOf(ws);
          if (index > -1) {
            clients.splice(index, 1);
          }
          if (clients.length === 0) {
            connectedClients.delete(ws.userId);
          }
        }
        console.log(`[WebSocket] 用户 ${ws.userId} 已断开连接`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] 连接错误:', error);
    });
  });

  setTelemetryCallback((data: TelemetryData) => {
    broadcastToDispatchers({
      type: 'telemetry',
      data
    });

    broadcastToRelevantOperators(data.droneId, {
      type: 'telemetry',
      data
    });
  });

  setAbnormalCallback((event: AbnormalEvent) => {
    broadcastToDispatchers({
      type: 'abnormal_event',
      data: event
    });
  });

  setNotificationCallback((notification: Notification) => {
    notification.recipientIds.forEach(userId => {
      sendToUser(userId, {
        type: 'notification',
        data: notification
      });
    });
  });

  console.log('[WebSocket] 服务器已启动');
}

function sendToUser(userId: string, message: object) {
  const clients = connectedClients.get(userId);
  if (clients && clients.length > 0) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

function broadcastToDispatchers(message: object) {
  const messageStr = JSON.stringify(message);
  connectedClients.forEach((clients, userId) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN &&
          (client.role === 'dispatcher' || client.role === 'admin')) {
        client.send(messageStr);
      }
    });
  });
}

function broadcastToRelevantOperators(droneId: string, message: object) {
  const messageStr = JSON.stringify(message);
  connectedClients.forEach((clients, userId) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN &&
          (client.role === 'operator' || client.role === 'admin')) {
        client.send(messageStr);
      }
    });
  });
}

export function broadcastDroneStatusUpdate(droneId: string, status: string) {
  broadcastToDispatchers({
    type: 'drone_status_update',
    data: { droneId, status }
  });
}

export function broadcastOrderStatusUpdate(orderId: string, status: string) {
  broadcastToDispatchers({
    type: 'order_status_update',
    data: { orderId, status }
  });
}

export function closeWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
