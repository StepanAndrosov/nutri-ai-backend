import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from '../../domain/food.entity';

@Injectable()
export class FoodRepository {
  constructor(@InjectModel(Food.name) private foodModel: Model<FoodDocument>) {}

  async create(food: Partial<Food>): Promise<FoodDocument> {
    const createdFood = new this.foodModel({
      ...food,
      lastSyncedAt: new Date(),
      cachedAt: new Date(),
    });
    return createdFood.save();
  }

  async findByExternalId(
    externalId: string,
    source: 'usda' | 'openfoodfacts',
  ): Promise<FoodDocument | null> {
    return this.foodModel.findOne({ externalId, source }).exec();
  }

  async findByBarcode(barcode: string): Promise<FoodDocument | null> {
    return this.foodModel.findOne({ barcode }).exec();
  }

  async updateLastSyncedAt(id: string): Promise<void> {
    await this.foodModel.updateOne(
      { _id: id },
      {
        $set: {
          lastSyncedAt: new Date(),
          cachedAt: new Date(),
        },
      },
    );
  }

  async upsert(
    externalId: string,
    source: 'usda' | 'openfoodfacts',
    food: Partial<Food>,
  ): Promise<FoodDocument> {
    const existing = await this.findByExternalId(externalId, source);

    if (existing) {
      await this.foodModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...food,
            lastSyncedAt: new Date(),
            cachedAt: new Date(),
          },
        },
      );
      return this.findByExternalId(externalId, source) as Promise<FoodDocument>;
    }

    return this.create(food);
  }
}
