import { Injectable } from '@nestjs/common';
import { UserOutputModel, UserOutputModelMapper } from '../api/models/output/user.output.model';
import { User, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaginationOutput,
  PaginationWithSearchLoginAndEmailTerm,
} from '../../../base/models/pagination.base.model';
import { FilterQuery } from 'mongoose';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserOutputModel | null> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });
    }

    return UserOutputModelMapper(user);
  }

  async getAll(
    pagination: PaginationWithSearchLoginAndEmailTerm,
  ): Promise<PaginationOutput<UserOutputModel>> {
    const filters: FilterQuery<User>[] = [];

    if (pagination.searchEmailTerm) {
      filters.push({
        email: { $regex: pagination.searchEmailTerm, $options: 'i' },
      });
    }

    if (pagination.searchLoginTerm) {
      filters.push({
        login: { $regex: pagination.searchLoginTerm, $options: 'i' },
      });
    }

    const filter: FilterQuery<User> = {};

    if (filters.length > 0) {
      filter.$or = filters;
    }

    return await this.__getResult(filter, pagination);
  }

  private async __getResult(
    filter: FilterQuery<User>,
    pagination: PaginationWithSearchLoginAndEmailTerm,
  ): Promise<PaginationOutput<UserOutputModel>> {
    const users = await this.UserModel.find(filter)
      .sort({
        [pagination.sortBy]: pagination.getSortDirectionInNumericFormat(),
      })
      .skip(pagination.getSkipItemsCount())
      .limit(pagination.pageSize);

    const totalCount = await this.UserModel.countDocuments(filter);

    const mappedUsers = users.map(UserOutputModelMapper);

    return new PaginationOutput<UserOutputModel>(
      mappedUsers,
      pagination.pageNumber,
      pagination.pageSize,
      totalCount,
    );
  }
}
