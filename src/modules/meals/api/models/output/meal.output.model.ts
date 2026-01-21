import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FoodItemOutputModel } from './food-item.output.model';
import { MealDocument } from '../../../domain/meal.entity';

export class MealOutputModel {
  @ApiProperty({
    description: 'Meal ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Day entry ID',
    example: '507f1f77bcf86cd799439011',
  })
  dayEntryId: string;

  @ApiProperty({
    description: 'Meal type',
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    example: 'breakfast',
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Time of meal in HH:mm format',
    example: '14:30',
  })
  time?: string;

  @ApiProperty({
    description: 'Food items in this meal',
    type: [FoodItemOutputModel],
  })
  items: FoodItemOutputModel[];

  @ApiProperty({
    description: 'Total calories',
    example: 450,
  })
  totalKcal: number;

  @ApiPropertyOptional({
    description: 'Total fiber in grams',
    example: 8.5,
  })
  totalFiber?: number;

  @ApiProperty({
    description: 'Source of meal data',
    enum: ['manual', 'ai'],
    example: 'manual',
  })
  source: string;

  @ApiPropertyOptional({
    description: 'AI confidence score (0-1)',
    example: 0.95,
  })
  aiConfidence?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-20T14:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-20T14:30:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Mapper function to convert Meal document to output model
 * @param meal - Meal document from MongoDB
 * @returns Meal output model for API response
 */
export const MealOutputModelMapper = (meal: MealDocument): MealOutputModel => {
  const output = new MealOutputModel();

  output.id = meal.id;
  output.dayEntryId = meal.dayEntryId;
  output.type = meal.type;
  output.time = meal.time;
  output.items = meal.items.map((item) => {
    const foodItemOutput = new FoodItemOutputModel();
    foodItemOutput.id = (item as any)._id?.toString();
    foodItemOutput.productId = item.productId;
    foodItemOutput.recipeId = item.recipeId;
    foodItemOutput.name = item.name;
    foodItemOutput.quantity = item.quantity;
    foodItemOutput.unit = item.unit;
    foodItemOutput.kcal = item.kcal;
    foodItemOutput.protein = item.protein;
    foodItemOutput.fat = item.fat;
    foodItemOutput.carbs = item.carbs;
    foodItemOutput.fiber = item.fiber;
    foodItemOutput.source = item.source;
    return foodItemOutput;
  });
  output.totalKcal = meal.totalKcal;
  output.totalFiber = meal.totalFiber;
  output.source = meal.source;
  output.aiConfidence = meal.aiConfidence;
  output.createdAt = meal.createdAt;
  output.updatedAt = meal.updatedAt;

  return output;
};
