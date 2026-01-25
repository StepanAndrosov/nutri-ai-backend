import { Module } from '@nestjs/common';
import { AiController } from './api/ai.controller';
import { AiService } from './application/ai.service';
import { OpenAIService } from './application/openai.service';
import { ProductsModule } from '../products/products.module';
import { MealsModule } from '../meals/meals.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';

/**
 * AI module for AI-powered meal parsing and product generation
 */
@Module({
  imports: [ProductsModule, MealsModule, TokenUsageModule],
  controllers: [AiController],
  providers: [AiService, OpenAIService],
  exports: [AiService],
})
export class AiModule {}
