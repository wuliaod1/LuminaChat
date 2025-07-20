const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 好友关系模型，双向关系会存储两条记录，例如 A->B 和 B->A
const friendSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  friend: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // 可以添加好友备注等字段
  remark: { type: String, trim: true },
}, { 
  timestamps: true 
});

// 确保每个好友关系是唯一的
friendSchema.index({ user: 1, friend: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
