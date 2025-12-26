import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * Path parameters for GET /meals/:id endpoint
 */
export class GetMealByIdParams {
  @ApiProperty({
    description: 'Meal ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}
