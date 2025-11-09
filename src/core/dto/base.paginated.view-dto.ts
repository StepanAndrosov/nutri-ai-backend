//базовый класс view модели для запросов за списком с пагинацией
export abstract class PaginatedViewDto<T> {
  abstract items: T;
  totalCount: number | undefined;
  pagesCount: number | undefined;
  page: number | undefined;
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
