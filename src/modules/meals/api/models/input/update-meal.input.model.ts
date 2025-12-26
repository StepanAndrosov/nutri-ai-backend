import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateFoodItemInputModel } from './create-food-item.input.model';

export class UpdateMealInputModel {
  @ApiPropertyOptional({
    description: 'Meal type',
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    example: 'breakfast',
  })
  @IsOptional()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  type?: string;

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

  @ApiPropertyOptional({
    description: 'Food items in this meal',
    type: [CreateFoodItemInputModel],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodItemInputModel)
  items?: CreateFoodItemInputModel[];

  @ApiPropertyOptional({
    description: 'Total calories',
    example: 450,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalKcal?: number;

  @ApiPropertyOptional({
    description: 'Source of meal data',
    enum: ['manual', 'ai'],
    example: 'manual',
  })
  @IsOptional()
  @IsEnum(['manual', 'ai'])
  source?: string;

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
