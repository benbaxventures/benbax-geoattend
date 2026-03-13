const QRCode = require('qrcode');

/**
 * Generate a QR code as a data URL for a staff member's ID card.
 */
async function generateQRCode(staffData) {
  const qrData = JSON.stringify({
    staffId: staffData.staff_id,
    institutionId: staffData.institution_id,
    uuid: staffData.id,
    code: staffData.qr_code_data,
  });

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return qrDataUrl;
}

/**
 * Generate a QR code as a buffer (for PDF embedding).
 */
async function generateQRCodeBuffer(staffData) {
  const qrData = JSON.stringify({
    staffId: staffData.staff_id,
    institutionId: staffData.institution_id,
    uuid: staffData.id,
    code: staffData.qr_code_data,
  });

  return QRCode.toBuffer(qrData, {
    width: 300,
    margin: 2,
  });
}

module.exports = { generateQRCode, generateQRCodeBuffer };
