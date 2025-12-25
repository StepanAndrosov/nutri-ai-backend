import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductDocument, ProductSource } from '../../../domain/product.entity';

/**
 * Product output model for API responses
 */
export class ProductOutputModel {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Овсянка',
  })
  name: string;

  @ApiProperty({
    description: 'Normalized name for search',
    example: 'ovsyanka',
  })
  normalizedName: string;

  @ApiProperty({
    description: 'Calories per 100g',
    example: 343,
  })
  kcalPer100g: number;

  @ApiPropertyOptional({
    description: 'Protein per 100g',
    example: 12.6,
  })
  proteinPer100g?: number;

  @ApiPropertyOptional({
    description: 'Fat per 100g',
    example: 3.3,
  })
  fatPer100g?: number;

  @ApiPropertyOptional({
    description: 'Carbohydrates per 100g',
    example: 62.1,
  })
  carbsPer100g?: number;

  @ApiPropertyOptional({
    description: 'Fiber per 100g',
    example: 8.0,
  })
  fiberPer100g?: number;

  @ApiPropertyOptional({
    description: 'Sugar per 100g',
    example: 1.0,
  })
  sugarPer100g?: number;

  @ApiProperty({
    description: 'Data source',
    enum: ProductSource,
    example: ProductSource.USER,
  })
  source: ProductSource;

  @ApiProperty({
    description: 'Whether the product is verified',
    example: false,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Number of times this product has been used',
    example: 0,
  })
  usageCount: number;

  @ApiPropertyOptional({
    description: 'ID of the user who created this product',
    example: '507f1f77bcf86cd799439011',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Product barcode (EAN/UPC)',
    example: '4607065597009',
  })
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Nordic',
  })
  brand?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Cereals',
  })
  category?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-25T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-12-25T10:30:00.000Z',
  })
  updatedAt: string;
}

/**
 * Mapper function to convert Product document to output model
 * @param product - Product document from MongoDB
 * @returns Product output model for API response
 */
export const ProductOutputModelMapper = (product: ProductDocument): ProductOutputModel => {
  const output = new ProductOutputModel();

  output.id = product.id;
  output.name = product.name;
  output.normalizedName = product.normalizedName;
  output.kcalPer100g = product.kcalPer100g;
  output.proteinPer100g = product.proteinPer100g;
  output.fatPer100g = product.fatPer100g;
  output.carbsPer100g = product.carbsPer100g;
  output.fiberPer100g = product.fiberPer100g;
  output.sugarPer100g = product.sugarPer100g;
  output.source = product.source;
  output.isVerified = product.isVerified;
  output.usageCount = product.usageCount;
  output.createdBy = product.createdBy;
  output.barcode = product.barcode;
  output.brand = product.brand;
  output.category = product.category;
  output.createdAt = product.createdAt.toISOString();
  output.updatedAt = product.updatedAt.toISOString();

  return output;
};
