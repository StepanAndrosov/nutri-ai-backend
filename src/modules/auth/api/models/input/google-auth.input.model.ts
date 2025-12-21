import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleAuthInputModel {
  @ApiProperty({
    description: 'Google ID token from Gmail OAuth',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'Europe/Moscow',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
