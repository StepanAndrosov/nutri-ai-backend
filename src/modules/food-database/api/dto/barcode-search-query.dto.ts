import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class BarcodeSearchQueryDto {
  @ApiProperty({
    description: 'Product barcode (EAN-13, UPC-A, etc.)',
    example: '3017620422003',
    pattern: '^[0-9]{8,13}$',
  })
  @IsString()
  @Matches(/^[0-9]{8,13}$/, {
    message: 'Barcode must be 8-13 digits',
  })
  barcode: string;
}
