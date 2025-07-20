const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupMemberSchema = new Schema({
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  joinedAt: { type: Date, default: Date.now },
  mutedUntil: { type: Date }, // 禁言截止时间 (null 或 过去的时间 表示正常)
  unreadCount: { type: Number, default: 0 },
  lastReadAt: { type: Date }
}, { 
  timestamps: true 
});

// 确保用户在同一个群组中只有一条记录
groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
