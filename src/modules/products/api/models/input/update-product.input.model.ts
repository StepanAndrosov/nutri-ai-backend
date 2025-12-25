import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Input model for updating a product
 * All fields are optional
 */
export class UpdateProductInputModel {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Овсянка',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Calories per 100g',
    example: 343,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  kcalPer100g?: number;

  @ApiPropertyOptional({
    description: 'Protein per 100g',
    example: 12.6,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  proteinPer100g?: number;

  @ApiPropertyOptional({
    description: 'Fat per 100g',
    example: 3.3,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fatPer100g?: number;

  @ApiPropertyOptional({
    description: 'Carbohydrates per 100g',
    example: 62.1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  carbsPer100g?: number;

  @ApiPropertyOptional({
    description: 'Fiber per 100g',
    example: 8.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fiberPer100g?: number;

  @ApiPropertyOptional({
    description: 'Sugar per 100g',
    example: 1.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sugarPer100g?: number;

  @ApiPropertyOptional({
    description: 'Product barcode (EAN/UPC)',
    example: '4607065597009',
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Nordic',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Cereals',
  })
  @IsString()
  @IsOptional()
  category?: string;
}
