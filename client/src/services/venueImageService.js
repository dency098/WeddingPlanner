import { getVenueUploadSignature } from './uploadService';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 12;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateVenueImages(files) {
  if (files.length > MAX_GALLERY_IMAGES) {
    throw new Error(`Choose no more than ${MAX_GALLERY_IMAGES} gallery images.`);
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Use JPG, PNG, or WebP images only.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Each image must be 8 MB or smaller.');
    }
  }
}

export async function uploadVenueImage(file) {
  const { cloudName, apiKey, timestamp, folder, uploadPreset, signature } = await getVenueUploadSignature();
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('upload_preset', uploadPreset);
  body.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Image upload failed. Please try again.');
  }
  return result.secure_url;
}

export async function uploadVenueImages(files) {
  const uploaded = [];
  for (const file of files) {
    uploaded.push(await uploadVenueImage(file));
  }
  return uploaded;
}
