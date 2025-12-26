import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

/**
 * DayEntry entity representing a single day's food tracking
 * Groups all meals for a specific date
 */
@Schema({ timestamps: true })
export class DayEntry {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  date: string; // Format: YYYY-MM-DD

  @Prop({ type: Number, required: false, min: 0 })
  targetKcal?: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  consumedKcal: number;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const DayEntrySchema = SchemaFactory.createForClass(DayEntry);

// Create compound index for unique user-date combination
DayEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
DayEntrySchema.index({ date: 1 });
DayEntrySchema.index({ createdAt: -1 });

// Load the class to enable instance methods
DayEntrySchema.loadClass(DayEntry);

export type DayEntryDocument = HydratedDocument<DayEntry>;
export type DayEntryModelType = Model<DayEntryDocument>;
