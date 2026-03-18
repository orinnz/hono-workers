export interface ImageAnalysis {
  id: number
  image_url: string
  original_name: string
  mime_type: string
  ai_response: string
  prompt_used: string | null
  created_at: string
}

export interface CreateImageAnalysisInput {
  imageUrl: string
  originalName: string
  mimeType: string
  aiResponse: string
  promptUsed?: string
}

export interface ImageAnalysisResponse {
  id: number
  imageUrl: string
  originalName: string
  mimeType: string
  aiResponse: string
  promptUsed: string | null
  createdAt: string
}

export interface ListImageAnalysesResult {
  data: ImageAnalysisResponse[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}
