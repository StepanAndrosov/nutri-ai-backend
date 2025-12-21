import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthInputModel {
  @ApiProperty({
    description: 'Google ID token from Gmail OAuth',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
