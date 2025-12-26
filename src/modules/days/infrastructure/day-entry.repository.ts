import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DayEntry, DayEntryModelType } from '../domain/day-entry.entity';

/**
 * Repository for day entry write operations
 */
@Injectable()
export class DayEntryRepository {
  constructor(@InjectModel(DayEntry.name) private DayEntryModel: DayEntryModelType) {}

  /**
   * Create a new day entry
   * @param newDayEntry - Day entry data to create
   * @returns Created day entry ID
   */
  async create(newDayEntry: DayEntry): Promise<string> {
    const insertResult = await this.DayEntryModel.insertMany([newDayEntry]);
    return insertResult[0].id as string;
  }

  /**
   * Update an existing day entry
   * @param id - Day entry ID
   * @param updateData - Partial day entry data to update
   * @returns True if day entry was updated, false otherwise
   */
  async update(id: string, updateData: Partial<DayEntry>): Promise<boolean> {
    const result = await this.DayEntryModel.updateOne(
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
   * Update consumed calories for a day entry
   * @param id - Day entry ID
   * @param consumedKcal - New consumed calories value
   * @returns True if day entry was updated, false otherwise
   */
  async updateConsumedKcal(id: string, consumedKcal: number): Promise<boolean> {
    const result = await this.DayEntryModel.updateOne(
      { _id: id },
      {
        $set: {
          consumedKcal,
          updatedAt: new Date(),
        },
      },
    );
    return result.modifiedCount === 1;
  }

  /**
   * Delete a day entry
   * @param id - Day entry ID
   * @returns True if day entry was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.DayEntryModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}
