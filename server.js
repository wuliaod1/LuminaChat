// server.js (完整版)

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 内部模块导入
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const initializeSocket = require('./sockets');

// 加载环境变量 (必须在最前面)
dotenv.config();

// 连接到 MongoDB 数据库
connectDB();

// 初始化 Express 应用
const app = express();

// --- 中间件配置 ---

// 1. 配置跨域资源共享 (CORS)
// 允许来自您前端域名的请求。在开发时可以使用 "*"
const allowedOrigins = [
    'http://localhost:3000', // 本地前端开发地址
    'http://localhost:5173', // Vite等现代前端框架的默认地址
    'https://www.maochat.dpdns.org' // 您未来的生产环境前端地址
];

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有来源的请求 (例如 Postman) 或来源在白名单中的请求
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 2. 解析请求体
// 用于解析 application/json 格式的请求体
app.use(express.json());
// 用于解析 application/x-www-form-urlencoded 格式的请求体
app.use(express.urlencoded({ extended: false }));


// --- API 路由配置 ---

// 基础路由，用于测试服务是否在线
app.get('/', (req, res) => {
  res.send('LuminaChat Backend Server is running...');
});

// Render 健康检查路由，必须返回 200 OK
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// 挂载各个模块的路由
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/users', require('./routes/user.routes.js'));
app.use('/api/friends', require('./routes/friend.routes.js'));
app.use('/api/groups', require('./routes/group.routes.js'));
app.use('/api/messages', require('./routes/message.routes.js'));


// --- 错误处理中间件 ---
// 这个必须放在所有路由之后
app.use(errorHandler);


// --- HTTP 和 Socket.io 服务器设置 ---

// 创建 HTTP 服务器实例
const server = http.createServer(app);

// 初始化并配置 Socket.io
const { io, onlineUsers } = initializeSocket(server, allowedOrigins);

// 将 io 和 onlineUsers 实例附加到 app 对象上，方便在控制器中访问
// 例如在控制器中可以通过 req.app.get('socketio').io 来调用
app.set('socketio', { io, onlineUsers });


// --- 启动服务器 ---

const PORT = process.env.PORT || 3001; // Render 会自动注入 PORT 环境变量

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LuminaChat backend successfully started.`);
});

// 优雅地处理进程退出
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // 关闭服务器 & 退出进程
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
