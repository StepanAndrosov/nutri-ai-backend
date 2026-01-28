import { Injectable } from '@nestjs/common';
import { NutritionGoalsRepository } from '../infrastructure/nutrition-goals.repository';
import { NutritionGoalsQueryRepository } from '../infrastructure/nutrition-goals.query-repository';
import { NutritionGoalsOutputModel } from '../api/models/output/nutrition-goals.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { UpdateNutritionGoalsDto } from '../api/models/input-dto/update-nutrition-goals-dto';

const DEFAULT_DAILY_KCAL_GOAL = 2000;
const DEFAULT_PROTEIN_PCT = 30;
const DEFAULT_FAT_PCT = 30;
const DEFAULT_CARBS_PCT = 40;

@Injectable()
export class NutritionGoalsService {
  constructor(
    private readonly nutritionGoalsRepository: NutritionGoalsRepository,
    private readonly nutritionGoalsQueryRepository: NutritionGoalsQueryRepository,
  ) {}

  async getOrCreateDefault(userId: string): Promise<NutritionGoalsOutputModel> {
    const existing = await this.nutritionGoalsQueryRepository.getByUserId(userId);

    if (existing) {
      return existing;
    }

    const defaultGoals = {
      userId,
      dailyKcalGoal: DEFAULT_DAILY_KCAL_GOAL,
      proteinPct: DEFAULT_PROTEIN_PCT,
      fatPct: DEFAULT_FAT_PCT,
      carbsPct: DEFAULT_CARBS_PCT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.nutritionGoalsRepository.create(defaultGoals);
    return this.nutritionGoalsQueryRepository.getByUserIdOrNotFoundFail(userId);
  }

  async updateGoals(
    userId: string,
    dto: UpdateNutritionGoalsDto,
  ): Promise<NutritionGoalsOutputModel> {
    const sum = dto.proteinPct + dto.fatPct + dto.carbsPct;
    if (sum !== 100) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: `Macronutrient percentages must sum to 100, got ${sum}`,
        extensions: [
          { key: 'proteinPct', message: `Current value: ${dto.proteinPct}` },
          { key: 'fatPct', message: `Current value: ${dto.fatPct}` },
          { key: 'carbsPct', message: `Current value: ${dto.carbsPct}` },
        ],
      });
    }

    await this.nutritionGoalsRepository.upsert(userId, {
      dailyKcalGoal: dto.dailyKcalGoal,
      proteinPct: dto.proteinPct,
      fatPct: dto.fatPct,
      carbsPct: dto.carbsPct,
    });

    return this.nutritionGoalsQueryRepository.getByUserIdOrNotFoundFail(userId);
  }

  async getByUserId(userId: string): Promise<NutritionGoalsOutputModel | null> {
    return this.nutritionGoalsQueryRepository.getByUserId(userId);
  }
}
