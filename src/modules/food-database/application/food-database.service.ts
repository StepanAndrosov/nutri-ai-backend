import { Injectable, Logger } from '@nestjs/common';
import { FoodSource } from '../api/dto/food-search-query.dto';
import { Food } from '../domain/food.entity';
import { OpenFoodFactsService } from '../infrastructure/external-apis/open-food-facts.service';
import { USDAFoodDataService } from '../infrastructure/external-apis/usda-food-data.service';
import { FoodQueryRepository } from '../infrastructure/repositories/food-query.repository';
import { FoodRepository } from '../infrastructure/repositories/food.repository';

@Injectable()
export class FoodDatabaseService {
  private readonly logger = new Logger(FoodDatabaseService.name);

  constructor(
    private readonly openFoodFactsService: OpenFoodFactsService,
    private readonly usdaService: USDAFoodDataService,
    private readonly foodRepository: FoodRepository,
    private readonly foodQueryRepository: FoodQueryRepository,
  ) {}

  async searchByQuery(
    query: string,
    source: FoodSource = FoodSource.ALL,
    limit: number = 20,
  ): Promise<Food[]> {
    this.logger.log(`Searching for food: ${query}, source: ${source}, limit: ${limit}`);

    // First, try to find in cache
    const cachedResults = await this.foodQueryRepository.searchByText(query, limit);
    if (cachedResults.length >= limit) {
      this.logger.log(`Found ${cachedResults.length} results in cache`);
      return cachedResults;
    }

    // If not enough in cache, fetch from external APIs
    const externalResults: Food[] = [];

    if (source === FoodSource.ALL || source === FoodSource.OPENFOODFACTS) {
      const openFoodFactsResults = await this.openFoodFactsService.searchByQuery(query, limit);
      for (const result of openFoodFactsResults) {
        const cached = await this.cacheFood(result, 'openfoodfacts');
        if (cached) externalResults.push(cached);
      }
    }

    if (source === FoodSource.ALL || source === FoodSource.USDA) {
      const usdaResults = await this.usdaService.searchByQuery(query, limit);
      for (const result of usdaResults) {
        const cached = await this.cacheFood(result, 'usda');
        if (cached) externalResults.push(cached);
      }
    }

    // Combine cached and external results, remove duplicates
    const allResults = [...cachedResults, ...externalResults];
    const uniqueResults = this.removeDuplicates(allResults);

    this.logger.log(`Total unique results: ${uniqueResults.length}`);
    return uniqueResults.slice(0, limit);
  }

  async searchByBarcode(barcode: string): Promise<Food | null> {
    this.logger.log(`Searching for food by barcode: ${barcode}`);

    // First, check cache
    const cachedResult = await this.foodQueryRepository.findByBarcode(barcode);
    if (cachedResult) {
      this.logger.log(`Found barcode ${barcode} in cache`);
      return cachedResult;
    }

    // If not in cache, try Open Food Facts (best for barcodes)
    const openFoodFactsResult = await this.openFoodFactsService.searchByBarcode(barcode);
    if (openFoodFactsResult) {
      this.logger.log(`Found barcode ${barcode} in Open Food Facts`);
      return this.cacheFood(openFoodFactsResult, 'openfoodfacts');
    }

    this.logger.log(`Barcode ${barcode} not found`);
    return null;
  }

  async getFoodById(id: string): Promise<Food | null> {
    return this.foodQueryRepository.findById(id);
  }

  private async cacheFood(foodData: any, source: 'usda' | 'openfoodfacts'): Promise<Food | null> {
    try {
      const food: Partial<Food> = {
        externalId: foodData.externalId,
        source,
        name: foodData.name,
        brand: foodData.brand,
        barcode: foodData.barcode,
        description: foodData.description,
        imageUrl: foodData.imageUrl,
        nutrition: foodData.nutrition,
        servingSize: foodData.servingSize,
        servingSizeGrams: foodData.servingSizeGrams,
        category: foodData.category,
        tags: foodData.tags,
        language: foodData.language || 'en',
      };

      return await this.foodRepository.upsert(foodData.externalId, source, food);
    } catch (error: any) {
      this.logger.error(`Error caching food: ${error?.message}`);
      return null;
    }
  }

  private removeDuplicates(foods: Food[]): Food[] {
    const seen = new Set<string>();
    return foods.filter((food) => {
      const key = `${food.source}-${food.externalId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getCacheStats(): Promise<{
    totalCached: number;
    usdaCount: number;
    openFoodFactsCount: number;
  }> {
    const totalCached = await this.foodQueryRepository.count();
    const usdaFoods = await this.foodQueryRepository.findBySource('usda', 1);
    const offFoods = await this.foodQueryRepository.findBySource('openfoodfacts', 1);

    return {
      totalCached,
      usdaCount: usdaFoods.length,
      openFoodFactsCount: offFoods.length,
    };
  }
}
