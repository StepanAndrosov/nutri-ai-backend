import { ApiProperty } from '@nestjs/swagger';
import { UserOutputModel } from '../../../../user-accounts/api/models/output/user.output.model';

export class AuthOutputModel {
  @ApiProperty({
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'User information',
    type: UserOutputModel,
  })
  user: UserOutputModel;
}
