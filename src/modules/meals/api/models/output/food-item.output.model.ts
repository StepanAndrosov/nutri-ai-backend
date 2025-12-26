import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FoodItemOutputModel {
  @ApiProperty({
    description: 'Food item ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Product ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Recipe ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  recipeId?: string;

  @ApiProperty({
    description: 'Food item name',
    example: 'Овсянка',
  })
  name: string;

  @ApiProperty({
    description: 'Quantity (grams for products, servings for recipes)',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g',
  })
  unit: string;

  @ApiProperty({
    description: 'Calories',
    example: 172,
  })
  kcal: number;

  @ApiPropertyOptional({
    description: 'Protein in grams',
    example: 6.3,
  })
  protein?: number;

  @ApiPropertyOptional({
    description: 'Fat in grams',
    example: 1.65,
  })
  fat?: number;

  @ApiPropertyOptional({
    description: 'Carbohydrates in grams',
    example: 31.05,
  })
  carbs?: number;

  @ApiPropertyOptional({
    description: 'Source of the item (product, recipe, ai)',
    example: 'product',
  })
  source?: string;
}
