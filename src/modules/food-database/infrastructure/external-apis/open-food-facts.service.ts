import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NutritionInfo } from '../../domain/food.entity';

interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_url?: string;
  categories?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    'saturated-fat_100g'?: number;
    sodium_100g?: number;
    cholesterol_100g?: number;
    calcium_100g?: number;
    iron_100g?: number;
    'vitamin-c_100g'?: number;
    'vitamin-a_100g'?: number;
    potassium_100g?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
  labels_tags?: string[];
  lang?: string;
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export interface OpenFoodFactsFood {
  externalId: string;
  name: string;
  brand?: string;
  barcode: string;
  imageUrl?: string;
  category?: string;
  nutrition: NutritionInfo;
  servingSize?: string;
  servingSizeGrams?: number;
  tags?: string[];
  language?: string;
}

@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get<string>('foodApi.openFoodFacts.apiUrl') ||
      'https://world.openfoodfacts.org/api/v2';
  }

  async searchByQuery(query: string, limit: number = 20): Promise<OpenFoodFactsFood[]> {
    try {
      const url = `${this.apiUrl}/search`;
      this.logger.log(`Searching OpenFoodFacts for: ${query}`);

      const response = await firstValueFrom(
        this.httpService.get<OpenFoodFactsSearchResponse>(url, {
          params: {
            search_terms: query,
            page_size: limit,
            fields:
              'code,product_name,brands,image_url,categories,nutriments,serving_size,serving_quantity,labels_tags,lang',
          },
          headers: {
            'User-Agent': 'NutriAI - Calorie Counter App - Version 1.0',
          },
        }),
      );

      return response.data.products
        .filter((product) => this.hasValidNutrition(product))
        .map((product) => this.mapToFood(product));
    } catch (error: any) {
      this.logger.error(`Error searching OpenFoodFacts: ${error?.message}`);
      return [];
    }
  }

  async searchByBarcode(barcode: string): Promise<OpenFoodFactsFood | null> {
    try {
      const url = `${this.apiUrl}/product/${barcode}`;
      this.logger.log(`Searching OpenFoodFacts by barcode: ${barcode}`);

      const response = await firstValueFrom(
        this.httpService.get<{ status: number; product?: OpenFoodFactsProduct }>(url, {
          headers: {
            'User-Agent': 'NutriAI - Calorie Counter App - Version 1.0',
          },
        }),
      );

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        if (this.hasValidNutrition(product)) {
          return this.mapToFood(product);
        }
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Error searching OpenFoodFacts by barcode: ${error?.message}`);
      return null;
    }
  }

  private hasValidNutrition(product: OpenFoodFactsProduct): boolean {
    const nutriments = product.nutriments;
    if (!nutriments) return false;

    return (
      nutriments['energy-kcal_100g'] !== undefined &&
      nutriments.proteins_100g !== undefined &&
      nutriments.carbohydrates_100g !== undefined &&
      nutriments.fat_100g !== undefined
    );
  }

  private mapToFood(product: OpenFoodFactsProduct): OpenFoodFactsFood {
    const nutriments = product.nutriments!;

    return {
      externalId: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
      barcode: product.code,
      imageUrl: product.image_url,
      category: product.categories?.split(',')[0]?.trim(),
      nutrition: {
        calories: nutriments['energy-kcal_100g'] || 0,
        proteins: nutriments.proteins_100g || 0,
        carbohydrates: nutriments.carbohydrates_100g || 0,
        fats: nutriments.fat_100g || 0,
        fiber: nutriments.fiber_100g,
        sugar: nutriments.sugars_100g,
        saturatedFats: nutriments['saturated-fat_100g'],
        sodium: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : undefined, // Convert g to mg
        cholesterol: nutriments.cholesterol_100g ? nutriments.cholesterol_100g * 1000 : undefined,
        calcium: nutriments.calcium_100g ? nutriments.calcium_100g * 1000 : undefined,
        iron: nutriments.iron_100g ? nutriments.iron_100g * 1000 : undefined,
        vitaminC: nutriments['vitamin-c_100g'] ? nutriments['vitamin-c_100g'] * 1000 : undefined,
        vitaminA: nutriments['vitamin-a_100g'],
        potassium: nutriments.potassium_100g ? nutriments.potassium_100g * 1000 : undefined,
      },
      servingSize: product.serving_size,
      servingSizeGrams: product.serving_quantity,
      tags: product.labels_tags?.map((tag) => tag.replace('en:', '')),
      language: product.lang,
    };
  }
}
