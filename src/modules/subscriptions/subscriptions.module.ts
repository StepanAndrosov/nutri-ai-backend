import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './domain/subscription.entity';
import { SubscriptionsController } from './api/subscriptions.controller';
import { SubscriptionsService } from './application/subscriptions.service';
import { SubscriptionsRepository } from './infrastructure/subscriptions.repository';
import { SubscriptionsQueryRepository } from './infrastructure/subscriptions.query-repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
    AuthModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository, SubscriptionsQueryRepository],
  exports: [SubscriptionsService, SubscriptionsQueryRepository],
})
export class SubscriptionsModule {}
