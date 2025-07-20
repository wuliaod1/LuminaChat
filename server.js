const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const initializeSocket = require('./sockets');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 配置跨域
app.use(cors({
  origin: process.env.FRONTEND_URL || "*", // 生产环境建议指定前端域名
  credentials: true
}));

// 中间件：解析JSON和URL编码的请求体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 基础路由
app.get('/', (req, res) => {
  res.send('IM Backend Server is running...');
});

// API 路由
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/friends', require('./routes/friend.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/messages', require('./routes/message.routes'));

// 统一错误处理中间件
app.use(errorHandler);

const server = http.createServer(app);

// 初始化Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    // 启用连接状态恢复
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// 将 io 实例传递给 socket 初始化模块
initializeSocket(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Render 健康检查
app.get('/healthz', (req, res) => res.sendStatus(200));

module.exports = { app, server, io };
