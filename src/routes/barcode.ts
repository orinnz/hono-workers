import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Bindings } from '../types'

type AppContext = Context<{ Bindings: Bindings }>

interface OpenFoodFactsProduct {
  product_name?: string
  product_name_en?: string
  brands?: string
  image_url?: string
  image_front_url?: string
  categories?: string
  categories_en?: string
  categories_tags?: string[]
  nutriments?: {
    'energy-kcal_100g'?: number | string
    energy_kcal_100g?: number | string
    proteins_100g?: number | string
    fat_100g?: number | string
    carbohydrates_100g?: number | string
    sugars_100g?: number | string
    fiber_100g?: number | string
    sodium_100g?: number | string
    salt_100g?: number | string
  }
}

interface OpenFoodFactsResponse {
  status?: number
  product?: OpenFoodFactsProduct
}

const BARCODE_REGEX = /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/

export const barcodeRoutes = new Hono<{ Bindings: Bindings }>()

barcodeRoutes.get('/', async (c) => {
  const barcode = c.req.query('barcode')?.trim() ?? ''
  return lookupBarcode(c, barcode)
})

barcodeRoutes.get('/:barcode', async (c) => {
  const barcode = c.req.param('barcode')?.trim() ?? ''
  return lookupBarcode(c, barcode)
})

barcodeRoutes.post('/', async (c) => {
  let barcode = ''

  try {
    const body = await c.req.json<{ barcode?: string }>()
    barcode = body.barcode?.trim() ?? ''
  } catch {
    return c.json({ error: 'Invalid barcode format' }, 400)
  }

  return lookupBarcode(c, barcode)
})

async function lookupBarcode(c: AppContext, barcode: string) {
  if (!isValidBarcode(barcode)) {
    return c.json({ error: 'Invalid barcode format' }, 400)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await (async () => {
      try {
        return await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: {
              Accept: 'application/json'
            }
          }
        )
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    if (!response.ok) {
      if (response.status >= 500) {
        return c.json({ error: 'API timeout/service unavailable' }, 503)
      }
      return c.json({ error: 'Product not found in global database' }, 404)
    }

    const data = (await response.json()) as OpenFoodFactsResponse

    if (data.status !== 1 || !data.product) {
      return c.json({ error: 'Product not found in global database' }, 404)
    }

    const product = data.product

    return c.json(
      {
        product_name: product.product_name_en || product.product_name || null,
        brand_name: product.brands?.split(',')[0]?.trim() || null,
        image_url: product.image_url || product.image_front_url || null,
        category: getEnglishCategory(product),
        nutrition: {
          calories_kcal_100g: toNumber(
            product.nutriments?.['energy-kcal_100g'] ?? product.nutriments?.energy_kcal_100g
          ),
          protein_g_100g: toNumber(product.nutriments?.proteins_100g),
          fat_g_100g: toNumber(product.nutriments?.fat_100g),
          carbohydrates_g_100g: toNumber(product.nutriments?.carbohydrates_100g),
          sugars_g_100g: toNumber(product.nutriments?.sugars_100g),
          fiber_g_100g: toNumber(product.nutriments?.fiber_100g),
          sodium_g_100g: toNumber(product.nutriments?.sodium_100g),
          salt_g_100g: toNumber(product.nutriments?.salt_100g)
        }
      },
      200
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return c.json({ error: 'API timeout/service unavailable' }, 504)
    }

    return c.json({ error: 'API timeout/service unavailable' }, 503)
  }
}

function toNumber(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isValidBarcode(barcode: string): boolean {
  if (!BARCODE_REGEX.test(barcode)) {
    return false
  }

  const digits = barcode.split('').map(Number)
  const checkDigit = digits[digits.length - 1]
  const payload = digits.slice(0, -1)

  let sum = 0

  for (let index = payload.length - 1; index >= 0; index--) {
    const fromRight = payload.length - index
    const multiplier = fromRight % 2 === 1 ? 3 : 1
    sum += payload[index] * multiplier
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  return calculatedCheckDigit === checkDigit
}

function getEnglishCategory(product: OpenFoodFactsProduct): string | null {
  if (product.categories_en) {
    return product.categories_en.split(',')[0]?.trim() || null
  }

  if (product.categories_tags?.length) {
    const englishTag = product.categories_tags.find((tag) => tag.startsWith('en:'))
    if (englishTag) {
      return englishTag
        .replace('en:', '')
        .replace(/-/g, ' ')
        .trim() || null
    }
  }

  if (product.categories) {
    return product.categories.split(',')[0]?.trim() || null
  }

  return null
}