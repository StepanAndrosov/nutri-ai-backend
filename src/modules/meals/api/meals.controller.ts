import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MealsService } from '../application/meals.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { UpdateMealInputModel } from './models/input/update-meal.input.model';
import { MealOutputModel } from './models/output/meal.output.model';
import { GetMealByIdParams } from './input-dto/get-meal-by-id-params.input-dto';

/**
 * Controller for meals management
 */
@ApiTags('Meals')
@Controller('meals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  /**
   * Get meal by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get meal by ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal found',
    type: MealOutputModel,
  })
  @ApiResponse({
    status: 404,
    description: 'Meal not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  async getMealById(
    @Param() params: GetMealByIdParams,
    @CurrentUser() user: CurrentUserType,
  ): Promise<MealOutputModel> {
    return this.mealsService.getById(params.id, user.userId);
  }

  /**
   * Update meal by ID
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update meal by ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal updated successfully',
    type: MealOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Meal not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  async updateMeal(
    @Param() params: GetMealByIdParams,
    @Body() body: UpdateMealInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<MealOutputModel> {
    return this.mealsService.update(params.id, user.userId, {
      type: body.type as any,
      time: body.time,
      name: body.name,
      items: body.items as any,
      totalKcal: body.totalKcal,
      source: body.source as any,
      aiConfidence: body.aiConfidence,
    });
  }

  /**
   * Delete meal by ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete meal by ID' })
  @ApiResponse({
    status: 204,
    description: 'Meal deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Meal not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  async deleteMeal(
    @Param() params: GetMealByIdParams,
    @CurrentUser() user: CurrentUserType,
  ): Promise<void> {
    await this.mealsService.delete(params.id, user.userId);
  }
}
