// 此文件用于处理更复杂的在线状态逻辑
// 在我们当前的设计中，核心的上线/下线逻辑已在 sockets/index.js 中处理
// 这里可以留空或用于未来的功能扩展，例如处理用户自定义状态（如“忙碌”、“离开”）

const registerPresenceHandlers = (io, socket, onlineUsers) => {
  // 示例：处理自定义状态更新
  socket.on('update_custom_status', (status) => {
    // 可以在 user 对象上附加一个 customStatus
    socket.user.customStatus = status;
    // 并广播给好友或群组成员
    // io.to(...)
    console.log(`User ${socket.user.nickname} updated status to: ${status}`);
  });
};

module.exports = registerPresenceHandlers;
