const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');
const { isUserInGroup } = require('../utils/helpers');

const registerGroupHandlers = (io, socket, onlineUsers) => {
  // 加入群聊房间，以便接收该群的消息
  socket.on('join_group_rooms', async () => {
    try {
      const memberships = await GroupMember.find({ user: socket.user._id });
      memberships.forEach(membership => {
        socket.join(membership.group.toString());
        console.log(`User ${socket.user.nickname} joined room: ${membership.group.toString()}`);
      });
    } catch (error) {
      console.error(`Error joining group rooms for user ${socket.user._id}:`, error);
    }
  });

  // 处理群公告更新事件
  socket.on('update_group_announcement', async (data, callback) => {
    const { groupId, announcement } = data;
    const userId = socket.user._id;

    try {
        // 权限检查：必须是群主或管理员
        const member = await isUserInGroup(userId, groupId, ['owner', 'admin']);
        if (!member) {
            return callback({ success: false, error: 'Permission denied.' });
        }

        const group = await Group.findByIdAndUpdate(
            groupId, 
            { announcement, announcementUpdatedAt: new Date() },
            { new: true }
        );

        if (!group) {
            return callback({ success: false, error: 'Group not found.' });
        }

        // 广播给群里的所有人
        io.to(groupId).emit('group_announcement_updated', {
            groupId,
            announcement: group.announcement,
            updatedBy: socket.user.nickname
        });

        callback({ success: true });
    } catch (error) {
        console.error('Error updating announcement:', error);
        callback({ success: false, error: 'Server error.' });
    }
  });

  // 更多群管理事件，如踢人、禁言等可以加在这里...
};

module.exports = registerGroupHandlers;
