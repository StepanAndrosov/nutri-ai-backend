import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFoodItemInputModel {
  @ApiPropertyOptional({
    description: 'Product ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Recipe ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiProperty({
    description: 'Food item name',
    example: 'Овсянка',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Quantity (grams for products, servings for recipes)',
    example: 50,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g',
  })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'Calories',
    example: 172,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  kcal: number;

  @ApiPropertyOptional({
    description: 'Protein in grams',
    example: 6.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional({
    description: 'Fat in grams',
    example: 1.65,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @ApiPropertyOptional({
    description: 'Carbohydrates in grams',
    example: 31.05,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional({
    description: 'Source of the item (product, recipe, ai)',
    example: 'product',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
