import ImageKit from '@imagekit/nodejs'
import dotenv from 'dotenv'

dotenv.config()

const hasKeys = Boolean(
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
)

let imagekitInstance = null

if (hasKeys) {
  try {
    imagekitInstance = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    })
  } catch (err) {
    console.warn('⚠️ Failed to initialize ImageKit with provided keys:', err.message)
  }
}

// Fallback imagekit mock so server doesn't crash on startup and gracefully handles uploads
const imagekit = imagekitInstance || {
  files: {
    upload: async ({ fileName } = {}) => {
      console.warn('⚠️ ImageKit keys not configured. Returning fallback placeholder image.')
      return {
        url: `https://picsum.photos/seed/${encodeURIComponent(fileName || 'report')}/800/600`,
      }
    },
  },
}

export default imagekit

