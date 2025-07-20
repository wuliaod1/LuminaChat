const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  announcement: { type: String, default: '群主很懒，什么都没有留下~' },
  announcementUpdatedAt: { type: Date },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false }, // true: 需要验证才能加入
  maxMembers: { type: Number, default: 200 },
  qrCode: { type: String }, // 群二维码URL
  isDeleted: { type: Boolean, default: false }, // 群是否已解散
}, { 
  timestamps: true 
});

groupSchema.index({ owner: 1 });

module.exports = mongoose.model('Group', groupSchema);
