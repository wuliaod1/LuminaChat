// routes/message.routes.js

const express = require('express');
const { getPrivateMessageHistory } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// 对此路由下的所有请求应用登录保护中间件
router.use(protect);

// GET /api/messages/private/:friendId - 获取私聊历史消息
router.get('/private/:friendId', getPrivateMessageHistory);

module.exports = router;
