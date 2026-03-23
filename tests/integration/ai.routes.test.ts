import { describe, expect, it } from 'vitest'
import type {
  D1Database,
  KVNamespace,
  Queue,
  R2Bucket
} from '@cloudflare/workers-types'
import { createApp } from '../../src/index'
import type { AIService } from '../../src/services/ai/gemini-ai.service'
import { FakeD1Database } from '../helpers/fake-d1'
import { FakeR2Bucket } from '../helpers/fake-r2'
import type { Bindings } from '../../src/types'

function createTestEnv(): Bindings {
  return {
    API_KEY: 'test-api-key',
    APP_NAME: 'test-app',
    GEMINI_API_KEY: 'test-gemini-key',
    CACHE: {
      get: async () => null
    } as unknown as KVNamespace,
    DB: new FakeD1Database() as unknown as D1Database,
    BUCKET: new FakeR2Bucket() as unknown as R2Bucket,
    MY_QUEUE: {
      send: async () => undefined,
      sendBatch: async () => undefined
    } as unknown as Queue
  }
}

describe('AI routes integration', () => {
  const mockedAIService: AIService = {
    analyzeImage: async () => JSON.stringify({
      product_name: 'Coca-Cola Original Taste',
      brand_name: 'Coca-Cola',
      image_url: null,
      category: 'beverages and beverages preparations',
      nutrition: {
        calories_kcal_100g: 42,
        protein_g_100g: 0,
        fat_g_100g: 0,
        carbohydrates_g_100g: 10.6,
        sugars_g_100g: 10.6,
        fiber_g_100g: null,
        sodium_g_100g: 0,
        salt_g_100g: 0
      }
    })
  }

  it('POST /api/ai/analyze works with valid file', async () => {
    const app = createApp({ aiService: mockedAIService })
    const env = createTestEnv()

    const form = new FormData()
    form.append('image', new Blob(['image-bytes'], { type: 'image/png' }), 'demo.png')

    const response = await app.request('/api/ai/scan', {
      method: 'POST',
      body: form
    }, env)

    expect(response.status).toBe(201)
    const payload = (await response.json()) as {
      id: number
      imageUrl: string
      originalName: string
      mimeType: string
      aiResponse: {
        product_name: string | null
        brand_name: string | null
      }
      promptUsed: string
    }

    expect(payload.id).toBeGreaterThan(0)
    expect(payload.imageUrl.startsWith('/uploads/')).toBe(true)
    expect(payload.originalName).toBe('demo.png')
    expect(payload.mimeType).toBe('image/png')
    expect(payload.aiResponse.product_name).toBe('Coca-Cola Original Taste')
    expect(payload.aiResponse.brand_name).toBe('Coca-Cola')
  })

  it('POST /api/ai/analyze returns 400 when file is missing', async () => {
    const app = createApp({ aiService: mockedAIService })
    const env = createTestEnv()

    const form = new FormData()
    form.append('prompt', 'describe image')

    const response = await app.request('/api/ai/scan', {
      method: 'POST',
      body: form
    }, env)

    expect(response.status).toBe(400)
  })

  it('GET /api/ai/analyses returns list and pagination', async () => {
    const app = createApp({ aiService: mockedAIService })
    const env = createTestEnv()

    const form = new FormData()
    form.append('image', new Blob(['image-bytes'], { type: 'image/png' }), 'demo.png')

    await app.request('/api/ai/scan', {
      method: 'POST',
      body: form
    }, env)

    const response = await app.request('/api/ai/scan?limit=20&offset=0', {
      method: 'GET'
    }, env)

    expect(response.status).toBe(200)

    const payload = (await response.json()) as {
      data: unknown[]
      pagination: { limit: number; offset: number; total: number }
    }

    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.pagination.total).toBe(1)
  })

  it('GET /api/ai/analyses/:id returns 404 when record does not exist', async () => {
    const app = createApp({ aiService: mockedAIService })
    const env = createTestEnv()

    const response = await app.request('/api/ai/scan/9999', {
      method: 'GET'
    }, env)

    expect(response.status).toBe(404)
  })
})
