export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
): PaginatedResult<T> {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(100, limit)); // Max 100 items per page
  const total = items.length;
  const totalPages = Math.ceil(total / validLimit);
  const startIndex = (validPage - 1) * validLimit;
  const endIndex = startIndex + validLimit;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      totalPages,
      hasNext: validPage < totalPages,
      hasPrev: validPage > 1,
    },
  };
}
