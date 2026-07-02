import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startItem,
  endItem,
  onPageChange,
  className,
  label = "รายการ",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const pages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className={cn("flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-gray-500">
        แสดง {startItem}-{endItem} จาก {totalItems} {label} ({pageSize} รายการต่อหน้า)
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          ก่อนหน้า
        </Button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <Button
              key={page}
              type="button"
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="min-w-9 px-3"
            >
              {page}
            </Button>
          )
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) {
    pages.push("ellipsis");
  }

  for (let page = left; page <= right; page += 1) {
    pages.push(page);
  }

  if (right < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}
