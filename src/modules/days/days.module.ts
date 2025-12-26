import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DayEntry, DayEntrySchema } from './domain/day-entry.entity';
import { DaysController } from './api/days.controller';
import { DaysService } from './application/days.service';
import { DayEntryRepository } from './infrastructure/day-entry.repository';
import { DayEntryQueryRepository } from './infrastructure/day-entry.query-repository';
import { MealsModule } from '../meals/meals.module';

/**
 * Days module for managing day entries
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: DayEntry.name, schema: DayEntrySchema }]),
    forwardRef(() => MealsModule),
  ],
  controllers: [DaysController],
  providers: [DaysService, DayEntryRepository, DayEntryQueryRepository],
  exports: [DaysService, DayEntryRepository, DayEntryQueryRepository, MongooseModule],
})
export class DaysModule {}
