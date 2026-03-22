import { BaseEntity, Pagination } from "./index";

export interface ImageAnalysis extends BaseEntity {
  image_url: string
  original_name: string
  mime_type: string
  ai_response: string
}

export interface CreateImageAnalysisInput {
  imageUrl: string
  originalName: string
  mimeType: string
  aiResponse: string
}

export interface ImageAnalysisResponse {
  id: number
  imageUrl: string
  originalName: string
  mimeType: string
  aiResponse: string
  createdAt: string
}

export interface ListImageAnalysesResult {
  data: ImageAnalysisResponse[]
  pagination: Pagination
}
