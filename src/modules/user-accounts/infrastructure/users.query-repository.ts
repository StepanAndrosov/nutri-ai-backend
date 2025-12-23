import { Injectable } from '@nestjs/common';
import { UserOutputModel, UserOutputModelMapper } from '../api/models/output/user.output.model';
import { User, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaginationOutput,
  PaginationWithSearchEmailTerm,
} from '../../../base/models/pagination.base.model';
import { FilterQuery } from 'mongoose';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import {
  UserWithPasswordModel,
  UserWithPasswordModelMapper,
} from './models/user-with-password.model';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async getById(id: string): Promise<UserOutputModel | null> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      return null;
    }

    return UserOutputModelMapper(user);
  }

  async getByIdOrNotFoundFail(id: string): Promise<UserOutputModel> {
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

  async getByEmail(email: string): Promise<UserOutputModel | null> {
    const user = await this.UserModel.findOne({
      email: email,
      deletedAt: null,
    });

    if (!user) {
      return null;
    }

    return UserOutputModelMapper(user);
  }

  async getAll(
    pagination: PaginationWithSearchEmailTerm,
  ): Promise<PaginationOutput<UserOutputModel>> {
    const filter: FilterQuery<User> = {};

    if (pagination.searchEmailTerm) {
      filter.email = { $regex: pagination.searchEmailTerm, $options: 'i' };
    }

    return await this.__getResult(filter, pagination);
  }

  private async __getResult(
    filter: FilterQuery<User>,
    pagination: PaginationWithSearchEmailTerm,
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

  // Methods for internal use (authentication) - includes passwordHash
  // NEVER expose these methods in API responses

  async getByEmailWithPassword(email: string): Promise<UserWithPasswordModel | null> {
    const user = await this.UserModel.findOne({
      email: email,
      deletedAt: null,
    });

    if (!user) {
      return null;
    }

    return UserWithPasswordModelMapper(user);
  }
}
