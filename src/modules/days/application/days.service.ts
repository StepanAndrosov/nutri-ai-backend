import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DayEntryRepository } from '../infrastructure/day-entry.repository';
import { DayEntryQueryRepository } from '../infrastructure/day-entry.query-repository';
import { MealsQueryRepository } from '../../meals/infrastructure/meals.query-repository';
import { DayEntryOutputModel } from '../api/models/output/day-entry.output.model';

/**
 * Service for day entry business logic
 */
@Injectable()
export class DaysService {
  constructor(
    private readonly dayEntryRepository: DayEntryRepository,
    private readonly dayEntryQueryRepository: DayEntryQueryRepository,
    @Inject(forwardRef(() => MealsQueryRepository))
    private readonly mealsQueryRepository: MealsQueryRepository,
  ) {}

  /**
   * Get day entry by user ID and date
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Day entry output model or null if not found
   */
  async getByUserAndDate(userId: string, date: string): Promise<DayEntryOutputModel | null> {
    return this.dayEntryQueryRepository.getByUserAndDate(userId, date);
  }

  /**
   * Get or create day entry for user and date
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Day entry output model
   */
  async getOrCreate(userId: string, date: string): Promise<DayEntryOutputModel> {
    const existing = await this.dayEntryQueryRepository.getByUserAndDate(userId, date);

    if (existing) {
      return existing;
    }

    // Create new day entry
    const newDayEntry = {
      userId,
      date,
      consumedKcal: 0,
      consumedFiber: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dayEntryId = await this.dayEntryRepository.create(newDayEntry);
    return this.dayEntryQueryRepository.getByIdOrNotFoundFail(dayEntryId);
  }

  /**
   * Get day entry with meals populated
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Day entry with meals or null if not found
   */
  async getDayWithMeals(userId: string, date: string): Promise<DayEntryOutputModel | null> {
    const dayEntry = await this.dayEntryQueryRepository.getByUserAndDate(userId, date);

    if (!dayEntry) {
      return null;
    }

    // Get meals for this day entry
    const meals = await this.mealsQueryRepository.getAllByDayEntry(dayEntry.id);
    dayEntry.meals = meals;

    return dayEntry;
  }

  /**
   * Update consumed calories for a day entry
   * Recalculates total from all meals
   * @param dayEntryId - Day entry ID
   * @param totalKcal - New total calories
   */
  async updateConsumedKcal(dayEntryId: string, totalKcal: number): Promise<void> {
    await this.dayEntryRepository.updateConsumedKcal(dayEntryId, totalKcal);
  }

  /**
   * Update consumed fiber for a day entry
   * @param dayEntryId - Day entry ID
   * @param totalFiber - New total fiber (in grams)
   */
  async updateConsumedFiber(dayEntryId: string, totalFiber: number): Promise<void> {
    await this.dayEntryRepository.updateConsumedFiber(dayEntryId, totalFiber);
  }

  /**
   * Check if user owns a day entry
   * @param dayEntryId - Day entry ID
   * @param userId - User ID
   * @returns True if user owns the day entry
   */
  async checkOwnership(dayEntryId: string, userId: string): Promise<boolean> {
    return this.dayEntryQueryRepository.checkOwnership(dayEntryId, userId);
  }

  /**
   * Get day entry by ID
   * @param dayEntryId - Day entry ID
   * @returns Day entry output model
   */
  async getById(dayEntryId: string): Promise<DayEntryOutputModel> {
    return this.dayEntryQueryRepository.getByIdOrNotFoundFail(dayEntryId);
  }
}
