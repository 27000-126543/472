import http from 'http';
import app from './app.js';
import { initWebSocket, closeWebSocket } from './services/WebSocketService.js';
import { startDailyReportScheduler, stopDailyReportScheduler } from './services/ReportService.js';

const PORT = process.env.API_PORT || 3001;

const server = http.createServer(app);

initWebSocket(server);

startDailyReportScheduler();

server.listen(PORT, () => {
  console.log(`
  🚀 无人机快递配送调度平台 API 服务器已启动
  📡 HTTP 服务: http://localhost:${PORT}
  🔌 WebSocket: ws://localhost:${PORT}/ws
  📚 API 文档: http://localhost:${PORT}/api/health
  `);
});

process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] 正在优雅关闭服务器...');
  stopDailyReportScheduler();
  closeWebSocket();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SIGINT] 正在优雅关闭服务器...');
  stopDailyReportScheduler();
  closeWebSocket();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default server;
