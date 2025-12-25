import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

/**
 * Product data source enumeration
 */
export enum ProductSource {
  MANUAL = 'manual',
  AI = 'ai',
  OPENFOODFACTS = 'openfoodfacts',
  USER = 'user',
}

/**
 * Product entity representing food products with nutritional information
 */
@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  normalizedName: string;

  @Prop({ type: Number, required: true, min: 0 })
  kcalPer100g: number;

  @Prop({ type: Number, required: false, min: 0 })
  proteinPer100g?: number;

  @Prop({ type: Number, required: false, min: 0 })
  fatPer100g?: number;

  @Prop({ type: Number, required: false, min: 0 })
  carbsPer100g?: number;

  @Prop({ type: Number, required: false, min: 0 })
  fiberPer100g?: number;

  @Prop({ type: Number, required: false, min: 0 })
  sugarPer100g?: number;

  @Prop({ type: String, enum: Object.values(ProductSource), default: ProductSource.MANUAL })
  source: ProductSource;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  usageCount: number;

  @Prop({ type: String, required: false, index: true })
  createdBy?: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  barcode?: string;

  @Prop({ type: String, required: false })
  brand?: string;

  @Prop({ type: String, required: false, index: true })
  category?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Create indexes for efficient querying
ProductSchema.index({ normalizedName: 'text' });
ProductSchema.index({ source: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ createdBy: 1 });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });

// Load the class to enable instance methods
ProductSchema.loadClass(Product);

export type ProductDocument = HydratedDocument<Product>;
export type ProductModelType = Model<ProductDocument>;
