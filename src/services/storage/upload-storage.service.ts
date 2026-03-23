import type { R2Bucket } from '@cloudflare/workers-types'
import { HttpError } from '../../lib/http-error'
import { S3Client } from '@aws-sdk/client-s3'
import { AppContext } from '../../types'

const mimeTypeToExtension: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif'
}

function getFileExtension(originalName: string, mimeType: string): string {
  const extensionFromName = originalName.includes('.')
    ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
    : ''

  return extensionFromName || mimeTypeToExtension[mimeType] || ''
}

export class UploadStorageService {
  constructor(private readonly bucket: R2Bucket) {}

  async saveImage(file: File): Promise<{ imageUrl: string; filename: string }> {
    const extension = getFileExtension(file.name, file.type)
    const filename = `${crypto.randomUUID()}${extension}`
    const key = `uploads/${filename}`
    const body = await file.arrayBuffer()

    const putResult = await this.bucket.put(key, body, {
      httpMetadata: {
        contentType: file.type
      }
    })

    if (!putResult) {
      throw new HttpError(500, 'FILE_SAVE_FAILED', 'Failed to save uploaded image')
    }

    return {
      filename,
      imageUrl: `/uploads/${filename}`
    }
  }

  async getImage(filename: string) {
    return this.bucket.get(`uploads/${filename}`)
  }

  async getSignedUrl(c: AppContext): Promise<string> {
    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      }
    })
    
}
