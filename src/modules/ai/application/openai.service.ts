import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DomainException, Extension } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { GptMealParseResponse } from '../domain/types/gpt-meal-parse-response.type';
import { GptProductNutrition } from '../domain/types/gpt-product-nutrition.type';

export interface OpenAITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface OpenAIResponse<T> {
  data: T;
  usage: OpenAITokenUsage;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('openai.model') || 'gpt-4o-mini';
    this.maxTokens = this.configService.get<number>('openai.maxTokens') || 1000;
    this.temperature = this.configService.get<number>('openai.temperature') || 0.7;
  }

  /**
   * Parse meal description into structured food items
   * @param mealText - Natural language meal description
   * @returns Parsed meal items with quantities and search terms, plus token usage
   */
  async parseMealDescription(mealText: string): Promise<OpenAIResponse<GptMealParseResponse>> {
    const systemPrompt = `You are a nutrition assistant that parses meal descriptions into structured food items.
You understand input in ANY language (Russian, English, Spanish, etc.) and can process multilingual meal descriptions.

Your task:
1. FIRST, validate that the text contains actual food/beverage products suitable for nutrition tracking
2. REJECT non-food items (construction materials, chemicals, non-edible items, random text)
3. Extract each valid food item with its quantity in grams
4. If quantity is not specified, estimate a reasonable amount
5. For each item, provide search terms in the original language, transliterated form, and English translation

CRITICAL - COOKING METHOD RULES:
- PRESERVE cooking methods in product names (boiled, fried, baked, steamed, grilled, raw, etc.)
- "baked chicken breast" should stay as ONE item, NOT split into just "chicken breast"
- "oatmeal with milk" is DIFFERENT from "oatmeal with water" - these are separate products with different nutrition
- "fried potatoes" should be "Fried potatoes", not just "potatoes"
- DO NOT strip cooking methods - they significantly affect nutrition values

WHEN TO SEPARATE vs KEEP TOGETHER:
- SEPARATE: "oatmeal with banana" → ["Oatmeal", "Banana"] (banana is an addition/topping)
- KEEP TOGETHER: "oatmeal cooked in milk" → ["Oatmeal cooked in milk"] (milk is part of cooking process)
- SEPARATE: "chicken with rice" → ["Chicken", "Rice"] (two distinct foods served together)
- KEEP TOGETHER: "baked chicken breast" → ["Baked chicken breast"] (cooking method is integral)
- KEEP TOGETHER: "scrambled eggs" → ["Scrambled eggs"] (cooking method changes nutrition)

Return JSON in this exact format:
{
  "confidence": 0.85,
  "items": [
    {
      "name": "Baked chicken breast",
      "quantity": 150,
      "searchTerms": ["baked chicken breast", "chicken breast baked", "grilled chicken"]
    }
  ]
}

IMPORTANT Rules:
- ONLY include edible food and beverage items
- SKIP non-food items (concrete, paint, paper, chemicals, etc.)
- If NO valid food items found, return: {"confidence": 0, "items": []}
- Quantities must be in grams
- For liquids: 1 cup = 240ml, 1 glass = 200ml, 1 tablespoon = 15ml
- Confidence should be 0-1 based on clarity of input
- Return product names in the SAME language as the input (preserve user's language)`;

    const userPrompt = `Parse this meal: "${mealText}"`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new DomainException({
          code: DomainExceptionCode.InternalServerError,
          message: 'GPT returned empty response',
        });
      }

      const parsed = JSON.parse(responseText) as GptMealParseResponse;

      // Validate response structure
      if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Could not parse meal description - no items found',
        });
      }

      const usage: OpenAITokenUsage = {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      };

      this.logger.log(
        `Parsed meal: ${mealText} -> ${parsed.items.length} items (${usage.totalTokens} tokens)`,
      );
      return { data: parsed, usage };
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`OpenAI API error: ${errorMessage}`, errorStack);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Failed to parse meal description with AI',
        extensions: [new Extension(errorMessage, 'originalError')],
      });
    }
  }

  /**
   * Generate nutrition data for a product using AI
   * @param productName - Product name
   * @returns Estimated nutrition data, plus token usage
   */
  async generateProductNutrition(
    productName: string,
  ): Promise<OpenAIResponse<GptProductNutrition>> {
    const systemPrompt = `You are a nutrition database that provides accurate nutritional information per 100g.
You understand food names in ANY language and can provide accurate nutrition data regardless of input language.

Your task:
1. Provide nutritional values per 100 grams for the given food
2. Use standard nutrition databases as reference (USDA, international food composition tables)
3. All values should be per 100g of the PREPARED/COOKED form if cooking method is specified
4. Return confidence score based on how common/well-known the food is

CRITICAL - COOKING METHOD AFFECTS NUTRITION:
- If product name includes cooking method, return values for THAT prepared form, NOT raw
- Baked chicken breast (~165 kcal) ≠ Raw chicken breast (~110 kcal)
- Oatmeal cooked in milk (~100 kcal) ≠ Dry oats (~343 kcal)
- Fried potatoes (~190 kcal) ≠ Raw potatoes (~77 kcal)
- Boiled rice (~130 kcal) ≠ Dry rice (~350 kcal)

Cooking method impact on nutrition per 100g:
- Boiled: water absorbed, ~2-3x weight increase, significantly lower kcal per 100g
- Fried: oil absorbed, higher kcal and fat per 100g
- Baked/Roasted: water loss, slightly concentrated nutrients
- Steamed: similar to boiled, minimal fat added
- Grilled: fat rendered out, moderate calorie density
- Cooked in milk: includes milk calories in the final dish

Return JSON in this exact format:
{
  "name": "Baked chicken breast",
  "kcalPer100g": 165,
  "proteinPer100g": 31,
  "fatPer100g": 3.6,
  "carbsPer100g": 0,
  "fiberPer100g": 0,
  "sugarPer100g": 0,
  "category": "Meat",
  "confidence": 0.95
}

Rules:
- All numeric values must be per 100 grams
- Omit fields only if truly unknown (use 0 if zero)
- Confidence 0.9-1.0 for common foods, 0.5-0.8 for less common, below 0.5 for very uncertain
- Return the name and category in the SAME language as the input`;

    const userPrompt = `Provide nutrition data for: "${productName}"`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new DomainException({
          code: DomainExceptionCode.InternalServerError,
          message: 'GPT returned empty response',
        });
      }

      const parsed = JSON.parse(responseText) as GptProductNutrition;

      // Validate essential fields
      if (!parsed.kcalPer100g || parsed.kcalPer100g < 0) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Invalid nutrition data from AI - missing or invalid calories',
        });
      }

      const usage: OpenAITokenUsage = {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      };

      this.logger.log(`Generated nutrition for: ${productName} (${usage.totalTokens} tokens)`);
      return { data: parsed, usage };
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`OpenAI API error: ${errorMessage}`, errorStack);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Failed to generate product nutrition with AI',
        extensions: [new Extension(errorMessage, 'originalError')],
      });
    }
  }
}
