import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const nullableNumber = z.number().nullable()
const nullableString = z.string().nullable()

export const nutritionSchema = z.object({
  calories_kcal_100g: nullableNumber,
  protein_g_100g: nullableNumber,
  fat_g_100g: nullableNumber,
  carbohydrates_g_100g: nullableNumber,
  sugars_g_100g: nullableNumber,
  fiber_g_100g: nullableNumber,
  sodium_g_100g: nullableNumber,
  salt_g_100g: nullableNumber
})

export const productAnalysisSchema = z.object({
  product_name: nullableString,
  brand_name: nullableString,
  image_url: nullableString,
  category: nullableString,
  nutrition: nutritionSchema
})

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>

export const productAnalysisJsonSchema = zodToJsonSchema(productAnalysisSchema, {
  name: 'ProductAnalysis'
})
