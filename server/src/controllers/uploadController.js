const crypto = require('node:crypto');

const createVenueUploadSignature = (req, res) => {
  const {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
    CLOUDINARY_UPLOAD_PRESET: uploadPreset,
  } = process.env;
  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return res.status(503).json({ success: false, message: 'Venue image uploads are not configured. Set all four Cloudinary environment variables.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `wedding-planner/venues/${req.user.id}`;
  const signatureBase = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');
  return res.json({ success: true, data: { cloudName, apiKey, timestamp, folder, uploadPreset, signature } });
};

module.exports = { createVenueUploadSignature };
