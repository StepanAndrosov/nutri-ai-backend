import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Input model for removing a product from a meal
 */
export class RemoveProductFromMealInputModel {
  @ApiProperty({
    description: 'Product ID to remove',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;
}
