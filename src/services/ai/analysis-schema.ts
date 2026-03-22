import { Type, type Schema } from '@google/genai'

export enum FoodCategory {
  noodleSoup = 'noodleSoup',
  soup = 'soup',
  riceDish = 'riceDish',
  porridge = 'porridge',
  meatPiece = 'meatPiece',
  fishPiece = 'fishPiece',
  egg = 'egg',
  bread = 'bread',
  pastry = 'pastry',
  salad = 'salad',
  vegetableDish = 'vegetableDish',
  fruitWhole = 'fruitWhole',
  fruitCut = 'fruitCut',
  snackBag = 'snackBag',
  snackPiece = 'snackPiece',
  hotDrink = 'hotDrink',
  coldDrink = 'coldDrink',
  milk = 'milk',
  alcoholicDrink = 'alcoholicDrink',
  boxedMeal = 'boxedMeal',
  sandwich = 'sandwich',
  wrap = 'wrap',
  dessert = 'dessert',
  yogurt = 'yogurt',
  sauce = 'sauce',
  other = 'other'
}

export enum ContainerType {
  bowl = 'bowl',
  plate = 'plate',
  cup = 'cup',
  glass = 'glass',
  can = 'can',
  bottle = 'bottle',
  box = 'box',
  bag = 'bag',
  piece = 'piece',
  wrap = 'wrap',
  spoon = 'spoon',
  handful = 'handful',
  other = 'other'
}

export interface AIScanResponse {
  foodName: string;
  category: FoodCategory;
  containerType: ContainerType;
  estimatedGrams: number;
  pieceCount: number | null;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  sugarPer100: number;
  sodiumPer100: number;
  isLiquid: boolean;
  densityGPerMl: number | null;
  confidence: number;
}

// Strict schema for Google Gen AI Structured Outputs
export const geminiProductAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING },
    category: { type: Type.STRING, enum: Object.values(FoodCategory) },
    containerType: { type: Type.STRING, enum: Object.values(ContainerType) },
    estimatedGrams: { type: Type.NUMBER },
    pieceCount: { type: Type.INTEGER, nullable: true },
    caloriesPer100: { type: Type.NUMBER },
    proteinPer100: { type: Type.NUMBER },
    carbsPer100: { type: Type.NUMBER },
    fatPer100: { type: Type.NUMBER },
    fiberPer100: { type: Type.NUMBER },
    sugarPer100: { type: Type.NUMBER },
    sodiumPer100: { type: Type.NUMBER },
    isLiquid: { type: Type.BOOLEAN },
    densityGPerMl: { type: Type.NUMBER, nullable: true },
    confidence: { type: Type.NUMBER }
  },
  required: [
    "foodName", "category", "containerType", "estimatedGrams",
    "caloriesPer100", "proteinPer100", "carbsPer100", "fatPer100",
    "fiberPer100", "sugarPer100", "sodiumPer100", "isLiquid", "confidence"
  ]
}
