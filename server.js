// server.js (最终修正版 - 修复CORS)

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const initializeSocket = require('./sockets');

dotenv.config();
connectDB();

const app = express();

// --- 关键修复：CORS (跨域资源共享) 配置 ---
// 使用更通用的CORS配置，允许所有来源的请求
// 这将解决 "Failed to fetch" 问题
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('LuminaChat Backend Server is running...');
});

app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/friends', require('./routes/friend.routes.js'));
app.use('/api/groups', require('./routes/group.routes.js'));
app.use('/api/messages', require('./routes/message.routes.js'));

app.use(errorHandler);

const server = http.createServer(app);

// 在Socket.io的CORS配置中也使用更宽松的策略
const { io, onlineUsers } = initializeSocket(server, {
  cors: {
    origin: "*", // 允许所有来源的WebSocket连接
    methods: ["GET", "POST"]
  }
});

app.set('socketio', { io, onlineUsers });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LuminaChat backend successfully started.`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
