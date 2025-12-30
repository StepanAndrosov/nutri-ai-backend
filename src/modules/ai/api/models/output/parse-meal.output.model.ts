import { ApiProperty } from '@nestjs/swagger';
import { MealOutputModel } from '../../../../meals/api/models/output/meal.output.model';
import { ParsedProductOutputModel } from './parsed-product.output.model';

export class ParseMealOutputModel {
  @ApiProperty({
    description: 'Created meal data',
    type: MealOutputModel,
  })
  meal: MealOutputModel;

  @ApiProperty({
    description: 'Products that were processed',
    type: [ParsedProductOutputModel],
  })
  products: ParsedProductOutputModel[];

  @ApiProperty({
    description: 'Overall AI confidence score (0-1)',
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'Number of products created by AI',
    example: 2,
  })
  productsCreatedCount: number;

  @ApiProperty({
    description: 'Number of products found in database',
    example: 1,
  })
  productsFoundCount: number;
}
