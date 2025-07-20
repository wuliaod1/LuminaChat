// controllers/friend.controller.js

const User = require('../models/User');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');
// const Blacklist = require('../models/Blacklist'); // 如果需要实现黑名单功能时取消注释

// @desc    发送好友申请
// @route   POST /api/friends/requests/send
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
  const { toUserId, message } = req.body;
  const fromUserId = req.user._id;

  try {
    // 1. 不能添加自己为好友
    if (fromUserId.equals(toUserId)) {
      return res.status(400).json({ success: false, error: { code: 'SELF_ADD_ERROR', message: "You cannot add yourself as a friend." } });
    }
    
    // 2. 检查对方是否存在
    const toUser = await User.findById(toUserId);
    if (!toUser) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User to add not found.' } });
    }

    // 3. 检查是否已经是好友
    const areFriends = await Friend.findOne({ user: fromUserId, friend: toUserId });
    if (areFriends) {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_FRIENDS', message: 'You are already friends.' } });
    }

    // 4. 检查是否已发送过待处理的申请
    const existingRequest = await FriendRequest.findOne({ from: fromUserId, to: toUserId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ success: false, error: { code: 'REQUEST_ALREADY_SENT', message: 'Friend request already sent and is pending.' } });
    }
    
    // 5. 创建并保存好友申请
    const friendRequest = await FriendRequest.create({
      from: fromUserId,
      to: toUserId,
      message
    });
    
    // TODO: 通过Socket.io实时通知对方有新的好友申请 (需要在socket.io主文件配合)
    // const { io, onlineUsers } = req.app.get('socketio');
    // const receiverSocketId = onlineUsers.get(toUserId.toString());
    // if (receiverSocketId) {
    //   io.to(receiverSocketId).emit('new_friend_request', friendRequest);
    // }

    res.status(201).json({ success: true, data: friendRequest });
  } catch (error) {
    next(error);
  }
};


// @desc    处理好友申请 (同意或拒绝)
// @route   POST /api/friends/requests/handle
// @access  Private
exports.handleFriendRequest = async (req, res, next) => {
  const { requestId, action } = req.body; // action: 'accept' or 'reject'
  const currentUserId = req.user._id;

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: { code: 'REQUEST_NOT_FOUND', message: 'Friend request not found.' } });
    }
    
    // 验证当前用户是否是请求的接收者
    if (!request.to.equals(currentUserId)) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to handle this request.' } });
    }
    
    if (request.status !== 'pending') {
        return res.status(400).json({ success: false, error: { code: 'REQUEST_ALREADY_HANDLED', message: 'This request has already been handled.' } });
    }

    if (action === 'accept') {
      // 1. 更新请求状态为“已接受”
      request.status = 'accepted';
      await request.save();

      // 2. 为双方创建好友关系 (双向)
      await Friend.create([
          { user: request.from, friend: request.to },
          { user: request.to, friend: request.from }
      ]);
      
      // 3. (推荐) 处理完毕后删除申请记录，保持数据库整洁
      await request.deleteOne();

      res.status(200).json({ success: true, data: { message: 'Friend request accepted.' } });

    } else if (action === 'reject') {
      // 1. 更新请求状态为“已拒绝”
      request.status = 'rejected';
      await request.save();
      
      // 2. (推荐) 处理完毕后删除申请记录
      await request.deleteOne();

      res.status(200).json({ success: true, data: { message: 'Friend request rejected.' } });
    } else {
      res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action specified. Must be "accept" or "reject".' } });
    }
  } catch (error) {
    next(error);
  }
};


// @desc    获取当前用户的好友列表
// @route   GET /api/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
  try {
    // 查找当前用户的所有好友关系记录
    const friendships = await Friend.find({ user: req.user._id }).populate({
        path: 'friend', // 关联查询好友的详细信息
        select: 'nickname avatar status lastActive' // 只选择需要的字段
    });

    // 提取好友信息，组成一个纯净的好友数组
    const friends = friendships.map(f => f.friend);

    res.status(200).json({ success: true, data: friends });
  } catch (error) {
    next(error);
  }
};

// 未来可以添加的其他函数:
// exports.deleteFriend = async (req, res, next) => { ... };
// exports.blockUser = async (req, res, next) => { ... };
// exports.getFriendRequests = async (req, res, next) => { ... };
