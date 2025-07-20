const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true }, // 申请时附带的消息
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { 
  timestamps: true 
});

// 为常用查询字段添加索引
friendRequestSchema.index({ to: 1, status: 1 });
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true, partialFilterExpression: { status: 'pending' }}); // 防止重复发送待处理的申请

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
