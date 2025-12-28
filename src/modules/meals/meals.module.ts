import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meal, MealSchema } from './domain/meal.entity';
import { MealsController } from './api/meals.controller';
import { MealsService } from './application/meals.service';
import { MealsRepository } from './infrastructure/meals.repository';
import { MealsQueryRepository } from './infrastructure/meals.query-repository';
import { DaysModule } from '../days/days.module';
import { ProductsModule } from '../products/products.module';

/**
 * Meals module for managing meals
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meal.name, schema: MealSchema }]),
    forwardRef(() => DaysModule),
    ProductsModule,
  ],
  controllers: [MealsController],
  providers: [MealsService, MealsRepository, MealsQueryRepository],
  exports: [MealsService, MealsRepository, MealsQueryRepository, MongooseModule],
})
export class MealsModule {}
