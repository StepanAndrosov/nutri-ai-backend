import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meal, MealModelType, MealType } from '../domain/meal.entity';
import { MealOutputModel, MealOutputModelMapper } from '../api/models/output/meal.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

/**
 * Repository for meal read operations
 */
@Injectable()
export class MealsQueryRepository {
  constructor(@InjectModel(Meal.name) private MealModel: MealModelType) {}

  /**
   * Get meal by ID
   * @param id - Meal ID
   * @returns Meal output model or null if not found
   */
  async getById(id: string): Promise<MealOutputModel | null> {
    const meal = await this.MealModel.findOne({ _id: id });
    if (!meal) return null;
    return MealOutputModelMapper(meal);
  }

  /**
   * Get meal by ID or throw exception if not found
   * @param id - Meal ID
   * @returns Meal output model
   * @throws DomainException with NotFound code if meal doesn't exist
   */
  async getByIdOrNotFoundFail(id: string): Promise<MealOutputModel> {
    const meal = await this.MealModel.findOne({ _id: id });
    if (!meal) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });
    }
    return MealOutputModelMapper(meal);
  }

  /**
   * Get all meals for a specific day entry
   * @param dayEntryId - Day entry ID
   * @returns Array of meals for the specified day
   */
  async getAllByDayEntry(dayEntryId: string): Promise<MealOutputModel[]> {
    const meals = await this.MealModel.find({ dayEntryId }).sort({ createdAt: 1 });
    return meals.map(MealOutputModelMapper);
  }

  /**
   * Check if a meal belongs to a specific day entry
   * @param mealId - Meal ID
   * @param dayEntryId - Day entry ID
   * @returns True if meal belongs to day entry, false otherwise
   */
  async checkMealBelongsToDayEntry(mealId: string, dayEntryId: string): Promise<boolean> {
    const meal = await this.MealModel.findOne({ _id: mealId });
    return meal?.dayEntryId === dayEntryId;
  }

  /**
   * Calculate total calories for a day entry
   * @param dayEntryId - Day entry ID
   * @returns Total calories consumed in the day
   */
  async calculateTotalKcalForDayEntry(dayEntryId: string): Promise<number> {
    const result = await this.MealModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          dayEntryId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$totalKcal',
          },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Calculate total fiber for a day entry
   * @param dayEntryId - Day entry ID
   * @returns Total fiber consumed in the day (in grams)
   */
  async calculateTotalFiberForDayEntry(dayEntryId: string): Promise<number> {
    const result = await this.MealModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          dayEntryId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $ifNull: ['$totalFiber', 0] },
          },
        },
      },
    ]);

    return result.length > 0 ? Math.round(result[0].total * 10) / 10 : 0;
  }

  /**
   * Check if a meal with a specific type exists for a day entry
   * @param dayEntryId - Day entry ID
   * @param mealType - Meal type to check
   * @returns True if a meal with the specified type exists, false otherwise
   */
  async checkMealTypeExistsForDayEntry(dayEntryId: string, mealType: MealType): Promise<boolean> {
    const meal = await this.MealModel.findOne({ dayEntryId, type: mealType });
    return meal !== null;
  }
}
