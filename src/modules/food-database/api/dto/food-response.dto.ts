import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NutritionInfoDto {
  @ApiProperty({ description: 'Calories in kcal per 100g', example: 52 })
  calories: number;

  @ApiProperty({ description: 'Proteins in grams per 100g', example: 0.3 })
  proteins: number;

  @ApiProperty({ description: 'Carbohydrates in grams per 100g', example: 13.8 })
  carbohydrates: number;

  @ApiProperty({ description: 'Fats in grams per 100g', example: 0.2 })
  fats: number;

  @ApiPropertyOptional({ description: 'Fiber in grams per 100g', example: 2.4 })
  fiber?: number;

  @ApiPropertyOptional({ description: 'Sugar in grams per 100g', example: 10.4 })
  sugar?: number;

  @ApiPropertyOptional({ description: 'Saturated fats in grams per 100g', example: 0.1 })
  saturatedFats?: number;

  @ApiPropertyOptional({ description: 'Sodium in mg per 100g', example: 1 })
  sodium?: number;

  @ApiPropertyOptional({ description: 'Cholesterol in mg per 100g', example: 0 })
  cholesterol?: number;

  @ApiPropertyOptional({ description: 'Calcium in mg per 100g', example: 6 })
  calcium?: number;

  @ApiPropertyOptional({ description: 'Iron in mg per 100g', example: 0.12 })
  iron?: number;

  @ApiPropertyOptional({ description: 'Vitamin C in mg per 100g', example: 4.6 })
  vitaminC?: number;

  @ApiPropertyOptional({ description: 'Vitamin A in µg per 100g', example: 3 })
  vitaminA?: number;

  @ApiPropertyOptional({ description: 'Potassium in mg per 100g', example: 107 })
  potassium?: number;
}

export class FoodResponseDto {
  @ApiProperty({ description: 'Food ID in database', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'External ID from source API', example: '123456' })
  externalId: string;

  @ApiProperty({ description: 'Data source', example: 'usda', enum: ['usda', 'openfoodfacts'] })
  source: string;

  @ApiProperty({ description: 'Food name', example: 'Apple juice, unsweetened' })
  name: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Tropicana' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Product barcode', example: '3017620422003' })
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: '100% pure apple juice',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.jpg',
  })
  imageUrl?: string;

  @ApiProperty({ description: 'Nutrition information per 100g', type: NutritionInfoDto })
  nutrition: NutritionInfoDto;

  @ApiPropertyOptional({ description: 'Serving size', example: '240 ml' })
  servingSize?: string;

  @ApiPropertyOptional({ description: 'Serving size in grams', example: 240 })
  servingSizeGrams?: number;

  @ApiPropertyOptional({ description: 'Food category', example: 'Beverages' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Product tags',
    example: ['vegan', 'gluten-free'],
    type: [String],
  })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Content language', example: 'en' })
  language?: string;
}

export class FoodSearchResponseDto {
  @ApiProperty({ description: 'List of foods', type: [FoodResponseDto] })
  foods: FoodResponseDto[];

  @ApiProperty({ description: 'Total number of results found', example: 150 })
  total: number;

  @ApiProperty({ description: 'Number of results returned', example: 20 })
  count: number;
}
