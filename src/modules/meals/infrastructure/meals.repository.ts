import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meal, MealModelType } from '../domain/meal.entity';

/**
 * Repository for meal write operations
 */
@Injectable()
export class MealsRepository {
  constructor(@InjectModel(Meal.name) private MealModel: MealModelType) {}

  /**
   * Create a new meal
   * @param newMeal - Meal data to create
   * @returns Created meal ID
   */
  async create(newMeal: Meal): Promise<string> {
    const insertResult = await this.MealModel.insertMany([newMeal]);
    return insertResult[0].id as string;
  }

  /**
   * Update an existing meal
   * @param id - Meal ID
   * @param updateData - Partial meal data to update
   * @returns True if meal was updated, false otherwise
   */
  async update(id: string, updateData: Partial<Meal>): Promise<boolean> {
    const result = await this.MealModel.updateOne(
      { _id: id },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );
    return result.modifiedCount === 1;
  }

  /**
   * Delete a meal
   * @param id - Meal ID
   * @returns True if meal was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.MealModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}
