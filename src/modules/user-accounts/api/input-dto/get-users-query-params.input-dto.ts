//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsersSortBy } from './users-sort-by';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
export class GetUsersQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: UsersSortBy,
    default: UsersSortBy.CreatedAt,
  })
  @IsEnum(UsersSortBy)
  sortBy = UsersSortBy.CreatedAt;

  @ApiPropertyOptional({
    description: 'Search term for login field',
    example: 'john',
  })
  @IsString()
  @IsOptional()
  searchLoginTerm: string | null = null;

  @ApiPropertyOptional({
    description: 'Search term for email field',
    example: 'john@example.com',
  })
  @IsString()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
