import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export class NutritionInfo {
  @Prop({ required: true })
  calories: number; // kcal per 100g

  @Prop({ required: true })
  proteins: number; // g per 100g

  @Prop({ required: true })
  carbohydrates: number; // g per 100g

  @Prop({ required: true })
  fats: number; // g per 100g

  @Prop()
  fiber?: number; // g per 100g

  @Prop()
  sugar?: number; // g per 100g

  @Prop()
  saturatedFats?: number; // g per 100g

  @Prop()
  sodium?: number; // mg per 100g

  @Prop()
  cholesterol?: number; // mg per 100g

  @Prop()
  calcium?: number; // mg per 100g

  @Prop()
  iron?: number; // mg per 100g

  @Prop()
  vitaminC?: number; // mg per 100g

  @Prop()
  vitaminA?: number; // µg per 100g

  @Prop()
  potassium?: number; // mg per 100g
}

export type FoodDocument = HydratedDocument<Food>;

@Schema({ collection: 'foods', timestamps: true })
export class Food {
  @Prop({ required: true, unique: true })
  externalId: string; // ID from external API (USDA or OpenFoodFacts)

  @Prop({ required: true })
  source: 'usda' | 'openfoodfacts'; // Source of the data

  @Prop({ required: true })
  name: string;

  @Prop()
  brand?: string;

  @Prop()
  barcode?: string; // EAN/UPC barcode

  @Prop()
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Object, required: true })
  nutrition: NutritionInfo;

  @Prop()
  servingSize?: string; // e.g., "100g", "1 cup", "1 piece"

  @Prop()
  servingSizeGrams?: number; // Serving size in grams

  @Prop()
  category?: string;

  @Prop([String])
  tags?: string[]; // e.g., "vegan", "gluten-free", etc.

  @Prop()
  language?: string; // Language of the product name/description

  @Prop()
  lastSyncedAt: Date; // Last time we synced from external API

  @Prop({ default: Date.now, expires: 604800 }) // TTL index: auto-delete after 7 days
  cachedAt: Date;
}

export const FoodSchema = SchemaFactory.createForClass(Food);

// Create indexes for better query performance
FoodSchema.index({ externalId: 1, source: 1 }, { unique: true });
FoodSchema.index({ barcode: 1 });
FoodSchema.index({ name: 'text', brand: 'text', description: 'text' });
FoodSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 604800 }); // TTL index
