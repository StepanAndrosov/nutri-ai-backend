import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ParseMealInputModel {
  @ApiProperty({
    description: 'Meal description in natural language (Russian or English)',
    example: 'овсянка 50 г с бананом и мёдом, кофе с молоком',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Meal type to create',
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    example: 'breakfast',
  })
  @IsNotEmpty()
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  mealType: string;

  @ApiPropertyOptional({
    description: 'Date for the meal in YYYY-MM-DD format (defaults to today)',
    example: '2025-12-30',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;
}
