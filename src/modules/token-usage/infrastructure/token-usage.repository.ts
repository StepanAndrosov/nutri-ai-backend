import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TokenUsage, TokenUsageModelType } from '../domain/token-usage.entity';

export interface TokenUsageIncrement {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Repository for token usage write operations
 */
@Injectable()
export class TokenUsageRepository {
  constructor(@InjectModel(TokenUsage.name) private TokenUsageModel: TokenUsageModelType) {}

  /**
   * Increment token usage for a user on a specific date
   * Creates the record if it doesn't exist (upsert)
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @param usage - Token usage to add
   */
  async incrementUsage(userId: string, date: string, usage: TokenUsageIncrement): Promise<void> {
    await this.TokenUsageModel.updateOne(
      { userId, date },
      {
        $inc: {
          totalTokens: usage.totalTokens,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          requestCount: 1,
        },
      },
      { upsert: true },
    );
  }
}
