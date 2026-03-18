import { DEFAULT_IMAGE_PROMPT } from '../../lib/constants'
import { GoogleGenAI } from '@google/genai'
import { HttpError } from '../../lib/http-error'
import { productAnalysisSchema } from './analysis-schema'
import { arrayBufferToBase64 } from './base64'

export interface AIService {
  analyzeImage(imageBuffer: ArrayBuffer, mimeType: string, prompt?: string): Promise<string>
}

export class GeminiAIService implements AIService {
  private static instance: GeminiAIService | null = null

  static getInstance(apiKey?: string): GeminiAIService {
    if (!GeminiAIService.instance || GeminiAIService.instance.apiKey !== (apiKey ?? '')) {
      GeminiAIService.instance = new GeminiAIService(apiKey ?? '')
    }

    return GeminiAIService.instance
  }

  private readonly ai: GoogleGenAI

  private constructor(private readonly apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey })
  }

  async analyzeImage(imageBuffer: ArrayBuffer, mimeType: string, prompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new HttpError(503, 'DEPENDENCY_NOT_CONFIGURED', 'GEMINI_API_KEY is not configured')
    }

    const promptUsed = prompt?.trim() || DEFAULT_IMAGE_PROMPT

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptUsed },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: arrayBufferToBase64(imageBuffer)
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      })

      const content = response.text?.trim()

      if (!content) {
        throw new HttpError(500, 'AI_EMPTY_RESPONSE', 'AI service returned an empty response')
      }

      const parsed = productAnalysisSchema.parse(JSON.parse(content))

      return JSON.stringify(parsed)
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      const detail = error instanceof Error ? error.message : 'unknown error'
      console.error('Failed to call Gemini API', { error, detail })
      throw new HttpError(500, 'AI_CALL_FAILED', `Failed to analyze image with AI service: ${detail}`)
    }
  }
}
