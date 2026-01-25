import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TokenUsage, TokenUsageModelType } from '../domain/token-usage.entity';
import {
  TokenUsageOutputModel,
  TokenUsageOutputModelMapper,
} from '../api/models/output/token-usage.output.model';

/**
 * Repository for token usage read operations
 */
@Injectable()
export class TokenUsageQueryRepository {
  constructor(@InjectModel(TokenUsage.name) private TokenUsageModel: TokenUsageModelType) {}

  /**
   * Get token usage by user ID and date
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Token usage output model or null if not found
   */
  async getByUserAndDate(userId: string, date: string): Promise<TokenUsageOutputModel | null> {
    const tokenUsage = await this.TokenUsageModel.findOne({ userId, date });
    if (!tokenUsage) return null;
    return TokenUsageOutputModelMapper(tokenUsage);
  }

  /**
   * Get total tokens used by user on a specific date
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Total tokens used or 0 if no record exists
   */
  async getTotalTokensByUserAndDate(userId: string, date: string): Promise<number> {
    const tokenUsage = await this.TokenUsageModel.findOne({ userId, date });
    return tokenUsage?.totalTokens ?? 0;
  }

  /**
   * Get all token usage records for a user in a date range
   * @param userId - User ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of token usage records
   */
  async getByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<TokenUsageOutputModel[]> {
    const records = await this.TokenUsageModel.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    return records.map(TokenUsageOutputModelMapper);
  }
}
