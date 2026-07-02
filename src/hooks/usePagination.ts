"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type PaginationResult<T> = {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  paginatedItems: T[];
  startItem: number;
  endItem: number;
  totalItems: number;
  pageSize: number;
};

export function usePagination<T>(items: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  const startItem = items.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, items.length);

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    startItem,
    endItem,
    totalItems: items.length,
    pageSize,
  } satisfies PaginationResult<T>;
}
