import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class NutritionGoals {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: Number, required: true, min: 1000, max: 10000 })
  dailyKcalGoal: number;

  @Prop({ type: Number, required: true, min: 5, max: 80 })
  proteinPct: number;

  @Prop({ type: Number, required: true, min: 5, max: 80 })
  fatPct: number;

  @Prop({ type: Number, required: true, min: 5, max: 80 })
  carbsPct: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const NutritionGoalsSchema = SchemaFactory.createForClass(NutritionGoals);

NutritionGoalsSchema.index({ userId: 1 }, { unique: true });

NutritionGoalsSchema.loadClass(NutritionGoals);

export type NutritionGoalsDocument = HydratedDocument<NutritionGoals>;
export type NutritionGoalsModelType = Model<NutritionGoalsDocument>;
