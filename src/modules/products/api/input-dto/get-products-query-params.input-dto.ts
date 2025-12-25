import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductSource } from '../../domain/product.entity';

/**
 * Query parameters for GET /products endpoint
 */
export class GetProductsQueryParams {
  @ApiPropertyOptional({
    description: 'Search by product name (searches in normalized name)',
    example: 'овся',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Cereals',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by data source',
    enum: ProductSource,
  })
  @IsEnum(ProductSource)
  @IsOptional()
  source?: ProductSource;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    default: 20,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Number of results to skip for pagination',
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset: number = 0;
}
