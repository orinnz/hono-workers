import type { D1Database } from '@cloudflare/workers-types'
import type {
  CreateImageAnalysisInput,
  ImageAnalysis,
  ImageAnalysisResponse,
  ListImageAnalysesResult
} from '../entities/image-analysis'

function toResponse(row: ImageAnalysis): ImageAnalysisResponse {
  return {
    id: row.id,
    imageUrl: row.image_url,
    originalName: row.original_name,
    mimeType: row.mime_type,
    aiResponse: row.ai_response,
    createdAt: row.created_at
  }
}

export class ImageAnalysisService {
  constructor(private readonly db: D1Database) {}

  async createImageAnalysis(input: CreateImageAnalysisInput): Promise<ImageAnalysisResponse> {
    const result = await this.db
      .prepare(
        `INSERT INTO image_analysis (image_url, original_name, mime_type, ai_response)
         VALUES (?, ?, ?, ?)`
      )
      .bind(
        input.imageUrl,
        input.originalName,
        input.mimeType,
        input.aiResponse
      )
      .run()

    const id = Number(result.meta?.last_row_id)
    const row = await this.getImageAnalysis(id)

    if (!row) {
      throw new Error('Failed to load created image analysis record')
    }

    return row
  }

  async getImageAnalysis(id: number): Promise<ImageAnalysisResponse | null> {
    const row = await this.db
      .prepare('SELECT * FROM image_analysis WHERE id = ?')
      .bind(id)
      .first<ImageAnalysis>()

    return row ? toResponse(row) : null
  }

  async getAllImageAnalyses(limit: number, offset: number): Promise<ListImageAnalysesResult> {
    const { results } = await this.db
      .prepare('SELECT * FROM image_analysis ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<ImageAnalysis>()

    const countRow = await this.db
      .prepare('SELECT COUNT(*) as total FROM image_analysis')
      .first<{ total: number }>()

    return {
      data: results.map(toResponse),
      pagination: {
        limit,
        offset,
        total: Number(countRow?.total ?? 0)
      }
    }
  }
}
