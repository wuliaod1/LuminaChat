// controllers/group.controller.js

const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const { isUserInGroup } = require('../utils/helpers');

// @desc    创建新群组
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res, next) => {
    const { name, isPrivate = false } = req.body;
    const ownerId = req.user._id;

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, error: { code: 'NAME_REQUIRED', message: 'Group name is required.' } });
    }

    try {
        // 步骤1: 创建群组实体
        const group = await Group.create({
            name,
            owner: ownerId,
            isPrivate,
            // TODO: 在未来可以集成服务生成默认头像和二维码URL
        });

        // 步骤2: 将群主作为第一个成员添加到群组
        await GroupMember.create({
            group: group._id,
            user: ownerId,
            role: 'owner'
        });

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        next(error);
    }
};

// @desc    将成员踢出群组
// @route   POST /api/groups/:groupId/kick
// @access  Private
exports.kickMember = async (req, res, next) => {
    const { groupId } = req.params;
    const { memberToKickId } = req.body;
    const operatorId = req.user._id;

    try {
        // 1. 验证操作者权限 (必须是群主或管理员)
        const operatorMembership = await isUserInGroup(operatorId, groupId, ['owner', 'admin']);
        if (!operatorMembership) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to kick members.' } });
        }

        // 2. 验证被踢者是否在群内
        const memberToKick = await GroupMember.findOne({ group: groupId, user: memberToKickId });
        if (!memberToKick) {
            return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member to kick not found in this group.' } });
        }
        
        // 3. 权限等级判断
        if (memberToKick.role === 'owner') {
             return res.status(403).json({ success: false, error: { code: 'CANNOT_KICK_OWNER', message: 'You cannot kick the group owner.' } });
        }
        if (operatorMembership.role === 'admin' && memberToKick.role === 'admin') {
             return res.status(403).json({ success: false, error: { code: 'ADMIN_CANNOT_KICK_ADMIN', message: 'Admins cannot kick other admins.' } });
        }

        // 4. 执行踢人操作 (从 GroupMember 表中删除记录)
        await memberToKick.deleteOne();

        // TODO: 通过Socket.io通知被踢者和群内其他成员
        // const { io } = req.app.get('socketio');
        // io.to(groupId).emit('member_kicked', { groupId, kickedUserId: memberToKickId, operatorId });

        res.status(200).json({ success: true, data: { message: 'Member kicked successfully.' } });
    } catch (error) {
        next(error);
    }
};

// 未来可以添加的其他函数:
// exports.getGroupInfo = async (req, res, next) => { ... };
// exports.joinGroup = async (req, res, next) => { ... };
// exports.leaveGroup = async (req, res, next) => { ... };
// exports.promoteAdmin = async (req, res, next) => { ... };
