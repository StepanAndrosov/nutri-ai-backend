import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationWithSearchEmailTerm } from '../../../base/models/pagination.base.model';
import { SortingPropertiesType } from '../../../base/types/sorting-properties.type';
import { ParsedQs } from 'qs';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UserCreateModel } from './models/input/create-user.input.model';
import { UpdateRoleInputModel } from './models/input/update-role.input.model';
import { UserOutputModel } from './models/output/user.output.model';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/api/guards/roles.guard';
import { Roles } from '../../auth/api/decorators/roles.decorator';
import { UserRole } from '../../auth/domain/user-role.enum';

export const USERS_SORTING_PROPERTIES: SortingPropertiesType<UserOutputModel> = [
  'displayName',
  'email',
];

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and search (Admin only)' })
  async getAll(@Query() query: ParsedQs) {
    const pagination: PaginationWithSearchEmailTerm = new PaginationWithSearchEmailTerm(
      query,
      USERS_SORTING_PROPERTIES,
    );

    return this.usersQueryRepository.getAll(pagination);
  }

  @ApiParam({ name: 'id' })
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async getById(@Param('id') id: string): Promise<UserOutputModel> {
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  async create(@Body() createModel: UserCreateModel) {
    const { email, password, displayName, timezone, dailyKcalGoal } = createModel;

    const createdUserId = await this.usersService.create(
      email,
      password,
      displayName,
      timezone,
      dailyKcalGoal,
    );

    return this.usersQueryRepository.getByIdOrNotFoundFail(createdUserId);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  async updateRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleInputModel,
  ): Promise<UserOutputModel> {
    await this.usersService.updateRole(id, body.role);
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  async delete(@Param('id') id: string) {
    const deletingResult: boolean = await this.usersService.delete(id);

    if (!deletingResult) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
