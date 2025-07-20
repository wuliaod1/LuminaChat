const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
// const sendEmail = require('../utils/email'); // 如果需要邮件验证

// @desc    注册新用户
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { email, password, nickname } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } });
    }

    const user = await User.create({ email, password, nickname });

    // // (可选) 发送验证码或欢迎邮件
    // await sendEmail({ email: user.email, subject: 'Welcome!', message: 'Welcome to our chat app!' });

    res.status(201).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: { id: user._id, email: user.email, nickname: user.nickname }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_CREDENTIALS', message: 'Please provide email and password' } });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)) || user.isDeleted) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }
    res.status(200).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: { id: user._id, email: user.email, nickname: user.nickname }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    注销账号
// @route   DELETE /api/auth/deactivate
// @access  Private
exports.deactivateAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' }});
        }

        user.isDeleted = true;
        // 可选：添加其他清理逻辑，如从好友列表中移除等
        await user.save();
        
        res.status(200).json({ success: true, data: { message: "Account deactivated successfully." }});
    } catch (error) {
        next(error);
    }
};
