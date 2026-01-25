import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

/**
 * TokenUsage entity for tracking daily OpenAI token consumption per user
 */
@Schema({ timestamps: true })
export class TokenUsage {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  date: string; // Format: YYYY-MM-DD

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  totalTokens: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  promptTokens: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  completionTokens: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  requestCount: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TokenUsageSchema = SchemaFactory.createForClass(TokenUsage);

// Create compound unique index for user-date combination
TokenUsageSchema.index({ userId: 1, date: 1 }, { unique: true });
TokenUsageSchema.index({ date: 1 });

// Load the class to enable instance methods
TokenUsageSchema.loadClass(TokenUsage);

export type TokenUsageDocument = HydratedDocument<TokenUsage>;
export type TokenUsageModelType = Model<TokenUsageDocument>;
