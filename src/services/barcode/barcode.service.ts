import { HttpError } from '../../lib/http-error'

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

export interface BarcodeProduct {
  product_name: string | null
  brand_name: string | null
  image_url: string | null
  category: string | null
  nutrition: {
    calories_kcal_100g: number | null
    protein_g_100g: number | null
    fat_g_100g: number | null
    carbohydrates_g_100g: number | null
    sugars_g_100g: number | null
    fiber_g_100g: number | null
    sodium_g_100g: number | null
    salt_g_100g: number | null
  }
}

export class BarcodeService {
  private readonly baseUrl = 'https://world.openfoodfacts.org/api/v0/product'
  private readonly timeout = 8000

  async lookupByBarcode(barcode: string): Promise<BarcodeProduct> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}/${barcode}.json`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status >= 500) {
          throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'API timeout/service unavailable')
        }
        throw new HttpError(404, 'NOT_FOUND', 'Product not found in global database')
      }

      const data = (await response.json()) as OpenFoodFactsResponse

      if (data.status !== 1 || !data.product) {
        throw new HttpError(404, 'NOT_FOUND', 'Product not found in global database')
      }

      return this.mapProduct(data.product)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(504, 'GATEWAY_TIMEOUT', 'API timeout/service unavailable')
      }

      if (error instanceof HttpError) {
        throw error
      }

      throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'API timeout/service unavailable')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private mapProduct(product: OpenFoodFactsProduct): BarcodeProduct {
    return {
      product_name: product.product_name_en || product.product_name || null,
      brand_name: product.brands?.split(',')[0]?.trim() || null,
      image_url: product.image_url || product.image_front_url || null,
      category: this.getEnglishCategory(product),
      nutrition: {
        calories_kcal_100g: this.toNumber(
          product.nutriments?.['energy-kcal_100g'] ?? product.nutriments?.energy_kcal_100g
        ),
        protein_g_100g: this.toNumber(product.nutriments?.proteins_100g),
        fat_g_100g: this.toNumber(product.nutriments?.fat_100g),
        carbohydrates_g_100g: this.toNumber(product.nutriments?.carbohydrates_100g),
        sugars_g_100g: this.toNumber(product.nutriments?.sugars_100g),
        fiber_g_100g: this.toNumber(product.nutriments?.fiber_100g),
        sodium_g_100g: this.toNumber(product.nutriments?.sodium_100g),
        salt_g_100g: this.toNumber(product.nutriments?.salt_100g)
      }
    }
  }

  private toNumber(value: number | string | undefined | null): number | null {
    if (value === undefined || value === null || value === '') {
      return null
    }

    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  private getEnglishCategory(product: OpenFoodFactsProduct): string | null {
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
}
