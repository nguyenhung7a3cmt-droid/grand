import fs from 'fs';
import path from 'path';

const PROOFS_DIR = path.resolve(process.cwd(), 'public/proofs');
if (!fs.existsSync(PROOFS_DIR)) {
  fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

/**
 * Downloads an image from a URL and saves it permanently to disk.
 * If IMGBB_API_KEY or IMGUR_CLIENT_ID is provided, it also uploads to ImgBB/Imgur
 * for an external permanent link, while keeping the local copy as resilient fallback.
 * 
 * @param {string} imageUrl - The temporary image URL (e.g. from Discord)
 * @param {string} identifier - A safe unique identifier (e.g. order number 'GS-DISC-211333')
 * @returns {Promise<string|null>} - Permanent URL or null if download failed
 */
export async function makeImagePermanent(imageUrl, identifier = 'proof') {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  // If already permanent (data uri or local public link or imgbb/imgur)
  if (
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('/proofs/') ||
    imageUrl.includes('i.ibb.co') ||
    imageUrl.includes('i.imgur.com')
  ) {
    return imageUrl;
  }

  const cleanId = String(identifier).replace(/[^a-zA-Z0-9-_]/g, '_');
  const localFileName = `${cleanId}.png`;
  const localFilePath = path.join(PROOFS_DIR, localFileName);
  const localRelativeUrl = `/proofs/${localFileName}`;

  try {
    // 1. Fetch image binary from source
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrandStock/2.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.warn(`[ImageUploader] Failed to fetch source image: ${imageUrl} (Status: ${res.status})`);
      // If local cache already exists, use it
      if (fs.existsSync(localFilePath)) return localRelativeUrl;
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save local copy permanently on server
    fs.writeFileSync(localFilePath, buffer);
    console.log(`[ImageUploader] Successfully saved local permanent proof: ${localRelativeUrl} (${buffer.length} bytes)`);

    // 2. Upload to ImgBB if API key exists
    const imgbbKey = process.env.IMGBB_API_KEY;
    if (imgbbKey) {
      try {
        const formData = new FormData();
        formData.append('key', imgbbKey);
        formData.append('image', buffer.toString('base64'));
        formData.append('name', cleanId);

        const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(15000)
        });

        if (imgbbRes.ok) {
          const imgbbData = await imgbbRes.json();
          if (imgbbData?.data?.url) {
            console.log(`[ImageUploader] Successfully uploaded to ImgBB: ${imgbbData.data.url}`);
            return imgbbData.data.url;
          }
        }
      } catch (err) {
        console.warn(`[ImageUploader] ImgBB upload error:`, err.message);
      }
    }

    // 3. Upload to Imgur if Client ID exists
    const imgurClientId = process.env.IMGUR_CLIENT_ID;
    if (imgurClientId) {
      try {
        const formData = new FormData();
        formData.append('image', buffer.toString('base64'));
        formData.append('type', 'base64');
        formData.append('title', `GrandStock Proof ${cleanId}`);

        const imgurRes = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': `Client-ID ${imgurClientId}`
          },
          body: formData,
          signal: AbortSignal.timeout(15000)
        });

        if (imgurRes.ok) {
          const imgurData = await imgurRes.json();
          if (imgurData?.data?.link) {
            console.log(`[ImageUploader] Successfully uploaded to Imgur: ${imgurData.data.link}`);
            return imgurData.data.link;
          }
        }
      } catch (err) {
        console.warn(`[ImageUploader] Imgur upload error:`, err.message);
      }
    }

    // Return the guaranteed local permanent URL
    return localRelativeUrl;
  } catch (err) {
    console.warn(`[ImageUploader] Error processing image ${imageUrl}:`, err.message);
    if (fs.existsSync(localFilePath)) return localRelativeUrl;
    return null;
  }
}
