import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NutritionInfo } from '../../domain/food.entity';

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  gtinUpc?: string;
  dataType: string;
  foodCategory?: string;
  foodNutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

export interface USDAFoodData {
  externalId: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  nutrition: NutritionInfo;
  servingSize?: string;
  servingSizeGrams?: number;
}

@Injectable()
export class USDAFoodDataService {
  private readonly logger = new Logger(USDAFoodDataService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  // USDA nutrient IDs mapping
  private readonly nutrientIds = {
    ENERGY: 1008, // Energy (kcal)
    PROTEIN: 1003, // Protein
    CARBOHYDRATE: 1005, // Carbohydrate
    FAT: 1004, // Total lipid (fat)
    FIBER: 1079, // Fiber, total dietary
    SUGAR: 2000, // Sugars, total
    SATURATED_FAT: 1258, // Fatty acids, total saturated
    SODIUM: 1093, // Sodium
    CHOLESTEROL: 1253, // Cholesterol
    CALCIUM: 1087, // Calcium
    IRON: 1089, // Iron
    VITAMIN_C: 1162, // Vitamin C
    VITAMIN_A: 1106, // Vitamin A, RAE
    POTASSIUM: 1092, // Potassium
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('foodApi.usda.apiUrl') || 'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = this.configService.get<string>('foodApi.usda.apiKey') || 'DEMO_KEY';
  }

  async searchByQuery(query: string, limit: number = 20): Promise<USDAFoodData[]> {
    try {
      const url = `${this.apiUrl}/foods/search`;
      this.logger.log(`Searching USDA FoodData for: ${query}`);

      const response = await firstValueFrom(
        this.httpService.get<USDASearchResponse>(url, {
          params: {
            api_key: this.apiKey,
            query: query,
            pageSize: limit,
            dataType: 'Survey (FNDDS),Foundation,Branded', // Include multiple data types
          },
        }),
      );

      return response.data.foods
        .filter((food) => this.hasValidNutrition(food))
        .map((food) => this.mapToFood(food));
    } catch (error: any) {
      this.logger.error(`Error searching USDA FoodData: ${error?.message}`);
      return [];
    }
  }

  async getFoodById(fdcId: string): Promise<USDAFoodData | null> {
    try {
      const url = `${this.apiUrl}/food/${fdcId}`;
      this.logger.log(`Fetching USDA food by ID: ${fdcId}`);

      const response = await firstValueFrom(
        this.httpService.get<USDAFood>(url, {
          params: {
            api_key: this.apiKey,
          },
        }),
      );

      if (this.hasValidNutrition(response.data)) {
        return this.mapToFood(response.data);
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Error fetching USDA food by ID: ${error?.message}`);
      return null;
    }
  }

  private hasValidNutrition(food: USDAFood): boolean {
    const nutrients = food.foodNutrients;
    if (!nutrients || nutrients.length === 0) return false;

    const hasEnergy = nutrients.some((n) => n.nutrientId === this.nutrientIds.ENERGY);
    const hasProtein = nutrients.some((n) => n.nutrientId === this.nutrientIds.PROTEIN);
    const hasCarbs = nutrients.some((n) => n.nutrientId === this.nutrientIds.CARBOHYDRATE);
    const hasFat = nutrients.some((n) => n.nutrientId === this.nutrientIds.FAT);

    return hasEnergy && hasProtein && hasCarbs && hasFat;
  }

  private getNutrientValue(nutrients: USDANutrient[], nutrientId: number): number | undefined {
    const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
    return nutrient ? nutrient.value : undefined;
  }

  private mapToFood(food: USDAFood): USDAFoodData {
    const nutrients = food.foodNutrients;

    const servingSize =
      food.servingSize && food.servingSizeUnit
        ? `${food.servingSize} ${food.servingSizeUnit}`
        : undefined;

    const servingSizeGrams =
      food.servingSizeUnit?.toLowerCase() === 'g' ? food.servingSize : undefined;

    return {
      externalId: food.fdcId.toString(),
      name: food.description,
      brand: food.brandOwner,
      barcode: food.gtinUpc,
      category: food.foodCategory,
      nutrition: {
        calories: this.getNutrientValue(nutrients, this.nutrientIds.ENERGY) || 0,
        proteins: this.getNutrientValue(nutrients, this.nutrientIds.PROTEIN) || 0,
        carbohydrates: this.getNutrientValue(nutrients, this.nutrientIds.CARBOHYDRATE) || 0,
        fats: this.getNutrientValue(nutrients, this.nutrientIds.FAT) || 0,
        fiber: this.getNutrientValue(nutrients, this.nutrientIds.FIBER),
        sugar: this.getNutrientValue(nutrients, this.nutrientIds.SUGAR),
        saturatedFats: this.getNutrientValue(nutrients, this.nutrientIds.SATURATED_FAT),
        sodium: this.getNutrientValue(nutrients, this.nutrientIds.SODIUM),
        cholesterol: this.getNutrientValue(nutrients, this.nutrientIds.CHOLESTEROL),
        calcium: this.getNutrientValue(nutrients, this.nutrientIds.CALCIUM),
        iron: this.getNutrientValue(nutrients, this.nutrientIds.IRON),
        vitaminC: this.getNutrientValue(nutrients, this.nutrientIds.VITAMIN_C),
        vitaminA: this.getNutrientValue(nutrients, this.nutrientIds.VITAMIN_A),
        potassium: this.getNutrientValue(nutrients, this.nutrientIds.POTASSIUM),
      },
      servingSize,
      servingSizeGrams,
    };
  }
}
