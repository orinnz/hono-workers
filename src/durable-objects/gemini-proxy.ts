import type { DurableObjectState } from '@cloudflare/workers-types'
import { GeminiAIService } from '../services/ai/gemini-ai.service'
import { HttpError } from '../lib/http-error'
import type { Bindings } from '../types'

interface AnalyzeProxyRequest {
  imageBase64?: string
  mimeType?: string
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer
}

export class GeminiProxyDO {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Bindings
  ) {
    void this.state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== 'POST' || url.pathname !== '/analyze') {
      return Response.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Not found'
          }
        },
        { status: 404 }
      )
    }

    try {
      if (!this.env.GEMINI_API_KEY) {
        throw new HttpError(503, 'DEPENDENCY_NOT_CONFIGURED', 'GEMINI_API_KEY is not configured')
      }

      const body = (await request.json()) as AnalyzeProxyRequest

      if (!body.imageBase64 || !body.mimeType) {
        throw new HttpError(400, 'INVALID_INPUT', 'imageBase64 and mimeType are required')
      }

      const imageBuffer = base64ToArrayBuffer(body.imageBase64)
      const aiService = GeminiAIService.getInstance(this.env.GEMINI_API_KEY)
      const result = await aiService.analyzeImage(imageBuffer, body.mimeType)

      return Response.json({ result })
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json(
          {
            error: {
              code: error.code,
              message: error.message
            }
          },
          { status: error.status }
        )
      }

      console.error('GeminiProxyDO unexpected error', { error })
      return Response.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Unexpected internal error'
          }
        },
        { status: 500 }
      )
    }
  }
}
