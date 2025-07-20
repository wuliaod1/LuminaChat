const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registerChatHandlers = require('./chatHandlers');
const registerPresenceHandlers = require('./presenceHandlers');
const registerGroupHandlers = require('./groupHandlers');

// 用于存储在线用户 { userId: socketId }
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Socket.io 中间件，用于连接认证
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token not provided.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || user.isDeleted) {
        return next(new Error('Authentication error: User not found.'));
      }

      socket.user = user; // 将用户信息附加到socket实例
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.nickname} (${socket.id})`);

    // 存储在线用户并广播上线状态
    onlineUsers.set(socket.user._id.toString(), socket.id);
    io.emit('user_presence', { userId: socket.user._id, status: 'online' });

    // 注册各类事件处理器
    registerChatHandlers(io, socket, onlineUsers);
    registerPresenceHandlers(io, socket, onlineUsers);
    registerGroupHandlers(io, socket, onlineUsers);

    // 处理断开连接
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.nickname} (${socket.id})`);
      // 移除在线用户并广播下线状态
      onlineUsers.delete(socket.user._id.toString());
      io.emit('user_presence', { userId: socket.user._id, status: 'offline', lastActive: new Date() });
      
      // 更新数据库中的用户状态
      User.findByIdAndUpdate(socket.user._id, { status: 'offline', lastActive: new Date() }).catch(err => {
        console.error('Failed to update user status on disconnect:', err);
      });
    });

    // 错误处理
    socket.on('error', (err) => {
      console.error(`Socket error for user ${socket.user.nickname}:`, err);
      // 可以向客户端发送一个标准的错误事件
      socket.emit('server_error', { message: 'An internal error occurred.' });
    });
  });
};

module.exports = initializeSocket;
