import { describe, expect, it } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { ImageAnalysisService } from '../../src/services/image-analysis.service'
import { FakeD1Database } from '../helpers/fake-d1'

describe('ImageAnalysisService', () => {
  it('creates and gets an image analysis', async () => {
    const db = new FakeD1Database()
    const service = new ImageAnalysisService(db as unknown as D1Database)

    const created = await service.createImageAnalysis({
      imageUrl: '/uploads/demo.png',
      originalName: 'demo.png',
      mimeType: 'image/png',
      aiResponse: 'A demo image'
    })

    const loaded = await service.getImageAnalysis(created.id)

    expect(loaded?.id).toBe(created.id)
    expect(loaded?.imageUrl).toBe('/uploads/demo.png')
    expect(loaded?.aiResponse).toBe('A demo image')
  })

  it('lists image analyses with pagination', async () => {
    const db = new FakeD1Database()
    const service = new ImageAnalysisService(db as unknown as D1Database)

    await service.createImageAnalysis({
      imageUrl: '/uploads/one.png',
      originalName: 'one.png',
      mimeType: 'image/png',
      aiResponse: 'one'
    })
    await service.createImageAnalysis({
      imageUrl: '/uploads/two.png',
      originalName: 'two.png',
      mimeType: 'image/png',
      aiResponse: 'two'
    })

    const result = await service.getAllImageAnalyses(1, 0)

    expect(result.data).toHaveLength(1)
    expect(result.pagination.limit).toBe(1)
    expect(result.pagination.offset).toBe(0)
    expect(result.pagination.total).toBe(2)
  })
})
