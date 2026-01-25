import { ApiProperty } from '@nestjs/swagger';
import { TokenUsageDocument } from '../../../domain/token-usage.entity';

export class TokenUsageOutputModel {
  @ApiProperty({ description: 'Token usage record ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ description: 'Total tokens used (prompt + completion)' })
  totalTokens: number;

  @ApiProperty({ description: 'Prompt tokens used' })
  promptTokens: number;

  @ApiProperty({ description: 'Completion tokens used' })
  completionTokens: number;

  @ApiProperty({ description: 'Number of API requests made' })
  requestCount: number;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record update timestamp' })
  updatedAt: Date;
}

export class CurrentTokenUsageOutputModel extends TokenUsageOutputModel {
  @ApiProperty({ description: 'Daily token limit for the user' })
  dailyLimit: number;

  @ApiProperty({ description: 'Remaining tokens for today' })
  remainingTokens: number;
}

export function TokenUsageOutputModelMapper(tokenUsage: TokenUsageDocument): TokenUsageOutputModel {
  return {
    id: tokenUsage._id.toString(),
    userId: tokenUsage.userId,
    date: tokenUsage.date,
    totalTokens: tokenUsage.totalTokens,
    promptTokens: tokenUsage.promptTokens,
    completionTokens: tokenUsage.completionTokens,
    requestCount: tokenUsage.requestCount,
    createdAt: tokenUsage.createdAt,
    updatedAt: tokenUsage.updatedAt,
  };
}
