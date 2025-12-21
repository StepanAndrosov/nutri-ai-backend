import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from '../../domain/food.entity';

@Injectable()
export class FoodQueryRepository {
  constructor(@InjectModel(Food.name) private foodModel: Model<FoodDocument>) {}

  async searchByText(query: string, limit: number = 20): Promise<Food[]> {
    return this.foodModel
      .find({ $text: { $search: query }}, { score: { $meta: 'textScore' }})
      .sort({ score: { $meta: 'textScore' }})
      .limit(limit)
      .exec();
  }

  async findBySource(source: 'usda' | 'openfoodfacts', limit: number = 20): Promise<Food[]> {
    return this.foodModel.find({ source }).limit(limit).exec();
  }

  async findById(id: string): Promise<Food | null> {
    return this.foodModel.findById(id).exec();
  }

  async findByExternalId(
    externalId: string,
    source: 'usda' | 'openfoodfacts',
  ): Promise<Food | null> {
    return this.foodModel.findOne({ externalId, source }).exec();
  }

  async findByBarcode(barcode: string): Promise<Food | null> {
    return this.foodModel.findOne({ barcode }).exec();
  }

  async count(): Promise<number> {
    return this.foodModel.countDocuments().exec();
  }
}
