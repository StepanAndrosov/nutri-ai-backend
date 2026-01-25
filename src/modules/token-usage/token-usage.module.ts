import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenUsage, TokenUsageSchema } from './domain/token-usage.entity';
import { TokenUsageController } from './api/token-usage.controller';
import { TokenUsageService } from './application/token-usage.service';
import { TokenUsageRepository } from './infrastructure/token-usage.repository';
import { TokenUsageQueryRepository } from './infrastructure/token-usage.query-repository';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';

/**
 * Token usage module for tracking OpenAI API token consumption
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: TokenUsage.name, schema: TokenUsageSchema }]),
    UserAccountsModule,
  ],
  controllers: [TokenUsageController],
  providers: [TokenUsageService, TokenUsageRepository, TokenUsageQueryRepository],
  exports: [TokenUsageService, TokenUsageRepository, TokenUsageQueryRepository],
})
export class TokenUsageModule {}
