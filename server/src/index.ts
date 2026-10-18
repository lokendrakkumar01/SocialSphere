import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { initSocket } from './services/socket';
import { env } from './config/env';

const startServer = async () => {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 ${env.APP_NAME} Server running on port ${env.PORT}`);
      console.log(`🌐 API Endpoint: http://localhost:${env.PORT}/api/v1`);
      console.log(`🔌 WebSockets enabled via Socket.IO`);
      console.log(`📁 Static uploads at: http://localhost:${env.PORT}/uploads/`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default startServer;
