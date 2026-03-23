import { describe, expect, it, vi } from 'vitest'
import { GeminiAIService } from '../../src/services/ai/gemini-ai.service'

const generateContentMock = vi.fn()

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>()
  return {
    ...actual,
    GoogleGenAI: class {
      models = {
        generateContent: generateContentMock
      }
    }
  }
})

describe('GeminiAIService', () => {
  it('throws 503 when API key is missing', async () => {
    const service = GeminiAIService.getInstance('')

    await expect(service.analyzeImage(new ArrayBuffer(0), 'image/png')).rejects.toMatchObject({
      status: 503,
      code: 'DEPENDENCY_NOT_CONFIGURED'
    })
  })

  it('uses default prompt when prompt is empty', async () => {
    const service = GeminiAIService.getInstance('test-key')
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
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
    })

    const output = await service.analyzeImage(new TextEncoder().encode('abc').buffer, 'image/png')

    expect(JSON.parse(output)).toMatchObject({
      product_name: 'Coca-Cola Original Taste',
      brand_name: 'Coca-Cola'
    })

    const callArg = generateContentMock.mock.calls[0]?.[0] as {
      contents: Array<{ parts: Array<{ text?: string }> }>
      config: { responseMimeType: string }
    }

    expect(callArg.contents[0].parts[0].text).toBe('Analyze this food image.')
    expect(callArg.config.responseMimeType).toBe('application/json')
  })
})
