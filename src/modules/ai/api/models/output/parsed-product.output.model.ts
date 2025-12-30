import { ApiProperty } from '@nestjs/swagger';

export class ParsedProductOutputModel {
  @ApiProperty({
    description: 'Product ID (existing or newly created)',
    example: '507f1f77bcf86cd799439011',
  })
  productId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Овсянка',
  })
  name: string;

  @ApiProperty({
    description: 'Quantity in grams',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Whether this product was newly created by AI',
    example: true,
  })
  wasCreated: boolean;

  @ApiProperty({
    description: 'Data source',
    enum: ['manual', 'ai', 'openfoodfacts', 'user'],
    example: 'ai',
  })
  source: string;
}
