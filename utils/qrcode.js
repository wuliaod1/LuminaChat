const QRCode = require('qrcode');

// 生成二维码并返回 Data URL
const generateQRCodeDataURL = async (data) => {
  try {
    const url = await QRCode.toDataURL(JSON.stringify(data));
    return url;
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return null;
  }
};

module.exports = { generateQRCodeDataURL };
