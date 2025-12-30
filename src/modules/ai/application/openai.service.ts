import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DomainException, Extension } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { GptMealParseResponse } from '../domain/types/gpt-meal-parse-response.type';
import { GptProductNutrition } from '../domain/types/gpt-product-nutrition.type';

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
   * @returns Parsed meal items with quantities and search terms
   */
  async parseMealDescription(mealText: string): Promise<GptMealParseResponse> {
    const systemPrompt = `You are a nutrition assistant that parses meal descriptions into structured food items.

Your task:
1. Extract each food item with its quantity in grams
2. If quantity is not specified, estimate a reasonable amount
3. For compound items (like "oatmeal with banana"), separate into individual products
4. For each item, provide search terms in Russian, transliterated Russian, and English

Return JSON in this exact format:
{
  "confidence": 0.85,
  "items": [
    {
      "name": "Овсянка",
      "quantity": 50,
      "searchTerms": ["овсянка", "ovsyanka", "oatmeal", "овсяные хлопья"]
    }
  ]
}

Rules:
- Quantities must be in grams
- For liquids: 1 cup = 240ml, 1 glass = 200ml, 1 tablespoon = 15ml
- Confidence should be 0-1 based on clarity of input
- Separate composite foods into individual ingredients`;

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

      this.logger.log(`Parsed meal: ${mealText} -> ${parsed.items.length} items`);
      return parsed;
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
   * @returns Estimated nutrition data
   */
  async generateProductNutrition(productName: string): Promise<GptProductNutrition> {
    const systemPrompt = `You are a nutrition database that provides accurate nutritional information per 100g.

Your task:
1. Provide nutritional values per 100 grams for the given food
2. Use standard nutrition databases as reference (USDA, Russian food composition tables)
3. All values should be per 100g
4. Return confidence score based on how common/well-known the food is

Return JSON in this exact format:
{
  "name": "Овсянка",
  "kcalPer100g": 343,
  "proteinPer100g": 12.6,
  "fatPer100g": 6.9,
  "carbsPer100g": 59.5,
  "fiberPer100g": 10.1,
  "sugarPer100g": 1.0,
  "category": "Зерновые",
  "confidence": 0.95
}

Rules:
- All numeric values must be per 100 grams
- Omit fields only if truly unknown (use 0 if zero)
- Confidence 0.9-1.0 for common foods, 0.5-0.8 for less common, below 0.5 for very uncertain
- Category should be in Russian if product name is Russian, English otherwise`;

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

      this.logger.log(`Generated nutrition for: ${productName}`);
      return parsed;
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
