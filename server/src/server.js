const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[+] Autonomous SQL Analyst Backend running on port ${PORT}`);
    console.log(`[+] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('[*] Received shutdown signal, closing server gracefully...');
    server.close(() => {
      console.log('[+] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
