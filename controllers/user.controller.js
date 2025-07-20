// controllers/user.controller.js

const User = require('../models/User');
const { generateQRCodeDataURL } = require('../utils/qrcode');

// @desc    获取当前登录用户的信息
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    // req.user 是在 protect 中间件中设置的
    // 我们只需要返回它即可
    const user = await User.findById(req.user.id);
    if (!user) {
         return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' }});
    }
    res.status(200).json({ success: true, data: user });
};

// @desc    根据ID获取任何用户的信息
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // 不返回密码
        if (!user || user.isDeleted) {
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' }});
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};


// @desc    更新当前登录用户的信息 (例如昵称、头像)
// @route   PUT /api/users/me
// @access  Private
exports.updateMyProfile = async (req, res, next) => {
    // 只允许更新部分字段
    const { nickname, avatar, settings } = req.body;
    const fieldsToUpdate = {};
    if (nickname) fieldsToUpdate.nickname = nickname;
    if (avatar) fieldsToUpdate.avatar = avatar;
    if (settings) fieldsToUpdate.settings = settings;

    try {
        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true, // 返回更新后的文档
            runValidators: true // 运行模型定义的验证器
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    生成并获取个人二维码
// @route   GET /api/users/qrcode
// @access  Private
exports.getMyQRCode = async (req, res, next) => {
    try {
        const qrCodeData = {
            type: 'user',
            userId: req.user.id,
        };
        const qrCodeDataURL = await generateQRCodeDataURL(qrCodeData);

        if (!qrCodeDataURL) {
            return res.status(500).json({ success: false, error: { code: 'QRCODE_GENERATION_FAILED', message: 'Failed to generate QR code.' } });
        }
        
        res.status(200).json({ success: true, data: { qrCode: qrCodeDataURL } });
    } catch (error) {
        next(error);
    }
};
