"use client";

import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

export function MonthlySummary() {
  const { incomes, expenses, allocation } = useFinanceData();

  // Group by month
  const monthlyData: Record<string, any> = {};

  incomes.forEach((inc) => {
    const monthKey = format(parseISO(inc.date), "yyyy-MM");
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
      };
    }
    monthlyData[monthKey].income += inc.amount;
  });

  expenses.forEach((exp) => {
    const monthKey = format(parseISO(exp.date), "yyyy-MM");
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
      };
    }
    monthlyData[monthKey].expense += exp.amount;
  });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

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
                  sortedMonths.map((month) => {
                    const data = monthlyData[month];
                    const balance = data.income - data.expense;
                    const savings = (data.income * allocation.savingsPercentage) / 100;
                    const emergency = (data.income * allocation.emergencyFundPercentage) / 100;

                    return (
                      <tr key={month} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-medium">
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
        </CardContent>
      </Card>
    </div>
  );
}
