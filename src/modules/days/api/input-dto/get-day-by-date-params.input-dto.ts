import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

/**
 * Path parameters for GET /day/:date endpoint
 */
export class GetDayByDateParams {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-10-20',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;
}
