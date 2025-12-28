import { Controller, Get, Post, Body, Param, UseGuards, forwardRef, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DaysService } from '../application/days.service';
import { MealsService } from '../../meals/application/meals.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { DayEntryOutputModel } from './models/output/day-entry.output.model';
import { GetDayByDateParams } from './models/input/get-day-by-date-params.input-dto';
import { CreateMealInputModel } from '../../meals/api/models/input/create-meal.input.model';
import { MealOutputModel } from '../../meals/api/models/output/meal.output.model';
import { MealSource, MealType } from '../../meals/domain/meal.entity';

/**
 * Controller for day entry management
 */
@ApiTags('Days')
@Controller('day')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DaysController {
  constructor(
    private readonly daysService: DaysService,
    @Inject(forwardRef(() => MealsService))
    private readonly mealsService: MealsService,
  ) {}

  /**
   * Get day entry with meals for a specific date
   */
  @Get(':date')
  @ApiOperation({ summary: 'Get day entry with meals for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Day entry found',
    type: DayEntryOutputModel,
  })
  @ApiResponse({
    status: 404,
    description: 'Day entry not found',
  })
  async getDayEntry(
    @Param() params: GetDayByDateParams,
    @CurrentUser() user: CurrentUserType,
  ): Promise<DayEntryOutputModel | null> {
    return this.daysService.getDayWithMeals(user.userId, params.date);
  }

  /**
   * Create a new meal for a specific date
   */
  @Post(':date/meals')
  @ApiOperation({ summary: 'Create a new meal for a specific date' })
  @ApiResponse({
    status: 201,
    description: 'Meal created successfully',
    type: MealOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createMeal(
    @Param() params: GetDayByDateParams,
    @Body() body: CreateMealInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<MealOutputModel> {
    return this.mealsService.createMealForDate(user.userId, params.date, {
      type: body.type as MealType,
      time: body.time,
      items: body.items,
      source: body.source as MealSource,
      aiConfidence: body.aiConfidence,
    });
  }
}
