import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum FoodSource {
  ALL = 'all',
  USDA = 'usda',
  OPENFOODFACTS = 'openfoodfacts',
}

export class FoodSearchQueryDto {
  @ApiProperty({
    description: 'Search query for food name or brand',
    example: 'apple juice',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query: string;

  @ApiPropertyOptional({
    description: 'Data source to search in',
    enum: FoodSource,
    default: FoodSource.ALL,
    example: FoodSource.ALL,
  })
  @IsOptional()
  @IsEnum(FoodSource)
  source?: FoodSource = FoodSource.ALL;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 20,
    default: 20,
  })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Language preference (ISO 639-1 code)',
    example: 'ru',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string = 'en';
}
