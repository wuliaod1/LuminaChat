const Message = require('../models/Message');
const mongoose = require('mongoose');
const { isUserInGroup } = require('../utils/helpers'); // 假设的辅助函数

const registerChatHandlers = (io, socket, onlineUsers) => {

  // 处理私聊消息
  socket.on('private_message', async (data, callback) => {
    const { receiverId, content, contentType = 'text' } = data;
    const senderId = socket.user._id;

    if (!receiverId || !content) {
      return callback({ success: false, error: 'Missing receiverId or content.' });
    }

    try {
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
        contentType
      });
      await message.save();

      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        // 如果接收者在线，直接发送
        io.to(receiverSocketId).emit('new_private_message', message);
        // 更新消息状态为 'delivered'
        message.status = 'delivered';
        await message.save();
      }

      // 回调给发送者，确认消息已发送
      callback({ success: true, message });
    } catch (error) {
      console.error('Error sending private message:', error);
      callback({ success: false, error: 'Failed to send message.' });
    }
  });

  // 处理群聊消息
  socket.on('group_message', async (data, callback) => {
    // ... 类似逻辑，但需要验证用户是否在群内，并使用 io.to(groupId).emit() 广播
  });

  // 更新消息状态 (已读)
  socket.on('message_status_update', async (data) => {
    const { messageId, status } = data;
    if (status !== 'read' || !messageId) return;

    try {
      const message = await Message.findById(messageId);
      if (!message || message.receiver.toString() !== socket.user._id.toString()) {
        return; // 防止非接收者更新状态
      }
      
      message.status = 'read';
      await message.save();

      const senderSocketId = onlineUsers.get(message.sender.toString());
      if (senderSocketId) {
        // 通知发送者消息已读
        io.to(senderSocketId).emit('message_read', { messageId, readerId: socket.user._id });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  });

  // 处理“正在输入”状态
  socket.on('typing_status', (data) => {
    const { to, isTyping } = data; // to可以是userId或groupId
    const from = socket.user._id;

    // 根据是私聊还是群聊，发送给特定的人或群组
    if (onlineUsers.has(to.toString())) {
      const targetSocketId = onlineUsers.get(to.toString());
      io.to(targetSocketId).emit('typing_status_update', { from, isTyping });
    } else {
      // 如果是群聊，需要广播给群内所有在线成员（除了自己）
      // socket.to(to).emit(...)
    }
  });
};

module.exports = registerChatHandlers;
