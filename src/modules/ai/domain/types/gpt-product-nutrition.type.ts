/**
 * Expected response structure from GPT when generating product nutrition data
 */
export interface GptProductNutrition {
  name: string;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  category?: string;
  confidence: number; // 0-1, confidence in the nutrition data
}
