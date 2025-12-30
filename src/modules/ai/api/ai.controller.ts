import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from '../application/ai.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { ParseMealInputModel } from './models/input/parse-meal.input.model';
import { ParseMealOutputModel } from './models/output/parse-meal.output.model';
import { MealsQueryRepository } from '../../meals/infrastructure/meals.query-repository';
import { MealType } from 'src/modules/meals/domain/meal.entity';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly mealsQueryRepository: MealsQueryRepository,
  ) {}

  @Post('parse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Parse meal description and create meal with AI',
    description:
      'Accepts natural language meal description (Russian/English), parses it with GPT-4, finds or creates products, and creates a meal entry.',
  })
  @ApiResponse({
    status: 201,
    description: 'Meal successfully parsed and created',
    type: ParseMealOutputModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or parsing failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT required',
  })
  async parseMeal(
    @CurrentUser() user: CurrentUserType,
    @Body() input: ParseMealInputModel,
  ): Promise<ParseMealOutputModel> {
    const result = await this.aiService.parseMealAndCreate(
      user.userId,
      input.text,
      input.mealType as MealType,
      input.date,
    );

    // Fetch full meal data
    const meal = await this.mealsQueryRepository.getByIdOrNotFoundFail(result.mealId);

    return {
      meal,
      products: result.products.map((p) => ({
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        wasCreated: p.wasCreated,
        source: p.source,
      })),
      confidence: result.confidence,
      productsCreatedCount: result.productsCreatedCount,
      productsFoundCount: result.productsFoundCount,
    };
  }
}
