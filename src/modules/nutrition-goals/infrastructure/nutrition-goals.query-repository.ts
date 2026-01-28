import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NutritionGoals, NutritionGoalsModelType } from '../domain/nutrition-goals.entity';
import {
  NutritionGoalsOutputModel,
  NutritionGoalsOutputModelMapper,
} from '../api/models/output/nutrition-goals.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class NutritionGoalsQueryRepository {
  constructor(
    @InjectModel(NutritionGoals.name)
    private NutritionGoalsModel: NutritionGoalsModelType,
  ) {}

  async getByUserId(userId: string): Promise<NutritionGoalsOutputModel | null> {
    const goals = await this.NutritionGoalsModel.findOne({ userId });
    if (!goals) return null;
    return NutritionGoalsOutputModelMapper(goals);
  }

  async getByUserIdOrNotFoundFail(userId: string): Promise<NutritionGoalsOutputModel> {
    const goals = await this.NutritionGoalsModel.findOne({ userId });
    if (!goals) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'nutrition goals not found',
      });
    }
    return NutritionGoalsOutputModelMapper(goals);
  }

  async existsForUser(userId: string): Promise<boolean> {
    const count = await this.NutritionGoalsModel.countDocuments({ userId });
    return count > 0;
  }
}
