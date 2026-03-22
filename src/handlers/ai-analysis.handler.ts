import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HttpError, isHttpError } from '../lib/http-error'
import { parseAndValidateAnalyzeMultipart } from '../middleware/upload-image'
import { GeminiAIService, type AIService } from '../services/ai/gemini-ai.service'
import { DurableObjectAIService } from '../services/ai/durable-object-ai.service'
import { ImageAnalysisService } from '../services/image-analysis.service'
import { UploadStorageService } from '../services/storage/upload-storage.service'
import type { Bindings, AppContext } from '../types'

function parseAIResponse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'INVALID_INPUT', 'id must be a positive integer')
  }

  return id
}

function parsePagination(rawLimit: string | undefined, rawOffset: string | undefined): { limit: number; offset: number } {
  const limit = rawLimit ? Number(rawLimit) : 20
  const offset = rawOffset ? Number(rawOffset) : 0

  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new HttpError(400, 'INVALID_INPUT', 'limit must be an integer between 1 and 100')
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new HttpError(400, 'INVALID_INPUT', 'offset must be a non-negative integer')
  }

  return { limit, offset }
}

function errorJson(c: AppContext, error: unknown) {
  if (isHttpError(error)) {
    return c.json({
      error: {
        code: error.code,
        message: error.message
      }
    }, error.status as ContentfulStatusCode)
  }

  console.error('Unexpected internal error', { error })
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected internal error'
    }
  }, 500)
}

export interface AIHandlerDependencies {
  getAIService?: (env: Bindings) => AIService | undefined
}

export class AIAnalysisHandler {
  constructor(private readonly dependencies: AIHandlerDependencies = {}) {}

  private getAIService(env: Bindings) {
    const injected = this.dependencies.getAIService?.(env)

    if (injected) {
      return injected
    }

    if (env.GEMINI_PROXY) {
      return new DurableObjectAIService(
        env.GEMINI_PROXY,
        env.GEMINI_DO_LOCATION_HINT ?? 'oc'
      )
    }

    return GeminiAIService.getInstance(env.GEMINI_API_KEY)
  }

  async analyze(c: AppContext) {
    try {
      console.info('Starting image analysis request')
      const { image } = await parseAndValidateAnalyzeMultipart(c.req.raw)

      const storageService = new UploadStorageService(c.env.BUCKET)
      const dbService = new ImageAnalysisService(c.env.DB)
      const aiService = this.getAIService(c.env)

      const { imageUrl } = await storageService.saveImage(image)
      const imageBuffer = await image.arrayBuffer()

      console.info('Calling AI service for image analysis')
      const aiResponse = await aiService.analyzeImage(imageBuffer, image.type)
      console.info('AI service call succeeded')

      console.info('Saving image analysis record to database')
      const record = await dbService.createImageAnalysis({
        imageUrl,
        originalName: image.name,
        mimeType: image.type,
        aiResponse
      })
      console.info('Saved image analysis record to database', { id: record.id })

      return c.json({
        id: record.id,
        imageUrl: record.imageUrl,
        originalName: record.originalName,
        mimeType: record.mimeType,
        aiResponse: parseAIResponse(record.aiResponse)
      }, 201)
    } catch (error) {
      console.error('Image analysis request failed', { error })
      return errorJson(c, error)
    }
  }

  async getList(c: AppContext) {
    try {
      const { limit, offset } = parsePagination(c.req.query('limit'), c.req.query('offset'))
      const dbService = new ImageAnalysisService(c.env.DB)
      const result = await dbService.getAllImageAnalyses(limit, offset)

      return c.json(result)
    } catch (error) {
      return errorJson(c, error)
    }
  }

  async getDetail(c: AppContext) {
    try {
      const rawId = c.req.param('id')
      const id = parseId(rawId ?? '')
      const dbService = new ImageAnalysisService(c.env.DB)
      const record = await dbService.getImageAnalysis(id)

      if (!record) {
        throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Image analysis not found')
      }

      return c.json(record)
    } catch (error) {
      return errorJson(c, error)
    }
  }

  async getUploadedFile(c: AppContext) {
    try {
      const filename = c.req.param('filename')

      if (!filename || filename.includes('..') || filename.includes('/')) {
        throw new HttpError(400, 'INVALID_INPUT', 'Invalid filename')
      }

      const storageService = new UploadStorageService(c.env.BUCKET)
      const object = await storageService.getImage(filename)

      if (!object || !object.body) {
        throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Image file not found')
      }

      const headers = new Headers()
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      return new Response(object.body, { headers })
    } catch (error) {
      return errorJson(c, error)
    }
  }
}
