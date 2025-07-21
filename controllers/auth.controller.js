// controllers/auth.controller.js (这是正确的、纯粹的JavaScript代码)

const User = require('../models/User');
const { generateToken } = require('../utils/helpers');

// @desc    注册新用户
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { email, password, nickname } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } });
    }

    const user = await User.create({ email, password, nickname });

    res.status(201).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: { 
            id: user._id, 
            email: user.email, 
            nickname: user.nickname, 
            avatar: user.avatar, 
            settings: user.settings 
        }
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
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    
    if (user.isDeleted) {
         return res.status(401).json({ success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account has been deactivated' } });
    }
    
    res.status(200).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: { 
            id: user._id, 
            email: user.email, 
            nickname: user.nickname, 
            avatar: user.avatar, 
            settings: user.settings 
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    注销账号 (软删除)
// @route   DELETE /api/auth/deactivate
// @access  Private
exports.deactivateAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' }});
        }
        user.isDeleted = true;
        await user.save();
        res.status(200).json({ success: true, data: { message: "Account deactivated successfully." }});
    } catch (error) {
        next(error);
    }
};
