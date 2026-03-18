export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
] as const

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
export const DEFAULT_IMAGE_PROMPT = [
  'Return ONLY valid JSON with this exact structure: { product_name, brand_name, image_url, category, nutrition }.',
  'nutrition must include: calories_kcal_100g, protein_g_100g, fat_g_100g, carbohydrates_g_100g, sugars_g_100g, fiber_g_100g, sodium_g_100g, salt_g_100g.',
  'Step 1: Identify what food or beverage product appears in the image (label, packaging, logo, visual cues).',
  'Step 2: If identified, infer/fill fields using both visible label data and reliable general nutrition knowledge for that product.',
  'Use null only when the value is truly unknown after identification.',
  'Do not return markdown. Do not include explanation text outside JSON.'
].join(' ')
