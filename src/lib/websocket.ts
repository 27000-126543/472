import { TelemetryData, Notification, AbnormalEvent } from '../../shared/types';

type MessageType =
  | 'telemetry'
  | 'notification'
  | 'abnormal_event'
  | 'drone_status_update'
  | 'order_status_update'
  | 'auth_success'
  | 'error';

interface WebSocketMessage {
  type: MessageType;
  data?: any;
  message?: string;
}

type Listener<T = any> = (data: T) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<MessageType, Set<Listener>> = new Map();
  private userId: string | null = null;
  private role: string | null = null;
  private url: string;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  connect(userId: string, role: string): void {
    this.userId = userId;
    this.role = role;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.createConnection();
  }

  private createConnection(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接已建立');
        this.reconnectAttempts = 0;
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[WebSocket] 消息解析失败:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] 连接已断开');
        this.attemptReconnect();
      };
    } catch (e) {
      console.error('[WebSocket] 创建连接失败:', e);
      this.attemptReconnect();
    }
  }

  private authenticate(): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId && this.role) {
      this.send({
        type: 'auth',
        userId: this.userId,
        role: this.role,
      });
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners && message.data) {
      listeners.forEach((listener) => listener(message.data));
    }

    if (message.type === 'auth_success') {
      console.log('[WebSocket] 认证成功:', message.message);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[WebSocket] ${delay / 1000}秒后进行第${this.reconnectAttempts}次重连`
    );

    setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on<T = any>(type: MessageType, listener: Listener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  onTelemetry(listener: Listener<TelemetryData>): () => void {
    return this.on<TelemetryData>('telemetry', listener);
  }

  onNotification(listener: Listener<Notification>): () => void {
    return this.on<Notification>('notification', listener);
  }

  onAbnormalEvent(listener: Listener<AbnormalEvent>): () => void {
    return this.on<AbnormalEvent>('abnormal_event', listener);
  }

  onDroneStatusUpdate(
    listener: Listener<{ droneId: string; status: string }>
  ): () => void {
    return this.on('drone_status_update', listener);
  }

  onOrderStatusUpdate(
    listener: Listener<{ orderId: string; status: string }>
  ): () => void {
    return this.on('order_status_update', listener);
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    console.log('[WebSocket] 已主动断开连接');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
