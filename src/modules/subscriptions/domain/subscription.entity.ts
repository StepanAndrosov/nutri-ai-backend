import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { SubscriptionStatus } from './subscription-status.enum';

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: String, required: true, unique: true })
  userId: string;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.NONE,
  })
  status: string;

  @Prop({ type: String, required: false })
  plan?: string;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.loadClass(Subscription);

export type SubscriptionDocument = HydratedDocument<Subscription>;
export type SubscriptionModelType = Model<SubscriptionDocument>;
