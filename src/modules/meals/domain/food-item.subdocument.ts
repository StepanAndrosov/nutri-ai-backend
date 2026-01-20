import { Prop, Schema } from '@nestjs/mongoose';

/**
 * FoodItem subdocument embedded within a Meal
 * Represents a single food item (product or recipe) in a meal
 */
@Schema({ _id: true })
export class FoodItem {
  @Prop({ type: String, required: false })
  productId?: string;

  @Prop({ type: String, required: false })
  recipeId?: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: Number, required: true, min: 0 })
  kcal: number;

  @Prop({ type: Number, required: false, min: 0 })
  protein?: number;

  @Prop({ type: Number, required: false, min: 0 })
  fat?: number;

  @Prop({ type: Number, required: false, min: 0 })
  carbs?: number;

  @Prop({ type: Number, required: false, min: 0 })
  fiber?: number;

  @Prop({ type: String, required: false })
  source?: string;
}
