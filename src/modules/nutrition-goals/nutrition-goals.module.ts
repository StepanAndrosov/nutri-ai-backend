import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NutritionGoals, NutritionGoalsSchema } from './domain/nutrition-goals.entity';
import { NutritionGoalsController } from './api/nutrition-goals.controller';
import { NutritionGoalsService } from './application/nutrition-goals.service';
import { NutritionGoalsRepository } from './infrastructure/nutrition-goals.repository';
import { NutritionGoalsQueryRepository } from './infrastructure/nutrition-goals.query-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NutritionGoals.name, schema: NutritionGoalsSchema }]),
  ],
  controllers: [NutritionGoalsController],
  providers: [NutritionGoalsService, NutritionGoalsRepository, NutritionGoalsQueryRepository],
  exports: [
    NutritionGoalsService,
    NutritionGoalsRepository,
    NutritionGoalsQueryRepository,
    MongooseModule,
  ],
})
export class NutritionGoalsModule {}
