import { Injectable } from '@nestjs/common';
import { SubscriptionsRepository } from '../infrastructure/subscriptions.repository';
import { SubscriptionsQueryRepository } from '../infrastructure/subscriptions.query-repository';
import { SubscriptionOutputModel } from '../api/models/output/subscription.output.model';
import { SubscriptionStatus } from '../domain/subscription-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly subscriptionsQueryRepository: SubscriptionsQueryRepository,
  ) {}

  async getByUserId(userId: string): Promise<SubscriptionOutputModel | null> {
    return this.subscriptionsQueryRepository.getByUserId(userId);
  }

  async updateSubscription(
    userId: string,
    status: SubscriptionStatus,
    plan?: string,
    expiresAt?: string,
  ): Promise<void> {
    await this.subscriptionsRepository.upsert(userId, {
      status,
      plan,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  }

  async isActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionsQueryRepository.getByUserId(userId);
    return subscription?.status === SubscriptionStatus.ACTIVE;
  }
}
