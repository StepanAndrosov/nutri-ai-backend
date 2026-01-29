import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionModelType } from '../domain/subscription.entity';

@Injectable()
export class SubscriptionsRepository {
  constructor(@InjectModel(Subscription.name) private subscriptionModel: SubscriptionModelType) {}

  async upsert(
    userId: string,
    data: Partial<Pick<Subscription, 'status' | 'plan' | 'expiresAt'>>,
  ): Promise<string> {
    const result = await this.subscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...data,
          userId,
        },
      },
      { upsert: true, new: true },
    );

    return result.id as string;
  }
}
