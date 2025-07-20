// routes/group.routes.js

const express = require('express');
const { createGroup, kickMember } = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// 对此路由下的所有请求应用登录保护中间件
router.use(protect);

// POST /api/groups - 创建群组
router.post('/', createGroup);

// POST /api/groups/:groupId/kick - 从群组踢人
router.post('/:groupId/kick', kickMember);

module.exports = router;
