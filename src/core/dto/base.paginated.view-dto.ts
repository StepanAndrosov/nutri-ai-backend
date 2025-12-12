//базовый класс view модели для запросов за списком с пагинацией
import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginatedViewDto<T> {
  abstract items: T;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  totalCount: number | undefined;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  pagesCount: number | undefined;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number | undefined;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  pageSize: number | undefined;

  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      items: data.items,
    };
  }
}
