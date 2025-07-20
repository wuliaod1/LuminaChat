// routes/friend.routes.js

const express = require('express');
const {
  sendFriendRequest,
  handleFriendRequest,
  getFriends
} = require('../controllers/friend.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// 对此路由下的所有请求应用登录保护中间件
router.use(protect);

// GET /api/friends - 获取好友列表
router.get('/', getFriends);

// POST /api/friends/requests/send - 发送好友申请
router.post('/requests/send', sendFriendRequest);

// POST /api/friends/requests/handle - 处理好友申请
router.post('/requests/handle', handleFriendRequest);


module.exports = router;
