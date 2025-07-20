// 这是一个可选的、简化的验证中间件示例
// 在大型项目中，推荐使用 Joi 或 express-validator 等库

const validateRegistration = (req, res, next) => {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email, password, and nickname are required.' } });
  }
  
  // 简单的邮箱格式验证
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' } });
  }

  // 密码长度验证
  if (password.length < 6) {
     return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' } });
  }

  next();
};

module.exports = { validateRegistration };
