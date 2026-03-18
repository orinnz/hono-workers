import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '../lib/constants'
import { HttpError } from '../lib/http-error'

export interface ParsedAnalyzeRequest {
  image: File
  prompt?: string
}

function normalizeFileFromField(value: string | File | (string | File)[] | undefined): File | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    if (value.length !== 1 || !(value[0] instanceof File)) {
      throw new HttpError(400, 'INVALID_INPUT', 'image must contain exactly one file')
    }

    return value[0]
  }

  return value instanceof File ? value : null
}

export async function parseAndValidateAnalyzeMultipart(request: Request): Promise<ParsedAnalyzeRequest> {
  const contentType = request.headers.get('content-type') || ''

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    throw new HttpError(400, 'INVALID_INPUT', 'Content-Type must be multipart/form-data')
  }

  const formData = await request.formData()
  const image = normalizeFileFromField(formData.getAll('image') as unknown as (string | File)[])

  if (!image) {
    throw new HttpError(400, 'INVALID_INPUT', 'image file is required')
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new HttpError(400, 'INVALID_INPUT', 'Unsupported image mime type')
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    throw new HttpError(400, 'INVALID_INPUT', 'Image size exceeds 10MB limit')
  }

  const promptRaw = formData.get('prompt')
  const prompt = typeof promptRaw === 'string' && promptRaw.trim() ? promptRaw.trim() : undefined

  return {
    image,
    prompt
  }
}
