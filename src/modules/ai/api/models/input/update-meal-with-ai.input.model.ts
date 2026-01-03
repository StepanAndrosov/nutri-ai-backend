import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMealWithAiInputModel {
  @ApiProperty({
    description: 'Meal description in natural language (Russian or English)',
    example: 'рис 100 г, куриная грудка 150 г',
  })
  @IsNotEmpty()
  @IsString()
  text: string;
}
