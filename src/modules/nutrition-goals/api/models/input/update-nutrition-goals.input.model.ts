import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MacrosSumValidator', async: false })
export class MacrosSumValidator implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as UpdateNutritionGoalsInputModel;
    const sum = (object.proteinPct || 0) + (object.fatPct || 0) + (object.carbsPct || 0);
    return sum === 100;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as UpdateNutritionGoalsInputModel;
    const sum = (object.proteinPct || 0) + (object.fatPct || 0) + (object.carbsPct || 0);
    return `Macronutrient percentages (proteinPct + fatPct + carbsPct) must sum to 100, got ${sum}`;
  }
}

export class UpdateNutritionGoalsInputModel {
  @ApiProperty({
    description: 'Daily calorie goal in kcal',
    example: 2000,
    minimum: 1000,
    maximum: 10000,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1000, { message: 'dailyKcalGoal must be at least 1000' })
  @Max(10000, { message: 'dailyKcalGoal must not exceed 10000' })
  dailyKcalGoal: number;

  @ApiProperty({
    description: 'Protein percentage of daily calories',
    example: 30,
    minimum: 5,
    maximum: 80,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: 'proteinPct must be at least 5' })
  @Max(80, { message: 'proteinPct must not exceed 80' })
  @Validate(MacrosSumValidator)
  proteinPct: number;

  @ApiProperty({
    description: 'Fat percentage of daily calories',
    example: 30,
    minimum: 5,
    maximum: 80,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: 'fatPct must be at least 5' })
  @Max(80, { message: 'fatPct must not exceed 80' })
  fatPct: number;

  @ApiProperty({
    description: 'Carbohydrates percentage of daily calories',
    example: 40,
    minimum: 5,
    maximum: 80,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: 'carbsPct must be at least 5' })
  @Max(80, { message: 'carbsPct must not exceed 80' })
  carbsPct: number;
}
