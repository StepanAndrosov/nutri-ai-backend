import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../../auth/domain/user-role.enum';

export class UpdateRoleInputModel {
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
