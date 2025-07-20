// controllers/message.controller.js

const Message = require('../models/Message');

// @desc    获取一对一聊天历史消息 (支持分页和消息漫游)
// @route   GET /api/messages/private/:friendId
// @access  Private
exports.getPrivateMessageHistory = async (req, res, next) => {
    const currentUserId = req.user._id;
    const friendId = req.params.friendId;
    
    // 从环境变量读取消息漫游天数
    const roamingDays = parseInt(process.env.MESSAGE_ROAMING_DAYS || 7);
    // 从查询参数获取分页信息
    const limit = parseInt(req.query.limit || 50);
    // 'before' 参数用于加载更早的消息，实现下拉加载更多
    const before = req.query.before ? new Date(req.query.before) : new Date();

    try {
        const messages = await Message.find({
            // 条件1: 消息必须是这两个用户之间的
            $or: [
                { sender: currentUserId, receiver: friendId },
                { sender: friendId, receiver: currentUserId }
            ],
            // 条件2: 消息时间必须在漫游期内，且早于'before'时间点
            sentAt: {
                $gte: new Date(Date.now() - roamingDays * 24 * 60 * 60 * 1000),
                $lt: before
            },
            // 条件3: 过滤掉已被当前用户本地删除的消息
            // 注意: 此处简化了逻辑，实际应更复杂，比如区分'local'和'cloud'删除
            'deleteInfo.deletedBy': { $ne: currentUserId } 
        })
        .sort({ sentAt: -1 }) // 按时间倒序查询，效率更高
        .limit(limit)
        .populate('sender', 'nickname avatar'); // 关联查询发送者信息

        // 返回给前端时，反转数组，使其按时间正序排列，方便显示
        res.status(200).json({ success: true, data: messages.reverse() });
    } catch (error) {
        next(error);
    }
};

// 未来可以添加的函数:
// exports.getGroupMessageHistory = async (req, res, next) => { ... };
