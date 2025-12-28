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
import { AddProductToMealInputModel } from './models/input/add-product-to-meal.input.model';
import { RemoveProductFromMealInputModel } from './models/input/remove-product-from-meal.input.model';
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
   * Add or update product in meal
   */
  @Put(':id/product')
  @ApiOperation({ summary: 'Add or update product in meal' })
  @ApiResponse({
    status: 200,
    description: 'Product added or updated successfully',
    type: MealOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Meal or product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  async addOrUpdateProduct(
    @Param() params: GetMealByIdParams,
    @Body() body: AddProductToMealInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<MealOutputModel> {
    return this.mealsService.addOrUpdateProduct(
      params.id,
      user.userId,
      body.productId,
      body.quantity,
    );
  }

  /**
   * Remove product from meal
   */
  @Delete(':id/product')
  @ApiOperation({ summary: 'Remove product from meal' })
  @ApiResponse({
    status: 200,
    description: 'Product removed successfully',
    type: MealOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Meal or product not found in meal',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  async removeProduct(
    @Param() params: GetMealByIdParams,
    @Body() body: RemoveProductFromMealInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<MealOutputModel> {
    return this.mealsService.removeProduct(params.id, user.userId, body.productId);
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
