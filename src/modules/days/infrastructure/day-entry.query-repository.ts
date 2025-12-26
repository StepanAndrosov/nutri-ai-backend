import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DayEntry, DayEntryModelType } from '../domain/day-entry.entity';
import {
  DayEntryOutputModel,
  DayEntryOutputModelMapper,
} from '../api/models/output/day-entry.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

/**
 * Repository for day entry read operations
 */
@Injectable()
export class DayEntryQueryRepository {
  constructor(@InjectModel(DayEntry.name) private DayEntryModel: DayEntryModelType) {}

  /**
   * Get day entry by ID
   * @param id - Day entry ID
   * @returns Day entry output model or null if not found
   */
  async getById(id: string): Promise<DayEntryOutputModel | null> {
    const dayEntry = await this.DayEntryModel.findOne({ _id: id });
    if (!dayEntry) return null;
    return DayEntryOutputModelMapper(dayEntry);
  }

  /**
   * Get day entry by ID or throw exception if not found
   * @param id - Day entry ID
   * @returns Day entry output model
   * @throws DomainException with NotFound code if day entry doesn't exist
   */
  async getByIdOrNotFoundFail(id: string): Promise<DayEntryOutputModel> {
    const dayEntry = await this.DayEntryModel.findOne({ _id: id });
    if (!dayEntry) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'day entry not found',
      });
    }
    return DayEntryOutputModelMapper(dayEntry);
  }

  /**
   * Get day entry by user ID and date
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Day entry output model or null if not found
   */
  async getByUserAndDate(userId: string, date: string): Promise<DayEntryOutputModel | null> {
    const dayEntry = await this.DayEntryModel.findOne({ userId, date });
    if (!dayEntry) return null;
    return DayEntryOutputModelMapper(dayEntry);
  }

  /**
   * Get or create day entry for user and date
   * If day entry doesn't exist, returns null (doesn't auto-create)
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Day entry output model or null
   */
  async getOrNullByUserAndDate(userId: string, date: string): Promise<DayEntryOutputModel | null> {
    return this.getByUserAndDate(userId, date);
  }

  /**
   * Check if user owns a day entry
   * @param dayEntryId - Day entry ID
   * @param userId - User ID
   * @returns True if user owns the day entry, false otherwise
   */
  async checkOwnership(dayEntryId: string, userId: string): Promise<boolean> {
    const dayEntry = await this.DayEntryModel.findOne({ _id: dayEntryId });
    return dayEntry?.userId === userId;
  }

  /**
   * Get all day entries for a user in a date range
   * @param userId - User ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of day entries
   */
  async getAllByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DayEntryOutputModel[]> {
    const dayEntries = await this.DayEntryModel.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return dayEntries.map(DayEntryOutputModelMapper);
  }
}
