import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateMealItemInputModel } from './create-meal-item.input.model';

export class CreateMealInputModel {
  @ApiProperty({
    description: 'Meal type',
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    example: 'breakfast',
  })
  @IsNotEmpty()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  type: string;

  @ApiPropertyOptional({
    description: 'Time of meal in HH:mm format',
    example: '14:30',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'time must be in HH:mm format',
  })
  time?: string;

  @ApiPropertyOptional({
    description: 'Meal name',
    example: 'Овсянка с бананом',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Meal items (products or recipes with quantities)',
    type: [CreateMealItemInputModel],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemInputModel)
  items: CreateMealItemInputModel[];

  @ApiProperty({
    description: 'Source of meal data',
    enum: ['manual', 'ai'],
    example: 'manual',
  })
  @IsNotEmpty()
  @IsEnum(['manual', 'ai'])
  source: string;

  @ApiPropertyOptional({
    description: 'AI confidence score (0-1)',
    example: 0.95,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidence?: number;
}
