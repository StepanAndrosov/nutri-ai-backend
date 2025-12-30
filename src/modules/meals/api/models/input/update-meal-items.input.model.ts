import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single meal item for update
 */
export class UpdateMealItemDto {
  @ApiProperty({
    description: 'Product ID',
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

/**
 * Input model for updating meal items array
 */
export class UpdateMealItemsInputModel {
  @ApiProperty({
    description: 'Array of meal items with productId and quantity',
    type: [UpdateMealItemDto],
    example: [
      { productId: '507f1f77bcf86cd799439011', quantity: 150 },
      { productId: '507f1f77bcf86cd799439012', quantity: 200 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMealItemDto)
  items: UpdateMealItemDto[];
}
