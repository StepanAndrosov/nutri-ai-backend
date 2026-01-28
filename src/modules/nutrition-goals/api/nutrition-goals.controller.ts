import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NutritionGoalsService } from '../application/nutrition-goals.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { NutritionGoalsOutputModel } from './models/output/nutrition-goals.output.model';
import { UpdateNutritionGoalsInputModel } from './models/input/update-nutrition-goals.input.model';

@ApiTags('User')
@Controller('user/goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NutritionGoalsController {
  constructor(private readonly nutritionGoalsService: NutritionGoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user nutrition goals' })
  @ApiResponse({
    status: 200,
    description: 'Nutrition goals retrieved successfully',
    type: NutritionGoalsOutputModel,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getGoals(@CurrentUser() user: CurrentUserType): Promise<NutritionGoalsOutputModel> {
    return this.nutritionGoalsService.getOrCreateDefault(user.userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user nutrition goals' })
  @ApiResponse({
    status: 200,
    description: 'Nutrition goals updated successfully',
    type: NutritionGoalsOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or macronutrient percentages do not sum to 100',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateGoals(
    @CurrentUser() user: CurrentUserType,
    @Body() body: UpdateNutritionGoalsInputModel,
  ): Promise<NutritionGoalsOutputModel> {
    return this.nutritionGoalsService.updateGoals(user.userId, {
      dailyKcalGoal: body.dailyKcalGoal,
      proteinPct: body.proteinPct,
      fatPct: body.fatPct,
      carbsPct: body.carbsPct,
    });
  }
}
