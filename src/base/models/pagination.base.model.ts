import { ParsedQs } from 'qs';

export class PaginationOutput<D> {
  public readonly pagesCount: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly totalCount: number;
  public readonly items: D[];

  constructor(items: D[], page: number, pageSize: number, totalCount: number) {
    this.items = items;
    this.page = page;
    this.pageSize = pageSize;
    this.totalCount = totalCount;

    this.pagesCount = Math.ceil(totalCount / pageSize);
  }
}

export class Pagination {
  public readonly pageNumber: number;
  public readonly pageSize: number;
  public readonly sortDirection: SortDirectionType;
  public readonly sortBy: string;
  public readonly searchNameTerm: string;

  constructor(query: ParsedQs, sortProperties: string[]) {
    this.searchNameTerm = this.getSearchNameTerm(query.searchNameTerm);
    this.sortBy = this.getSortBy(query, sortProperties);
    this.sortDirection = this.getSortDirection(query);
    this.pageNumber = Number(query.pageNumber ?? 1);
    this.pageSize = Number(query.pageSize ?? 10);
  }

  public getSearchNameTerm(searchNameTerm: ParsedQs[string]): string {
    return searchNameTerm ? String(searchNameTerm as string) : '';
  }

  public getSortDirectionInNumericFormat(): -1 | 1 {
    return this.sortDirection === 'desc' ? -1 : 1;
  }

  public getSkipItemsCount() {
    return (this.pageNumber - 1) * this.pageSize;
  }

  private getSortDirection(query: ParsedQs): SortDirectionType {
    let sortDirection: SortDirectionType = 'desc';

    switch (query.sortDirection) {
      case 'desc': {
        sortDirection = 'desc';
        break;
      }
      case 'asc': {
        sortDirection = 'asc';
        break;
      }
    }
    return sortDirection;
  }

  private getSortBy(query: ParsedQs, sortProperties: string[]): string {
    let result = 'createdAt';

    const querySortBy = query.sortBy as string;

    if (querySortBy === undefined) {
      return result;
    }

    // If query property sent as Array
    if (Array.isArray(querySortBy)) {
      for (let i: number = 0; i < querySortBy.length; i++) {
        const param = querySortBy[i];

        if (sortProperties.includes(param.toString())) {
          result = param.toString();
          break;
        }
      }
    } else {
      if (sortProperties.includes(querySortBy.toString())) {
        result = querySortBy.toString();
      }
    }

    return result;
  }
}

export class PaginationWithSearchLoginAndEmailTerm extends Pagination {
  public readonly searchLoginTerm: string | null;
  public readonly searchEmailTerm: string | null;

  constructor(query: ParsedQs, sortProperties: string[]) {
    super(query, sortProperties);

    this.searchLoginTerm = query.searchLoginTerm ? `${query.searchLoginTerm as string}` : null;
    this.searchEmailTerm = query.searchEmailTerm ? `${query.searchEmailTerm as string}` : null;
  }
}

export type SortDirectionType = 'desc' | 'asc';

export type PaginationType = {
  searchNameTerm: string | null;
  sortBy: string;
  sortDirection: SortDirectionType;
  pageNumber: number;
  pageSize: number;
};
