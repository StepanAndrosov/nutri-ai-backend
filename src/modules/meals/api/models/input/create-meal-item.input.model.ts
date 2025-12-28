import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Input model for creating a meal item from productId or recipeId
 */
export class CreateMealItemInputModel {
  @ApiPropertyOptional({
    description: 'Product ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Recipe ID reference (not implemented yet)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiProperty({
    description: 'Quantity in grams for products, servings for recipes',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;
}
