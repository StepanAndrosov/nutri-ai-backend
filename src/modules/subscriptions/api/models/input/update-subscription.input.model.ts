import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { SubscriptionStatus } from '../../../domain/subscription-status.enum';

export class UpdateSubscriptionInputModel {
  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Subscription plan name',
    example: 'premium',
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Subscription expiration date (ISO 8601)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
