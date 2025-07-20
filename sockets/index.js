// sockets/index.js
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registerChatHandlers = require('./chatHandlers');
const registerPresenceHandlers = require('./presenceHandlers');
const registerGroupHandlers = require('./groupHandlers');

const initializeSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"]
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  const onlineUsers = new Map(); // { userId: socketId }

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

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.nickname} (${socket.id})`);

    onlineUsers.set(socket.user._id.toString(), socket.id);
    io.emit('user_presence', { userId: socket.user._id, status: 'online' });

    registerChatHandlers(io, socket, onlineUsers);
    registerPresenceHandlers(io, socket, onlineUsers);
    registerGroupHandlers(io, socket, onlineUsers);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.nickname} (${socket.id})`);
      onlineUsers.delete(socket.user._id.toString());
      io.emit('user_presence', { userId: socket.user._id, status: 'offline', lastActive: new Date() });
      User.findByIdAndUpdate(socket.user._id, { status: 'offline', lastActive: new Date() }).catch(err => {
        console.error('Failed to update user status on disconnect:', err);
      });
    });

    socket.on('error', (err) => {
      console.error(`Socket error for user ${socket.user.nickname}:`, err.message);
    });
  });

  return { io, onlineUsers };
};

module.exports = initializeSocket;
