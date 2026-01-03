import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ProductsService } from '../../products/application/products.service';
import { ProductsQueryRepository } from '../../products/infrastructure/products.query-repository';
import { ProductsRepository } from '../../products/infrastructure/products.repository';
import { MealsService } from '../../meals/application/meals.service';
import { MealType, MealSource } from '../../meals/domain/meal.entity';
import { ProductSource } from '../../products/domain/product.entity';
import { normalizeProductName } from '../../../common/utils/transliteration.util';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { ParsedMealItem } from '../domain/types/gpt-meal-parse-response.type';

export interface ParsedProductResult {
  productId: string;
  name: string;
  quantity: number;
  wasCreated: boolean;
  source: ProductSource;
}

export interface ParseMealResult {
  mealId: string;
  products: ParsedProductResult[];
  confidence: number;
  productsCreatedCount: number;
  productsFoundCount: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly productsService: ProductsService,
    private readonly productsQueryRepository: ProductsQueryRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly mealsService: MealsService,
  ) {}

  /**
   * Parse meal description and create meal with products
   * @param userId - User ID for meal creation
   * @param text - Natural language meal description
   * @param mealType - Type of meal to create
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   * @returns Created meal with product details
   */
  async parseMealAndCreate(
    userId: string,
    text: string,
    mealType: MealType,
    date?: string,
  ): Promise<ParseMealResult> {
    this.logger.log(`Parsing meal for user ${userId}: "${text}"`);

    // Step 1: Parse meal description with GPT
    const parseResult = await this.openAIService.parseMealDescription(text);

    // Step 2: Process each parsed item - find or create products
    const processedProducts: ParsedProductResult[] = [];
    let productsCreated = 0;
    let productsFound = 0;

    for (const item of parseResult.items) {
      try {
        const result = await this.findOrCreateProduct(item, userId);
        processedProducts.push(result);

        if (result.wasCreated) {
          productsCreated++;
        } else {
          productsFound++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Failed to process item "${item.name}": ${errorMessage}`, errorStack);
        // Continue processing other items even if one fails
      }
    }

    if (processedProducts.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Failed to process any products from meal description',
      });
    }

    // Step 3: Create meal with all products
    const mealDate = date || new Date().toISOString().split('T')[0];

    const createMealData = {
      type: mealType,
      items: processedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
      source: MealSource.AI,
      aiConfidence: parseResult.confidence,
    };

    const createdMeal = await this.mealsService.createMealForDate(userId, mealDate, createMealData);

    // Step 4: Increment usage counts for all products
    await Promise.all(
      processedProducts.map((p) => this.productsRepository.incrementUsageCount(p.productId)),
    );

    this.logger.log(
      `Created meal ${createdMeal.id} with ${processedProducts.length} products (${productsCreated} created, ${productsFound} found)`,
    );

    return {
      mealId: createdMeal.id,
      products: processedProducts,
      confidence: parseResult.confidence,
      productsCreatedCount: productsCreated,
      productsFoundCount: productsFound,
    };
  }

  /**
   * Parse meal description and update existing meal with products
   * Merges new products with existing ones: updates quantities if product exists, adds new if not
   * Existing products not mentioned in the text remain unchanged
   * @param userId - User ID for ownership check
   * @param mealId - Meal ID to update
   * @param text - Natural language meal description
   * @returns Updated meal with product details
   */
  async updateMealWithParsedText(
    userId: string,
    mealId: string,
    text: string,
  ): Promise<ParseMealResult> {
    this.logger.log(`Parsing and updating meal ${mealId} for user ${userId}: "${text}"`);

    // Step 1: Parse meal description with GPT
    const parseResult = await this.openAIService.parseMealDescription(text);

    // Step 2: Process each parsed item - find or create products
    const processedProducts: ParsedProductResult[] = [];
    let productsCreated = 0;
    let productsFound = 0;

    for (const item of parseResult.items) {
      try {
        const result = await this.findOrCreateProduct(item, userId);
        processedProducts.push(result);

        if (result.wasCreated) {
          productsCreated++;
        } else {
          productsFound++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Failed to process item "${item.name}": ${errorMessage}`, errorStack);
        // Continue processing other items even if one fails
      }
    }

    if (processedProducts.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Failed to process any products from meal description',
      });
    }

    // Step 3: Merge/update meal with new products
    const itemsToMerge = processedProducts.map((p) => ({
      productId: p.productId,
      quantity: p.quantity,
    }));

    const updatedMeal = await this.mealsService.mergeOrAddMealItems(mealId, userId, itemsToMerge);

    // Step 4: Increment usage counts for all products
    await Promise.all(
      processedProducts.map((p) => this.productsRepository.incrementUsageCount(p.productId)),
    );

    this.logger.log(
      `Updated meal ${updatedMeal.id} with ${processedProducts.length} products (${productsCreated} created, ${productsFound} found)`,
    );

    return {
      mealId: updatedMeal.id,
      products: processedProducts,
      confidence: parseResult.confidence,
      productsCreatedCount: productsCreated,
      productsFoundCount: productsFound,
    };
  }

  /**
   * Find existing product or create new one with AI-generated nutrition
   * @param item - Parsed meal item from GPT
   * @param userId - User ID for product creation
   * @returns Product result with ID and metadata
   */
  private async findOrCreateProduct(
    item: ParsedMealItem,
    userId: string,
  ): Promise<ParsedProductResult> {
    // Strategy: Try each search term until we find a match
    for (const searchTerm of item.searchTerms) {
      const normalizedTerm = normalizeProductName(searchTerm);

      // Search with limit 5 to get top matches by usageCount
      const foundProducts = await this.productsQueryRepository.search(normalizedTerm, 5);

      if (foundProducts.length > 0) {
        // Use most popular (first result, sorted by usageCount desc)
        const bestMatch = foundProducts[0];

        this.logger.log(
          `Found existing product: "${bestMatch.name}" (${bestMatch.id}) for search term "${searchTerm}"`,
        );

        return {
          productId: bestMatch.id,
          name: bestMatch.name,
          quantity: item.quantity,
          wasCreated: false,
          source: bestMatch.source,
        };
      }
    }

    // No match found - create new product with AI-generated nutrition
    this.logger.log(`No match found for "${item.name}", generating with AI`);

    const nutritionData = await this.openAIService.generateProductNutrition(item.name);

    const productId = await this.productsService.create(
      {
        name: nutritionData.name || item.name,
        kcalPer100g: nutritionData.kcalPer100g,
        proteinPer100g: nutritionData.proteinPer100g,
        fatPer100g: nutritionData.fatPer100g,
        carbsPer100g: nutritionData.carbsPer100g,
        fiberPer100g: nutritionData.fiberPer100g,
        sugarPer100g: nutritionData.sugarPer100g,
        category: nutritionData.category,
        source: ProductSource.AI,
      },
      userId,
    );

    this.logger.log(`Created AI product: "${nutritionData.name}" (${productId})`);

    return {
      productId,
      name: nutritionData.name || item.name,
      quantity: item.quantity,
      wasCreated: true,
      source: ProductSource.AI,
    };
  }
}
