import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { FoodItem } from './food-item.subdocument';

/**
 * Meal type enumeration
 */
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  OTHER = 'other',
}

/**
 * Meal source enumeration
 */
export enum MealSource {
  MANUAL = 'manual',
  AI = 'ai',
}

/**
 * Meal entity representing a food intake at a specific time
 */
@Schema({ timestamps: true })
export class Meal {
  @Prop({ type: String, required: true, index: true })
  dayEntryId: string;

  @Prop({ type: String, enum: Object.values(MealType), required: true })
  type: MealType;

  @Prop({ type: String, required: false })
  time?: string;

  @Prop({ type: [Object], default: [] })
  items: FoodItem[];

  @Prop({ type: Number, required: true, min: 0 })
  totalKcal: number;

  @Prop({ type: Number, required: false, min: 0 })
  totalFiber?: number;

  @Prop({ type: String, enum: Object.values(MealSource), required: true })
  source: MealSource;

  @Prop({ type: Number, required: false, min: 0, max: 1 })
  aiConfidence?: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MealSchema = SchemaFactory.createForClass(Meal);

// Create indexes for efficient querying
MealSchema.index({ dayEntryId: 1 });
MealSchema.index({ type: 1 });
MealSchema.index({ createdAt: -1 });

// Load the class to enable instance methods
MealSchema.loadClass(Meal);

export type MealDocument = HydratedDocument<Meal>;
export type MealModelType = Model<MealDocument>;
