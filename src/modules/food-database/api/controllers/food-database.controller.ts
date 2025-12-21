import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FoodDatabaseService } from '../../application/food-database.service';
import { BarcodeSearchQueryDto } from '../dto/barcode-search-query.dto';
import { FoodSearchQueryDto } from '../dto/food-search-query.dto';
import { FoodResponseDto, FoodSearchResponseDto } from '../dto/food-response.dto';
import { Food } from '../../domain/food.entity';

@ApiTags('Food Database')
@Controller('food-database')
export class FoodDatabaseController {
  constructor(private readonly foodDatabaseService: FoodDatabaseService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for foods by name or description',
    description:
      'Search across USDA FoodData Central and Open Food Facts databases. Results are cached for faster subsequent searches.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of foods matching the search query',
    type: FoodSearchResponseDto,
  })
  async searchFoods(@Query() query: FoodSearchQueryDto): Promise<FoodSearchResponseDto> {
    const foods = await this.foodDatabaseService.searchByQuery(
      query.query,
      query.source,
      query.limit,
    );

    return {
      foods: foods.map((food) => this.mapToResponseDto(food)),
      total: foods.length,
      count: foods.length,
    };
  }

  @Get('barcode/:barcode')
  @ApiOperation({
    summary: 'Search for food by barcode',
    description:
      'Search for a product by its barcode (EAN-13, UPC-A, etc.). Primarily uses Open Food Facts database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Food found by barcode',
    type: FoodResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Food not found',
  })
  async searchByBarcode(@Param() params: BarcodeSearchQueryDto): Promise<FoodResponseDto | null> {
    const food = await this.foodDatabaseService.searchByBarcode(params.barcode);

    if (!food) {
      return null;
    }

    return this.mapToResponseDto(food);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get food by ID',
    description: 'Retrieve detailed information about a specific food item by its database ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Food details',
    type: FoodResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Food not found',
  })
  async getFoodById(@Param('id') id: string): Promise<FoodResponseDto | null> {
    const food = await this.foodDatabaseService.getFoodById(id);

    if (!food) {
      return null;
    }

    return this.mapToResponseDto(food);
  }

  @Get('stats/cache')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Retrieve statistics about cached food data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
  })
  async getCacheStats() {
    return this.foodDatabaseService.getCacheStats();
  }

  private mapToResponseDto(food: Food): FoodResponseDto {
    return {
      id: (food as any)._id?.toString() || '',
      externalId: food.externalId,
      source: food.source,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      description: food.description,
      imageUrl: food.imageUrl,
      nutrition: {
        calories: food.nutrition.calories,
        proteins: food.nutrition.proteins,
        carbohydrates: food.nutrition.carbohydrates,
        fats: food.nutrition.fats,
        fiber: food.nutrition.fiber,
        sugar: food.nutrition.sugar,
        saturatedFats: food.nutrition.saturatedFats,
        sodium: food.nutrition.sodium,
        cholesterol: food.nutrition.cholesterol,
        calcium: food.nutrition.calcium,
        iron: food.nutrition.iron,
        vitaminC: food.nutrition.vitaminC,
        vitaminA: food.nutrition.vitaminA,
        potassium: food.nutrition.potassium,
      },
      servingSize: food.servingSize,
      servingSizeGrams: food.servingSizeGrams,
      category: food.category,
      tags: food.tags,
      language: food.language,
    };
  }
}
