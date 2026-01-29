import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionModelType } from '../domain/subscription.entity';
import {
  SubscriptionOutputModel,
  SubscriptionOutputModelMapper,
} from '../api/models/output/subscription.output.model';

@Injectable()
export class SubscriptionsQueryRepository {
  constructor(@InjectModel(Subscription.name) private subscriptionModel: SubscriptionModelType) {}

  async getByUserId(userId: string): Promise<SubscriptionOutputModel | null> {
    const subscription = await this.subscriptionModel.findOne({ userId });

    if (!subscription) {
      return null;
    }

    return SubscriptionOutputModelMapper(subscription);
  }
}
