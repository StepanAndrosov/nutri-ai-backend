import { ApiProperty } from '@nestjs/swagger';
import { NutritionGoalsDocument } from '../../../domain/nutrition-goals.entity';

export class NutritionGoalsOutputModel {
  @ApiProperty({
    description: 'Nutrition goals ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Daily calorie goal in kcal',
    example: 2000,
  })
  dailyKcalGoal: number;

  @ApiProperty({
    description: 'Protein percentage of daily calories',
    example: 30,
  })
  proteinPct: number;

  @ApiProperty({
    description: 'Fat percentage of daily calories',
    example: 30,
  })
  fatPct: number;

  @ApiProperty({
    description: 'Carbohydrates percentage of daily calories',
    example: 40,
  })
  carbsPct: number;

  @ApiProperty({
    description: 'Calculated protein goal in grams',
    example: 150,
  })
  proteinGrams: number;

  @ApiProperty({
    description: 'Calculated fat goal in grams',
    example: 67,
  })
  fatGrams: number;

  @ApiProperty({
    description: 'Calculated carbohydrates goal in grams',
    example: 200,
  })
  carbsGrams: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-20T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-20T14:30:00.000Z',
  })
  updatedAt: Date;
}

function calculateGrams(dailyKcalGoal: number, percentage: number, kcalPerGram: number): number {
  return Math.round((dailyKcalGoal * percentage) / 100 / kcalPerGram);
}

export const NutritionGoalsOutputModelMapper = (
  goals: NutritionGoalsDocument,
): NutritionGoalsOutputModel => {
  const output = new NutritionGoalsOutputModel();

  output.id = goals.id;
  output.userId = goals.userId;
  output.dailyKcalGoal = goals.dailyKcalGoal;
  output.proteinPct = goals.proteinPct;
  output.fatPct = goals.fatPct;
  output.carbsPct = goals.carbsPct;

  output.proteinGrams = calculateGrams(goals.dailyKcalGoal, goals.proteinPct, 4);
  output.fatGrams = calculateGrams(goals.dailyKcalGoal, goals.fatPct, 9);
  output.carbsGrams = calculateGrams(goals.dailyKcalGoal, goals.carbsPct, 4);

  output.createdAt = goals.createdAt;
  output.updatedAt = goals.updatedAt;

  return output;
};
