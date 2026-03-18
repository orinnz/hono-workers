import type { DurableObjectNamespace } from '@cloudflare/workers-types'
import { HttpError } from '../../lib/http-error'
import { arrayBufferToBase64 } from './base64'
import type { AIService } from './gemini-ai.service'

type DurableObjectLocationHint =
  | 'wnam'
  | 'enam'
  | 'sam'
  | 'weur'
  | 'eeur'
  | 'apac'
  | 'oc'
  | 'afr'
  | 'me'

interface AnalyzeProxyResponse {
  result?: string
  error?: {
    code?: string
    message?: string
  }
}

export class DurableObjectAIService implements AIService {
  constructor(
    private readonly namespace: DurableObjectNamespace,
    private readonly locationHint: DurableObjectLocationHint = 'oc'
  ) {}

  async analyzeImage(imageBuffer: ArrayBuffer, mimeType: string, prompt?: string): Promise<string> {
    let response: Response

    try {
      const id = this.namespace.idFromName('gemini-proxy')
      const stub = this.namespace.get(id, {
        locationHint: this.locationHint,
        routingMode: 'primary-only'
      })

      response = await stub.fetch('http://gemini-proxy/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: arrayBufferToBase64(imageBuffer),
          mimeType,
          prompt
        })
      })
    } catch (error) {
      console.error('Failed to reach Gemini proxy Durable Object', {
        error,
        locationHint: this.locationHint
      })
      throw new HttpError(500, 'AI_DO_UNREACHABLE', 'AI proxy Durable Object is unreachable')
    }

    const rawBody = await response.text()
    let payload: AnalyzeProxyResponse = {}

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as AnalyzeProxyResponse
      } catch {
        payload = {}
      }
    }

    if (!response.ok) {
      const code = payload.error?.code || 'AI_DO_PROXY_FAILED'
      const message = payload.error?.message || rawBody || 'Durable Object AI proxy failed'

      if (response.status === 503) {
        throw new HttpError(503, code, message)
      }

      throw new HttpError(500, code, message)
    }

    if (!payload.result) {
      throw new HttpError(500, 'AI_DO_INVALID_RESPONSE', 'Durable Object AI proxy returned invalid response')
    }

    return payload.result
  }
}
