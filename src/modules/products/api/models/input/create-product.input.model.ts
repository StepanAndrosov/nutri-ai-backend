import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { ProductSource } from '../../../domain/product.entity';

/**
 * Input model for creating a product
 */
export class CreateProductInputModel {
  @ApiProperty({
    description: 'Product name',
    example: 'Овсянка',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Calories per 100g',
    example: 343,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  kcalPer100g: number;

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

  @ApiPropertyOptional({
    description: 'Data source',
    enum: ProductSource,
    default: ProductSource.MANUAL,
  })
  @IsEnum(ProductSource)
  @IsOptional()
  source?: ProductSource;
}
