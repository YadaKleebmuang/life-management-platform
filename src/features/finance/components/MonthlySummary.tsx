"use client";

import { useMemo } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useCategories } from "../hooks/useCategories";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { PaginationControls } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";

export function MonthlySummary() {
  const { incomes, expenses, allocation, loading: financeLoading } = useFinanceData();
  const { categories, loading: categoriesLoading } = useCategories();

  const monthlyData = useMemo<Record<string, { income: number; expense: number; expenseByCategory: Record<string, number> }>>(() => {
    const nextMonthlyData: Record<string, { income: number; expense: number; expenseByCategory: Record<string, number> }> = {};

    incomes.forEach((inc) => {
      const monthKey = format(parseISO(inc.date), "yyyy-MM");
      if (!nextMonthlyData[monthKey]) {
        nextMonthlyData[monthKey] = { income: 0, expense: 0, expenseByCategory: {} };
      }
      nextMonthlyData[monthKey].income += inc.amount;
    });

    expenses.forEach((exp) => {
      const monthKey = format(parseISO(exp.date), "yyyy-MM");
      if (!nextMonthlyData[monthKey]) {
        nextMonthlyData[monthKey] = { income: 0, expense: 0, expenseByCategory: {} };
      }
      nextMonthlyData[monthKey].expense += exp.amount;

      const catId = exp.categoryId || exp.category || "other";
      if (!nextMonthlyData[monthKey].expenseByCategory[catId]) {
        nextMonthlyData[monthKey].expenseByCategory[catId] = 0;
      }
      nextMonthlyData[monthKey].expenseByCategory[catId] += exp.amount;
    });

    return nextMonthlyData;
  }, [expenses, incomes]);

  const sortedMonths = useMemo(() => Object.keys(monthlyData).sort((a, b) => b.localeCompare(a)), [monthlyData]);
  const monthPagination = usePagination(sortedMonths, 10);
  const paginatedMonths = monthPagination.paginatedItems;

  if (financeLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">เดือน</th>
                  <th className="px-4 py-3 font-semibold text-right">รายรับรวม</th>
                  <th className="px-4 py-3 font-semibold text-right">รายจ่ายรวม</th>
                  <th className="px-4 py-3 font-semibold text-right">คงเหลือ</th>
                  <th className="px-4 py-3 font-semibold text-right">เงินออม (สะสม)</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">ฉุกเฉิน (สะสม)</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  paginatedMonths.map((month) => {
                    const data = monthlyData[month];
                    const balance = data.income - data.expense;
                    const savings = (data.income * allocation.savingsPercentage) / 100;
                    const emergency = (data.income * allocation.emergencyFundPercentage) / 100;

                    return (
                      <tr key={month} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                          {formatDateThai(`${month}-01`).split(" ")[1]} {formatDateThai(`${month}-01`).split(" ")[2]}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(data.income)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(data.expense)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(balance)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(savings)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(emergency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={monthPagination.currentPage}
            totalPages={monthPagination.totalPages}
            totalItems={monthPagination.totalItems}
            pageSize={monthPagination.pageSize}
            startItem={monthPagination.startItem}
            endItem={monthPagination.endItem}
            onPageChange={monthPagination.setCurrentPage}
            label="เดือน"
          />
        </CardContent>
      </Card>

      {sortedMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนรายจ่ายตามหมวดหมู่ ({formatDateThai(`${sortedMonths[0]}-01`).split(" ")[1]} {formatDateThai(`${sortedMonths[0]}-01`).split(" ")[2]})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(monthlyData[sortedMonths[0]].expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([catId, amount]) => {
                  const percent = (amount / monthlyData[sortedMonths[0]].expense) * 100;
                  return (
                    <div key={catId}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-gray-900">{getCategoryName(catId)}</span>
                        <span className="text-gray-600">{formatCurrency(amount)} ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-900 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
