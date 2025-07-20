// routes/user.routes.js

const express = require('express');
const {
    getMe,
    updateMyProfile,
    getUserById,
    getMyQRCode
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// 对此路由下的所有请求应用登录保护中间件
router.use(protect);

// @route   GET /api/users/me
// @desc    获取当前登录用户的信息
router.get('/me', getMe);

// @route   PUT /api/users/me
// @desc    更新当前登录用户的信息
router.put('/me', updateMyProfile);

// @route   GET /api/users/qrcode
// @desc    获取个人二维码
router.get('/qrcode', getMyQRCode);

// @route   GET /api/users/:id
// @desc    根据ID查找特定用户的信息 (用于查看好友资料等)
router.get('/:id', getUserById);

module.exports = router;
