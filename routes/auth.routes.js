// routes/auth.routes.js

const express = require('express');
const { register, login, deactivateAccount } = require('../controllers/auth.controller');
const { validateRegistration } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST /api/auth/login
// @desc    用户登录
// @access  Public
router.post('/login', login);

// @route   DELETE /api/auth/deactivate
// @desc    注销当前用户账号 (软删除)
// @access  Private (需要登录)
router.delete('/deactivate', protect, deactivateAccount);

module.exports = router;
