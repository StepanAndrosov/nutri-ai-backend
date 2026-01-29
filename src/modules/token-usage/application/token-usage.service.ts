import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TokenUsageRepository,
  TokenUsageIncrement,
} from '../infrastructure/token-usage.repository';
import { TokenUsageQueryRepository } from '../infrastructure/token-usage.query-repository';
import { UsersQueryRepository } from '../../user-accounts/infrastructure/users.query-repository';
import { SubscriptionsService } from '../../subscriptions/application/subscriptions.service';
import { SubscriptionStatus } from '../../subscriptions/domain/subscription-status.enum';
import { CurrentTokenUsageOutputModel } from '../api/models/output/token-usage.output.model';
import { DomainException, Extension } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class TokenUsageService {
  private readonly logger = new Logger(TokenUsageService.name);
  private readonly defaultDailyLimit: number;
  private readonly freeTierDailyLimit: number;
  private readonly subscriberDailyLimit: number;

  constructor(
    private readonly tokenUsageRepository: TokenUsageRepository,
    private readonly tokenUsageQueryRepository: TokenUsageQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {
    this.defaultDailyLimit = this.configService.get<number>('openai.dailyTokenLimit') || 50000;
    this.freeTierDailyLimit =
      this.configService.get<number>('openai.freeTierDailyTokenLimit') || 10000;
    this.subscriberDailyLimit =
      this.configService.get<number>('openai.subscriberDailyTokenLimit') || 200000;
  }

  /**
   * Record token usage for a user
   * @param userId - User ID
   * @param usage - Token usage data from OpenAI response
   */
  async recordUsage(userId: string, usage: TokenUsageIncrement): Promise<void> {
    const today = this.getTodayDate();
    await this.tokenUsageRepository.incrementUsage(userId, today, usage);
    this.logger.log(`Recorded ${usage.totalTokens} tokens for user ${userId} on ${today}`);
  }

  /**
   * Check if user has exceeded their daily token limit
   * Throws exception if limit is exceeded
   * @param userId - User ID
   * @throws DomainException with TokenLimitExceeded code
   */
  async checkLimitAndThrow(userId: string): Promise<void> {
    const today = this.getTodayDate();
    const currentUsage = await this.tokenUsageQueryRepository.getTotalTokensByUserAndDate(
      userId,
      today,
    );
    const dailyLimit = await this.getDailyLimit(userId);

    if (currentUsage >= dailyLimit) {
      this.logger.warn(`User ${userId} exceeded daily token limit: ${currentUsage}/${dailyLimit}`);
      throw new DomainException({
        code: DomainExceptionCode.TokenLimitExceeded,
        message: 'Daily AI token limit exceeded',
        extensions: [
          new Extension(currentUsage.toString(), 'currentUsage'),
          new Extension(dailyLimit.toString(), 'dailyLimit'),
          new Extension('0', 'remainingTokens'),
        ],
      });
    }
  }

  /**
   * Get current token usage for a user (today)
   * @param userId - User ID
   * @returns Current token usage with limit info
   */
  async getCurrentUsage(userId: string): Promise<CurrentTokenUsageOutputModel> {
    const today = this.getTodayDate();
    const dailyLimit = await this.getDailyLimit(userId);
    const usage = await this.tokenUsageQueryRepository.getByUserAndDate(userId, today);

    if (!usage) {
      // No usage yet today
      return {
        id: '',
        userId,
        date: today,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0,
        dailyLimit,
        remainingTokens: dailyLimit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      ...usage,
      dailyLimit,
      remainingTokens: Math.max(0, dailyLimit - usage.totalTokens),
    };
  }

  /**
   * Get daily token limit for a user
   * Uses user-specific override if set, otherwise system default
   * @param userId - User ID
   * @returns Daily token limit
   */
  async getDailyLimit(userId: string): Promise<number> {
    const user = await this.usersQueryRepository.getById(userId);

    // 1. User-specific override (highest priority, e.g. set by admin)
    if (user?.dailyTokenLimit !== undefined && user.dailyTokenLimit !== null) {
      return user.dailyTokenLimit;
    }

    // 2. Subscription-based limit
    const subscription = await this.subscriptionsService.getByUserId(userId);
    if (subscription?.status === SubscriptionStatus.ACTIVE) {
      return this.subscriberDailyLimit;
    }

    // 3. Free tier limit
    return this.freeTierDailyLimit;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
