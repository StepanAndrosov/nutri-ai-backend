import { Body, Controller, Post, Put, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from '../application/ai.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { ParseMealInputModel } from './models/input/parse-meal.input.model';
import { UpdateMealWithAiInputModel } from './models/input/update-meal-with-ai.input.model';
import { ParseMealOutputModel } from './models/output/parse-meal.output.model';
import { MealsQueryRepository } from '../../meals/infrastructure/meals.query-repository';
import { GetMealByIdParams } from '../../meals/api/input-dto/get-meal-by-id-params.input-dto';
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

  @Put('meals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update meal with AI-parsed description',
    description:
      'Parses meal description with GPT-4, finds or creates products, and merges them into existing meal. Existing products are updated if mentioned, new products are added. Products not mentioned remain unchanged.',
  })
  @ApiResponse({
    status: 200,
    description: 'Meal successfully updated with parsed products',
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your meal',
  })
  @ApiResponse({
    status: 404,
    description: 'Meal not found',
  })
  async updateMealWithAi(
    @Param() params: GetMealByIdParams,
    @CurrentUser() user: CurrentUserType,
    @Body() input: UpdateMealWithAiInputModel,
  ): Promise<ParseMealOutputModel> {
    const result = await this.aiService.updateMealWithParsedText(
      user.userId,
      params.id,
      input.text,
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
