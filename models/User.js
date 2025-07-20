const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastActive: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isDeleted: { type: Boolean, default: false },
  settings: {
    notification: { type: Boolean, default: true },
    sound: { type: Boolean, default: true }
  }
}, { timestamps: true });

// 密码加密中间件
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 实例方法：比较密码
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
