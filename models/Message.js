const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User' },
  group: { type: Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, required: true },
  contentType: { type: String, enum: ['text', 'emoji', 'image', 'file'], default: 'text' },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'recalled'],
    default: 'sent'
  },
  sentAt: { type: Date, default: Date.now },
  recalledAt: { type: Date },
  deleteInfo: {
    isDeleted: { type: Boolean, default: false },
    deleteType: { type: String, enum: ['local', 'cloud'] },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date }
  }
}, { timestamps: true });

// 为常用查询字段添加索引
messageSchema.index({ sender: 1, receiver: 1, sentAt: -1 });
messageSchema.index({ group: 1, sentAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
