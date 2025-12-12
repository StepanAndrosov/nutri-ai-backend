import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDocument } from '../../../domain/user.entity';

export class UserOutputModel {
  @ApiProperty({
    description: 'User unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Hashed password',
    example: '$2b$10$...',
  })
  passwordHash: string;

  @ApiPropertyOptional({
    description: 'Display name for the user',
    example: 'John Doe',
  })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'Europe/Moscow',
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Daily calorie goal in kcal',
    example: 2000,
  })
  dailyKcalGoal?: number;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-12-12T10:30:00.000Z',
  })
  createdAt: string;
}

// MAPPERS

export const UserOutputModelMapper = (user: UserDocument): UserOutputModel => {
  const outputModel = new UserOutputModel();

  outputModel.id = user.id;
  outputModel.email = user.email;
  outputModel.passwordHash = user.passwordHash;
  outputModel.displayName = user.displayName;
  outputModel.timezone = user.timezone;
  outputModel.dailyKcalGoal = user.dailyKcalGoal;
  outputModel.createdAt = user.createdAt.toISOString();

  return outputModel;
};
