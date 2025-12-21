import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodDatabaseController } from './api/controllers/food-database.controller';
import { FoodDatabaseService } from './application/food-database.service';
import { Food, FoodSchema } from './domain/food.entity';
import { OpenFoodFactsService } from './infrastructure/external-apis/open-food-facts.service';
import { USDAFoodDataService } from './infrastructure/external-apis/usda-food-data.service';
import { FoodQueryRepository } from './infrastructure/repositories/food-query.repository';
import { FoodRepository } from './infrastructure/repositories/food.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Food.name, schema: FoodSchema }]),
    HttpModule.register({
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 5,
    }),
  ],
  controllers: [FoodDatabaseController],
  providers: [
    FoodDatabaseService,
    OpenFoodFactsService,
    USDAFoodDataService,
    FoodRepository,
    FoodQueryRepository,
  ],
  exports: [FoodDatabaseService],
})
export class FoodDatabaseModule {}
