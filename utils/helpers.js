const jwt = require('jsonwebtoken');

// 生成JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


// 检查用户是否在群组中，并可选地检查其角色
const isUserInGroup = async (userId, groupId, allowedRoles = null) => {
    const GroupMember = require('../models/GroupMember');
    const membership = await GroupMember.findOne({ user: userId, group: groupId });

    if (!membership) {
        return false;
    }

    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(membership.role)) {
        return false;
    }

    return membership; // 返回成员信息，方便后续使用
};


module.exports = {
  generateToken,
  isUserInGroup
};
