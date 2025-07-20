// sockets/chatHandlers.js

const Message = require('../models/Message');
const mongoose = require('mongoose');
const { isUserInGroup } = require('../utils/helpers');

// 定义消息可撤回的时间窗口（2分钟）
const RECALL_WINDOW_MS = 2 * 60 * 1000;

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
        // 如果接收者在线，直接发送新消息事件
        io.to(receiverSocketId).emit('new_private_message', message);
        // 并更新消息状态为 'delivered'
        message.status = 'delivered';
        await message.save();
      }

      // 回调给发送者，确认消息已发送成功
      callback({ success: true, message });
    } catch (error) {
      console.error('Error sending private message:', error);
      callback({ success: false, error: 'Failed to send message.' });
    }
  });

  // 处理群聊消息 (未来可以补充完整逻辑)
  socket.on('group_message', async (data, callback) => {
      // 类似私聊逻辑, 但需要:
      // 1. 验证用户是否在群内
      // 2. 将消息保存到数据库, group 字段为 groupId
      // 3. 使用 io.to(groupId).emit('new_group_message', message) 广播给群内所有人
  });

  // 更新消息状态 (例如：已读)
  socket.on('message_status_update', async (data) => {
    const { messageId, status } = data;
    if (status !== 'read' || !messageId) return;

    try {
      const message = await Message.findById(messageId);
      // 防止非接收者更新状态
      if (!message || !message.receiver || message.receiver.toString() !== socket.user._id.toString()) {
        return;
      }
      
      message.status = 'read';
      await message.save();

      // 通知发送者消息已读
      const senderSocketId = onlineUsers.get(message.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_read', { messageId, readerId: socket.user._id });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  });

  // 处理“正在输入”状态
  socket.on('typing_status', (data) => {
    const { to, isTyping } = data; // 'to' 可以是 userId 或 groupId
    const from = socket.user._id;

    // 根据是私聊还是群聊，发送给特定的人或群组
    const targetSocketId = onlineUsers.get(to.toString());
    if (targetSocketId) { // 私聊
      io.to(targetSocketId).emit('typing_status_update', { from, isTyping });
    } else { // 群聊 (假设 'to' 是 groupId)
      socket.to(to).emit('typing_status_update', { from, isTyping, groupId: to });
    }
  });

  // 【新增】处理消息撤回
  socket.on('recall_message', async (data, callback) => {
    const { messageId } = data;
    const senderId = socket.user._id;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return callback({ success: false, error: 'Message not found.' });
        }

        // 验证1: 必须是发送者本人操作
        if (!message.sender.equals(senderId)) {
            return callback({ success: false, error: 'You can only recall your own messages.' });
        }

        // 验证2: 必须在可撤回的时间窗口内
        const timeDiff = Date.now() - new Date(message.sentAt).getTime();
        if (timeDiff > RECALL_WINDOW_MS) {
            return callback({ success: false, error: 'Message cannot be recalled after 2 minutes.' });
        }
        
        // 验证3: 消息不能是已经被撤回的
        if (message.status === 'recalled') {
            return callback({ success: false, error: 'Message has already been recalled.' });
        }

        // 执行更新
        message.status = 'recalled';
        message.recalledAt = new Date();
        const originalContent = message.content; // 可以保留原内容用于审计
        message.content = ''; // 清空内容或设为 "消息已撤回"
        await message.save();

        // 准备广播的通知内容
        const notification = { 
            messageId: message._id, 
            recalledAt: message.recalledAt,
            senderId: message.sender,
            receiverId: message.receiver,
            groupId: message.group,
        };

        // 广播撤回事件
        if (message.receiver) { // 私聊撤回
            // 通知接收者
            const receiverSocketId = onlineUsers.get(message.receiver.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message_recalled', notification);
            }
        } else if (message.group) { // 群聊撤回
            // 广播给除了自己以外的群内所有人
            socket.to(message.group.toString()).emit('message_recalled', notification);
        }
        
        // 给操作者自己一个成功回调
        callback({ success: true, data: notification });

    } catch (error) {
        console.error('Error recalling message:', error);
        callback({ success: false, error: 'Server error while recalling message.' });
    }
  });
};

module.exports = registerChatHandlers;
