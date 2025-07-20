const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blacklistSchema = new Schema({
  // 执行拉黑操作的用户
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // 被拉黑的用户
  blockedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { 
  timestamps: true 
});

// 确保同一个拉黑关系是唯一的
blacklistSchema.index({ user: 1, blockedUser: 1 }, { unique: true });

module.exports = mongoose.model('Blacklist', blacklistSchema);
