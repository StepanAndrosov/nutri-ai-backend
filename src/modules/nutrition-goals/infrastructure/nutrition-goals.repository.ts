import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NutritionGoals, NutritionGoalsModelType } from '../domain/nutrition-goals.entity';

@Injectable()
export class NutritionGoalsRepository {
  constructor(
    @InjectModel(NutritionGoals.name)
    private NutritionGoalsModel: NutritionGoalsModelType,
  ) {}

  async create(newGoals: NutritionGoals): Promise<string> {
    const insertResult = await this.NutritionGoalsModel.insertMany([newGoals]);
    return insertResult[0].id as string;
  }

  async updateByUserId(userId: string, updateData: Partial<NutritionGoals>): Promise<boolean> {
    const result = await this.NutritionGoalsModel.updateOne(
      { userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );
    return result.modifiedCount === 1;
  }

  async upsert(
    userId: string,
    goalsData: Omit<NutritionGoals, 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const result = await this.NutritionGoalsModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...goalsData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    return result.id as string;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.NutritionGoalsModel.deleteOne({ userId });
    return result.deletedCount === 1;
  }
}
