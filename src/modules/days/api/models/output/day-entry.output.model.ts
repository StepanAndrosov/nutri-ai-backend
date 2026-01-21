import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayEntryDocument } from '../../../domain/day-entry.entity';
import { MealOutputModel } from 'src/modules/meals/api/models/output/meal.output.model';

export class DayEntryOutputModel {
  @ApiProperty({
    description: 'Day entry ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-10-20',
  })
  date: string;

  @ApiPropertyOptional({
    description: 'Target calories for the day',
    example: 2000,
  })
  targetKcal?: number;

  @ApiProperty({
    description: 'Total consumed calories',
    example: 1650,
  })
  consumedKcal: number;

  @ApiPropertyOptional({
    description: 'Total consumed fiber in grams',
    example: 25.5,
  })
  consumedFiber?: number;

  @ApiPropertyOptional({
    description: 'Notes for the day',
    example: 'Felt energetic throughout the day',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Meals for this day',
    type: [MealOutputModel],
  })
  meals?: MealOutputModel[];

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

/**
 * Mapper function to convert DayEntry document to output model
 * @param dayEntry - DayEntry document from MongoDB
 * @returns DayEntry output model for API response
 */
export const DayEntryOutputModelMapper = (dayEntry: DayEntryDocument): DayEntryOutputModel => {
  const output = new DayEntryOutputModel();

  output.id = dayEntry.id;
  output.userId = dayEntry.userId;
  output.date = dayEntry.date;
  output.targetKcal = dayEntry.targetKcal;
  output.consumedKcal = dayEntry.consumedKcal;
  output.consumedFiber = dayEntry.consumedFiber;
  output.notes = dayEntry.notes;
  output.createdAt = dayEntry.createdAt;
  output.updatedAt = dayEntry.updatedAt;

  return output;
};
