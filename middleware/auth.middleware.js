const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取 token from header
      token = req.headers.authorization.split(' ')[1];

      // 验证 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 获取用户信息 (不包括密码) 并附加到 req 对象
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || req.user.isDeleted) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or deleted' } });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authorized, token failed' } });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authorized, no token' } });
  }
};

module.exports = { protect };
