import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionDocument } from '../../../domain/subscription.entity';

export class SubscriptionOutputModel {
  @ApiProperty({
    description: 'Subscription unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Subscription status',
    example: 'none',
    enum: ['none', 'active', 'expired'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Subscription plan name',
    example: 'premium',
  })
  plan?: string;

  @ApiPropertyOptional({
    description: 'Subscription expiration date',
    example: '2026-12-31T23:59:59.000Z',
  })
  expiresAt?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-12T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-12-12T10:30:00.000Z',
  })
  updatedAt: string;
}

export const SubscriptionOutputModelMapper = (
  subscription: SubscriptionDocument,
): SubscriptionOutputModel => {
  const outputModel = new SubscriptionOutputModel();

  outputModel.id = subscription.id;
  outputModel.userId = subscription.userId;
  outputModel.status = subscription.status;
  outputModel.plan = subscription.plan;
  outputModel.expiresAt = subscription.expiresAt?.toISOString();
  outputModel.createdAt = subscription.createdAt.toISOString();
  outputModel.updatedAt = subscription.updatedAt.toISOString();

  return outputModel;
};
