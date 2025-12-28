import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

/**
 * Input model for adding or updating a product in a meal
 */
export class AddProductToMealInputModel {
  @ApiProperty({
    description: 'Product ID to add or update',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity in grams',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}
